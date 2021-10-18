const {
    NATS_URL,
    LOGGING_FORMAT,
    TEZOS_RPC_URI,
    TEZOS_SECRET_KEY,
    MAX_BATCH_SIZE
} = process.env;

if (!NATS_URL) {
    throw new Error(
        `Please provide a valid NATS_URL so the service can connect to NATS. For example, use nats://nats:4222`
    );
}
if (!TEZOS_RPC_URI) {
    throw new Error(
        `Please provide a valid Tezos node URI via "TEZOS_RPC_URI", for instance https://api.tez.ie/rpc/mainnet`
    );
}

if (!TEZOS_SECRET_KEY) {
    throw new Error(
        "Please provide an uncrypted private key to sign transactions with via WAREHOUSE_SECRET_KEY."
    );
}

export default {
    NATS_URL,
    LOGGING_FORMAT,
    TEZOS_RPC_URI,
    TEZOS_SECRET_KEY,
    MAX_BATCH_SIZE
};
