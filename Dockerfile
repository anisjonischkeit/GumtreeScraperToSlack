# specify the node base image with your desired version node:<version>
FROM node:8

COPY ./src /usr/src/app

WORKDIR /usr/src/app

RUN cd /usr/src/app && yarn install

# replace this with your application's default port
EXPOSE 8081

CMD node server.js