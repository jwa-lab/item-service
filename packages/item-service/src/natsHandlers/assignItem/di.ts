module.exports = {
    services: {
        AssignItemAirlock: {
            class: "./AssignItem",
            main: "AssignItemAirlockHandler",
            tags: [{ name: "nats.handler" }],
            arguments: ["%config.SERVICE_NAME%", "@logger", "@natsConnection"]
        },
        AssignItem: {
            class: "./AssignItem",
            main: "AssignItemHandler",
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
