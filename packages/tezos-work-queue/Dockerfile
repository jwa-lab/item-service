FROM node:16-alpine as build

WORKDIR /build

COPY . .

RUN npm install
RUN npm run build -w @jwalab/tezos-work-queue

USER node

ENTRYPOINT ["npm", "run", "-w", "@jwalab/tezos-work-queue"]
