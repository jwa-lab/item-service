module.exports = {
    "services": {
        "knex": {
            "factory": {
                "class": "./services/knex/knexFactory",
                "method": "makeKnexClient"
            },
            "arguments": [
                "%config.PGSQL_HOST%",
                "%config.PGSQL_USER%",
                "%config.PGSQL_PASSWORD%",
                "%config.PGSQL_DATABASE%"
            ]
        },
        "itemRepository": {
            "class": "./repositories/KnexItemRepository",
            "arguments": ["@knex"]
        }
    },
    "imports": [
        { "resource": "./natsHandlers/createItem/createItem.json" },
        { "resource": "./natsHandlers/getItem/getItem.json" }
    ]
}
