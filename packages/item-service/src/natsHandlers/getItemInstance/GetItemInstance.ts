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

import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { ItemInstance } from "../../entities/itemInstance";
import { ItemRepository } from "../../repositories/ItemRepository";
import Joi from "joi";
import {
    InvalidStudioError,
    InvalidTokenTypeError,
    MissingPropertyError,
    SchemaValidationError,
    UnknownItemError,
    UnknownItemInstanceError
} from "../../errors";

interface GetItemInstancePrivatePayloadInterface {
    item_id: number;
    instance_number: number;
    is_studio: boolean;
    studio_id: string;
}

export class GetItemInstanceAirlockHandler extends AirlockHandler {
    readonly subject = "instance.*.*";
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

    async handle(msg: AirlockMessage): Promise<ItemInstance> {
        if (!isStudio(msg.headers)) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        const item_id = Number(msg.subject.split(".")[2]);
        const instance_number = Number(msg.subject.split(".")[3]);

        try {
            await getItemInstanceSchema.validateAsync({
                item_id,
                instance_number
            });
        } catch (error) {
            throw new SchemaValidationError(
                `GetItemInstance -- ${(error as Error).message}`,
                error as Error
            );
        }

        this.logger.info(
            `Getting item instance [item: ${item_id}, instance: ${instance_number}]`
        );

        const response = await this.natsConnection.request(
            "item-service.get-item-instance",
            JSONCodec().encode({
                item_id,
                instance_number,
                is_studio: msg.headers.is_studio,
                studio_id: msg.headers.studio_id
            })
        );

        return JSONCodec<ItemInstance>().decode(response.data);
    }
}

export class GetItemInstanceHandler extends PrivateHandler {
    readonly subject = "get-item-instance";

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

    async handle(msg: Message): Promise<ItemInstance> {
        const { item_id, instance_number, is_studio, studio_id } =
            msg.data as GetItemInstancePrivatePayloadInterface;

        if (!item_id) {
            throw new MissingPropertyError("Property 'item_id' is missing.");
        }

        if (!instance_number) {
            throw new MissingPropertyError(
                "Property 'instance_number' is missing."
            );
        }

        if (!is_studio) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        if (!studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        const requiredItem = await this.itemRepository.getItem(item_id);

        if (!requiredItem) {
            throw new UnknownItemError(`Item ID: ${item_id}.`);
        }

        if (requiredItem.studio_id !== studio_id) {
            throw new InvalidStudioError(
                `Item with id ${item_id} does not belong to your studio.`
            );
        }

        const fetchedInstance = await this.itemInstanceRepository.getInstance(
            item_id,
            instance_number
        );

        if (!fetchedInstance) {
            throw new UnknownItemInstanceError(
                `No instance match for [item: ${item_id}, instance: ${instance_number}]`
            );
        }

        const aggregatedInstance = new ItemInstance({
            ...fetchedInstance,
            data: {
                ...requiredItem.data,
                ...fetchedInstance.data
            }
        });

        return aggregatedInstance;
    }
}

const getItemInstanceSchema = Joi.object({
    item_id: Joi.number().min(0).required(),
    instance_number: Joi.number().min(0).required()
});
