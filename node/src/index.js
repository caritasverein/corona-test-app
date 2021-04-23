process.on('unhandledRejection', error => {
  console.error('unhandledRejection', error.message);
  process.exit(-1);
});
process.on('uncaughtException', error => {
  console.error('uncaughtException', error.message);
  process.exit(-1);
});

import express from 'express';
import helmet from 'helmet';

import {db} from './db.js';

const app = express();
app.use(helmet());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use('/a', ()=>{});

app.listen(process.env.NODE_PORT);
