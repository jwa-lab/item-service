import { JWAError } from "@jwalab/errors";

export class ExceededPayloadSizeError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            400,
            ExceededPayloadSizeError.name,
            `Maximum payload size exceeded. Details: ${message}`,
            "PAYLOAD_SIZE_EXCEEDED",
            origin
        );
    }
}
