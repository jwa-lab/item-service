import {
    JetStreamClient,
    JSONCodec,
    NatsConnection,
    headers as natsHeaders
} from "nats";
import { Logger } from "common";
import { OpKind, TransferParams } from "@taquito/taquito";

import {
    WarehouseContract,
    WarehouseItem
} from "@jwalab/tokenization-service-contracts";

import { ItemRepository } from "../../repositories/ItemRepository";
import { TokenizationService } from "../tokenization/TokenizationService";
import { TezosEvents } from "./TezosEvents";

export class TezosTokenizationService implements TokenizationService {
    private readonly jetStreamClient: JetStreamClient;
    private readonly jsonCodec = JSONCodec();

    constructor(
        private readonly logger: Logger,
        private readonly itemRepository: ItemRepository,
        private readonly tezosWarehouseContract: Promise<WarehouseContract>,
        natsConnection: NatsConnection
    ) {
        this.jetStreamClient = natsConnection.jetstream();
    }

    async createItem(itemId: number): Promise<void> {
        const item = await this.itemRepository.getItem(itemId);

        // need to remove this comment by typing WarehouseItem better
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        const warehouseItem = new WarehouseItem(item as any);

        // node dependency injection doesn't support async factories
        // so they return a Promise with the value, hence the await here.
        // we should add a compilerPass with an async tag to work around this and maybe raise an issue with the library.
        const operation = (await this.tezosWarehouseContract).methods
            .add_item(...warehouseItem.toMichelsonArguments())
            .toTransferParams();

        this.executeOperation(
            item.studio_id,
            TezosEvents.ItemAdded,
            JSON.stringify(item),
            operation
        );
    }

    async updateItem(itemId: number): Promise<void> {
        const item = await this.itemRepository.getItem(itemId);

        // need to remove this comment by typing WarehouseItem better
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        const warehouseItem = new WarehouseItem(item as any);

        // node dependency injection doesn't support async factories
        // so they return a Promise with the value, hence the await here.
        // we should add a compilerPass with an async tag to work around this and maybe raise an issue with the library.
        const operation = (await this.tezosWarehouseContract).methods
            .update_item(...warehouseItem.toMichelsonArguments())
            .toTransferParams();

        this.executeOperation(
            item.studio_id,
            TezosEvents.ItemUpdated,
            JSON.stringify(item),
            operation
        );
    }

    private async executeOperation(
        studioId: string,
        tezosEvent: TezosEvents,
        metadata: string,
        operation: TransferParams
    ): Promise<void> {
        const headers = natsHeaders();

        headers.append("X-Studio-Id", studioId);
        headers.append("X-Metadata", metadata);
        headers.append("X-Confirmation-Subject", tezosEvent);

        const tezosOperation = {
            kind: OpKind.TRANSACTION,
            ...operation
        };

        this.logger.debug(
            `TezosCommands.Execute ${JSON.stringify(tezosOperation)}`
        );

        await this.jetStreamClient.publish(
            "TEZOS.Execute",
            this.jsonCodec.encode(tezosOperation),
            { headers }
        );
    }
}
