import { JWAError } from "@jwalab/js-common";

export class MissingPropertyError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            MissingPropertyError.name,
            `Missing property. Details: ${message}`,
            "MISSING_PROPERTY",
            origin
        );
    }
}
