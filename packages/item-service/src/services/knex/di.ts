module.exports = {
    services: {
        knex: {
            factory: {
                class: "./knexFactory",
                method: "makeKnexClient"
            },
            arguments: [
                "%config.PGSQL_HOST%",
                "%config.PGSQL_USER%",
                "%config.PGSQL_PASSWORD%",
                "%config.PGSQL_DATABASE%"
            ]
        }
    }
};
