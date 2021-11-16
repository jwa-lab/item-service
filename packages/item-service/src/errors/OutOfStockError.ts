import { JWAError } from "@jwalab/errors";

export class OutOfStockError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            403,
            `This item is not assignable anymore. Item out of stock. Details: ${message}`,
            "ITEM_OUT_OF_STOCK",
            origin
        );
    }
}
