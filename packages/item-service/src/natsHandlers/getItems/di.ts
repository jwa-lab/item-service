module.exports = {
    services: {
        GetItemsAirlock: {
            class: "./GetItems",
            main: "GetItemsAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        GetItems: {
            class: "./GetItems",
            main: "GetItemsHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@itemRepository"]
        }
    }
};
