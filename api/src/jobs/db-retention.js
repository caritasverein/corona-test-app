import {retention} from '../db.js';

retention().then((e)=>{
  console.log(e);
  process.exit(0);
}, (e)=>{
  console.error(e);
  process.exit(-1);
});
