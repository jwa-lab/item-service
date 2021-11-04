import { WarehouseContract } from "@jwalab/tokenization-service-contracts";
import { TezosToolkit } from "@taquito/taquito";
import { Logger } from "@jwalab/js-common";

export async function loadTezosWarehouseContract(
    logger: Logger,
    tezosClient: TezosToolkit,
    WAREHOUSE_CONTRACT_ADDRESS: string
): Promise<WarehouseContract> {
    try {
        const warehouseContract =
            await tezosClient.contract.at<WarehouseContract>(
                WAREHOUSE_CONTRACT_ADDRESS
            );

        logger.debug(
            `Successfully loaded Warehouse contract at "${WAREHOUSE_CONTRACT_ADDRESS}"`
        );
        return warehouseContract;
    } catch (err) {
        logger.error(
            `Unable to load Warehouse contract at "${WAREHOUSE_CONTRACT_ADDRESS}"`
        );
        throw err;
    }
}
