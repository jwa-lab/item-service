module.exports = {
    imports: [
        { resource: "./services/EventBus/di" },
        { resource: "./services/Tezos/di" },
        { resource: "./services/knex/di" },
        { resource: "./repositories/di" },
        { resource: "./natsHandlers/createItem/di" },
        { resource: "./natsHandlers/updateItem/di" },
        { resource: "./natsHandlers/assignItem/di" },
        { resource: "./natsHandlers/getItem/di" },
        { resource: "./natsHandlers/getItems/di" },
        { resource: "./natsHandlers/updateItemInstance/di" },
        { resource: "./natsHandlers/getItemInstance/di" },
        { resource: "./natsHandlers/transferItemInstance/di" }
    ]
};
