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

import { ItemInstanceRepository } from "../../repositories/ItemInstanceRepository";
import { ItemInstance } from "../../entities/itemInstance";
import { ItemRepository } from "../../repositories/ItemRepository";

interface GetItemInstancePrivatePayloadInterface {
    item_id: number;
    instance_number: number;
    is_studio: boolean;
    studio_id: string;
}

export class GetItemInstanceAirlockHandler extends AirlockHandler {
    readonly subject = "instance.*.*";
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

    async handle(msg: AirlockMessage): Promise<ItemInstance> {
        if (!isStudio(msg.headers)) {
            throw new Error("Invalid token type, a studio token is required.");
        }

        const item_id = Number(msg.subject.split(".")[2]);
        const instance_number = Number(msg.subject.split(".")[3]);

        this.logger.info(
            `Getting item instance [item: ${item_id}, instance: ${instance_number}]`
        );

        const response = await this.natsConnection.request(
            "item-service.get-item-instance",
            JSONCodec().encode({
                item_id,
                instance_number,
                is_studio: msg.headers.is_studio,
                studio_id: msg.headers.studio_id
            })
        );

        return JSONCodec<ItemInstance>().decode(response.data);
    }
}

export class GetItemInstanceHandler extends PrivateHandler {
    readonly subject = "get-item-instance";

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private itemInstanceRepository: ItemInstanceRepository,
        private itemRepository: ItemRepository
    ) {
        super();
    }

    async handle(msg: Message): Promise<ItemInstance> {
        const { item_id, instance_number, is_studio, studio_id } =
            msg.data as GetItemInstancePrivatePayloadInterface;

        if (!item_id) {
            throw new Error("Invalid item_id.");
        }

        if (!instance_number) {
            throw new Error("Invalid instance_number.");
        }

        if (!is_studio) {
            throw new Error("INVALID_JWT_STUDIO");
        }

        const requiredItem = await this.itemRepository.getItem(item_id);

        if (requiredItem.studio_id !== studio_id) {
            throw new Error("INVALID_STUDIO_ID");
        }

        const fetchedInstance = await this.itemInstanceRepository.getInstance(
            item_id,
            instance_number
        );

        if (!fetchedInstance) {
            throw new Error(
                `No instance match for [item: ${item_id}, instance: ${instance_number}]`
            );
        }

        const aggregatedInstance = new ItemInstance({
            ...fetchedInstance,
            data: {
                ...requiredItem.data,
                ...fetchedInstance.data
            }
        });

        return aggregatedInstance;
    }
}
