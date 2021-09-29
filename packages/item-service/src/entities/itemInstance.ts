export class ItemInstance {
    readonly item_id: number;
    readonly user_id: string;
    readonly instance_number: number;
    readonly data: Record<string, string>;

    constructor({
        item_id,
        user_id,
        instance_number,
        data
    }: { [K in keyof ItemInstance]: ItemInstance[K] }) {
        this.item_id = item_id;
        this.user_id = user_id;
        this.instance_number = instance_number;
        this.data = data;
    }
}
