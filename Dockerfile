FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY ./public /app

ARG NODE_ENV

RUN cp .env.${NODE_ENV} .env

EXPOSE 3000
EXPOSE 3001
EXPOSE 3200
EXPOSE 3201

CMD ["npm", "run", "start"]
