export class Item {
    readonly studio_id: string;
    readonly name: string;
    readonly available_quantity: number;
    readonly total_quantity: number;
    readonly frozen: boolean;
    readonly data: Record<string, string>;
    readonly tezos_operation_hash?: string;

    constructor({
        studio_id,
        name,
        available_quantity,
        total_quantity,
        frozen,
        data,
        tezos_operation_hash
    }: { [K in keyof Item]: Item[K] }) {
        this.studio_id = studio_id;
        this.name = name;
        this.available_quantity = available_quantity;
        this.total_quantity = total_quantity;
        this.frozen = frozen;
        this.data = data;
        this.tezos_operation_hash = tezos_operation_hash;
    }
}

export class SavedItem extends Item {
    readonly item_id: number;

    constructor(item: Item & { item_id: number }) {
        super(item);

        this.item_id = item.item_id;
    }
}
