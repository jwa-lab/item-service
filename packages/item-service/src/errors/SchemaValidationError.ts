import { JWAError } from "@jwalab/errors";

export class SchemaValidationError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            `Invalid data provided, please check your payload. Details: ${message}`,
            "INVALID_SCHEMA",
            origin
        );
    }
}
