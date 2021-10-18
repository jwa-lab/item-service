import { Item, SavedItem } from "../entities/item";
import { GetItemsInterface } from "./KnexItemRepository";

export interface ItemTezosTokenizationInfo {
    tezos_operation_hash: string;
}

export interface ItemRepository {
    addItem(item: Item): Promise<SavedItem>;
    updateItem(item: SavedItem): Promise<SavedItem>;
    updateItemTokenizationInfo(
        item_id: number,
        tezosTokenizationInfo: ItemTezosTokenizationInfo
    ): Promise<void>;
    getItem(item_id: number): Promise<SavedItem>;
    getItems(
        start: number,
        limit: number,
        studio_id: string
    ): Promise<GetItemsInterface>;
    assignItem(item: SavedItem, decrease_quantity: number): Promise<SavedItem>;
    getItemsByIds(ids: number[]): Promise<SavedItem[]>;
}
