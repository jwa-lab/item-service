import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.raw(
        "CREATE OR REPLACE FUNCTION flatten_item_data(data jsonb, name text) RETURNS TEXT AS $$ SELECT CONCAT(string_agg(value, ' '), ' ', name) FROM (SELECT value FROM JSONB_EACH_TEXT(data)) AS foo $$ LANGUAGE SQL IMMUTABLE;"
    );

    await knex.schema
        .createTable("items", function (table) {
            table.increments("item_id");
            table.string("studio_id").notNullable();
            table.string("name", 100).notNullable();
            table.integer("total_quantity").notNullable();
            table.integer("available_quantity").notNullable();
            table.boolean("frozen").notNullable();
            table.jsonb("data").notNullable().defaultTo("{}");
            table.specificType(
                "fulltext",
                "TEXT GENERATED ALWAYS AS (flatten_item_data(data, name)) STORED"
            );
            table.string("tezos_contract_address");
            table.string("tezos_block");
        });
}


export async function down(knex: Knex): Promise<void> {
}
