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
import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { ItemInstance } from "../../entities/itemInstance";
import { ItemRepository } from "../../repositories/ItemRepository";
import { ItemInstanceTransferredEvent } from "../../events/item";

interface TransferItemInstancePayload {
    item_id: number;
    instance_number: number;
    to_user_id: string;
}

interface TransferItemInstancePrivatePayloadInterface
    extends TransferItemInstancePayload {
    is_studio: boolean;
    studio_id: string;
}

export class TransferItemInstanceAirlockHandler extends AirlockHandler {
    readonly subject = "transfer-instance";
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
        await itemUpdateSchema.validateAsync(msg.body);

        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
        }

        const transferProps = {
            ...(msg.body as TransferItemInstancePayload),
            studio_id: msg.headers.studio_id,
            is_studio: msg.headers.is_studio
        };

        this.logger.info(
            `Transferring item instance with id [item_id: ${transferProps.item_id}, instance_number:  ${transferProps.instance_number}].`
        );

        const response = await this.natsConnection.request(
            `${this.SERVICE_NAME}.transfer-item-instance`,
            JSONCodec().encode(transferProps)
        );

        return JSONCodec<ItemInstance>().decode(response.data);
    }
}

export class TransferItemInstanceHandler extends PrivateHandler {
    readonly subject = "transfer-item-instance";

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
        const { is_studio, studio_id, item_id, instance_number, to_user_id } =
            msg.data as TransferItemInstancePrivatePayloadInterface;

        if (!is_studio) {
            throw new Error("INVALID_JWT_STUDIO");
        }

        if (!studio_id) {
            throw new Error("STUDIO_ID_MISSING");
        }

        if (!item_id) {
            throw new Error("ITEM_ID_MISSING");
        }

        if (!instance_number) {
            throw new Error("INSTANCE_NUMBER_MISSING");
        }

        if (!to_user_id) {
            throw new Error("TO_USER_ID_MISSING");
        }

        const item = await this.itemRepository.getItem(item_id);

        if (item.studio_id !== studio_id) {
            throw new Error("Invalid studio, you cannot update this item.");
        }

        /*
                Only for a naive implementation.
         */

        const transferredItemInstance =
            await this.itemInstanceRepository.transferItemInstance(
                item_id,
                instance_number,
                to_user_id
            );

        this.logger.info(
            `item instance with id [item_id: ${transferredItemInstance.item_id}, instance_number:  ${transferredItemInstance.instance_number}] transferred.`
        );

        this.eventBus.publish(
            new ItemInstanceTransferredEvent(
                item_id,
                instance_number,
                to_user_id
            )
        );

        return transferredItemInstance;
    }
}

export const itemUpdateSchema = Joi.object({
    item_id: Joi.number().min(0).required(),
    instance_number: Joi.number().min(0).required(),
    to_user_id: Joi.string().required()
});
