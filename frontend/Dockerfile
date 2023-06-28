FROM ubuntu:lunar
FROM node:latest
RUN apt update
RUN apt upgrade -y
COPY package.json .
RUN npm install
COPY . .
COPY ./src/docker.app.config.json ./src/app.config.json


RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build"]