import Joi from "joi";

function objectSize(data: Record<string, string>) {
    return Object.keys(data).reduce(
        (totalSize, key) =>
            Buffer.byteLength(key, "ascii") +
            Buffer.byteLength(data[key], "ascii") +
            totalSize,
        0
    );
}

function validatePayloadSize(data: Record<string, string>): boolean {
    const byteLength = objectSize(data);

    if (byteLength > 10000) {
        throw new Error(
            `Maximum payload size exceeded, got ${byteLength} bytes but maximum is 10000 bytes.`
        );
    }

    return true;
}

function joiPayloadValidator(
    value: Record<string, string>,
    helper: Joi.CustomHelpers
): boolean | Joi.ErrorReport {
    try {
        validatePayloadSize(value);
    } catch (error) {
        return helper.message(
            (error as Error).message as unknown as Joi.LanguageMessages
        );
    }

    return true;
}

export { validatePayloadSize, joiPayloadValidator };
