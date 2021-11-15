import { JWAError } from "@jwalab/errors";

export class FrozenItemError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            `Cannot update this item. Item is frozen. Details: ${message}`,
            "FROZEN_ITEM",
            origin
        );
    }
}
