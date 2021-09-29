import { ItemInstance } from "../entities/itemInstance";

export interface ItemInstanceRepository {
    createInstance(itemInstance: ItemInstance): Promise<ItemInstance>;
}
