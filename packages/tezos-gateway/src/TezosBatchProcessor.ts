import { Logger } from "@jwalab/logger";
import { TezosOperationError, TezosToolkit } from "@taquito/taquito";
import { Estimate } from "@taquito/taquito/dist/types/contract/estimate";

import { TezosTransferOperation, TezosOperationEstimate } from "./types";

export interface BatchProcessingResult {
    success: boolean;
    opHash: string;
    batch: Batch;
}

/**
 * A convenience class for storing batches of operations alongside their estimates and validating them.
 * Adding an operation will verify that it's valid and get the new batch estimate. If the new batch is invalid
 * then an error will be raised. If the batch is full then the operation won't be added.
 */
export class Batch {
    private operations: Map<number, TezosTransferOperation>;
    private estimates: Map<number, TezosOperationEstimate>;

    constructor(
        private readonly maxBatchGasLimit: number,
        private readonly tezosClient: TezosToolkit,
        private readonly logger: Logger
    ) {
        this.operations = new Map();
        this.estimates = new Map();
    }

    /**
     * addOperation will:
     *  - return true if the operation is valid, was added to the batch and the bath gas limit is less than maxBatchGasLimit
     *  - return false if the operation is valid but the gas limit is reached
     *  - raise an error if the operation is not valid and can't be included in the batch
     */
    async addOperation(
        operationId: number,
        operation: TezosTransferOperation
    ): Promise<boolean> {
        const batchEstimates = await this.estimateBatch([
            ...this.operations.values(),
            operation
        ]);

        const canAddOperation = this.isBatchWithinGasLimit(batchEstimates);

        if (canAddOperation) {
            this.operations.set(operationId, operation);
            this.setEstimates(
                batchEstimates.map((estimate) => ({
                    burnFeeMutez: estimate.burnFeeMutez,
                    gasLimit: estimate.gasLimit,
                    minimalFeeMutez: estimate.minimalFeeMutez,
                    storageLimit: estimate.storageLimit,
                    suggestedFeeMutez: estimate.suggestedFeeMutez,
                    totalCost: estimate.totalCost,
                    usingBaseFeeMutez: estimate.usingBaseFeeMutez
                }))
            );
            return true;
        } else {
            return false;
        }
    }

    getOperations(): Map<number, TezosTransferOperation> {
        return this.operations;
    }

    getEstimates(): Map<number, TezosOperationEstimate> {
        return this.estimates;
    }

    getEstimate(operationId: number): TezosOperationEstimate {
        const operationEstimate = this.estimates.get(operationId);

        if (!operationEstimate) {
            throw new Error(`No estimate for operation id (${operationId}).`);
        }

        return operationEstimate;
    }

    isEmpty(): boolean {
        return this.size() === 0;
    }

    size(): number {
        return this.operations.size;
    }

    private async estimateBatch(
        batch: TezosTransferOperation[]
    ): Promise<Estimate[]> {
        try {
            return await this.tezosClient.estimate.batch(batch);
        } catch (err) {
            if (
                (err as TezosOperationError).message.includes(
                    "contract.counter_in_the_past"
                )
            ) {
                this.logger.warning(
                    `Tezos "Counter in the past" error estimating batch, retrying... ${JSON.stringify(
                        err
                    )} `
                );
                const estimate = await this.estimateBatch(batch);
                this.logger.info(
                    `Tezos "Counter in the past" successfully recovered.`
                );
                return estimate;
            }

            //rethrow if not a counter issue
            throw err;
        }
    }

    private isBatchWithinGasLimit(batchEstimates: Estimate[]): boolean {
        const batchGasLimit = batchEstimates.reduce(
            (acc, { gasLimit }) => acc + gasLimit,
            0
        );

        return batchGasLimit <= this.maxBatchGasLimit;
    }

    private setEstimates(estimates: TezosOperationEstimate[]): void {
        this.estimates = new Map(
            Array.from(this.operations.keys()).map((operationId, idx) => [
                operationId,
                estimates[idx]
            ])
        );
    }
}

/**
 * TezosBatchProcessor handles new operations and processes the next batch.
 */
export default class TezosBatchProcessor {
    private currentBatch!: Batch;

    constructor(
        private readonly logger: Logger,
        private readonly tezosClient: TezosToolkit,
        private readonly MAX_BATCH_GAS_LIMIT = "900000"
    ) {
        this.resetCurrentBatch();
    }

    async handleMessage(
        sequenceId: number,
        data: TezosTransferOperation
    ): Promise<boolean> {
        return this.currentBatch.addOperation(sequenceId, data);
    }

    async processNextBatch(): Promise<BatchProcessingResult> {
        const batch = this.currentBatch;

        if (batch.isEmpty()) {
            this.logger.debug(`Emtpy batch, ignoring.`);
            return {
                success: false,
                opHash: "",
                batch
            };
        }

        this.logger.info(
            `Processing ${this.currentBatch.size()} operation(s).`
        );

        const batchOperation = this.tezosClient.wallet.batch(
            Array.from(this.currentBatch.getOperations().values())
        );

        try {
            this.logger.debug(`Sending batch`);

            const { opHash } = await batchOperation.send();

            this.logger.info(`Successfully sent batch`);

            this.resetCurrentBatch();

            return {
                success: true,
                opHash,
                batch
            };
        } catch (err) {
            this.logger.error(
                `Batch couldn't be processed. ${JSON.stringify(
                    err
                )}. Retrying...`
            );

            const result = await this.processNextBatch();

            this.logger.info(`Successfully sent batch after retry.`);

            return result;
        }
    }

    private resetCurrentBatch() {
        this.currentBatch = new Batch(
            Number(this.MAX_BATCH_GAS_LIMIT),
            this.tezosClient,
            this.logger
        );
    }
}
