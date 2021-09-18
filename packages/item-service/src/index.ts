import dotenv from "dotenv";
dotenv.config();

import NatsRunner from "common";

const natsRunner = new NatsRunner(__dirname);

natsRunner.start();
