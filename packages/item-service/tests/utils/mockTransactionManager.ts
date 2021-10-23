import { KnexTransactionManager } from "../../src/services/knex/KnexTransactionManager";

export default {
    initialize: jest.fn(),
    getProvider: jest.fn(),
    transaction: jest.fn()
} as unknown as KnexTransactionManager;
