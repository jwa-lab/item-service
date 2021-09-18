import { Item } from "../entities/item";

export interface ItemRepository {
    addItem(item: Item): Promise<number>;
    getItem(item_id: Pick<Item, "item_id">): Promise<Item>;
}
