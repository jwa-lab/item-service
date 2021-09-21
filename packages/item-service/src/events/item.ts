import { EventBusEvent } from "common";

export class ItemCreatedEvent implements EventBusEvent {
    name = "ItemCreatedEvent";
    readonly item_id: number;

    constructor(item_id: number) {
        this.item_id = item_id;
    }
}
