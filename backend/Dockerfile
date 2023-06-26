FROM ubuntu:lunar
FROM python:3.10.4
RUN apt update
RUN apt upgrade -y

RUN useradd -ms /bin/bash inu
RUN usermod -aG sudo inu
WORKDIR /home/inu
USER inu
COPY . .
RUN pip install -r requirements.txt
USER root
RUN chown -R inu: /home/inu/
USER inu
WORKDIR /home/inu
CMD ["python3", "-O", "main.py"]