import { ItemInstance } from "../entities/itemInstance";
import { GetItemInstancesInterface } from "./KnexItemInstanceRepository";

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
    getInstance(
        item_id: number,
        instance_number: number
    ): Promise<ItemInstance>;
    transferItemInstance(
        item_id: number,
        instance_number: number,
        to_user_id: string
    ): Promise<ItemInstance>;
    getItemInstancesByUserId(
        start: number,
        limit: number,
        user_id?: string
    ): Promise<GetItemInstancesInterface>;
    getItemInstancesByItemId(
        start: number,
        limit: number,
        item_id: number
    ): Promise<GetItemInstancesInterface>;
}
