module.exports = {
    imports: [
        { resource: "./common/MessageBus/di" },
        { resource: "./services/Tezos/di" },
        { resource: "./services/knex/di" },
        { resource: "./repositories/di" },
        { resource: "./natsHandlers/createItem/di" },
        { resource: "./natsHandlers/getItem/di" }
    ]
};
