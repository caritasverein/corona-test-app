# Schema

## Appointments
```JSON
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "uuid": {
      "type": "string",
      "format": "uuid"
    },
    "time": {
      "type": "string",
      "format": "date-time"
    },
    "nameGiven": {
      "type": "string",
      "minLength": 1,
      "maxLength": 250
    },
    "nameFamily": {
      "type": "string",
      "minLength": 1,
      "maxLength": 250
    },
    "address": {
      "type": "string",
      "minLength": 1
    },
    "dateOfBirth": {
      "type": "string",
      "format": "date"
    },
    "email": {
      "type": ["string", "null"],
      "format": "email"
    },
    "phoneMobile": {
      "type": ["string", "null"],
      "pattern": "^(015|016|017)[0-9]+$"
    },
    "phoneLandline": {
      "type": ["string", "null"],
      "pattern": "^0[2-9][0-9]+$"
    },
    "testStartedAt": {
      "type": ["string", "null"],
      "format": "date-time"
    },
    "testResult": {
      "type": ["string", "null"],
      "enum": ["positive", "negative", "invalid"]
    },
  },
  "required": [
    "uuid",
    "time",
    "nameGiven",
    "nameFamily",
    "address",
    "dateOfBirth",
    "email",
    "phoneMobile",
    "phoneLandline",
    "testStartedAt",
    "testResult"
  ],
  "additionalProperties": false,
}
```

## Window
```JSON
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "start": {"type": "string", "format": "date-time"},
    "end": {"type": "string", "format": "date-time"},
    "times": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "time": {"type": "string", "format": "date-time"},
          "full": {"type": "boolean"},
        },
        "required": ["time", "full"],
        "additionalProperties": false,
      }
    }
  },
  "required": ["start", "end", "times"],
  "additionalProperties": false,
}
```
