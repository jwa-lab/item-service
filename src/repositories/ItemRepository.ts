import { PgSQL } from "../services/pgSql/pgSqlFactory";
import { Item } from "../entities/item";

export class ItemRepository {
    private readonly itemTable = "items";

    constructor(private pgSql: PgSQL) {}

    async addItem(item: Item): Promise<number> {
        const result = await this.pgSql(this.itemTable).insert(item, [
            "item_id"
        ]);

        return result[0].item_id;
    }

    async getItem(item_id: number): Promise<Item> {
        const result = await this.pgSql(this.itemTable)
            .select()
            .where("item_id", item_id);

        return new Item(result[0]);
    }
}
