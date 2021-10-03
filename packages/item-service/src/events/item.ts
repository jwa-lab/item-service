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
