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

## `GET /admin/appointments/:uuid`
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

## `DELETE /admin/appointments/:uuid`
```
204
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
