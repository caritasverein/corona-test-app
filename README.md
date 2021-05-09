# Caritas Verein Altenoythe e.V. Corona-test-app

## Setup
Create a file called `.env` in the root of this project.
It must contain contain the following entries, according to your deployments needs:

```shell
MYSQL_PASSWORD= # e.g. openssl rand -hex 32
OIDC_APP_SECRET= # e.g. openssl rand -hex 32

# Required in production
OIDC_ISSUER_BASE_URL= # https://login.microsoftonline.com/TENNANT_ID
OIDC_CLIENT_ID= # e.g. azure application client id
CERTIFICATE_PATH= # TBD
SMTP_CONNECTION= # smtp://noreply%40corona-test.tld:secretpassword@smtp.office365.com:25/?pool=true
SMTP_FROM= # noreply@corona-test.tld
TWILIO_ACCOUNT_SID= #
TWILIO_AUTH_TOKEN= #
TWILIO_SMS_FROM= #
WEB_DOMAIN= # corona-test.tld
```

It may also contain these additional entries:
```shell
HOST_WEB_PORT=8080 # defaults to 80 in production

MYSQL_USER=coronatests
MYSQL_RANDOM_ROOT_PASSWORD=true
MYSQL_DATABASE=coronatests
CERTIFICATE_PATH=./res/demoCertificate.pdf
SMTP_CONNECTION= # empty string disables mail transport
SMTP_FROM=noreply@localhost
TWILIO_ACCOUNT_SID= # empty string disables twilio transport
TWILIO_AUTH_TOKEN=
TWILIO_SMS_FROM=+15005550006
WEB_DOMAIN=localhost
WEB_PROTO=http
WEB_PORT=8080
WEB_PATH=/


# Only available in development env
HOST_MYSQL_PORT=3306
HOST_OIDC_PORT=9090
OIDC_ISSUER_BASE_URL=http://oidc-mock:9090
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
