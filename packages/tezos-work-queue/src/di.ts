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
        tezosBatchValidator: {
            class: "./TezosBatchValidator",
            arguments: ["@logger", "@tezosClient", "%config.MAX_BATCH_SIZE%"]
        },
        tezosSmartBatcher: {
            class: "./TezosSmartBatcher",
            arguments: ["@logger", "@tezosClient", "@tezosBatchValidator"]
        },
        tezosBlockMonitor: {
            class: "./TezosBlockMonitor",
            arguments: ["@logger", "@tezosClient"]
        },
        TezosWorkQueue: {
            class: "./TezosWorkQueue",
            tags: [{ name: "nats.consumer" }],
            arguments: [
                "@logger",
                "@jetStreamClient",
                "@tezosSmartBatcher",
                "@tezosBlockMonitor"
            ]
        }
    }
};
