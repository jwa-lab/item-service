import * as winston from "winston";
import { Logger } from "./Logger";
import { WinstonLogger } from "./WinstonLogger";

export function makeWinstonLogger(
    LOGGING_FORMAT: string,
    SERVICE_NAME: string
): Logger {
    let transport;

    if (LOGGING_FORMAT.toLocaleLowerCase() === "cli") {
        transport = new winston.transports.Console({
            format: winston.format.combine(winston.format.cli())
        });
    } else {
        transport = new winston.transports.Console();
    }

    return new WinstonLogger(
        SERVICE_NAME,
        winston.createLogger({
            level: "debug",
            transports: transport,
            levels: winston.config.syslog.levels
        })
    );
}
