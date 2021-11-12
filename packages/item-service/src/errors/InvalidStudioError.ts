import { JWAError } from "@jwalab/js-common";

export class InvalidStudioError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            403,
            InvalidStudioError.name,
            `Invalid studio, you cannot update this item. Details: ${message}`,
            "INVALID_STUDIO",
            origin
        );
    }
}
