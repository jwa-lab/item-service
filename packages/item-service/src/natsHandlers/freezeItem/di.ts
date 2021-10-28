module.exports = {
    services: {
        FreezeItemAirlock: {
            class: "./FreezeItem",
            main: "FreezeItemAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        FreezeItem: {
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
