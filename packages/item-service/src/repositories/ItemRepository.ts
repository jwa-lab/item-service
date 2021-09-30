import { Item } from "../entities/item";
import { GetItemsInterface } from "./KnexItemRepository";

export interface ItemTezosTokenizationInfo {
    tezos_contract_address: string;
    tezos_block: string;
}

export interface ItemRepository {
    addItem(item: Item): Promise<number>;
    updateItem(item: Item): Promise<Item>;
    updateItemTokenizationInfo(
        item_id: number,
        tezosTokenizationInfo: ItemTezosTokenizationInfo
    ): Promise<void>;
    getItem(item_id: number): Promise<Item>;
    getItems(
        start: number,
        limit: number,
        studio_id: string
    ): Promise<GetItemsInterface>;
    assignItem(item: Item, decrease_quantity: number): Promise<Item>;
}
