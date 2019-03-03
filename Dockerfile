FROM node:alpine AS build

ADD . /src

RUN mkdir /dist
RUN yarn && yarn build

FROM node:alpine

COPY --from=build /dist /dist
WORKDIR /dist

CMD ["node", "index.js"]
