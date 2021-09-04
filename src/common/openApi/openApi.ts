import fs from "fs";
import { OpenAPIV3 } from "openapi-types";
import { SubscriptionOptions } from "nats";

import { Logger } from "../../common/logger/Logger";
import { PrivateHandler } from "../NatsRunner/Handlers";

type OpenAPIDocs = Pick<OpenAPIV3.Document, "paths" | "components" | "tags">;

export function makeOpenApiDocs(cwd: string, logger: Logger): Promise<void> {
    const docs = String(fs.readFileSync(`${cwd}/openapi-docs.json`));
    let jsonDocs;

    try {
        jsonDocs = JSON.parse(docs);
    } catch (err) {
        logger.error("Invalid docs");
        throw new Error("Invalid docs");
    }

    return jsonDocs;
}

export class GetDocsHandler extends PrivateHandler {
    readonly subject = "docs";
    readonly serviceScopedSubject = false;

    getSubscriptionOptions(): SubscriptionOptions {
        return {
            queue: this.SERVICE_NAME
        };
    }

    constructor(
        private SERVICE_NAME: string,
        private openApiDocs: OpenAPIDocs
    ) {
        super();
    }

    async handle(): Promise<OpenAPIDocs> {
        return this.openApiDocs;
    }
}
