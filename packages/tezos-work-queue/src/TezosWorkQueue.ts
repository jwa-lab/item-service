import {
    consumerOpts,
    ConsumerOptsBuilder,
    JetStreamClient,
    JSONCodec,
    headers as natsHeaders
} from "nats";

import {
    JetStreamMessage,
    Logger,
    JetStreamPullConsumer
} from "@jwalab/js-common";
import {
    TezosTransferOperation,
    TezosWorkerTokenizationConfirmation
} from "./types";
import TezosSmartBatcher from "./TezosSmartBatcher";
import { Batch } from "./TezosBatchValidator";
import TezosBlockMonitor from "./TezosBlockMonitor";

export class TezosWorkQueue extends JetStreamPullConsumer {
    readonly subject = "TEZOS.Execute";

    private readonly jsonCodec = JSONCodec();
    private readonly messages: Map<
        number,
        JetStreamMessage<TezosTransferOperation>
    >;

    constructor(
        private readonly logger: Logger,
        private readonly jetStreamClient: JetStreamClient,
        private readonly tezosSmartBatcher: TezosSmartBatcher,
        private readonly tezosBlockMonitor: TezosBlockMonitor
    ) {
        super();

        this.messages = new Map();
    }

    async onReady(): Promise<void> {
        this.pullNext();

        for await (const hasBlockHashChanged of this.tezosBlockMonitor.blockHashChanged()) {
            if (hasBlockHashChanged) {
                this.logger.info(`Block hash has changed, processing batch.`);
                await this.processBatch();
                this.pullNext();
            }
        }
    }

    getConsumerOptions(): ConsumerOptsBuilder {
        const subscriptionOptions = consumerOpts();
        subscriptionOptions.durable("tezos-queue-consumer");
        subscriptionOptions.manualAck();
        subscriptionOptions.ackExplicit();

        return subscriptionOptions;
    }

    pullNext(): void {
        // pull will directly ask for the next message
        // but if the timer checking for the next available block
        // never gets to tick then messages will keep piling up.
        // the setTiemout allows so breathing room ensuring that we do process
        // batches when possible
        setTimeout(() => {
            this.getSubscription().pull();
        }, 0);
    }

    async handle(
        message: JetStreamMessage<TezosTransferOperation>
    ): Promise<void> {
        const { msg, data } = message;
        const { seq, subject } = message.msg;

        if (!data) {
            this.pullNext();

            throw new Error(
                `Invalid Tezos Operation received on subject (${subject}) with sequence id (${seq}).`
            );
        }

        if (this.messages.has(seq)) {
            this.pullNext();

            this.logger.info(
                `Message with sequence id (${seq}) already tracked, ignoring`
            );
            return;
        }

        try {
            const canTakeMore = await this.tezosSmartBatcher.handleMessage(
                seq,
                data
            );

            if (!canTakeMore) {
                msg.nak();
                this.logger.info(
                    `Batch full, rejecting message ${msg.seq} for now.`
                );
            } else {
                this.logger.info(
                    `Adding message with sequence id ${seq} to batch.`
                );
                this.messages.set(seq, message);
                this.pullNext();
            }
        } catch (err) {
            this.logger.error(`Cant add message ${JSON.stringify(data)}`);
            this.pullNext();
            // rethrow so error handler handles it.
            throw err;
        }
    }

    private async processBatch(): Promise<void> {
        this.logger.info("Processing batch");

        const [isSuccessful, operationHash, batch] =
            await this.tezosSmartBatcher.processNextBatch();

        if (isSuccessful) {
            await this.onBatchProcessed(operationHash, batch);
        } else {
            this.failedToProcessBatch(batch);
        }

        this.logger.info("Done processing batch");
    }

    private failedToProcessBatch(batch: Batch) {
        const unprocessedOperationIds = Array.from(
            batch.getOperations().keys()
        );

        unprocessedOperationIds.forEach((operationId) => {
            const natsMsg = this.messages.get(operationId);

            if (natsMsg) {
                const { msg } = natsMsg;

                // ask to resend message so it's included in a future batch
                msg.nak();
            }
        });
    }

    private async onBatchProcessed(
        operationHash: string,
        batch: Batch
    ): Promise<void> {
        const processedOperationIds = Array.from(batch.getOperations().keys());

        processedOperationIds.forEach((operationId) => {
            const natsMsg = this.messages.get(operationId);

            if (natsMsg) {
                const { msg, data } = natsMsg;

                const studioId = msg.headers?.get("studio_id");
                const metadata = msg.headers?.get("metadata");
                const confirmationSubject = msg.headers?.get(
                    "confirmation-subject"
                );

                if (confirmationSubject) {
                    this.logger.info(`Sending confirmation for ${operationId}`);

                    const headers = natsHeaders();

                    headers.append("studio_id", studioId || "");
                    headers.append("metadata", metadata || "");
                    headers.append(
                        "confirmation-subject",
                        confirmationSubject || ""
                    );

                    const operationEstimate = batch.getEstimate(operationId);

                    if (!operationEstimate) {
                        throw new Error(
                            `Message ${msg.seq} missing operation estimate.`
                        );
                    }

                    if (!data) {
                        throw new Error(
                            `Message ${msg.seq} missing operation data.`
                        );
                    }

                    const confirmation: TezosWorkerTokenizationConfirmation = {
                        operation: data,
                        operationEstimate: {
                            burnFeeMutez: operationEstimate.burnFeeMutez,
                            gasLimit: operationEstimate.gasLimit,
                            minimalFeeMutez: operationEstimate.minimalFeeMutez,
                            storageLimit: operationEstimate.storageLimit,
                            suggestedFeeMutez:
                                operationEstimate.suggestedFeeMutez,
                            totalCost: operationEstimate.totalCost
                        },
                        operationHash
                    };

                    this.jetStreamClient.publish(
                        confirmationSubject,
                        this.jsonCodec.encode(confirmation),
                        { headers }
                    );
                }

                msg.ack();
                this.messages.delete(operationId);
            }
        });
    }
}
