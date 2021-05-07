FROM node:12.14.1-buster-slim

WORKDIR /app
EXPOSE 8080

RUN ["/bin/bash", "-c", "npm i -g typescript; npm install -g @angular/cli"]