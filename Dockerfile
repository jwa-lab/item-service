FROM node:14-alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY LICENSE .
COPY tsconfig.json .

RUN npm install
RUN npm run build

USER node

ENTRYPOINT ["npm", "run", "start"]
