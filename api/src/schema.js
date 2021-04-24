
import {Validator, ValidationError} from 'express-json-validator-middleware';

const {validate} = new Validator();

export const schema = {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  'type': 'object',
  'properties': {
    'uuid': {
      'type': 'string',
      'format': 'uuid',
    },
    'time': {
      'type': 'string',
      'format': 'date-time',
    },
    'nameGiven': {
      'type': 'string',
      'minLength': 1,
      'maxLength': 250,
    },
    'nameFamily': {
      'type': 'string',
      'minLength': 1,
      'maxLength': 250,
    },
    'address': {
      'type': 'string',
      'minLength': 1,
    },
    'dateOfBirth': {
      'type': 'string',
      'format': 'date',
    },
    'email': {
      'type': ['string', 'null'],
      'format': 'email',
      'maxLength': 50,
    },
    'phoneMobile': {
      'type': ['string', 'null'],
      'pattern': '^(015|016|017)[0-9]+$',
      'maxLength': 50,
    },
    'phoneLandline': {
      'type': ['string', 'null'],
      'pattern': '^0[2-9][0-9]+$',
      'maxLength': 50,
    },
    'testStartedAt': {
      'type': ['string', 'null'],
      'format': 'date-time',
    },
    'testResult': {
      'type': ['string', 'null'],
      'enum': ['positive', 'negative', 'invalid'],
    },
  },
  'required': [
    'uuid',
    'time',
    'nameGiven',
    'nameFamily',
    'address',
    'dateOfBirth',
    'email',
    'phoneMobile',
    'phoneLandline',
    'testStartedAt',
    'testResult',
  ],
  'additionalProperties': false,
};

export function subsetSchema(properties) {
  return {
    ...schema,
    properties: Object.fromEntries(
      Object.entries(schema.properties)
        .filter(([k, v])=>properties.includes(k)),
    ),
    required: schema.required
      .filter((r)=>properties.includes(r)),
  };
}

export function validateBodySubset(properties) {
  return validate({body: subsetSchema(properties)});
}
export function validateUuidParam() {
  return validate({params: subsetSchema(['uuid'])});
}
export function handleValidationError(error, req, res, next) {
  if (error instanceof ValidationError) {
    res.status(400).send(error.validationErrors);
    return next();
  }
  next(error);
}
