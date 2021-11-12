import dotenv from "dotenv";
dotenv.config();

import { NatsRunner } from "@jwalab/nats-runner";

const natsRunner = new NatsRunner(__dirname);

natsRunner.start();
