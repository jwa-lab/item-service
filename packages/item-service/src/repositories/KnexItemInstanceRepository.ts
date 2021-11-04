import { ItemInstance } from "../entities/itemInstance";
import {
    ItemInstanceRepository,
    ItemInstanceTezosTokenizationInfo
} from "./ItemInstanceRepository";
import { KnexTransactionManager } from "../services/knex/KnexTransactionManager";
import { SQLUpdateNoRowsAffected } from "@jwalab/js-common";

export interface GetItemInstancesInterface {
    results: ItemInstance[];
    pagination: {
        from: number;
        count: number;
        total: number;
    };
}

export class KnexItemInstanceRepository implements ItemInstanceRepository {
    private readonly itemInstanceTable = "items_instances";

    constructor(private transactionManager: KnexTransactionManager) {}

    async createInstance(itemInstance: ItemInstance): Promise<ItemInstance> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient<ItemInstance>(
            this.itemInstanceTable
        ).insert(itemInstance, Object.keys(itemInstance));

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

    async getInstance(
        item_id: number,
        instance_number: number
    ): Promise<ItemInstance> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient<ItemInstance>(this.itemInstanceTable)
            .select()
            .where({
                item_id,
                instance_number
            });

        return result[0];
    }

    async updateItemInstance(
        item_id: number,
        instance_number: number,
        data: Record<string, string>
    ): Promise<ItemInstance> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient<ItemInstance>(this.itemInstanceTable)
            .update({ data }, "*")
            .where({
                item_id,
                instance_number
            });

        if (result.length === 0) {
            throw new SQLUpdateNoRowsAffected(
                "Unable to update the item instance, please check the given instance_number."
            );
        }

        return result[0];
    }

    async transferItemInstance(
        item_id: number,
        instance_number: number,
        to_user_id: string
    ): Promise<ItemInstance> {
        const queryClient = await this.transactionManager.getProvider();

        const result = await queryClient<ItemInstance>(this.itemInstanceTable)
            .update({ user_id: to_user_id }, "*")
            .where({
                item_id,
                instance_number
            });

        if (result.length === 0) {
            throw new SQLUpdateNoRowsAffected(
                "Unable to transfer the item instance, please check your inputs or retry the request."
            );
        }

        return result[0];
    }

    async getItemInstancesByUserId(
        start: number,
        limit: number,
        user_id?: string
    ): Promise<GetItemInstancesInterface> {
        const queryClient = await this.transactionManager.getProvider();
        const whereStatement = {
            ...(user_id && { user_id })
        };

        const totalQuery = await queryClient(this.itemInstanceTable)
            .where(whereStatement)
            .count("*")
            .first();

        const results = await queryClient<ItemInstance>(this.itemInstanceTable)
            .select()
            .where(whereStatement)
            .offset(start)
            .limit(limit);

        const pagination = {
            from: start,
            count: results.length,
            total: Number(totalQuery?.count)
        };

        return {
            results,
            pagination
        };
    }

    async getItemInstancesByItemId(
        start: number,
        limit: number,
        item_id: number
    ): Promise<GetItemInstancesInterface> {
        const queryClient = await this.transactionManager.getProvider();
        const whereStatement = {
            item_id
        };

        const totalQuery = await queryClient(this.itemInstanceTable)
            .where(whereStatement)
            .count("*")
            .first();

        const results = await queryClient<ItemInstance>(this.itemInstanceTable)
            .select()
            .where(whereStatement)
            .offset(start)
            .limit(limit);

        const pagination = {
            from: start,
            count: results.length,
            total: Number(totalQuery?.count)
        };

        return {
            results,
            pagination
        };
    }
}
