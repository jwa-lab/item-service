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
        TezosWorkQueue: {
            class: "./TezosWorkQueue",
            tags: [{ name: "nats.consumer" }],
            arguments: ["@logger", "@tezosClient", "@jetStreamClient"]
        }
    }
};
