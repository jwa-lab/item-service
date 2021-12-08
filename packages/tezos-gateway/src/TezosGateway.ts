import {
    consumerOpts,
    ConsumerOptsBuilder,
    JetStreamClient,
    JSONCodec,
    headers as natsHeaders,
    ConsumerOpts
} from "nats";
import { Logger } from "@jwalab/logger";
import {
    JetStreamMessage,
    JetStreamPullConsumerHandler
} from "@jwalab/nats-runner";

import {
    TezosTransferOperation,
    TezosWorkerTokenizationConfirmation
} from "./types";
import TezosBatchProcessor, { Batch } from "./TezosBatchProcessor";
import TezosBlockMonitor from "./TezosBlockMonitor";

export class TezosGateway extends JetStreamPullConsumerHandler {
    readonly subject = "TEZOS.Execute";
    private isProcessing = false;

    private readonly jsonCodec = JSONCodec();
    private readonly messages: Map<
        number,
        JetStreamMessage<TezosTransferOperation>
    >;

    constructor(
        logger: Logger,
        jetStreamClient: JetStreamClient,
        private readonly tezosBatchProcessor: TezosBatchProcessor,
        private readonly tezosBlockMonitor: TezosBlockMonitor
    ) {
        super(logger, jetStreamClient);

        this.messages = new Map();
    }

    async onReady(): Promise<void> {
        this.pullNext();

        for await (const hasBlockHashChanged of this.tezosBlockMonitor.blockHashChanged()) {
            if (hasBlockHashChanged) {
                this.logger.debug(`Block hash has changed, processing batch.`);
                await this.processBatch();
                this.pullNext();
            }
        }
    }

    getConsumerOptions(): ConsumerOptsBuilder | Partial<ConsumerOpts> {
        const subscriptionOptions = consumerOpts();
        subscriptionOptions.durable("tezos-queue-consumer");
        subscriptionOptions.manualAck();
        subscriptionOptions.ackExplicit();

        return subscriptionOptions;
    }

    pullNext(): void {
        if (!this.subscription) {
            throw new Error("No subscription available");
        }
        this.subscription.pull();
    }

    async handle(
        message: JetStreamMessage<TezosTransferOperation>
    ): Promise<void> {
        const { msg, data } = message;
        const { seq, subject } = msg;

        if (!data) {
            this.pullNext();

            throw new Error(
                `Invalid Tezos Operation received on subject (${subject}) with sequence id (${seq}).`
            );
        }

        if (this.isProcessing) {
            msg.nak();
            this.logger.info(`Rejecting message ${seq} while we're processing`);
            return;
        }

        if (this.messages.has(seq)) {
            this.pullNext();

            this.logger.info(
                `Message with sequence id (${seq}) already tracked, ignoring`
            );
            return;
        }

        try {
            const canTakeMore = await this.tezosBatchProcessor.handleMessage(
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
            this.logger.error(`Can't add message ${JSON.stringify(data)}`);
            this.pullNext();
            // rethrow so error handler handles it.
            throw err;
        }
    }

    private async processBatch(): Promise<void> {
        this.logger.debug("Processing batch");
        this.isProcessing = true;

        const { success, opHash, batch } =
            await this.tezosBatchProcessor.processNextBatch();

        if (success) {
            await this.onBatchProcessed(opHash, batch);
        } else {
            this.failedToProcessBatch(batch);
        }

        this.isProcessing = false;
        this.logger.debug("Done processing batch");
    }

    private failedToProcessBatch(batch: Batch) {
        const unprocessedOperationIds = Array.from(
            batch.getOperations().keys()
        );

        if (unprocessedOperationIds.length > 0) {
            this.logger.crit(
                `Failed to execute batch containing operations with sequence ids ${unprocessedOperationIds.join(
                    ", "
                )}. Messages won't be resent`
            );
        }

        unprocessedOperationIds.forEach((operationId) => {
            const natsMsg = this.messages.get(operationId);

            if (natsMsg) {
                const { msg } = natsMsg;

                // this shouldn't happen, let's not resend the operations
                msg.term();

                this.messages.delete(operationId);
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
