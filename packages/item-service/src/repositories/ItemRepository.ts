import { Item } from "../entities/item";

export interface ItemRepository {
    addItem(item: Item): Promise<number>;
    updateItem(item: Item): Promise<Item>;
    getItem(item_id: number): Promise<Item>;
}
