import { ItemInstance } from "../entities/itemInstance";
import { ItemInstanceRepository } from "./ItemInstanceRepository";
import { KnexTransactionManager } from "../services/knex/KnexTransactionManager";

export class KnexItemInstanceRepository implements ItemInstanceRepository {
    private readonly itemInstanceTable = "items_instances";

    constructor(private transactionManager: KnexTransactionManager) {}

    async createInstance(itemInstance: ItemInstance): Promise<ItemInstance> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient(this.itemInstanceTable).insert(
            itemInstance,
            Object.keys(itemInstance)
        );

        return result[0];
    }
}
