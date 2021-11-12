import { JWAError } from "@jwalab/js-common";

export class UnknownItemError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            UnknownItemError.name,
            `Item does not exists. Details: ${message}`,
            "UNKNOWN_ITEM",
            origin
        );
    }
}