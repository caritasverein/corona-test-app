FROM node:14 AS userbuilder

RUN mkdir /app
RUN mkdir /shared
WORKDIR /app
COPY ./shared /shared
COPY ./userfrontend/package* ./
COPY ./userfrontend/.npmrc ./
RUN npm i

ENV PUBLIC_URL=
COPY ./userfrontend/ ./

RUN npm run build


FROM node:14 AS adminbuilder

RUN mkdir /app
RUN mkdir /shared
WORKDIR /app
COPY ./shared /shared
COPY ./adminfrontend/package* ./
COPY ./adminfrontend/.npmrc ./
RUN npm i

ENV PUBLIC_URL=/admin
COPY ./adminfrontend/ ./

RUN npm run build


FROM nginx

RUN rm /etc/nginx/conf.d/default.conf
COPY --from=userbuilder /app/build /var/www/html
COPY --from=adminbuilder /app/build /var/www/html/admin
COPY ./proxy/production /etc/nginx/templates/
