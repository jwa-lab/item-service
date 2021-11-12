import { JWAError } from "@jwalab/js-common";

export class SQLTransactionError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            500,
            SQLTransactionError.name,
            `Transaction error. Details: ${message}`,
            "FROZEN_ITEM",
            origin
        );
    }
}
