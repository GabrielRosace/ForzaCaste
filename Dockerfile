FROM node:12.22-buster-slim

WORKDIR /app
EXPOSE 8080
EXPOSE 4200

RUN ["/bin/bash", "-c", "npm i -g typescript; npm install -g @angular/cli; npm i -g nodemon"]