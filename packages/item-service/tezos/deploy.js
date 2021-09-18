require("dotenv").config();

const { TezosToolkit, MichelsonMap } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const { warehouse } = require("@jwalab/tokenization-service-contracts").default;

const { TEZOS_RPC_URI, TEZOS_SECRET_KEY, TEZOS_PUBLIC_KEY_HASH } = process.env;

const tezosClient = new TezosToolkit(TEZOS_RPC_URI);

tezosClient.setProvider({
    signer: new InMemorySigner(TEZOS_SECRET_KEY)
});

(async function deploy() {
    try {
        const operation = await tezosClient.contract.originate({
            code: warehouse.michelson,
            storage: {
                owner: TEZOS_PUBLIC_KEY_HASH,
                version: "1",
                items: MichelsonMap.fromLiteral({}),
                instances: MichelsonMap.fromLiteral({})
            }
        });

        operation.address;

        const contract = await operation.contract(1, 1);

        console.log("contract deployed at " + contract.address);
    } catch (e) {
        console.error(e);
    }
})();
