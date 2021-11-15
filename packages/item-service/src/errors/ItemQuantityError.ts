import { JWAError } from "@jwalab/errors";

export class ItemQuantityError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            403,
            `Item's total_quantity can't be less than number of already assigned instances. Details: ${message}`,
            "ITEM_QUANTITY_ERROR",
            origin
        );
    }
}
