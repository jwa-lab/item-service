import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";

import {
    AIRLOCK_VERBS,
    AirlockHandler,
    AirlockMessage,
    isStudio,
    Logger,
    Message,
    PrivateHandler
} from "common";

import { Item } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import { GetItemsInterface } from "../../repositories/KnexItemRepository";
import Joi from "joi";

interface GetItemsPrivatePayloadInterface {
    page: number;
    start: number;
    limit: number;
    is_studio: boolean;
    studio_id: string;
}

interface GetItemsQueryInterface {
    page: string;
    start: string;
    limit: string;
}

export class GetItemsAirlockHandler extends AirlockHandler {
    readonly subject = "items";
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
        const query = msg.query as unknown as GetItemsQueryInterface;
        const parsedQuery = {
            start: Number(query?.start) || 0,
            limit:
                typeof query?.limit !== "undefined" ? Number(query.limit) : 10
        };

        await getItemsSchema.validateAsync(parsedQuery);

        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
        }

        this.logger.info(`Getting items ${msg.headers.studio_id}`);

        const response = await this.natsConnection.request(
            "item-service.get-items",
            JSONCodec().encode({
                ...parsedQuery,
                is_studio: msg.headers.is_studio,
                studio_id: msg.headers.studio_id
            })
        );

        return JSONCodec<Item>().decode(response.data);
    }
}

export class GetItemsHandler extends PrivateHandler {
    readonly subject = "get-items";

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

    async handle(msg: Message): Promise<GetItemsInterface> {
        const data = msg.data as GetItemsPrivatePayloadInterface;

        if (!data.is_studio) {
            throw new Error("INVALID_JWT_STUDIO");
        }

        if (!data.studio_id) {
            throw new Error("STUDIO_ID_MISSING");
        }

        return this.itemRepository.getItems(
            data.start,
            data.limit,
            data.studio_id
        );
    }
}

const getItemsSchema = Joi.object({
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required()
});
