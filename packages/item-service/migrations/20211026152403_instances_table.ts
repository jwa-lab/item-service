import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("items_instances", function (table) {
        table.integer("instance_number").notNullable();
        table.integer("item_id").notNullable();
        table.string("user_id").notNullable();
        table.jsonb("data").notNullable().defaultTo("{}");
        table.string("tezos_contract_address");
        table.string("tezos_block");
        table.primary(["instance_number", "item_id"]);
    });
}

export async function down(knex: Knex): Promise<void> {}
