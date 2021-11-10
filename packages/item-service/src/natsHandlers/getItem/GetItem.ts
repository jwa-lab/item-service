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

import { SavedItem } from "../../entities/item";
import { ItemRepository } from "../../repositories/ItemRepository";
import Joi from "joi";
import {
    InvalidStudioError,
    InvalidTokenTypeError,
    MissingPropertyError,
    SchemaValidationError,
    UnknownItemError
} from "../../errors";

interface GetItemPrivatePayloadInterface {
    item_id: number;
    is_studio: boolean;
    studio_id: string;
}

export class GetItemAirlockHandler extends AirlockHandler {
    readonly subject = "item.*";
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

    async handle(msg: AirlockMessage): Promise<SavedItem> {
        if (!isStudio(msg.headers)) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        }

        const item_id = Number(msg.subject.split(".")[2]);

        try {
            await getItemSchema.validateAsync({ item_id });
        } catch (error) {
            throw new SchemaValidationError(
                `GetItem -- ${(error as Error).message}`,
                error as Error
            );
        }

        this.logger.info(`Getting item ${item_id}`);

        const response = await this.natsConnection.request(
            "item-service.get-item",
            JSONCodec().encode({
                item_id,
                is_studio: msg.headers.is_studio,
                studio_id: msg.headers.studio_id
            })
        );

        return JSONCodec<SavedItem>().decode(response.data);
    }
}

export class GetItemHandler extends PrivateHandler {
    readonly subject = "get-item";

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private itemRepository: ItemRepository
    ) {
        super();
    }

    async handle(msg: Message): Promise<SavedItem> {
        const { is_studio, studio_id, item_id } =
            msg.data as GetItemPrivatePayloadInterface;
        const fetchedItem = await this.itemRepository.getItem(item_id);

        if (!fetchedItem) {
            throw new UnknownItemError(`Item ID: ${item_id}.`);
        }

        if (!studio_id) {
            throw new MissingPropertyError("Property 'studio_id' is missing.");
        }

        if (!is_studio) {
            throw new InvalidTokenTypeError("A studio token is expected.");
        } else {
            if (fetchedItem.studio_id !== studio_id) {
                throw new InvalidStudioError(
                    `Unable to fetch item with id ${item_id}. Item does not belong to your studio.`
                );
            }
        }

        return fetchedItem;
    }
}

const getItemSchema = Joi.object({
    item_id: Joi.number().min(0).required()
});
