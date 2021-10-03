import fs from "fs";
import { OpenAPIV3 } from "openapi-types";
import { SubscriptionOptions } from "nats";

import { Logger } from "../Logger/Logger";
import { PrivateHandler } from "../NatsRunner/Handlers";

type OpenAPIDocs = Pick<OpenAPIV3.Document, "paths" | "components" | "tags">;

export class GetDocsHandler extends PrivateHandler {
  readonly subject = "docs";
  readonly serviceScopedSubject = false;
  private jsonDocs: OpenAPIDocs;

  getSubscriptionOptions(): SubscriptionOptions {
    return {
      queue: this.SERVICE_NAME,
    };
  }

  constructor(
    private cwd: string,
    private SERVICE_NAME: string,
    private logger: Logger
  ) {
    super();

    let jsonDocs;

    try {
      const docs = String(fs.readFileSync(`${this.cwd}/openapi-docs.json`));
      jsonDocs = JSON.parse(docs);
    } catch (err) {
      this.logger.warning("Unable to load openapi docs.");
    }

    this.jsonDocs = jsonDocs;
  }

  async handle(): Promise<OpenAPIDocs> {
    return this.jsonDocs;
  }
}
