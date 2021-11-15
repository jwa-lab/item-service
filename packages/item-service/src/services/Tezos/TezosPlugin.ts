import { AckPolicy, NatsConnection } from "nats";
import { Logger } from "@jwalab/logger";
import { EventBus } from "@jwalab/event-bus";
import { RunnerPlugin } from "@jwalab/nats-runner";

import {
    ItemAssignedEvent,
    ItemCreatedEvent,
    ItemFrozenEvent,
    ItemInstanceTransferredEvent,
    ItemInstanceUpdatedEvent,
    ItemUpdatedEvent
} from "../../events/item";

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
            subjects: ["TEZOS.Execute", "TEZOS.Processed.*"]
        });

        const stream = await jsm.streams.find("TEZOS.*");

        await jsm.consumers.add(stream, {
            durable_name: "tezos-service-worker",
            ack_policy: AckPolicy.Explicit
        });
    }

    subscribeToEvents(): void {
        this.eventBus.subscribe(
            ItemCreatedEvent.name,
            (itemCreatedEvent: ItemCreatedEvent) =>
                this.tezosTokenizationService.createItem(
                    itemCreatedEvent.item_id
                )
        );

        this.eventBus.subscribe(
            ItemUpdatedEvent.name,
            (itemUpdatedEvent: ItemUpdatedEvent) =>
                this.tezosTokenizationService.updateItem(
                    itemUpdatedEvent.item_id
                )
        );

        this.eventBus.subscribe(
            ItemAssignedEvent.name,
            (itemAssignedEvent: ItemAssignedEvent) =>
                this.tezosTokenizationService.assignItem(
                    itemAssignedEvent.item_id,
                    itemAssignedEvent.instance_number,
                    itemAssignedEvent.user_id
                )
        );

        this.eventBus.subscribe(
            ItemFrozenEvent.name,
            (itemFrozenEvent: ItemFrozenEvent) =>
                this.tezosTokenizationService.freezeItem(
                    itemFrozenEvent.item_id
                )
        );

        this.eventBus.subscribe(
            ItemInstanceUpdatedEvent.name,
            (itemInstanceUpdatedEvent: ItemInstanceUpdatedEvent) =>
                this.tezosTokenizationService.updateItemInstance(
                    itemInstanceUpdatedEvent.item_id,
                    itemInstanceUpdatedEvent.instance_number,
                    itemInstanceUpdatedEvent.data
                )
        );

        this.eventBus.subscribe(
            ItemInstanceTransferredEvent.name,
            (itemInstanceTransferredEvent: ItemInstanceTransferredEvent) =>
                this.tezosTokenizationService.transferItemInstance(
                    itemInstanceTransferredEvent.item_id,
                    itemInstanceTransferredEvent.instance_number,
                    itemInstanceTransferredEvent.to_user_id
                )
        );
    }
}
