import { knex, Knex } from "knex";

export function makeKnexClient(
    PGSQL_HOST: string,
    PGSQL_USER: string,
    PGSQL_PASSWORD: string,
    PGSQL_DATABASE: string
): Knex {
    return knex({
        client: "pg",
        connection: {
            host: PGSQL_HOST,
            user: PGSQL_USER,
            password: PGSQL_PASSWORD,
            database: PGSQL_DATABASE
        }
    });
}
