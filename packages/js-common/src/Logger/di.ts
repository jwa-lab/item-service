module.exports = {
    services: {
        winstonLogger: {
            factory: {
                class: "./winstonLoggerFactory",
                method: "makeWinstonLogger"
            },
            arguments: ["%config.LOGGING_FORMAT%", "%config.SERVICE_NAME%"]
        },
        logger: "@winstonLogger"
    }
};
