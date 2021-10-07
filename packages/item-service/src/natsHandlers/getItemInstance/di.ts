module.exports = {
    services: {
        GetItemInstanceAirlock: {
            class: "./GetItemInstance",
            main: "GetItemInstanceAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        GetItemInstance: {
            class: "./GetItemInstance",
            main: "GetItemInstanceHandler",
            tags: [{ name: "nats.handler" }],
            arguments: [
                "%config.SERVICE_NAME%",
                "@itemInstanceRepository",
                "@itemRepository"
            ]
        }
    }
};
