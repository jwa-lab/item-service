import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";

import {
    AirlockHandler,
    PrivateHandler
} from "../../common/NatsRunner/Handlers";
import { AIRLOCK_VERBS } from "../../common/NatsRunner/NatsRunner";
import { AirlockMessage, Message } from "../../common/NatsRunner/Messages";
import { Logger } from "../../common/Logger/Logger";
import { Item } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";

export class GetItemAirlockHandler extends AirlockHandler {
    readonly subject = "item.*";
    readonly verb = AIRLOCK_VERBS.GET;

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private logger: Logger,
        private natsConnection: NatsConnection
    ) {
        super();
    }

    async handle(msg: AirlockMessage): Promise<Item> {
        const item_id = Number(msg.subject.split(".")[2]);

        this.logger.info(`Getting item ${item_id}`);

        const response = await this.natsConnection.request(
            "item-service.get-item",
            JSONCodec().encode(item_id)
        );

        return JSONCodec<Item>().decode(response.data);
    }
}

export class GetItemHandler extends PrivateHandler {
    readonly subject = "get-item";

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private itemRepository: ItemRepository
    ) {
        super();
    }

    handle(msg: Message): Promise<Item> {
        return this.itemRepository.getItem(msg.data as Pick<Item, "item_id">);
    }
}
