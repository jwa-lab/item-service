# Item Service

Item Service is an integrated service that manages gaming items for video game editors in a fast and reliable fashion
and then tokenizes them in the blockchain.
Items can be created, assigned to users and may evolve each at their own pace.

## Run

1. Start minilab

```
npm install -g @jwalab/minilab
minilab start
```

2. Start the PostgreSQL database

```
docker compose up
```

3. Initialize the DB schemas

```
./run knex seed:run
```

## Use

The `http://localhost:8000/docs` url serves the OpenApi documentation.
