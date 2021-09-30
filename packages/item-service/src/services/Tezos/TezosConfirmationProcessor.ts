import { JetStreamConsumer, JetStreamMessage, Logger } from "common";
import { consumerOpts, ConsumerOptsBuilder, createInbox } from "nats";
import { TezosWorkerTokenizationConfirmation } from "tezos-work-queue";
import { Item } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import { TezosEvents } from "./TezosEvents";

export class TezosConfirmationProcessor extends JetStreamConsumer {
    readonly subject = "TEZOS.Processed.*";

    private readonly processingHandlers = new Map([
        [TezosEvents.ItemAdded, this.onItemAdded],
        [TezosEvents.ItemUpdated, this.onItemUpdated]
    ]);

    constructor(
        private logger: Logger,
        private readonly itemRepository: ItemRepository
    ) {
        super();
    }

    getConsumerOptions(): ConsumerOptsBuilder {
        const subscriptionOptions = consumerOpts();

        subscriptionOptions.durable("tezos-confirmation-processor");
        // if multiple instances of this consumer, the queue ensures load balancing
        subscriptionOptions.queue("tezos-confirmation-processor");
        subscriptionOptions.manualAck();
        subscriptionOptions.ackExplicit();
        subscriptionOptions.deliverTo(createInbox());
        subscriptionOptions.deliverAll();

        return subscriptionOptions;
    }

    async handle(
        jetStreamMessage: JetStreamMessage<TezosWorkerTokenizationConfirmation>
    ): Promise<void> {
        const subject = jetStreamMessage.msg.subject as TezosEvents;
        const tokenizationConfirmation = jetStreamMessage.data;

        const handler = this.processingHandlers.get(subject);

        if (handler && tokenizationConfirmation) {
            jetStreamMessage.msg.working();

            await handler.call(
                this,
                tokenizationConfirmation,
                jetStreamMessage.msg.headers
                    ? JSON.parse(jetStreamMessage.msg.headers.get("X-Metadata"))
                    : undefined
            );
            jetStreamMessage.msg.ack();
        } else {
            this.logger.warning(
                `No Tezos confirmation handler for "${subject}"`
            );
            jetStreamMessage.msg.term();
        }
    }

    async onItemAdded(
        message: TezosWorkerTokenizationConfirmation,
        metadata: unknown
    ): Promise<void> {
        const { item_id } = new Item(metadata as Item);

        if (typeof item_id !== "undefined") {
            this.itemRepository.updateItemTokenizationInfo(item_id, {
                tezosContractAddress: message.operation.to,
                tezosBlock: message.operationConfirmation.block.hash
            });

            this.logger.info(
                `Tezos tokenization confirmation stored for Added Item ${item_id}`
            );
        }
    }

    async onItemUpdated(
        message: TezosWorkerTokenizationConfirmation,
        metadata: unknown
    ): Promise<void> {
        const { item_id } = new Item(metadata as Item);

        if (typeof item_id !== "undefined") {
            this.itemRepository.updateItemTokenizationInfo(item_id, {
                tezosContractAddress: message.operation.to,
                tezosBlock: message.operationConfirmation.block.hash
            });

            this.logger.info(
                `Tezos tokenization confirmation stored for Updated Item ${item_id}`
            );
        }
    }
}
