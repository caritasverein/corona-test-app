FROM node:14 AS userbuilder

ARG REACT_APP_LOCATION_NAME
ENV REACT_APP_LOCATION_NAME $REACT_APP_LOCATION_NAME
ARG REACT_APP_LOGO_REF
ENV REACT_APP_LOGO_REF $REACT_APP_LOGO_REF
ARG REACT_APP_INDEX_REF
ENV REACT_APP_INDEX_REF $REACT_APP_INDEX_REF
ARG REACT_APP_IMPRINT_REF
ENV REACT_APP_IMPRINT_REF $REACT_APP_IMPRINT_REF
ARG REACT_APP_PRIVACY_REF
ENV REACT_APP_PRIVACY_REF $REACT_APP_PRIVACY_REF

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

ARG REACT_APP_LOCATION_NAME
ENV REACT_APP_LOCATION_NAME $REACT_APP_LOCATION_NAME
ARG REACT_APP_TEST_DURATION
ENV REACT_APP_TEST_DURATION $REACT_APP_TEST_DURATION

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
