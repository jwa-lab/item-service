export class Item {
    readonly studio_id: string;
    readonly name: string;
    readonly available_quantity: number;
    readonly total_quantity: number;
    readonly frozen: boolean;
    readonly data: Record<string, string>;
    readonly tezos_block?: string;
    readonly tezos_contract_address?: string;

    constructor({
        studio_id,
        name,
        available_quantity,
        total_quantity,
        frozen,
        data,
        tezos_block,
        tezos_contract_address
    }: { [K in keyof Item]: Item[K] }) {
        this.studio_id = studio_id;
        this.name = name;
        this.available_quantity = available_quantity;
        this.total_quantity = total_quantity;
        this.frozen = frozen;
        this.data = data;
        this.tezos_block = tezos_block;
        this.tezos_contract_address = tezos_contract_address;
    }
}

export class SavedItem extends Item {
    readonly item_id: number;

    constructor(item: Item & { item_id: number }) {
        super(item);

        this.item_id = item.item_id;
    }
}
