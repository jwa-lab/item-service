import { TezosToolkit, WalletParamsWithKind } from "@taquito/taquito";
import { Logger } from "common";
import { RunnerPlugin } from "common";
import {
    consumerOpts,
    createInbox,
    JetStreamClient,
    JetStreamSubscription,
    JSONCodec,
    NatsConnection
} from "nats";

export class TezosWorkQueuePlugin implements RunnerPlugin {
    private readonly jetStreamClient: JetStreamClient;
    private readonly jsonCodec = JSONCodec();

    constructor(
        private readonly logger: Logger,
        natsConnection: NatsConnection,
        private readonly tezosClient: TezosToolkit
    ) {
        this.jetStreamClient = natsConnection.jetstream();
    }

    async start(): Promise<void> {
        const subscriptionOptions = consumerOpts();
        subscriptionOptions.durable("tezos-queue-consumer");
        subscriptionOptions.manualAck();
        subscriptionOptions.ackExplicit();
        subscriptionOptions.deliverTo(createInbox());
        subscriptionOptions.deliverAll();

        const subscription = await this.jetStreamClient.subscribe(
            "TEZOS.Execute",
            subscriptionOptions
        );

        await this.executeWork(subscription);
    }

    async executeWork(subscription: JetStreamSubscription): Promise<void> {
        for await (const message of subscription) {
            try {
                message.working();

                const operation = this.jsonCodec.decode(message.data) as WalletParamsWithKind;

                this.logger.debug(`Processing ${JSON.stringify(operation)}`);

                const batch = this.tezosClient.wallet.batch([operation]);

                const batchOperation = await batch.send();

                await batchOperation.confirmation(1);

                this.logger.debug(
                    `Successfully processed ${JSON.stringify(
                        operation
                    )}`
                );
                message.ack();
            } catch (err) {
                if (message.info.redeliveryCount > 2) {
                    message.term();
                }

                this.logger.error(`Error processing ${JSON.stringify(err)}`);
            }
        }
    }
}
