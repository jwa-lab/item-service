import { connect, NatsConnection, Subscription, JSONCodec, Codec } from "nats";
import {
    ContainerBuilder,
    JsonFileLoader,
    Parameter
} from "node-dependency-injection";
import { WinstonLogger } from "../logger/WinstonLogger";
import { AirlockHandler, PrivateHandler } from "./Handlers";
import { AirlockMessage, Message } from "./Messages";

export enum AIRLOCK_VERBS {
    "GET" = "GET",
    "POST" = "POST",
    "PUT" = "PUT",
    "PATCH" = "PATCH",
    "DELETE" = "DELETE"
}

export interface NatsRunnerConfig {
    NATS_URL: string;
    SERVICE_NAME: string;
}

export default class NatsRunner {
    private readonly cwd;
    private readonly container;
    private readonly jsonCodec: Codec<unknown>;

    private natsConnection!: NatsConnection;
    protected logger!: WinstonLogger;
    private config!: Record<string, unknown>;

    constructor(cwd: string) {
        this.jsonCodec = JSONCodec();
        this.cwd = cwd;
        this.container = new ContainerBuilder();
    }

    async start(): Promise<void> {
        try {
            await this.getConfig();
            this.initContainer();
            await this.initNats();
            await this.registerNatsHandlers();

            this.registerSignalHandlers();
        } catch (e) {
            console.error(e);
            this.logger.error(e);
            process.exit(1);
        }
    }

    private async getConfig() {
        try {
            const config = await import(`${this.cwd}/config`);

            this.config = config.default;
        } catch (err) {
            console.error("Unable to load required config.ts file", err);
            process.exit(1);
        }
    }

    private initContainer() {
        Object.keys(this.config).forEach((configName) => {
            this.config[configName] &&
                this.container.setParameter(
                    `config.${configName}`,
                    this.config[configName] as Parameter
                );
        });

        this.container.setParameter("cwd", this.cwd);
        const loader = new JsonFileLoader(this.container);

        loader.load(`${this.cwd}/common/NatsRunner/di.json`);
        loader.load(`${this.cwd}/di.json`);

        this.logger = this.container.get("logger");

        this.container.logger = this.logger;

        this.logger.debug("NatsRunner container initialized");
    }

    private async initNats() {
        this.natsConnection = await connect({
            servers: this.config.NATS_URL as string
        });

        this.container.register("natsConnection");
        this.container.set("natsConnection", this.natsConnection);

        this.logger.debug(
            `NatsRunner connected to NATS ${this.config.NATS_URL}`
        );
    }

    private async registerNatsHandlers() {
        const ids = Array.from(
            this.container.findTaggedServiceIds("nats.handler").keys()
        );

        ids.forEach((id) => {
            const handler = this.container.get(id);

            if (handler instanceof PrivateHandler) {
                this.registerPrivateHandler(handler);
            } else if (handler instanceof AirlockHandler) {
                this.registerAirlockHandler(handler);
            } else {
                throw new Error(
                    "Nats Handler must extend type Handler or AirlockHandler"
                );
            }
        });
    }

    private registerPrivateHandler(handler: PrivateHandler) {
        let subject;

        if (handler.serviceScopedSubject) {
            subject = `${this.config.SERVICE_NAME}.${handler.subject}`;
        } else {
            subject = handler.subject;
        }

        this.logger.debug(`Registering private handler for ${subject}`);
        const subscriptionOptions = handler.getSubscriptionOptions();

        const subscription = this.natsConnection.subscribe(
            subject,
            subscriptionOptions
        );

        this.handlePrivateMessage(subscription, handler);
    }

    private registerAirlockHandler(handler: AirlockHandler) {
        const subject = `${handler.verb}:${this.config.SERVICE_NAME}.${handler.subject}`;
        this.logger.debug(`Registering airlock handler for ${subject}`);
        const subscriptionOptions = handler.getSubscriptionOptions();

        const subscription = this.natsConnection.subscribe(
            subject,
            subscriptionOptions
        );

        this.handleAirlockMessage(subscription, handler);
    }

    async handleAirlockMessage(
        subscription: Subscription,
        handler: AirlockHandler
    ): Promise<void> {
        for await (const message of subscription) {
            try {
                const response = await handler.handle(
                    new AirlockMessage(message)
                );

                message.respond(this.jsonCodec.encode(response));
            } catch (err) {
                this.logger.error(err.message);
                message.respond(
                    this.jsonCodec.encode({
                        error: err.message
                    })
                );
            }
        }
    }

    async handlePrivateMessage(
        subscription: Subscription,
        handler: PrivateHandler
    ): Promise<void> {
        for await (const message of subscription) {
            try {
                const response = await handler.handle(new Message(message));

                message.respond(this.jsonCodec.encode(response));
            } catch (err) {
                this.logger.error(err.message);
                message.respond(
                    this.jsonCodec.encode({
                        error: err.message
                    })
                );
            }
        }
    }

    private registerSignalHandlers() {
        const onGracefulShutdown = async () => {
            this.logger.debug("NatsRunner gracefully shutting down...");
            await this.natsConnection.drain();
            this.logger.debug("natsConnection drained");
            process.exit(0);
        };

        process.on("SIGINT", onGracefulShutdown);
        process.on("SIGTERM", onGracefulShutdown);
    }
}
