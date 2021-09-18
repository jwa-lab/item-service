# Item Service

Item service manages items in a postgresql and enqueues operations on the desired blockchain

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
