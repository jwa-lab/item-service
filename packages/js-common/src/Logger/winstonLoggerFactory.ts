import * as winston from "winston";
import { WinstonLogger } from "./WinstonLogger";

export function makeWinstonLogger(
    loggingFormat: "cli" | "json" = "json",
    serviceName: string
): WinstonLogger {
    let transport;

    if (loggingFormat.toLocaleLowerCase() === "cli") {
        transport = new winston.transports.Console({
            format: winston.format.combine(winston.format.cli())
        });
    } else {
        transport = new winston.transports.Console();
    }

    return new WinstonLogger(
        serviceName,
        winston.createLogger({
            level: "debug",
            transports: transport,
            levels: winston.config.syslog.levels
        })
    );
}
