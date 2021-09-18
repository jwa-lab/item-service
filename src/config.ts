import { validateAddress } from "@taquito/utils";

const {
    SERVICE_NAME,
    NATS_URL,
    LOGGING_FORMAT,
    TEZOS_RPC_URI,
    TEZOS_SECRET_KEY,
    TEZOS_PUBLIC_KEY_HASH,
    WAREHOUSE_CONTRACT_ADDRESS,
    PGSQL_HOST,
    PGSQL_USER,
    PGSQL_PASSWORD,
    PGSQL_DATABASE
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

if (!TEZOS_PUBLIC_KEY_HASH) {
    throw new Error(
        "Please provide a public key hash for the contract owner via WAREHOUSE_TEZOS_PUBLIC_KEY_HASH."
    );
}

if (!validateAddress(WAREHOUSE_CONTRACT_ADDRESS)) {
    throw new Error(
        "Please provide a valid KT1 address to access the WAREHOUSE via WAREHOUSE_CONTRACT_ADDRESS."
    );
}

export default {
    SERVICE_NAME,
    NATS_URL,
    LOGGING_FORMAT,
    TEZOS_RPC_URI,
    TEZOS_SECRET_KEY,
    TEZOS_PUBLIC_KEY_HASH,
    WAREHOUSE_CONTRACT_ADDRESS,
    PGSQL_HOST,
    PGSQL_USER,
    PGSQL_PASSWORD,
    PGSQL_DATABASE
};
