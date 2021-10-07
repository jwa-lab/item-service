module.exports = {
    services: {
        UpdateItemInstanceAirlock: {
            class: "./UpdateItemInstance",
            main: "UpdateItemInstanceAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        UpdateItemInstance: {
            class: "./UpdateItemInstance",
            main: "UpdateItemInstanceHandler",
            tags: [{ name: "nats.handler" }],
            arguments: [
                "%config.SERVICE_NAME%",
                "@logger",
                "@itemRepository",
                "@itemInstanceRepository",
                "@eventBus"
            ]
        }
    }
};
