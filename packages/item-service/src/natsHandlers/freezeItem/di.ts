module.exports = {
    services: {
        AssignItemAirlock: {
            class: "./FreezeItem",
            main: "FreezeItemAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        AssignItem: {
            class: "./FreezeItem",
            main: "FreezeItemHandler",
            tags: [{ name: "nats.handler" }],
            arguments: [
                "%config.SERVICE_NAME%",
                "@logger",
                "@itemRepository",
                "@eventBus",
                "@transactionManager"
            ]
        }
    }
};
