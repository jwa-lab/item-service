module.exports = {
    services: {
        UpdateItemAirlock: {
            class: "./UpdateItem",
            main: "UpdateItemAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        UpdateItem: {
            class: "./UpdateItem",
            main: "UpdateItemHandler",
            tags: [{ name: "nats.handler" }],
            arguments: [
                "%config.SERVICE_NAME%",
                "@logger",
                "@itemRepository",
                "@itemInstanceRepository",
                "@eventBus",
                "@transactionManager"
            ]
        }
    }
};
