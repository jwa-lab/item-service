import { JWAError } from "@jwalab/errors";

export class InvalidStudioError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            403,
            `Invalid studio, you cannot update this item. Details: ${message}`,
            "INVALID_STUDIO",
            origin
        );
    }
}
