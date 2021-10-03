FROM node:16-alpine

WORKDIR /app

COPY seeds ./seeds
COPY dist ./dist
COPY package.json package-lock.json LICENSE tsconfig.json ./

USER node

ENTRYPOINT ["npm", "run", "start"]
