import {
    JetStreamClient,
    JSONCodec,
    NatsConnection,
    headers as natsHeaders
} from "nats";
import { Logger } from "@jwalab/js-common";
import { OpKind, TransferParams } from "@taquito/taquito";

import {
    WarehouseContract,
    WarehouseItem
} from "@jwalab/tokenization-service-contracts";

import { ItemRepository } from "../../repositories/ItemRepository";
import { TokenizationService } from "../tokenization/TokenizationService";
import { TezosEvents } from "./TezosEvents";
import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";

export class TezosTokenizationService implements TokenizationService {
    private readonly jetStreamClient: JetStreamClient;
    private readonly jsonCodec = JSONCodec();

    constructor(
        private readonly logger: Logger,
        private readonly itemRepository: ItemRepository,
        private readonly itemInstanceRepository: ItemInstanceRepository,
        private readonly tezosWarehouseContract: Promise<WarehouseContract>,
        natsConnection: NatsConnection
    ) {
        this.jetStreamClient = natsConnection.jetstream();
    }

    async createItem(item_id: number): Promise<void> {
        const item = await this.itemRepository.getItem(item_id);

        // need to remove this comment by typing WarehouseItem better
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        const warehouseItem = new WarehouseItem(item as any);

        // node dependency injection doesn't support async factories
        // so they return a Promise with the value, hence the await here.
        // we should add a compilerPass with an async tag to work around this and maybe raise an issue with the library.
        const operation = (await this.tezosWarehouseContract).methods
            .add_item(...warehouseItem.toMichelsonArguments())
            .toTransferParams();

        await this.executeOperation(
            item.studio_id,
            TezosEvents.ItemAdded,
            JSON.stringify({ item_id }),
            operation
        );
    }

    async updateItem(item_id: number): Promise<void> {
        const item = await this.itemRepository.getItem(item_id);

        // need to remove this comment by typing WarehouseItem better
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        const warehouseItem = new WarehouseItem(item as any);

        // node dependency injection doesn't support async factories
        // so they return a Promise with the value, hence the await here.
        // we should add a compilerPass with an async tag to work around this and maybe raise an issue with the library.
        const operation = (await this.tezosWarehouseContract).methods
            .update_item(...warehouseItem.toMichelsonArguments())
            .toTransferParams();

        await this.executeOperation(
            item.studio_id,
            TezosEvents.ItemUpdated,
            JSON.stringify({ item_id }),
            operation
        );
    }

    async assignItem(
        item_id: number,
        instance_number: number,
        user_id: string
    ): Promise<void> {
        const item = await this.itemRepository.getItem(item_id);

        // node dependency injection doesn't support async factories
        // so they return a Promise with the value, hence the await here.
        // we should add a compilerPass with an async tag to work around this and maybe raise an issue with the library.
        const operation = (await this.tezosWarehouseContract).methods
            .assign_item(item_id, instance_number, user_id)
            .toTransferParams();

        await this.executeOperation(
            item.studio_id,
            TezosEvents.ItemAssigned,
            JSON.stringify({ item_id, instance_number }),
            operation
        );
    }

    //@TODO - Uncomment when getInstance is merged, anti-typescript comment will be deleted.
    async updateItemInstance(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        item_id: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        instance_number: number
    ): Promise<void> {
        /*
        const itemInstance = await this.itemInstanceRepository.getInstance(item_id, instance_number);
        const item = await this.itemRepository.getItem(item_id);

        // node dependency injection doesn't support async factories
        // so they return a Promise with the value, hence the await here.
        // we should add a compilerPass with an async tag to work around this and maybe raise an issue with the library.
        const operation = (await this.tezosWarehouseContract).methods
            .update_instance(item_id, instance_number, itemInstance.data)
            .toTransferParams();

        await this.executeOperation(
            item.studio_id,
            TezosEvents.ItemInstanceUpdated,
            JSON.stringify({ item_id, instance_number }),
            operation
        );
         */
    }

    private async executeOperation(
        studioId: string,
        tezosEvent: TezosEvents,
        metadata: string,
        operation: TransferParams
    ): Promise<void> {
        const headers = natsHeaders();

        headers.append("studio_id", studioId);
        headers.append("metadata", metadata);
        headers.append("confirmation-subject", tezosEvent);

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
