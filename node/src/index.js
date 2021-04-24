process.on('unhandledRejection', (error) => {
  console.error('unhandledRejection', error.message);
  process.exit(-1);
});
process.on('uncaughtException', (error) => {
  console.error('uncaughtException', error.message);
  process.exit(-1);
});

import express from 'express';
import helmet from 'helmet';
import {validateUuidParam, validateBodySubset} from './schema.js';

const app = express();
app.use(helmet());
app.use(express.json());

app.get('/:uuid',
  validateUuidParam(),
  (req, res)=>{

  },
);

app.patch(
  '/:uuid',
  validateUuidParam(),
  validateBodySubset([
    'nameGiven',
    'nameFamily',
    'address',
    'dateOfBirth',
    'email',
    'phoneMobile',
    'phoneLandline',
  ]),
  (req, res)=>{

  },
);


/**
 * Error handler middleware for validation errors.
 */
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    res.status(400).send(error.validationErrors);
    return next();
  }
  next(error);
});

app.listen(process.env.NODE_PORT);
