module.exports = {
    services: {
        CreateItemAirlock: {
            class: "./CreateItem",
            main: "CreateItemAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        CreateItem: {
            class: "./CreateItem",
            main: "CreateItemHandler",
            tags: [{ name: "nats.handler" }],
            arguments: [
                "%config.SERVICE_NAME%",
                "@logger",
                "@itemRepository",
                "@eventBus"
            ]
        }
    }
};
