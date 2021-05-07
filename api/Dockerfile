FROM node:14

RUN mkdir /app && chown 1000:1000 /app
WORKDIR /app
USER 1000
COPY ./package* ./
RUN npm ci --only=prod

COPY ./ ./

EXPOSE 8080

CMD npm start
