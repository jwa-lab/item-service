module.exports = {
    services: {
        TransferItemInstanceAirlock: {
            class: "./TransferItemInstance",
            main: "TransferItemInstanceAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        TransferItemInstance: {
            class: "./TransferItemInstance",
            main: "TransferItemInstanceHandler",
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
