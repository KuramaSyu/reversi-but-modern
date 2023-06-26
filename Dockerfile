FROM ubuntu:lunar
FROM python:3.10.4
FROM node:latest
RUN apt update
RUN apt upgrade -y

RUN useradd -ms /bin/bash inu
RUN usermod -aG sudo inu
WORKDIR /home/inu
USER inu
COPY . .
RUN pip install -r backend/requirements.txt
USER root
RUN chown -R inu: /home/inu/.config
RUN chown -R inu: /home/inu/inu
USER inu
WORKDIR /home/inu
CMD ["python3", "-O", "inu/main.py"]