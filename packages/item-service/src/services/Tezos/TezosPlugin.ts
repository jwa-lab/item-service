import { AckPolicy, NatsConnection } from "nats";

import { Logger, MessageBus, RunnerPlugin } from "common";

import { Item } from "../../entities/item";
import { TokenizationEvents } from "../tokenization/TokenizationService";

import { TezosTokenizationService } from "./TezosTokenizationService";

export class TezosPlugin extends RunnerPlugin {
    constructor(
        private logger: Logger,
        private messageBus: MessageBus,
        private tezosTokenizationService: TezosTokenizationService,
        private natsConnections: NatsConnection
    ) {
        super();
    }

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
        this.messageBus.subscribe(
            TokenizationEvents.ITEM_CREATED,
            (itemId: unknown) =>
                this.tezosTokenizationService.createItem(itemId as Pick<Item, "item_id">)
        );
    }
}
