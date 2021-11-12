import { JWAError } from "@jwalab/js-common";

export class SchemaValidationError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            SchemaValidationError.name,
            `Invalid data provided, please check your payload. Details: ${message}`,
            "INVALID_SCHEMA",
            origin
        );
    }
}
