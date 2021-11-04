FROM node:16-alpine

WORKDIR /app

COPY migrations ./migrations/
COPY knexfile.ts ./
COPY package-init-db.json ./package.json

RUN npm install

ENTRYPOINT ["npm", "run", "migrate"]
