# Item Service

Item Service is an integrated service that manages gaming items for video game editors in a fast and reliable fashion
and then tokenizes them in the blockchain.
Items can be created, assigned to users and may evolve each at their own pace.

## Setup

Start by creating a `.env` file in this project's top level folderwith the following configuration:

```
# in .env
SERVICE_NAME=item-service
NATS_URL=nats://localhost:4222
TEZOS_RPC_URI=http://localhost:20000
TEZOS_SECRET_KEY=edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq  
TEZOS_PUBLIC_KEY_HASH=tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb
WAREHOUSE_CONTRACT_ADDRESS=KT1NxT1X7H95ECnGkCGRywmzYencNe2sQS2i
LOGGING_FORMAT=cli
PGSQL_HOST=localhost
PGSQL_USER=jwa
PGSQL_PASSWORD=jwalab
PGSQL_DATABASE=item
```

Those values aren't private, feel free to use them by default on your local environment.
Also note that those are all the environment variables used in the various packages.
Each package has an alias `ln -s` of the top-level .env and will be able to reuse them.

### Install

```
npm install
```

Then make sure the common code is available for all to use:

```
npm run build -w @jwalab/js-common
```

### Run

First, start minilab

```
npx @jwalab/minilab start
```

Then, start the postgres DB

```
npm run start-db -w @jwalab/item-service
```

Seed the DB:

```
npm run seed-db -w @jwalab/item-service
```

Deploy the Warehouse contract:

```
npm run deploy-warehouse -w @jwalab/item-service
```

Notice the new contract address and paste it in the `.env` file under `WAREHOUSE_CONTRACT_ADDRESS`

Start the `item-service`

```
npm run dev -w @jwalab/item-service
```

And start the `tezos-work-queue`

```
npm run dev -w @jwalab/tezos-work-queue
```
