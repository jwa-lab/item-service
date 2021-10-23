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
        tezosWarehouseContract: {
            factory: {
                class: "./TezosWarehouseContract",
                method: "loadTezosWarehouseContract"
            },
            arguments: [
                "@logger",
                "@tezosClient",
                "%config.WAREHOUSE_CONTRACT_ADDRESS%"
            ]
        },
        tezosTokenizationService: {
            class: "./TezosTokenizationService",
            arguments: [
                "@logger",
                "@itemRepository",
                "@tezosWarehouseContract",
                "@natsConnection"
            ]
        },
        tezosPlugin: {
            class: "./TezosPlugin",
            tags: [{ name: "runner.plugin" }],
            arguments: [
                "@logger",
                "@eventBus",
                "@tezosTokenizationService",
                "@natsConnection"
            ]
        },
        tezosConfirmationProcessor: {
            class: "./TezosConfirmationProcessor",
            tags: [{ name: "nats.consumer" }],
            arguments: ["@logger", "@itemRepository", "@itemInstanceRepository"]
        }
    }
};
