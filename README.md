# Caritas Verein Altenoythe e.V. Corona-test-app

## Setup
Create a file called `.env` in the root of this project.
It must contain contain the following entries, according to your deployments needs:

```shell
MYSQL_PASSWORD= # e.g. openssl rand -hex 32
OIDC_APP_SECRET= # e.g. openssl rand -hex 32

# Required in production
OIDC_ISSUER_BASE_URL= # https://login.microsoftonline.com/TENNANT_ID
OIDC_APP_BASE_URL= # https://corona-tests/api   (note /api as the path)
OIDC_CLIENT_ID= # e.g. azure application client id
```

It may also contain these additional entries:
```shell
WEB_PORT=8080 # defaults to 80 in production

MYSQL_USER=coronatests
MYSQL_RANDOM_ROOT_PASSWORD=true
MYSQL_DATABASE=coronatests

# Only available in development env
MYSQL_PORT=3306
OIDC_PORT=9090
OIDC_ISSUER_BASE_URL=http://oidc-mock:9090/
OIDC_APP_BASE_URL=http://localhost:8080/api # note /api as path
OIDC_CLIENT_ID=coronatests
```

## Development
Start dev env using

```shell
./dev.sh
```

### Enable oidc-mock login
For the oidc-mock server to work during development as well as automated testing, you need to locally resolve the domain `oidc-mock` to `127.0.0.1`.\
On Linux you can add the following line to your `/etc/hosts`:
```shell
127.0.0.1   oidc-mock
```

### Running tests during development
Tests are automatically run after starting the dev env and upon filechange.

To manually start them run:
```shell
./test.sh
```

## Production
Make sure all **required env-variables** are set.

Deploy production service using

```shell
./prod.sh
```
