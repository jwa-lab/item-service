import dotenv from "dotenv";
dotenv.config();

import NatsRunner from "@jwalab/js-common";

const natsRunner = new NatsRunner(__dirname);

natsRunner.start();
