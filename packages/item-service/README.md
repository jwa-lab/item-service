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
npm run start-db
```

3. Initialize the DB schemas

```
npm run migrate
```

## Use

The `http://localhost:8000/docs` url serves the OpenApi documentation.
