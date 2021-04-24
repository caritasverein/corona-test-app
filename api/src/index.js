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
import oidc from 'express-openid-connect';
const {auth, requiresAuth} = oidc;

import {
  validateUuidParam,
  validateBodySubset,
  handleValidationError,
} from './schema.js';

const app = express();
app.use(helmet());
app.use(express.json());
app.use(auth({
  authRequired: false,
  errorOnRequiredAuth: true,
  routes: {
    login: false,
    logout: false,
  },
}));

app.get('/login', (req, res) => res.oidc.login({returnTo: '/admin/'}));
app.get('/me', requiresAuth(), (req, res)=>{
  res.send(req.oidc.user);
});
app.get('/', (req, res)=>{
  res.send('hello');
});

app.get('/appointments/:uuid',
  validateUuidParam(),
  (req, res)=>{

  },
);

app.patch(
  '/appointments/:uuid',
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
app.use(handleValidationError);

app.listen(8080);
