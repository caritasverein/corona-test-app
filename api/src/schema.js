
import {Validator, ValidationError} from 'express-json-validator-middleware';
import keywords from 'ajv-keywords';

export const validator = new Validator();
export const {validate} = validator;
keywords(validator.ajv);

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
      'pattern': '^.+$',
      'regexp': {'pattern': '^\\p{L}[\\p{L} \'.-]*$', 'flags': 'u'},
    },
    'nameFamily': {
      'type': 'string',
      'minLength': 1,
      'maxLength': 250,
      'pattern': '^.+$',
      'regexp': {'pattern': '^\\p{L}[\\p{L} \'.-]*$', 'flags': 'u'},
    },
    'address': {
      'type': 'string',
      'minLength': 1,
      'maxLength': 250,
      'pattern': '^.+\n.+$',
      'regexp': {'pattern': '^\\p{L}[\\p{L}\\d \'._()-]*\\n[\\p{L}\\d \'._()-]*$', 'flags': 'mu'},
    },
    'dateOfBirth': {
      'type': 'string',
      'format': 'date',
    },
    'email': {
      'type': ['string', 'null'],
      'format': 'email',
      'maxLength': 50,
      'pattern': '^.+@.+$',
      'regexp': {'pattern': '^\\p{L}[\\p{L}._+-]*@[\\p{L}.-]+$', 'flags': 'u'},
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
    'arrivedAt': {
      'type': ['string', 'null'],
      'format': 'date-time',
    },
    'testStartedAt': {
      'type': ['string', 'null'],
      'format': 'date-time',
    },
    'testResult': {
      'type': ['string', 'null'],
      'enum': ['positive', 'negative', 'invalid', null],
    },
    'needsCertificate': {
      'type': ['string', 'null'],
      'enum': ['true', null],
    },
    'marked': {
      'type': ['string', 'null'],
      'enum': ['true', null],
    },
    'slot': {
      'type': ['number', 'null'],
    },
    'createdAt': {
      'type': ['string', 'null'],
      'format': 'date-time',
    },
    'updatedAt': {
      'type': ['string', 'null'],
      'format': 'date-time',
    },
    'reportedAt': {
      'type': ['string', 'null'],
      'format': 'date-time',
    },
    'invalidatedAt': {
      'type': ['string', 'null'],
      'format': 'date-time',
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
    'arrivedAt',
    'testStartedAt',
    'testResult',
    'needsCertificate',
    'marked',
    'createdAt',
    'updatedAt',
    'reportedAt',
    'invalidatedAt',
  ],
  'additionalProperties': false,
};

export const appointmentSchemaUser = subsetSchema([
  'uuid',
  'time',
  'nameGiven',
  'nameFamily',
  'address',
  'dateOfBirth',
  'email',
  'phoneMobile',
  'phoneLandline',
  'arrivedAt',
  'testStartedAt',
  'testResult',
  'createdAt',
  'updatedAt',
  'invalidatedAt',
]);

export const appointmentTestSchema = subsetSchemaAnyOf([
  'arrivedAt',
  'testStartedAt',
  'testResult',
  'needsCertificate',
  'marked',
]);

export const windowSchema = {
  '$schema': 'http://json-schema.org/draft-07/schema#',
  'type': 'object',
  'properties': {
    'id': {'type': 'number'},
    'start': {'type': 'string', 'format': 'date-time'},
    'end': {'type': 'string', 'format': 'date-time'},
    'numQueues': {'type': 'integer', 'min': 1},
    'appointmentDuration': {'type': 'integer', 'min': 60},
    'externalRef': {
      'type': ['string', 'null'],
      'format': 'url',
    },
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
  'required': ['id', 'start', 'end', 'times', 'numQueues', 'appointmentDuration', 'externalRef'],
  'additionalProperties': false,
};

export function subsetSchema(properties=[], schema=appointmentSchema) {
  const missing = properties.find((p)=>!(p in schema.properties));
  if (missing) {
    throw new Error(`Required request property ${missing} does not exist in this schema`);
  }

  return {
    ...schema,
    properties: Object.fromEntries(
      Object.entries(schema.properties)
        .filter(([k, v])=>properties.includes(k)),
    ),
    required: properties,
  };
}
export function subsetSchemaAnyOf(properties=[], schema=appointmentSchema) {
  return {
    ...subsetSchema(properties, schema),
    'required': [],
    'anyOf': properties.map((p)=>({'required': [p]})),
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
    return next({status: 400, message: 'Bad Request', detail: error.validationErrors});
  }
  next(error);
}
