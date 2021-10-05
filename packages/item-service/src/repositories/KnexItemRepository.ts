import { KnexTransactionManager } from "../services/knex/KnexTransactionManager";
import { Item } from "../entities/item";
import { ItemRepository } from "./ItemRepository";

export interface GetItemsInterface {
    results: Item[];
    pagination: Record<string, unknown>;
}

export class KnexItemRepository implements ItemRepository {
    private readonly itemTable = "items";

    constructor(private transactionManager: KnexTransactionManager) {}

    async addItem(item: Item): Promise<number> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient(this.itemTable).insert(item, [
            "item_id"
        ]);

        return result[0].item_id;
    }

    async updateItem(item: Item): Promise<Item> {
        const queryClient = await this.transactionManager.getProvider();

        const existingItem = await this.getItem(item.item_id as number);

        if (existingItem.studio_id !== item.studio_id) {
            throw new Error("Invalid studio, you cannot update this item.");
        }

        if (existingItem.frozen) {
            throw new Error("Cannot update this item. Item is frozen.");
        }

        const result = await queryClient<Item>(this.itemTable)
            .update(item, Object.keys(item))
            .where("item_id", item.item_id);

        return result[0];
    }

    async getItem(item_id: number): Promise<Item> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient(this.itemTable)
            .select()
            .where("item_id", item_id);

        return new Item(result[0]);
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

    async assignItem(item: Item, decrease_quantity: number): Promise<Item> {
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
            throw new Error("No lines updated.");
        }

        return result[0];
    }
}
