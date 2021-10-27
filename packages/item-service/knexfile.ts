import * as dotenv from "dotenv";
dotenv.config();

import { Knex } from "knex";

const config: Knex.Config = {
  client: "pg",
  debug: false,
  connection: {
    host: process.env.PGSQL_HOST,
    user: process.env.PGSQL_USER,
    password: process.env.PGSQL_PASSWORD,
    database: process.env.PGSQL_DATABASE
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
    directory: "migrations",
    extension: 'ts'
  },
};

export default config;
