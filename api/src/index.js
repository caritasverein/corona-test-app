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

import {userRouter} from './user.js';

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

app.get('/login', (req, res) => res.oidc.login({returnTo: '/admin/index.html'}));
app.get('/me', requiresAuth(), (req, res)=>{
  res.send(req.oidc.user);
});
app.get('/', (req, res)=>{
  res.send('hello');
});

app.use(userRouter);

app.all('*', function(req, res, next) {
  next({status: 404, message: 'Not Found'});
});

/**
 * Error handler middleware for validation errors.
 */
app.use(handleValidationError);

app.use((error, req, res, next) => {
  if (error.status) {
    return res.status(error.status).json(error);
  }
  res.status(500).json({status: 500, message: error.message});
  next();
});

app.listen(8080);
