import Router from 'express-promise-router';

import {
  windowSchema,
  validateParamSubset,
  validateBodySubset,
} from './schema.js';

const router = new Router();
export const appointmentRouter = router;

router.post(
  '/',
  validateBodySubset([
    'time',
  ], windowSchema),
  (req, res)=>{
    // return 201 uuid
  },
);

router.get(
  '/:uuid',
  validateParamSubset(['uuid']),
  (req, res)=>{
    /* return 200
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
    */
  },
);

router.patch(
  '/:uuid',
  validateParamSubset(['uuid']),
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
    /* return 200
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
    */
  },
);

router.delete(
  '/:uuid',
  validateParamSubset(['uuid']),
  (req, res)=>{
    // return 204
  },
);
