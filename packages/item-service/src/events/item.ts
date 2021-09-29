import { EventBusEvent } from "common";

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
