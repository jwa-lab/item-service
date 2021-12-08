import { Logger } from "@jwalab/logger";
import { TezosToolkit } from "@taquito/taquito";

const TICK_INTERVAL_MS = 1000;

/**
 * The TezosBlockMonitor monitors the current block and tells if it has changed.
 * When the block increases that means that a new operation can be sent.
 * There can be only operation baked into one block for each signer, as of Granada.
 */
export default class TezosBlockMonitor {
    private blockHash = "";

    constructor(
        private readonly logger: Logger,
        private readonly tezosClient: TezosToolkit
    ) {}

    async *blockHashChanged(): AsyncGenerator<boolean, void, unknown> {
        while (true) {
            await new Promise((res) => setTimeout(res, TICK_INTERVAL_MS));

            yield this.hasBlockHashChanged();
        }
    }

    private async hasBlockHashChanged(): Promise<boolean> {
        const blockHash = await this.getBlockHash();

        if (this.blockHash === "") {
            this.blockHash = blockHash;
            return false;
        }

        if (blockHash !== this.blockHash) {
            this.blockHash = blockHash;

            this.logger.debug(
                `TezosBlockMonitor block changed with hash ${blockHash}`
            );

            return true;
        }

        return false;
    }

    private async getBlockHash(): Promise<string> {
        const { hash } = await this.tezosClient.rpc.getBlock();
        return hash;
    }
}
