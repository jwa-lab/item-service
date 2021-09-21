module.exports = {
    services: {
        knexItemRepository: {
            class: "./KnexItemRepository",
            arguments: ["@knex"]
        },
        itemRepository: "@knexItemRepository"
    }
};
