import { knex, Knex } from "knex";

export type PgSQL = Knex;

export function makePgSQLClient(
    PGSQL_HOST: string,
    PGSQL_USER: string,
    PGSQL_PASSWORD: string,
    PGSQL_DATABASE: string
): PgSQL {
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
