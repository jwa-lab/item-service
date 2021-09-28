import Joi from "joi";
import {JSONCodec, NatsConnection, SubscriptionOptions} from "nats";
import {
    AIRLOCK_VERBS,
    AirlockHandler,
    AirlockMessage,
    EventBus,
    isStudio,
    Logger,
    Message,
    PrivateHandler
} from "common";
import {Item} from "../../entities/item";
import {ItemRepository} from "../../repositories/ItemRepository";
import {ItemUpdatedEvent} from "../../events/item";

interface UpdateItemPrivatePayloadInterface extends Item {
    is_studio: boolean;
    studio_id: string;
}

export class UpdateItemAirlockHandler extends AirlockHandler {
    readonly subject = "item";
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

    async handle(msg: AirlockMessage): Promise<{ item_id: number }> {
        await itemUpdateSchema.validateAsync(msg.body);

        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
        }

        const itemProps = {
            ...(msg.body as Partial<Item>),
            studio_id: msg.headers.studio_id,
            is_studio: msg.headers.is_studio,
        };

        const item = new Item(itemProps as Item);

        this.logger.info(`updating item ${JSON.stringify(item)}`);

        const response = await this.natsConnection.request(
            `${this.SERVICE_NAME}.update-item`,
            JSONCodec().encode(itemProps)
        );

        return JSONCodec<{ item_id: number }>().decode(response.data);
    }
}

export class UpdateItemHandler extends PrivateHandler {
    readonly subject = "update-item";

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private logger: Logger,
        private itemRepository: ItemRepository,
        private eventBus: EventBus
    ) {
        super();
    }

    async handle(msg: Message): Promise<Item> {
        const data = msg.data as UpdateItemPrivatePayloadInterface;

        if (!data.is_studio) {
            throw new Error("INVALID_JWT_STUDIO");
        }

        if (!data.studio_id) {
            throw new Error("STUDIO_ID_MISSING");
        }

        const item = await this.itemRepository.updateItem(
            new Item(msg.data as Item)
        );

        this.logger.info(`item updated with id ${item.item_id}`);

        this.eventBus.publish(new ItemUpdatedEvent(item.item_id as number));

        return item;
    }
}

export const itemUpdateSchema = Joi.object({
    item_id: Joi.number().min(0).required(),
    name: Joi.string().max(100).required(),
    available_quantity: Joi.number().min(0).required(),
    total_quantity: Joi.number().min(0).required(),
    frozen: Joi.boolean().required(),
    data: Joi.object().pattern(/^/, Joi.string()).required()
});
