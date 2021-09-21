import Joi from "joi";

export class Item {
    readonly item_id?: number;
    readonly name: string;
    readonly available_quantity: number;
    readonly total_quantity: number;
    readonly frozen: boolean;
    readonly data: Record<string, string>;

    constructor({
        item_id,
        name,
        available_quantity,
        total_quantity,
        frozen,
        data
    }: { [K in keyof Item]: Item[K] }) {
        this.item_id = item_id;
        this.name = name;
        this.available_quantity = available_quantity;
        this.total_quantity = total_quantity;
        this.frozen = frozen;
        this.data = data;
    }
}

export const itemSchema = Joi.object({
    item_id: Joi.number().min(1),
    name: Joi.string().max(100).required(),
    available_quantity: Joi.number().min(0).required(),
    total_quantity: Joi.number().min(0).required(),
    frozen: Joi.boolean().required(),
    data: Joi.object().pattern(/^/, Joi.string()).required()
});
