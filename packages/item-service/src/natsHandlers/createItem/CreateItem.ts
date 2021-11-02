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

import { Item, SavedItem } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import { ItemCreatedEvent } from "../../events/item";
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
        const payload = msg.body as Pick<
            Item,
            "frozen" | "data" | "total_quantity" | "name"
        >;

        await itemCreateSchema.validateAsync(payload);

        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
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
        const item = await this.itemRepository.addItem(
            new Item(msg.data as Item)
        );

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
