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
import { GetItemInstancesInterface } from "../../repositories/KnexItemInstanceRepository";
import Joi from "joi";
import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { ItemRepository } from "../../repositories/ItemRepository";
import { ItemInstance } from "../../entities/itemInstance";
import {
    InvalidTokenTypeError,
    MissingPropertyError,
    PropertyTypeError,
    SchemaValidationError
} from "../../errors";

interface GetItemInstancesQueryInterface {
    start: number;
    limit: number;
    user_id?: string;
}

interface GetItemInstancesPrivatePayloadInterface
    extends GetItemInstancesQueryInterface {
    is_studio: boolean;
    studio_id: string;
}

export class GetItemInstancesAirlockHandler extends AirlockHandler {
    readonly subject = "instances";
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

    async handle(msg: AirlockMessage): Promise<GetItemInstancesInterface> {
        if (!isStudio(msg.headers)) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        const { start, limit, user_id } =
            msg.query as unknown as GetItemInstancesQueryInterface;
        const parsedQuery = {
            start: Number(start) || 0,
            limit: typeof limit !== "undefined" ? Number(limit) : 10,
            user_id: user_id
        };

        try {
            await getItemsSchema.validateAsync(parsedQuery);
        } catch (error) {
            throw new SchemaValidationError(
                `GetItemInstances -- ${(error as Error).message}`,
                error as Error
            );
        }

        this.logger.info(`Getting items ${msg.headers.studio_id}`);

        const response = await this.natsConnection.request(
            "item-service.get-item-instances",
            JSONCodec().encode({
                ...parsedQuery,
                is_studio: msg.headers.is_studio,
                studio_id: msg.headers.studio_id
            })
        );

        return JSONCodec<GetItemInstancesInterface>().decode(response.data);
    }
}

export class GetItemInstancesHandler extends PrivateHandler {
    readonly subject = "get-item-instances";

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private itemInstanceRepository: ItemInstanceRepository,
        private itemRepository: ItemRepository
    ) {
        super();
    }

    async handle(msg: Message): Promise<GetItemInstancesInterface> {
        const { start, limit, studio_id, is_studio, user_id } =
            msg.data as GetItemInstancesPrivatePayloadInterface;

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

        const instances =
            await this.itemInstanceRepository.getItemInstancesByUserId(
                start,
                limit,
                user_id
            );

        const items_ids = new Set(
            instances.results.map((instance) => instance.item_id)
        );

        const items = await this.itemRepository.getItemsByIds(
            Array.from(items_ids)
        );

        const items_by_ids_map = new Map(
            items.map((item) => [item.item_id, item])
        );

        instances.results = instances.results.map((instance) => {
            const related_item = items_by_ids_map.get(instance.item_id);

            const aggregated_data = { ...related_item?.data, ...instance.data };

            return new ItemInstance({ ...instance, data: aggregated_data });
        });

        return instances;
    }
}

const getItemsSchema = Joi.object({
    start: Joi.number().min(0).required(),
    limit: Joi.number().min(1).required(),
    user_id: Joi.string()
});
