import dotenv from "dotenv";
dotenv.config();

require("newrelic");

import { NatsRunner } from "@jwalab/nats-runner";

export { TezosWorkerTokenizationConfirmation } from "./types";

const natsRunner = new NatsRunner(__dirname);

natsRunner.start();
