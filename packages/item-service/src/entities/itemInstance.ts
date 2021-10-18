export class ItemInstance {
    readonly item_id: number;
    readonly user_id: string;
    readonly instance_number: number;
    readonly data: Record<string, string>;
    readonly tezos_operation_hash?: string;

    constructor({
        item_id,
        user_id,
        instance_number,
        data = {},
        tezos_operation_hash
    }: { [K in keyof ItemInstance]: ItemInstance[K] }) {
        this.item_id = item_id;
        this.user_id = user_id;
        this.instance_number = instance_number;
        this.data = data;
        this.tezos_operation_hash = tezos_operation_hash;
    }
}
