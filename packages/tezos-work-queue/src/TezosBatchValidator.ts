import { Logger } from "@jwalab/js-common";
import { TezosToolkit } from "@taquito/taquito";
import { TezosOperationEstimate, TezosTransferOperation } from "./types";

/**
 * A convenience class for storing batches of operations alongside their estimates.
 */
export class Batch {
    private operations: Map<number, TezosTransferOperation>;
    private estimates: Map<number, TezosOperationEstimate>;

    constructor() {
        this.operations = new Map();
        this.estimates = new Map();
    }

    addOperation(operationId: number, operation: TezosTransferOperation): void {
        this.operations.set(operationId, operation);
    }

    getOperations(): Map<number, TezosTransferOperation> {
        return this.operations;
    }

    getOperation(operationId: number): TezosTransferOperation | undefined {
        return this.operations.get(operationId);
    }

    setEstimates(estimates: TezosOperationEstimate[]): void {
        this.estimates = new Map(
            Array.from(this.operations.keys()).map((operationId, idx) => [
                operationId,
                estimates[idx]
            ])
        );
    }

    getEstimates(): Map<number, TezosOperationEstimate> {
        return this.estimates;
    }

    getEstimate(operationId: number): TezosOperationEstimate | undefined {
        return this.estimates.get(operationId);
    }
}

/**
 * The TezosBatchValidator takes operations and queries the node to see
 * if it can be added to the batch.
 *
 * If the operation can't be added because of an error (the entrypoint fails with an exception "failwith" for instance)
 * then the operation is rejected so it doesn't pollute the queue.
 *
 * If the operation can be added, then it's added to the current batch and its cost is estimated
 * and stored in the batch too.
 *
 * If the batch is full then we return false, so the worker can pause receiving new messages while handling the batch
 */
export default class TezosBatchValidator {
    private batch: Batch;

    constructor(
        private readonly logger: Logger,
        private readonly tezosClient: TezosToolkit,
        private readonly MAX_BATCH_SIZE = "800000"
    ) {
        this.batch = new Batch();
        this.logger.debug(`Max batch size ${this.MAX_BATCH_SIZE}`);
    }

    async addOperation(
        operationId: number,
        newOperation: TezosTransferOperation
    ): Promise<boolean> {
        const operations = this.batch.getOperations();

        const newBatch = [...operations.values(), newOperation];

        const batchEstimate = await this.tezosClient.estimate.batch(newBatch);

        const batchSize = batchEstimate.reduce((acc, e) => acc + e.gasLimit, 0);

        if (batchSize > Number(this.MAX_BATCH_SIZE)) {
            return false;
        }

        this.batch.addOperation(operationId, newOperation);

        this.batch.setEstimates(
            batchEstimate.map((estimate) => ({
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
    }

    rotateBatch(): Batch {
        const currentBatch = this.batch;
        this.batch = new Batch();
        return currentBatch;
    }
}
