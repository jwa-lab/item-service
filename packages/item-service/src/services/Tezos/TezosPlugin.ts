import { AckPolicy, NatsConnection } from "nats";

import { Logger, EventBus, RunnerPlugin } from "common";

import { ItemCreatedEvent } from "../../events/item";

import { TezosTokenizationService } from "./TezosTokenizationService";

export class TezosPlugin implements RunnerPlugin {
    constructor(
        private logger: Logger,
        private eventBus: EventBus,
        private tezosTokenizationService: TezosTokenizationService,
        private natsConnections: NatsConnection
    ) {}

    async start(): Promise<void> {
        await this.initJetStream();
        this.subscribeToEvents();

        this.logger.debug(
            "Tezos Tokenization service listening on Item events"
        );
    }

    async initJetStream(): Promise<void> {
        const jsm = await this.natsConnections.jetstreamManager();

        jsm.streams.add({
            name: "TEZOS",
            subjects: ["TEZOS.*"]
        });

        const stream = await jsm.streams.find("TEZOS.*");

        await jsm.consumers.add(stream, {
            durable_name: "tezos-service-worker",
            ack_policy: AckPolicy.Explicit
        });
    }

    subscribeToEvents(): void {
        this.eventBus.subscribe(
            "ItemCreatedEvent",
            (itemCreatedEvent: ItemCreatedEvent) =>
                this.tezosTokenizationService.createItem(
                    itemCreatedEvent.item_id
                )
        );
    }
}
