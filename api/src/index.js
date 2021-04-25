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

import {handleValidationError} from './schema.js';

import {appointmentRouter} from './appointments.js';
import {windowsRouter} from './windows.js';

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

app.use('/appointments', appointmentRouter);
app.use('/windows', windowsRouter);


/**
 * Error handler middleware for validation errors.
 */
app.use(handleValidationError);

app.listen(8080);
