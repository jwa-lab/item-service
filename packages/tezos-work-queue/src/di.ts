module.exports = {
    services: {
        tezosClient: {
            factory: {
                class: "./TezosClient",
                method: "makeTezosClient"
            },
            arguments: [
                "@logger",
                "%config.TEZOS_RPC_URI%",
                "%config.TEZOS_SECRET_KEY%"
            ]
        },
        TezosWorkQueuePlugin: {
            class: "./TezosWorkQueuePlugin",
            tags: [{ name: "runner.plugin" }],
            arguments: ["@logger", "@natsConnection", "@tezosClient"]
        }
    }
};
