FROM node:lts-alpine

RUN mkdir /app && chown -R node:node /app

WORKDIR /app
USER node

COPY --chown=node . .
RUN yarn install --production --frozen-lockfile
RUN yarn build

CMD ["yarn", "start"]