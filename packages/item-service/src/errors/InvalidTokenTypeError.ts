import { JWAError } from "@jwalab/errors";

export class InvalidTokenTypeError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            403,
            InvalidTokenTypeError.name,
            `Invalid token type provided. Details: ${message}`,
            "INVALID_TOKEN_TYPE",
            origin
        );
    }
}
