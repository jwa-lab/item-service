FROM node:16-alpine

WORKDIR /app

COPY seeds ./seeds
COPY src ./src
COPY tezos ./tezos
COPY package*.json LICENSE tsconfig.json ./

RUN npm install
RUN npm run build

USER node

ENTRYPOINT ["npm", "run"]
