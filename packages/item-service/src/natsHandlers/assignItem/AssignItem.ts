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

import { Item } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import { KnexTransactionManager } from "../../services/knex/KnexTransactionManager";
import { ItemInstance } from "../../entities/itemInstance";
import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { ItemAssignedEvent } from "../../events/item";
import {
    InvalidStudioError,
    InvalidTokenTypeError,
    MissingPropertyError,
    OutOfStockError,
    SchemaValidationError,
    UnknownItemError
} from "../../errors";

interface AssignItemPrivatePayloadInterface extends Item {
    is_studio: boolean;
    studio_id: string;
    user_id: string;
    item_id: number;
}

export class AssignItemAirlockHandler extends AirlockHandler {
    readonly subject = "assign-item";
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

    async handle(msg: AirlockMessage): Promise<ItemInstance> {
        if (!isStudio(msg.headers)) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        try {
            await itemAssignSchema.validateAsync(msg.body);
        } catch (error) {
            throw new SchemaValidationError(
                `AssignItem -- ${(error as Error).message}`,
                error as Error
            );
        }

        const itemProps = {
            ...(msg.body as Record<string, unknown>),
            studio_id: msg.headers.studio_id,
            is_studio: msg.headers.is_studio
        };

        this.logger.info(`assigning item`);

        const response = await this.natsConnection.request(
            `${this.SERVICE_NAME}.assign-item`,
            JSONCodec().encode(itemProps)
        );

        return JSONCodec<ItemInstance>().decode(response.data);
    }
}

export class AssignItemHandler extends PrivateHandler {
    readonly subject = "assign-item";

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

    async handle(msg: Message): Promise<ItemInstance> {
        const data = msg.data as AssignItemPrivatePayloadInterface;

        if (!data.is_studio) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        if (!data.studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        if (!data.user_id) {
            throw new MissingPropertyError("Property 'user_id' is missing.");
        }

        if (!data.item_id) {
            throw new MissingPropertyError("Property 'item_id' is missing.");
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

        if (item.available_quantity === 0) {
            throw new OutOfStockError(`Item ID: ${data.item_id}.`);
        }

        const transactionResult = await this.transactionManager.transaction<
            Promise<ItemInstance>
        >(async () => {
            const assignedItem = await this.itemRepository.assignItem(item, 1);

            const itemInstance = new ItemInstance({
                data: {},
                item_id: data.item_id,
                user_id: data.user_id,
                instance_number:
                    assignedItem.total_quantity -
                    assignedItem.available_quantity
            });

            const assignedInstance =
                await this.itemInstanceRepository.createInstance(itemInstance);

            const aggregatedInstance = new ItemInstance({
                ...assignedInstance,
                data: {
                    ...assignedItem.data,
                    ...assignedInstance.data
                }
            });

            return aggregatedInstance;
        });

        this.eventBus.publish(
            new ItemAssignedEvent(
                item.item_id as number,
                transactionResult.instance_number,
                data.user_id
            )
        );

        this.logger.info(`item id ${item.item_id} assigned`);

        return transactionResult;
    }
}

export const itemAssignSchema = Joi.object({
    item_id: Joi.number().min(0).required(),
    user_id: Joi.string().max(100).required()
});
