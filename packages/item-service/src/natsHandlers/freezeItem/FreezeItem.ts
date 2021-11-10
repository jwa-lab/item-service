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
import Joi from "joi";
import { JSONCodec, NatsConnection, SubscriptionOptions } from "nats";

import { SavedItem } from "../../entities/item";
import { ItemFrozenEvent } from "../../events/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import { KnexTransactionManager } from "../../services/knex/KnexTransactionManager";
import {
    InvalidStudioError,
    InvalidTokenTypeError,
    MissingPropertyError,
    SchemaValidationError,
    UnknownItemError
} from "../../errors";

export class FreezeItemAirlockHandler extends AirlockHandler {
    readonly subject = "freeze-item";
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

        try {
            await itemFreezeSchema.validateAsync(msg.body);
        } catch (error) {
            throw new SchemaValidationError(
                `FreezeItem -- ${(error as Error).message}`,
                error as Error
            );
        }

        const { item_id } = msg.body as Pick<SavedItem, "item_id">;

        this.logger.info(`Freezing item ${item_id}`);

        const response = await this.natsConnection.request(
            "item-service.freeze-item",
            JSONCodec().encode({
                item_id,
                is_studio: msg.headers.is_studio,
                studio_id: msg.headers.studio_id
            })
        );

        return JSONCodec<SavedItem>().decode(response.data);
    }
}

export class FreezeItemHandler extends PrivateHandler {
    readonly subject = "freeze-item";

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private logger: Logger,
        private itemRepository: ItemRepository,
        private eventBus: EventBus,
        private transactionManager: KnexTransactionManager
    ) {
        super();
    }

    async handle(msg: Message): Promise<SavedItem> {
        const { item_id, is_studio, studio_id } = msg.data as {
            item_id: number;
            is_studio: boolean;
            studio_id: string;
        };

        if (!is_studio) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        if (!studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        if (!item_id) {
            throw new MissingPropertyError("Property 'item_id' is missing.");
        }

        const [item, statusChanged] = await this.transactionManager.transaction<
            Promise<[SavedItem, boolean]>
        >(async () => {
            const fetchedItem = await this.itemRepository.getItem(item_id);

            if (!fetchedItem) {
                throw new UnknownItemError(
                    `Can't freeze item ${item_id}, item doesn't exist.`
                );
            }

            if (fetchedItem.studio_id !== studio_id) {
                throw new InvalidStudioError(
                    `Unable to freeze item with id ${item_id}. The item does not belong to your studio.`
                );
            }

            if (!fetchedItem.frozen) {
                const frozenItem = await this.itemRepository.updateItem(
                    new SavedItem({
                        ...fetchedItem,
                        frozen: true
                    })
                );

                return [frozenItem, true];
            } else {
                return [fetchedItem, false];
            }
        });

        this.logger.info(`item id ${item_id} frozen`);

        if (statusChanged) {
            this.eventBus.publish(new ItemFrozenEvent(item_id));
        }

        return item;
    }
}

export const itemFreezeSchema = Joi.object({
    item_id: Joi.number().min(0).required()
});
