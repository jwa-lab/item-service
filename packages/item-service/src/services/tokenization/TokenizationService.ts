import { Item } from "../../entities/item";

export enum TokenizationEvents {
    ITEM_CREATED = "ItemCreated"
}

export interface TokenizationService {
    createItem(itemId: Pick<Item, "item_id">): void;
}
