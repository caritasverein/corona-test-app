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
import compression from 'compression';
import oidc from 'express-openid-connect';
const {auth, requiresAuth} = oidc;

import {initPromise} from './db.js';
import {apiURL} from './url.js';
import {handleValidationError} from './schema.js';

import {adminRouter} from './admin.js';
import {userRouter} from './user.js';

const app = express();
app.use(helmet());
app.use(compression());
app.use(express.json());
console.log(apiURL().toString());
app.use(auth({
  authRequired: false,
  baseURL: apiURL().toString(),
  errorOnRequiredAuth: true,
  routes: {
    login: false,
    logout: false,
  },
}));

app.get('/login', (req, res) => res.oidc.login({returnTo: '/admin/index.html'}));

app.get('/', (req, res)=>{
  res.send('OK');
});

app.use(userRouter);
app.use('/admin', requiresAuth(), adminRouter);

app.all('*', function(req, res, next) {
  next({status: 404, message: 'Not Found'});
});

/**
 * Error handler middleware for validation errors.
 */
app.use(handleValidationError);

app.use((error, req, res, next) => {
  if (!(error.status < 500)) console.error(error);

  if (error.status) {
    return res.status(error.status).json(error);
  }
  res.status(500).json({status: 500, message: error.message});
  next();
});

initPromise.then(()=>{
  app.listen(8080);
});
