import { Item } from "../entities/item";
import { GetItemsInterface } from "./KnexItemRepository";

export interface ItemRepository {
    addItem(item: Item): Promise<number>;
    updateItem(item: Item): Promise<Item>;
    getItem(item_id: number): Promise<Item>;
    getItems(
        start: number,
        limit: number,
        studio_id: string
    ): Promise<GetItemsInterface>;
}
