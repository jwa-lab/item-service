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
import { ItemUpdatedEvent } from "../../events/item";
import { KnexTransactionManager } from "../../services/knex/KnexTransactionManager";
import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { joiPayloadValidator } from "../../utils";

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
        const updatedFields = msg.body as Pick<
            SavedItem,
            "item_id" | "frozen" | "data" | "total_quantity" | "name"
        >;

        await itemUpdateSchema.validateAsync(updatedFields);

        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
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
            throw new Error("INVALID_JWT_STUDIO");
        }

        if (!data.studio_id) {
            throw new Error("STUDIO_ID_MISSING");
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
                throw new Error(
                    "Item's total_quantity can't be less than number of already assigned instances."
                );
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
