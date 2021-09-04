import Joi from "joi";

export class Item {
    readonly item_id?: number;
    readonly name: string;
    readonly available_quantity: number;
    readonly total_quantity: number;
    readonly is_frozen: boolean;
    readonly data: Record<string, string>;

    constructor({
        item_id,
        name,
        available_quantity,
        total_quantity,
        is_frozen,
        data
    }: Item) {
        this.item_id = item_id;
        this.name = name;
        this.available_quantity = available_quantity;
        this.total_quantity = total_quantity;
        this.is_frozen = is_frozen;
        this.data = data;
    }
}

export const itemSchema = Joi.object({
    item_id: Joi.number().min(1),
    name: Joi.string().required(),
    available_quantity: Joi.number().min(0).required(),
    total_quantity: Joi.number().min(0).required(),
    is_frozen: Joi.boolean().required(),
    data: Joi.object().pattern(/^/, Joi.string()).required()
});
