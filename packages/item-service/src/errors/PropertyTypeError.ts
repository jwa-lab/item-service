import { JWAError } from "@jwalab/errors";

export class PropertyTypeError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            PropertyTypeError.name,
            `Invalid property type. Details: ${message}`,
            "PROPERTY_TYPE_ERROR",
            origin
        );
    }
}
