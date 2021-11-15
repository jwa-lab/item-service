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
import { ItemUpdatedEvent } from "../../events/item";
import { KnexTransactionManager } from "../../services/knex/KnexTransactionManager";
import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { joiPayloadValidator } from "../../utils";
import {
    FrozenItemError,
    InvalidStudioError,
    InvalidTokenTypeError,
    ItemQuantityError,
    MissingPropertyError,
    SchemaValidationError,
    UnknownItemError
} from "../../errors";

interface UpdateItemPrivatePayloadInterface extends SavedItem {
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

    async handle(msg: AirlockMessage): Promise<SavedItem> {
        if (!isStudio(msg.headers)) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        const updatedFields = msg.body as Pick<
            SavedItem,
            "item_id" | "frozen" | "data" | "total_quantity" | "name"
        >;

        try {
            await itemUpdateSchema.validateAsync(updatedFields);
        } catch (error) {
            throw new SchemaValidationError(
                `UpdateItem -- ${(error as Error).message}`,
                error as Error
            );
        }

        const payload = {
            ...updatedFields,
            studio_id: msg.headers.studio_id as string,
            is_studio: msg.headers.is_studio
        };

        this.logger.info(`updating item ${JSON.stringify(payload)}`);

        const response = await this.natsConnection.request(
            `${this.SERVICE_NAME}.update-item`,
            JSONCodec().encode(payload)
        );

        return JSONCodec<SavedItem>().decode(response.data);
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
        private itemInstanceRepository: ItemInstanceRepository,
        private eventBus: EventBus,
        private transactionManager: KnexTransactionManager
    ) {
        super();
    }

    async handle(msg: Message): Promise<Item> {
        const data = msg.data as UpdateItemPrivatePayloadInterface;

        if (!data.is_studio) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        if (!data.studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        const item = await this.itemRepository.getItem(data.item_id);

        if (!item) {
            throw new UnknownItemError(`Item ID: ${data.item_id}.`);
        }

        if (item.studio_id !== data.studio_id) {
            throw new InvalidStudioError(
                `Item with id ${data.item_id} does not belong to your studio.`
            );
        }

        if (item.frozen) {
            throw new FrozenItemError(`Item ID: ${data.item_id}.`);
        }

        const transactionResult = await this.transactionManager.transaction<
            Promise<SavedItem>
        >(async () => {
            const {
                pagination: { total }
            } = await this.itemInstanceRepository.getItemInstancesByItemId(
                0,
                1,
                data.item_id
            );

            if (total > data.total_quantity) {
                throw new ItemQuantityError(`Item ID: ${data.item_id}.`);
            }

            const item = await this.itemRepository.updateItem(
                new SavedItem({
                    ...data,
                    available_quantity: data.total_quantity - total
                })
            );

            this.logger.info(`item updated with id ${item.item_id}`);

            return item;
        });

        this.eventBus.publish(new ItemUpdatedEvent(data.item_id));

        return transactionResult;
    }
}

const itemUpdateSchema = Joi.object({
    item_id: Joi.number().min(1).required(),
    name: Joi.string().max(100).required(),
    total_quantity: Joi.number().min(1).required(),
    frozen: Joi.boolean().required(),
    data: Joi.object()
        .pattern(/^/, Joi.string())
        .required()
        .custom(joiPayloadValidator)
});
