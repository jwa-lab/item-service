module.exports = {
    client: "pg",
    debug: true,
    connection: {
        host: process.env.PGSQL_HOST,
        user: process.env.PGSQL_USER,
        password: process.env.PGSQL_PASSWORD,
        database: process.env.PGSQL_DATABASE
    }
};
