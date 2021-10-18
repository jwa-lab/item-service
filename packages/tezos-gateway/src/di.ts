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
        tezosBatchProcessor: {
            class: "./TezosBatchProcessor",
            arguments: [
                "@logger",
                "@tezosClient",
                "%config.MAX_BATCH_GAS_LIMIT%"
            ]
        },
        tezosBlockMonitor: {
            class: "./TezosBlockMonitor",
            arguments: ["@logger", "@tezosClient"]
        },
        TezosGateway: {
            class: "./TezosGateway",
            tags: [{ name: "nats.consumer" }],
            arguments: [
                "@logger",
                "@jetStreamClient",
                "@tezosBatchProcessor",
                "@tezosBlockMonitor"
            ]
        }
    }
};
