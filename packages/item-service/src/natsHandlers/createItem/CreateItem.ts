import Joi from "joi";
import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";
import { EventBus } from "@jwalab/event-bus";
import { Logger } from "@jwalab/logger";
import {
    AIRLOCK_VERBS,
    AirlockHandler,
    AirlockMessage,
    isStudio,
    Message,
    PrivateHandler
} from "@jwalab/nats-runner";

import { Item, SavedItem } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import { ItemCreatedEvent } from "../../events/item";
import {
    InvalidTokenTypeError,
    MissingPropertyError,
    SchemaValidationError
} from "../../errors";
import { joiPayloadValidator } from "../../utils";

export class CreateItemAirlockHandler extends AirlockHandler {
    readonly subject = "item";
    readonly verb = AIRLOCK_VERBS.POST;

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
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        const payload = msg.body as Pick<
            Item,
            "frozen" | "data" | "total_quantity" | "name"
        >;

        try {
            await itemCreateSchema.validateAsync(payload);
        } catch (error) {
            throw new SchemaValidationError(
                `CreateItem -- ${(error as Error).message}`,
                error as Error
            );
        }

        const item = new Item({
            ...payload,
            available_quantity: payload.total_quantity,
            studio_id: msg.headers.studio_id as string
        });

        this.logger.info(`adding item ${JSON.stringify(item)}`);

        const response = await this.natsConnection.request(
            `${this.SERVICE_NAME}.create-item`,
            JSONCodec().encode(item)
        );

        return JSONCodec<SavedItem>().decode(response.data);
    }
}

export class CreateItemHandler extends PrivateHandler {
    readonly subject = "create-item";

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

    async handle(msg: Message): Promise<SavedItem> {
        const itemData = msg.data as Item;

        if (!itemData.studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        const item = await this.itemRepository.addItem(new Item(itemData));

        this.logger.info(`item added with id ${item.item_id}`);

        this.eventBus.publish(new ItemCreatedEvent(item.item_id));

        return item;
    }
}

const itemCreateSchema = Joi.object({
    name: Joi.string().max(100).required(),
    total_quantity: Joi.number().min(1).required(),
    frozen: Joi.boolean().required(),
    data: Joi.object()
        .pattern(/^/, Joi.string())
        .required()
        .custom(joiPayloadValidator)
});
