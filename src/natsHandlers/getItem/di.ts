module.exports = {
    services: {
        GetItemAirlock: {
            class: "./GetItem",
            main: "GetItemAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        GetItem: {
            class: "./GetItem",
            main: "GetItemHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@itemRepository"]
        }
    }
};
