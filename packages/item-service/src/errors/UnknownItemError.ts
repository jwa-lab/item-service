import { JWAError } from "@jwalab/errors";

export class UnknownItemError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            `Item does not exists. Details: ${message}`,
            "UNKNOWN_ITEM",
            origin
        );
    }
}
