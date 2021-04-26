# Admin API-Endpoints
These Endpoints all require prior authentication and authorization.

Please refer to [schema.md](./schema.md) to check the format of individual properties.

## `POST /admin/windows`
```
{
  start,
  end,
  numQueues,
  appointmentDuration,
}
```
```
201
```
## `DELETE /admin/windows/:id`
```
204
```

## `POST /admin/appointments`
```
{
  time,
  nameGiven,
  nameFamily,
  address,
  dateOfBirth,
  email,
  phoneMobile,
  phoneLandline,
}
```
```
201 {
  uuid,
}
```

## `PATCH /admin/appointments/:uuid`
```
{
  testStartedAt,
  testResult,
}
```
```
200 {
  time,
  nameGiven,
  nameFamily,
  address,
  dateOfBirth,
  email,
  phoneMobile,
  phoneLandline,
  testStartedAt,
  testResult,
}
```

## `GET /admin/appointments?start&end`
```
200 [{
    uuid,
    time,
    nameGiven,
    nameFamily,
    address,
    dateOfBirth,
    email,
    phoneMobile,
    phoneLandline,
    testStartedAt,
    testResult,
}]
```
