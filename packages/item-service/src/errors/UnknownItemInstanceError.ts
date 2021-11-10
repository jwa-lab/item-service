import { JWAError } from "@jwalab/js-common";

export class UnknownItemInstanceError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            UnknownItemInstanceError.name,
            `Item instance does not exists. Details: ${message}`,
            "UNKNOWN_ITEM_INSTANCE",
            origin
        );
    }
}
