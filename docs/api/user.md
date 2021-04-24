# User API-Endpoints
Please refer to [schema.md](./schema.md) to check the format of individual properties.

## `GET /windows`
```
200 [{
  start,
  end,
}]
```

## `GET /windows/:date`
```
200 [{
  start,
  end,
  times: [{
    time,
    full,
  }]
}]
```

## `POST /appointments`
```
{
  time,
}
```
```
201 {
  uuid,
}
```

## `GET /appointments/:uuid`
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

## `PATCH /appointments/:uuid`
```
{
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

## `DELETE /appointments/:uuid`
```
204
```
