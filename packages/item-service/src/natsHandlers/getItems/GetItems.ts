import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";
import { Logger } from "@jwalab/logger";
import {
    AIRLOCK_VERBS,
    AirlockHandler,
    AirlockMessage,
    isStudio,
    Message,
    PrivateHandler
} from "@jwalab/nats-runner";

import { ItemRepository } from "../../repositories/ItemRepository";
import { GetItemsInterface } from "../../repositories/KnexItemRepository";
import Joi from "joi";
import {
    InvalidTokenTypeError,
    MissingPropertyError,
    PropertyTypeError,
    SchemaValidationError
} from "../../errors";

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
        if (!isStudio(msg.headers)) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        const { start, limit } = msg.query as unknown as GetItemsQueryInterface;
        const parsedQuery = {
            start: Number(start) || 0,
            limit: typeof limit !== "undefined" ? Number(limit) : 10
        };

        try {
            await getItemsSchema.validateAsync(parsedQuery);
        } catch (error) {
            throw new SchemaValidationError(
                `GetItems -- ${(error as Error).message}`,
                error as Error
            );
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
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        if (!studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        if (!start && typeof start !== "number") {
            throw new MissingPropertyError("Property 'start' is missing.");
        }

        if (!limit && typeof limit !== "number") {
            throw new MissingPropertyError("Property 'limit' is missing.");
        }

        if (typeof start !== "number") {
            throw new PropertyTypeError(
                `given 'start' property is of type ${typeof start} but expected type is 'number'`
            );
        }

        if (typeof limit !== "number") {
            throw new PropertyTypeError(
                `given 'limit' property is of type ${typeof limit} but expected type is 'number'`
            );
        }

        return this.itemRepository.getItems(start, limit, studio_id);
    }
}

const getItemsSchema = Joi.object({
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required()
});
