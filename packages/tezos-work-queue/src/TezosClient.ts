import { TezosToolkit } from "@taquito/taquito";
import { InMemorySigner } from "@taquito/signer";

import { Logger } from "@jwalab/js-common";

export function makeTezosClient(
    logger: Logger,
    TEZOS_RPC_URI: string,
    TEZOS_SECRET_KEY: string
): TezosToolkit {
    const tezosClient = new TezosToolkit(TEZOS_RPC_URI);

    tezosClient.setProvider({
        config: {
            // I wish I could override this confirmation in config.json but this currently doesn't work, resorting to calling
            // operation.confirmation(1, 1) instead everywhere in my code. will debug and submit a Taquito bug fix on GitHub if necessary
            confirmationPollingIntervalSecond: 1,
            confirmationPollingTimeoutSecond: 180
        },
        signer: new InMemorySigner(TEZOS_SECRET_KEY)
    });

    logger.debug(`Tezos client connected to ${TEZOS_RPC_URI}`);

    return tezosClient;
}
