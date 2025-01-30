FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG NODE_ENV

RUN cp .env.${NODE_ENV} .env

EXPOSE 3000

CMD ["npm", "run", "start"]
