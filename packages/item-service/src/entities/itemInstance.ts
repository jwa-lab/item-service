export class ItemInstance {
    readonly item_id: number;
    readonly user_id: string;
    readonly instance_number: number;
    readonly data: Record<string, string>;
    readonly tezos_block?: string;
    readonly tezos_contract_address?: string;

    constructor({
        item_id,
        user_id,
        instance_number,
        data = {},
        tezos_block,
        tezos_contract_address
    }: { [K in keyof ItemInstance]: ItemInstance[K] }) {
        this.item_id = item_id;
        this.user_id = user_id;
        this.instance_number = instance_number;
        this.data = data;
        this.tezos_block = tezos_block;
        this.tezos_contract_address = tezos_contract_address;
    }
}
