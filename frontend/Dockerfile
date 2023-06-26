FROM ubuntu:lunar
FROM node:latest
RUN apt update
RUN apt upgrade -y
RUN useradd -ms /bin/bash inu
RUN usermod -aG sudo inu
WORKDIR /home/inu
USER inu
COPY . .
USER root
RUN chown -R inu: /home/inu/
USER inu
WORKDIR /home/inu

RUN npm install
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "build"]