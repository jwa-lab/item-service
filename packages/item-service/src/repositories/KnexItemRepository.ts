import { Knex } from "knex";

import { Item } from "../entities/item";

import { ItemRepository } from "./ItemRepository";

export interface GetItemsInterface {
    results: Item[];
    pagination: Record<string, unknown>;
}

export class KnexItemRepository implements ItemRepository {
    private readonly itemTable = "items";

    constructor(private knex: Knex) {}

    async addItem(item: Item): Promise<number> {
        const result = await this.knex(this.itemTable).insert(item, [
            "item_id"
        ]);

        return result[0].item_id;
    }

    async updateItem(item: Item): Promise<Item> {
        const existingItem = await this.getItem(item.item_id as number);

        if (existingItem.studio_id !== item.studio_id) {
            throw new Error("Invalid studio, you cannot update this item.");
        }

        if (existingItem.frozen) {
            throw new Error("Cannot update this item. Item is frozen.");
        }

        const result = await this.knex<Item>(this.itemTable)
            .update(item, Object.keys(item))
            .where("item_id", item.item_id);

        return result[0];
    }

    async getItem(item_id: number): Promise<Item> {
        const result = await this.knex(this.itemTable)
            .select()
            .where("item_id", item_id);

        return new Item(result[0]);
    }

    async getItems(
        start: number,
        limit: number,
        studio_id: string
    ): Promise<GetItemsInterface> {
        const totalQuery = await this.knex(this.itemTable).count("*").first();

        const results = await this.knex<Item>(this.itemTable)
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
}
