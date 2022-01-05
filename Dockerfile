FROM node:12.22-buster-slim

WORKDIR /app
EXPOSE 8080
EXPOSE 4200

RUN ["/bin/bash", "-c", "npm i -g typescript; npm install -g @angular/cli; npm i -g nodemon; npm i -g http-server; apt update && apt upgrade && apt install -y git"]