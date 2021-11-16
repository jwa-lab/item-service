import { JWAError } from "@jwalab/errors";

export class MissingPropertyError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            `Missing property. Details: ${message}`,
            "MISSING_PROPERTY",
            origin
        );
    }
}
