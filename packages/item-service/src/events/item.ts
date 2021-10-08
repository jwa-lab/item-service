import { EventBusEvent } from "@jwalab/js-common";

export class ItemCreatedEvent implements EventBusEvent {
    name = "ItemCreatedEvent";
    readonly item_id: number;

    constructor(item_id: number) {
        this.item_id = item_id;
    }
}

export class ItemUpdatedEvent implements EventBusEvent {
    name = "ItemUpdatedEvent";
    readonly item_id: number;

    constructor(item_id: number) {
        this.item_id = item_id;
    }
}

export class ItemAssignedEvent implements EventBusEvent {
    name = "ItemAssignedEvent";
    readonly item_id: number;
    readonly instance_number: number;
    readonly user_id: string;

    constructor(item_id: number, instance_number: number, user_id: string) {
        this.item_id = item_id;
        this.instance_number = instance_number;
        this.user_id = user_id;
    }
}

export class ItemInstanceUpdatedEvent implements EventBusEvent {
    name = "ItemInstanceUpdatedEvent";

    constructor(
        readonly item_id: number,
        readonly instance_number: number,
        readonly data: Record<string, string>
    ) {
        this.item_id = item_id;
        this.instance_number = instance_number;
        this.data = data;
    }
}

export class ItemInstanceTransferredEvent implements EventBusEvent {
    name = "ItemInstanceTransferredEvent";

    constructor(
        readonly item_id: number,
        readonly instance_number: number,
        readonly to_user_id: string
    ) {
        this.item_id = item_id;
        this.instance_number = instance_number;
        this.to_user_id = to_user_id;
    }
}
