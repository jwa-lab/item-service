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
        const { start, limit, user_id } =
            msg.query as unknown as GetItemInstancesQueryInterface;
        const parsedQuery = {
            start: Number(start) || 0,
            limit: typeof limit !== "undefined" ? Number(limit) : 10,
            user_id: user_id
        };

        await getItemsSchema.validateAsync(parsedQuery);

        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
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
            throw new Error("INVALID_JWT_STUDIO");
        }

        if (!studio_id) {
            throw new Error("STUDIO_ID_MISSING");
        }

        if (typeof start !== "number" || typeof limit !== "number") {
            throw new Error("MISSING_START_LIMIT");
        }

        const instances = await this.itemInstanceRepository.getItemInstances(
            start,
            limit,
            studio_id,
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
