import { JWAError } from "@jwalab/errors";

export class SQLTransactionError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            500,
            `Transaction error. Details: ${message}`,
            "FROZEN_ITEM",
            origin
        );
    }
}
