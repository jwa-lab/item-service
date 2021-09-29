import { TezosToolkit } from "@taquito/taquito";
import { JetStreamMessage, Logger, JetStreamConsumer } from "common";

import { consumerOpts, ConsumerOptsBuilder, createInbox } from "nats";

export class TezosWorkQueue extends JetStreamConsumer {
    readonly subject = "TEZOS.Execute";

    constructor(
        private readonly logger: Logger,
        private readonly tezosClient: TezosToolkit
    ) {
        super();
    }

    getConsumerOptions(): ConsumerOptsBuilder {
        const subscriptionOptions = consumerOpts();
        subscriptionOptions.durable("tezos-queue-consumer");
        subscriptionOptions.manualAck();
        subscriptionOptions.ackExplicit();
        subscriptionOptions.deliverTo(createInbox());
        subscriptionOptions.deliverAll();

        return subscriptionOptions;
    }

    async handle<WalletParamsWithKind>({
        msg,
        data
    }: JetStreamMessage<WalletParamsWithKind>): Promise<void> {
        if (!data) {
            msg.term();

            this.logger.error(
                `Tezos Work Queue is expecting an operation but didn't receive anything.`
            );
            return;
        } else {
            msg.working();

            this.logger.debug(`Processing ${JSON.stringify(data)}`);

            const batch = this.tezosClient.wallet.batch([data]);

            const batchOperation = await batch.send();

            await batchOperation.confirmation(1);

            this.logger.debug(`Successfully processed ${JSON.stringify(data)}`);

            msg.ack();
        }
    }
}
