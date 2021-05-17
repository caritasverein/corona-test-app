import {mailReport} from '../report.js';

mailReport(true).then((e)=>{
  console.log(e);
  process.exit(0);
}, (e)=>{
  console.error(e);
  process.exit(-1);
});
