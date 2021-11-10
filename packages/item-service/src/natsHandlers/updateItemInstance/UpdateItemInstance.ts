import Joi from "joi";
import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";
import {
    AIRLOCK_VERBS,
    AirlockHandler,
    AirlockMessage,
    EventBus,
    isStudio,
    Logger,
    Message,
    PrivateHandler
} from "@jwalab/js-common";
import { ItemInstance } from "../../entities/itemInstance";
import { ItemInstanceUpdatedEvent } from "../../events/item";
import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { ItemRepository } from "../../repositories/ItemRepository";
import { joiPayloadValidator } from "../../utils";
import {
    InvalidStudioError,
    InvalidTokenTypeError,
    MissingPropertyError,
    SchemaValidationError,
    UnknownItemError
} from "../../errors";

interface UpdateItemInstancePrivatePayloadInterface extends ItemInstance {
    is_studio: boolean;
    studio_id: string;
}

export class UpdateItemInstanceAirlockHandler extends AirlockHandler {
    readonly subject = "item-instance";
    readonly verb = AIRLOCK_VERBS.PUT;

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

        try {
            await itemInstanceUpdateSchema.validateAsync(msg.body);
        } catch (error) {
            throw new SchemaValidationError(
                `UpdateItemInstance -- ${(error as Error).message}`,
                error as Error
            );
        }

        const itemInstance = new ItemInstance(msg.body as ItemInstance);

        const itemProps = {
            data: itemInstance.data,
            item_id: itemInstance.item_id,
            instance_number: itemInstance.instance_number,
            studio_id: msg.headers.studio_id,
            is_studio: msg.headers.is_studio
        };

        this.logger.info(
            `updating item instance [item_id: ${JSON.stringify(
                itemInstance.item_id
            )}, instance_number: ${JSON.stringify(
                itemInstance.instance_number
            )}`
        );

        const response = await this.natsConnection.request(
            `${this.SERVICE_NAME}.update-item-instance`,
            JSONCodec().encode(itemProps)
        );

        return JSONCodec<ItemInstance>().decode(response.data);
    }
}

export class UpdateItemInstanceHandler extends PrivateHandler {
    readonly subject = "update-item-instance";

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private logger: Logger,
        private itemRepository: ItemRepository,
        private itemInstanceRepository: ItemInstanceRepository,
        private eventBus: EventBus
    ) {
        super();
    }

    async handle(msg: Message): Promise<ItemInstance> {
        const { is_studio, studio_id, item_id, instance_number, data } =
            msg.data as UpdateItemInstancePrivatePayloadInterface;

        if (!is_studio) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        if (!studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        if (!data) {
            throw new MissingPropertyError("Property 'data' is missing.");
        }

        if (!item_id) {
            throw new MissingPropertyError("Property 'item_id' is missing.");
        }

        if (!instance_number) {
            throw new MissingPropertyError(
                "Property 'instance_number' is missing."
            );
        }

        const item = await this.itemRepository.getItem(item_id);

        if (!item) {
            throw new UnknownItemError(`Item ID: ${item_id}.`);
        }

        if (item.studio_id !== studio_id) {
            throw new InvalidStudioError(
                `Item with id ${item_id} does not belong to your studio.`
            );
        }

        const updatedInstance =
            await this.itemInstanceRepository.updateItemInstance(
                item_id,
                instance_number,
                data
            );

        const aggregatedData = {
            ...item.data,
            ...updatedInstance.data
        };

        const aggregatedUpdatedInstance = new ItemInstance({
            ...updatedInstance,
            data: aggregatedData
        });

        this.logger.info(
            `item instance updated with [item_id: ${updatedInstance.item_id}, instance_number: ${updatedInstance.instance_number}]`
        );

        this.eventBus.publish(
            new ItemInstanceUpdatedEvent(
                updatedInstance.item_id,
                updatedInstance.instance_number,
                updatedInstance.data
            )
        );

        return aggregatedUpdatedInstance;
    }
}

export const itemInstanceUpdateSchema = Joi.object({
    item_id: Joi.number().min(0).required(),
    instance_number: Joi.number().min(0).required(),
    data: Joi.object()
        .pattern(/^/, Joi.string())
        .required()
        .custom(joiPayloadValidator)
});
