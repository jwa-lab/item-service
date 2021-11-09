import { JWAError } from "@jwalab/js-common";

export class TestError extends JWAError {
    constructor(message: string, origin?: Error) {
        super(
            401,
            "TestUnauthorizedError",
            message,
            "UNAUTHORIZED_ERROR",
            origin
        );
    }
}
