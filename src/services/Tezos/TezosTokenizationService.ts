import { JetStreamClient, JSONCodec, NatsConnection } from "nats";
import {
    WarehouseContract,
    WarehouseItem
} from "@jwalab/tokenization-service-contracts";

import { Item } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import { TokenizationService } from "../tokenization/TokenizationService";

enum TezosCommands {
    CreateItem = "TEZOS.CreateItem"
}

export class TezosTokenizationService implements TokenizationService {
    private readonly jetStreamClient: JetStreamClient;

    constructor(
        private itemRepository: ItemRepository,
        private tezosWarehouseContract: Promise<WarehouseContract>,
        natsConnection: NatsConnection
    ) {
        this.jetStreamClient = natsConnection.jetstream();
    }

    async createItem(itemId: Pick<Item, "item_id">): Promise<void> {
        const item = await this.itemRepository.getItem(itemId);

        const warehouseItem = new WarehouseItem(item as any);

        // node dependency injection doesn't support async factories
        // so they return a Promise with the value, hence the await here.
        // we should add a compilerPass with an async tag to work around this and maybe raise an issue with the library.
        const operation = (await this.tezosWarehouseContract).methods
            .add_item(...warehouseItem.toMichelsonArguments())
            .toTransferParams();

        console.log("jestream", TezosCommands.CreateItem, operation);

        await this.jetStreamClient.publish(
            TezosCommands.CreateItem,
            JSONCodec().encode(operation)
        );
    }
}
