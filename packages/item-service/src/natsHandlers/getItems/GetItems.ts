import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";

import {
    AIRLOCK_VERBS,
    AirlockHandler,
    AirlockMessage,
    isStudio,
    Logger,
    Message,
    PrivateHandler
} from "@jwalab/js-common";
import { ItemRepository } from "../../repositories/ItemRepository";
import { GetItemsInterface } from "../../repositories/KnexItemRepository";
import Joi from "joi";

interface GetItemsPrivatePayloadInterface {
    start: number;
    limit: number;
    is_studio: boolean;
    studio_id: string;
}

interface GetItemsQueryInterface {
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

    async handle(msg: AirlockMessage): Promise<GetItemsInterface> {
        const { start, limit } = msg.query as unknown as GetItemsQueryInterface;
        const parsedQuery = {
            start: Number(start) || 0,
            limit: typeof limit !== "undefined" ? Number(limit) : 10
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

        return JSONCodec<GetItemsInterface>().decode(response.data);
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
        const { is_studio, studio_id, start, limit } =
            msg.data as GetItemsPrivatePayloadInterface;

        if (!is_studio) {
            throw new Error("INVALID_JWT_STUDIO");
        }

        if (!studio_id) {
            throw new Error("STUDIO_ID_MISSING");
        }

        return this.itemRepository.getItems(start, limit, studio_id);
    }
}

const getItemsSchema = Joi.object({
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required()
});
