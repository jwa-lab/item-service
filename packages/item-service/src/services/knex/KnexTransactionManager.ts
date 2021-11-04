import { Knex } from "knex";

export class KnexTransactionManager {
    private transactionProvider?: Knex.TransactionProvider;

    constructor(private knex: Knex) {}

    async initialize(): Promise<Knex.Transaction> {
        this.transactionProvider = this.knex.transactionProvider();

        return await this.transactionProvider();
    }

    async getProvider(): Promise<Knex.Transaction | Knex> {
        if (!this.transactionProvider) {
            return this.knex;
        }

        const transaction = await this.transactionProvider();

        if (transaction.isCompleted()) {
            return this.knex;
        }

        return transaction;
    }

    async transaction<T>(callback: () => T): Promise<T> {
        const transaction = await this.initialize();
        let callbackResult: T;

        try {
            callbackResult = await callback();
            await transaction.commit();
        } catch (error) {
            console.error(`An error occurred in the SQL transaction: ${error}`);
            await transaction.rollback();
            throw new Error((error as Error).message);
        }

        return callbackResult;
    }
}
