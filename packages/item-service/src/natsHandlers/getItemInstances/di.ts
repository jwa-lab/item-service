module.exports = {
    services: {
        GetItemInstancesAirlock: {
            class: "./GetItemInstances",
            main: "GetItemInstancesAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        GetItemInstances: {
            class: "./GetItemInstances",
            main: "GetItemInstancesHandler",
            tags: [{ name: "nats.handler" }],
            arguments: [
                "%config.SERVICE_NAME%",
                "@itemInstanceRepository",
                "@itemRepository"
            ]
        }
    }
};
