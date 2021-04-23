process.on('unhandledRejection', error => {
  console.error('unhandledRejection', error.message);
  process.exit(-1);
});
process.on('uncaughtException', error => {
  console.error('uncaughtException', error.message);
  process.exit(-1);
});

const express = require('express');

const {db} = require('./db.js');

const app = express();
app.use(express.urlencoded({extended: false}));

app.use('/a', ()=>{});

app.listen(process.env.NODE_PORT);
