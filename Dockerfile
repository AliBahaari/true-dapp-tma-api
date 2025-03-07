FROM node:21

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install @types/multer

COPY . .

COPY ./public /app

ARG NODE_ENV

RUN cp .env.${NODE_ENV} .env

EXPOSE 3000
EXPOSE 3001
EXPOSE 3200
EXPOSE 3201

CMD ["npm", "run", "start"]
