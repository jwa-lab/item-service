module.exports = {
    imports: [
        { resource: "./services/EventBus/di" },
        { resource: "./services/Tezos/di" },
        { resource: "./services/knex/di" },
        { resource: "./repositories/di" },
        { resource: "./natsHandlers/createItem/di" },
        { resource: "./natsHandlers/updateItem/di" },
        { resource: "./natsHandlers/getItem/di" }
    ]
};
