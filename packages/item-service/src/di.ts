module.exports = {
    imports: [
        { resource: "./services/MessageBus/di" },
        { resource: "./services/Tezos/di" },
        { resource: "./services/knex/di" },
        { resource: "./repositories/di" },
        { resource: "./natsHandlers/createItem/di" },
        { resource: "./natsHandlers/getItem/di" }
    ]
};
