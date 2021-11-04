FROM node:16-alpine

WORKDIR /app

COPY tezos/deploy.js ./tezos/deploy.js
COPY package-init-tezos.json package.json

RUN npm install

ENTRYPOINT ["npm", "run", "deploy-warehouse"]
