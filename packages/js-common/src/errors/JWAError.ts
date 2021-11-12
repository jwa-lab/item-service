export class JWAError extends Error {
    readonly httpCode: number;
    readonly errorCode: string;
    readonly origin?: Error;

    constructor(
        httpCode: number,
        name: string,
        message: string,
        errorCode: string,
        origin?: Error
    ) {
        super();

        if (!httpCode || typeof httpCode !== "number") {
            throw new Error("Invalid HTTP Code");
        }

        if (!name || name === "" || typeof name !== "string") {
            throw new Error("Invalid error name.");
        }

        if (!errorCode || errorCode === "" || typeof errorCode !== "string") {
            throw new Error("Invalid error code.");
        }

        if (origin) {
            if (!(origin instanceof Error)) {
                throw new Error(
                    `Invalid origin error, got '${typeof origin}' but the expected type is 'Error'`
                );
            }
        }

        this.httpCode = httpCode;
        this.name = name;
        this.message = message;
        this.errorCode = errorCode;
        this.origin = origin;
    }
}
