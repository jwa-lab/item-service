module.exports = {
    services: {
        knex: {
            factory: {
                class: "./services/knex/knexFactory",
                method: "makeKnexClient"
            },
            arguments: [
                "%config.PGSQL_HOST%",
                "%config.PGSQL_USER%",
                "%config.PGSQL_PASSWORD%",
                "%config.PGSQL_DATABASE%"
            ]
        },
        knexItemRepository: {
            class: "./repositories/KnexItemRepository",
            arguments: ["@knex"]
        },
        itemRepository: "@knexItemRepository"
    },
    imports: [
        { resource: "./natsHandlers/createItem/createItem.json" },
        { resource: "./natsHandlers/getItem/getItem.json" }
    ]
};
