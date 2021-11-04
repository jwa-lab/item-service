import { KnexTransactionManager } from "../services/knex/KnexTransactionManager";
import { Item, SavedItem } from "../entities/item";

import { ItemRepository, ItemTezosTokenizationInfo } from "./ItemRepository";
import { SQLUpdateNoRowsAffected } from "@jwalab/js-common";

export interface GetItemsInterface {
    results: Item[];
    pagination: Record<string, unknown>;
}

export class KnexItemRepository implements ItemRepository {
    private readonly itemTable = "items";

    constructor(private transactionManager: KnexTransactionManager) {}

    async addItem(item: Item): Promise<SavedItem> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient(this.itemTable).insert(item, ["*"]);

        return result[0];
    }

    async updateItem(item: SavedItem): Promise<SavedItem> {
        const queryClient = await this.transactionManager.getProvider();

        const existingItem = await this.getItem(item.item_id);

        if (!existingItem) {
            throw new Error(`Item with id ${item.item_id} does not exist.`);
        }

        if (existingItem.studio_id !== item.studio_id) {
            throw new Error("Invalid studio, you cannot update this item.");
        }

        if (existingItem.frozen) {
            throw new Error("Cannot update this item. Item is frozen.");
        }

        const result = await queryClient<SavedItem>(this.itemTable)
            .update(item, Object.keys(item))
            .where("item_id", item.item_id);

        return result[0];
    }

    async updateItemTokenizationInfo(
        item_id: number,
        tezosTokenizationInfo: ItemTezosTokenizationInfo
    ): Promise<void> {
        const queryClient = await this.transactionManager.getProvider();

        await queryClient(this.itemTable)
            .update(tezosTokenizationInfo)
            .where("item_id", item_id);
    }

    async getItem(item_id: number): Promise<SavedItem> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient<SavedItem>(this.itemTable)
            .select()
            .where("item_id", item_id);

        return result[0];
    }

    async getItems(
        start: number,
        limit: number,
        studio_id: string
    ): Promise<GetItemsInterface> {
        const queryClient = await this.transactionManager.getProvider();

        const totalQuery = await queryClient(this.itemTable).count("*").first();

        const results = await queryClient<Item>(this.itemTable)
            .select()
            .where("studio_id", studio_id)
            .offset(start)
            .limit(limit);

        const pagination = {
            from: start,
            count: results.length,
            total: Number(totalQuery?.count)
        };

        return {
            results,
            pagination
        };
    }

    async getItemsByIds(ids: number[]): Promise<SavedItem[]> {
        const queryClient = await this.transactionManager.getProvider();

        const results = await queryClient<SavedItem>(this.itemTable)
            .select()
            .whereIn("item_id", ids);

        return results;
    }

    async assignItem(
        item: SavedItem,
        decrease_quantity: number
    ): Promise<SavedItem> {
        const queryClient = await this.transactionManager.getProvider();
        const finalDecreaseQuantity = Math.abs(decrease_quantity);

        const result = await queryClient(this.itemTable)
            .update(
                {
                    available_quantity: queryClient.raw(
                        "available_quantity - " + String(finalDecreaseQuantity)
                    )
                },
                Object.keys(item)
            )
            .where("item_id", item.item_id)
            .andWhere("available_quantity", item.available_quantity);

        if (result.length === 0) {
            throw new SQLUpdateNoRowsAffected(
                "No lines updated, please try again."
            );
        }

        return result[0];
    }
}
