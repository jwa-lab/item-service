import dotenv from "dotenv";
dotenv.config();

import NatsRunner from "common";

export { TezosWorkerTokenizationConfirmation } from "./TezosWorkQueue";

const natsRunner = new NatsRunner(__dirname);

natsRunner.start();
