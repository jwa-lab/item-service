module.exports = {
    services: {
        knexItemRepository: {
            class: "./KnexItemRepository",
            arguments: ["@transactionManager"]
        },
        itemRepository: "@knexItemRepository",
        knexItemInstanceRepository: {
            class: "./KnexItemInstanceRepository",
            arguments: ["@transactionManager"]
        },
        itemInstanceRepository: "@knexItemInstanceRepository"
    }
};
