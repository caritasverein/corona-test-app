FROM node:14 AS userbuilder

RUN mkdir /app
WORKDIR /app
COPY ./userfrontend/package* ./
COPY ./userfrontend/.npmrc ./
RUN npm i

ENV PUBLIC_URL=
COPY ./userfrontend/ ./

RUN npm run build


FROM node:14 AS adminbuilder

RUN mkdir /app
WORKDIR /app
COPY ./adminfrontend/package* ./
COPY ./adminfrontend/.npmrc ./
RUN npm i

ENV PUBLIC_URL=/admin
COPY ./adminfrontend/ ./

RUN npm run build


FROM nginx

COPY --from=userbuilder /app/build /var/www/html
COPY --from=adminbuilder /app/build /var/www/html/admin
COPY ./proxy/production /etc/nginx/templates/
