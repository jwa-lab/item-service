FROM node:14-alpine

WORKDIR /app

COPY src ./src
COPY package.json package-lock.json LICENSE tsconfig.json ./

RUN npm install
RUN npm run build

USER node

ENTRYPOINT ["npm", "run", "start"]
