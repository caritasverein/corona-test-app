# Caritas Verein Altenoythe e.V. Corona-test-app

## Setup
Create a file called `.env` in the root of this project.
It must contain contain the following entries, according to your deployments needs:
```shell
MYSQL_PASSWORD= # e.g. openssl rand -hex 32

ISSUER_BASE_URL= # e.g. https://login.microsoftonline.com/TENANT_ID
CLIENT_ID= # e.g. azure application client id
BASE_URL= # e.g. http://localhost:8080/api/ !important ending /api/
SECRET= # e.g. openssl rand -hex 32
```
It may also contain these additional entries:
```shell
WEB_PORT=8080 # defaults development: 8080 / production: 80

MYSQL_USER=coronatests
MYSQL_RANDOM_ROOT_PASSWORD=true
MYSQL_DATABASE=coronatests
```

## development
Start dev env using
```shell
./dev.sh
```

## production
Deploy production service using
```shell
./prod.sh
```
