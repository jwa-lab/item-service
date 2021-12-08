# Item Service

Item Service is an integrated service that manages gaming items for video game editors in a fast and reliable fashion
and then tokenizes them in the blockchain.
Items can be created, assigned to users and may evolve each at their own pace.

## Setup

Copy the `.env.dist` files to `.env`:

```
cp packages/item-service/.env.dist packages/item-service/.env
cp packages/tezos-gateway/.env.dist packages/tezos-gateway/.env
```

### Install

```
npm install
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
npm run migrate -w @jwalab/item-service
```

Deploy the Warehouse contract:

```
npm run deploy-warehouse -w @jwalab/item-service
```

Notice the new contract address and paste it in the `packages/item-service/.env` file under `WAREHOUSE_CONTRACT_ADDRESS`

Start the `item-service`

```
npm run dev -w @jwalab/item-service
```

And start the `tezos-gateway`

```
npm run dev -w @jwalab/tezos-gateway
```
