import { ItemInstance } from "../entities/itemInstance";
import { KnexTransactionManager } from "../services/knex/KnexTransactionManager";
import {
    ItemInstanceRepository,
    ItemInstanceTezosTokenizationInfo
} from "./ItemInstanceRepository";
import { SQLUpdateNoRowsAffected } from "common";

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

    async updateItemInstanceTokenizationInfo(
        item_id: number,
        instance_number: number,
        tezosTokenizationInfo: ItemInstanceTezosTokenizationInfo
    ): Promise<void> {
        const queryClient = await this.transactionManager.getProvider();

        await queryClient(this.itemInstanceTable)
            .where({
                item_id,
                instance_number
            })
            .update(tezosTokenizationInfo);
    }

    async updateItemInstance(
        item_id: number,
        instance_number: number,
        data: Record<string, string>
    ): Promise<ItemInstance> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient<ItemInstance>(this.itemInstanceTable)
            .update({ data }, "*")
            .where("item_id", item_id)
            .andWhere("instance_number", instance_number);

        if (result.length === 0) {
            throw new SQLUpdateNoRowsAffected(
                "No lines updated, maybe no instance for this record key ?"
            );
        }

        return result[0];
    }
}
