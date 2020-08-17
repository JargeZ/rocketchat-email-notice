FROM node:14.5-alpine

ENV TZ=Europe/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apk add --update \
  git \
&& rm -rf /var/cache/apk/*

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node
COPY package*.json ./
RUN npm install --only=prod

COPY --chown=node:node ./dist/app .

CMD [ "node", "main.js" ]
