
import {Validator, ValidationError} from 'express-json-validator-middleware';

const {validate} = new Validator();

export const appointmentSchema = {
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

export const windowSchema = {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  'type': 'object',
  'properties': {
    'id': {'type': 'number'},
    'start': {'type': 'string', 'format': 'date-time'},
    'end': {'type': 'string', 'format': 'date-time'},
    'numQueues': {'type': 'number'},
    'appointmentDuration': {'type': 'number'},
    'times': {
      'type': 'array',
      'items': {
        'type': 'object',
        'properties': {
          'time': {'type': 'string', 'format': 'date-time'},
          'full': {'type': 'boolean'},
        },
        'required': ['time', 'full'],
        'additionalProperties': false,
      },
    },
  },
  'required': ['id', 'start', 'end', 'times'],
  'additionalProperties': false,
};

export function subsetSchema(properties=[], schema=appointmentSchema) {
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

export function validateProperties(key='body', properties={}) {
  return validate({[key]: {
    '$schema': 'http://json-schema.org/draft-07/schema#',
    'type': 'object',
    'properties': properties,
    'required': Object.keys(properties),
    'additionalProperties': false,
  }});
}

export function validateBodySubset(properties=[], schema=appointmentSchema) {
  return validate({body: subsetSchema(properties, schema)});
}
export function validateParamSubset(params, schema=appointmentSchema) {
  return validate({params: subsetSchema(params, schema)});
}
export function validateQuerySubset(params, schema=appointmentSchema) {
  return validate({query: subsetSchema(params, schema)});
}
export function handleValidationError(error, req, res, next) {
  if (error instanceof ValidationError) {
    res.status(400).send(error.validationErrors);
    return next();
  }
  next(error);
}
