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
ARG REACT_APP_THEME_PRIMARY
ENV REACT_APP_THEME_PRIMARY $REACT_APP_THEME_PRIMARY
ARG REACT_APP_THEME_ON_PRIMARY
ENV REACT_APP_THEME_ON_PRIMARY $REACT_APP_THEME_ON_PRIMARY
ARG REACT_APP_THEME_SECONDARY
ENV REACT_APP_THEME_SECONDARY $REACT_APP_THEME_SECONDARY
ARG REACT_APP_THEME_ON_SECONDARY
ENV REACT_APP_THEME_ON_SECONDARY $REACT_APP_THEME_ON_SECONDARY
ARG REACT_APP_USERLIST
ENV REACT_APP_USERLIST $REACT_APP_USERLIST
ARG REACT_APP_GROUPLIST
ENV REACT_APP_GROUPLIST $REACT_APP_GROUPLIST
ARG REACT_APP_SITE_NAME
ENV REACT_APP_SITE_NAME $REACT_APP_SITE_NAME
ARG REACT_APP_SITE_ADDRESS1
ENV REACT_APP_SITE_ADDRESS1 $REACT_APP_SITE_ADDRESS1
ARG REACT_APP_SITE_ADDRESS2
ENV REACT_APP_SITE_ADDRESS2 $REACT_APP_SITE_ADDRESS2
ARG REACT_APP_SITE_MAPS_QUERY
ENV REACT_APP_SITE_MAPS_QUERY $REACT_APP_SITE_MAPS_QUERY

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
ARG REACT_APP_THEME_PRIMARY
ENV REACT_APP_THEME_PRIMARY $REACT_APP_THEME_PRIMARY
ARG REACT_APP_THEME_ON_PRIMARY
ENV REACT_APP_THEME_ON_PRIMARY $REACT_APP_THEME_ON_PRIMARY
ARG REACT_APP_THEME_SECONDARY
ENV REACT_APP_THEME_SECONDARY $REACT_APP_THEME_SECONDARY
ARG REACT_APP_THEME_ON_SECONDARY
ENV REACT_APP_THEME_ON_SECONDARY $REACT_APP_THEME_ON_SECONDARY

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
