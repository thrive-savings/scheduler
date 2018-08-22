FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

RUN yarn --no-lockfile --production

ENV NODE_ENV=production

CMD [ "npm", "start" ]