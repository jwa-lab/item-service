import { Logger } from "@jwalab/js-common";
import { TezosToolkit } from "@taquito/taquito";
import TezosBatchValidator, { Batch } from "./TezosBatchValidator";

import { TezosTransferOperation } from "./types";

/**
 * TezosSmartBatcher
 */
export default class TezosSmartBatcher {
    constructor(
        private readonly logger: Logger,
        private readonly tezosClient: TezosToolkit,
        private readonly tezosBatchValidator: TezosBatchValidator
    ) {}

    async handleMessage(
        sequenceId: number,
        data: TezosTransferOperation
    ): Promise<boolean> {
        return this.tezosBatchValidator.addOperation(sequenceId, data);
    }

    async processNextBatch(): Promise<[boolean, string, Batch]> {
        this.logger.info(`Processing next batch`);

        const batch = this.tezosBatchValidator.rotateBatch();

        if (!batch.getOperations().size) {
            this.logger.info(`Emtpy batch, ignoring.`);
            return [false, "", batch];
        }

        this.logger.info(
            `Processing ${batch.getOperations().size} operation(s).`
        );

        const batchOperation = this.tezosClient.wallet.batch(
            Array.from(batch.getOperations().values())
        );

        try {
            this.logger.info(`Sending batch`);

            const batchSendOperation = await batchOperation.send();

            this.logger.info(`Successfully sent batch`);

            return [true, batchSendOperation.opHash, batch];
        } catch (err) {
            this.logger.error(
                `Batch couldn't be processed. ${JSON.stringify(err)}`
            );
            return [false, "", batch];
        }
    }
}
