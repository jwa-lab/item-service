import { ItemInstance } from "../entities/itemInstance";

export interface ItemInstanceTezosTokenizationInfo {
    tezos_contract_address: string;
    tezos_block: string;
}

export interface ItemInstanceRepository {
    createInstance(itemInstance: ItemInstance): Promise<ItemInstance>;

    updateItemInstanceTokenizationInfo(
        item_id: number,
        instance_number: number,
        tezosTokenizationInfo: ItemInstanceTezosTokenizationInfo
    ): Promise<void>;

    updateItemInstance(
        item_id: number,
        item_instance: number,
        data: Record<string, string>
    ): Promise<ItemInstance>;
}
