import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";

import {
    AIRLOCK_VERBS,
    AirlockHandler,
    AirlockMessage,
    Logger,
    Message,
    PrivateHandler,
    isStudio
} from "@jwalab/js-common";

import { SavedItem } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";

interface GetItemPrivatePayloadInterface {
    item_id: number;
    is_studio: boolean;
    studio_id: string;
}

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

    async handle(msg: AirlockMessage): Promise<SavedItem> {
        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
        }

        const item_id = Number(msg.subject.split(".")[2]);

        this.logger.info(`Getting item ${item_id}`);

        const response = await this.natsConnection.request(
            "item-service.get-item",
            JSONCodec().encode({
                item_id,
                is_studio: msg.headers.is_studio,
                studio_id: msg.headers.studio_id
            })
        );

        return JSONCodec<SavedItem>().decode(response.data);
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

    async handle(msg: Message): Promise<SavedItem> {
        const data = msg.data as GetItemPrivatePayloadInterface;
        const fetchedItem = await this.itemRepository.getItem(data.item_id);

        if (!data?.is_studio) {
            throw new Error("INVALID_JWT_STUDIO");
        } else {
            if (fetchedItem.studio_id !== data.studio_id) {
                throw new Error("INVALID_STUDIO_ID");
            }
        }

        return fetchedItem;
    }
}
