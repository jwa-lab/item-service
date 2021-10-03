import {
    OpKind,
    TezosToolkit,
    TransferParams,
    withKind
} from "@taquito/taquito";
import { BlockResponse } from "@taquito/rpc";

import { JetStreamMessage, Logger, JetStreamConsumer } from "@jwalab/js-common";

import {
    consumerOpts,
    ConsumerOptsBuilder,
    createInbox,
    headers as natsHeaders,
    JetStreamClient,
    JSONCodec
} from "nats";

export interface TezosWorkerTokenizationConfirmation {
    operation: withKind<TransferParams, OpKind.TRANSACTION>;
    operationEstimate: {
        burnFeeMutez: number;
        gasLimit: number;
        minimalFeeMutez: number;
        storageLimit: number;
        suggestedFeeMutez: number;
        totalCost: number;
        consumedMilligas: number;
    };
    operationConfirmation: {
        block: BlockResponse;
        expectedConfirmation: number;
        currentConfirmation: number;
        completed: boolean;
    };
}

export class TezosWorkQueue extends JetStreamConsumer {
    readonly subject = "TEZOS.Execute";
    private readonly jsonCodec = JSONCodec();

    constructor(
        private readonly logger: Logger,
        private readonly tezosClient: TezosToolkit,
        private readonly jetStreamClient: JetStreamClient
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

    async handle({
        msg,
        data
    }: JetStreamMessage<
        withKind<TransferParams, OpKind.TRANSACTION>
    >): Promise<void> {
        if (!data) {
            msg.term();

            this.logger.error(
                `Tezos Work Queue is expecting an operation but didn't receive anything.`
            );
            return;
        } else {
            msg.working();

            const studioId = msg.headers?.get("X-Studio-Id");
            const metadata = msg.headers?.get("X-Metadata");
            const confirmationSubject = msg.headers?.get(
                "X-Confirmation-Subject"
            );

            this.logger.debug(`Processing ${JSON.stringify(data)}`);

            const operationEstimate = await this.tezosClient.estimate.transfer(
                data
            );

            const batch = this.tezosClient.wallet.batch([data]);

            const batchOperation = await batch.send();

            const operationConfirmation = await batchOperation.confirmation(1);

            this.logger.debug(`Successfully processed ${JSON.stringify(data)}`);

            if (confirmationSubject) {
                const headers = natsHeaders();

                headers.append("X-Studio-Id", studioId || "");
                headers.append("X-Metadata", metadata || "");
                headers.append(
                    "X-Confirmation-Subject",
                    confirmationSubject || ""
                );

                const confirmation: TezosWorkerTokenizationConfirmation = {
                    operation: data,
                    operationEstimate: {
                        burnFeeMutez: operationEstimate.burnFeeMutez,
                        gasLimit: operationEstimate.gasLimit,
                        minimalFeeMutez: operationEstimate.minimalFeeMutez,
                        storageLimit: operationEstimate.storageLimit,
                        suggestedFeeMutez: operationEstimate.suggestedFeeMutez,
                        totalCost: operationEstimate.totalCost,
                        consumedMilligas: operationEstimate.consumedMilligas
                    },
                    operationConfirmation
                };

                await this.jetStreamClient.publish(
                    confirmationSubject,
                    this.jsonCodec.encode(confirmation),
                    { headers }
                );
            }

            msg.ack();
        }
    }
}
