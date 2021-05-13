import Router from 'express-promise-router';

import {
  validateProperties,
} from '../schema.js';
import db from '../db.js';
import mail from '../mail.js';

const router = new Router();
export const reportRouter = router;

const csvify = (v)=>{
  if (typeof v === 'string') return JSON.stringify(v);
  if (v instanceof Date) return v.toISOString();
  return ''+v;
};

router.get(
  '/day/:date',
  validateProperties('params', {
    date: {type: 'string', format: 'date'},
  }),
  async (req, res)=>{
    const [rows, columns] = await db.execute(
      'SELECT * FROM appointments WHERE DATE(time) = DATE(?)',
      [new Date(req.params.date)],
    );

    const countPositive = rows.filter((r)=>r.testResult === 'positive').length;
    const countNegative = rows.filter((r)=>r.testResult === 'negative').length;
    const countInvalid = rows.filter((r)=>r.testResult === 'invalid').length;
    const countTotal = rows.filter((r)=>r.testResult).length;
    const countPending = rows.filter((r)=>r.testStartedAt && !r.testResult).length;
    const countCanceled = rows.filter((r)=>r.invalidatedAt).length;
    const countNotArrived = rows.filter((r)=>!r.arrivedAt).length;
    const countNotStarted = rows.filter((r)=>!r.testStartedAt).length;

    const textReport =
      `Testzentrum Wassermühle\n`+
      `Report ${req.params.date} (generated at ${new Date().toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})})\n\n`+
      `Tests Total: ${countTotal}\n`+
      `Tests Negative: ${countNegative}\n`+
      `Tests Positive: ${countPositive}\n`+
      `Tests Invalid: ${countInvalid}\n`+
      `Tests Pending: ${countPending}\n`+
      `Canceled: ${countCanceled}\n`+
      `Not Arrived: ${countNotArrived}\n`+
      `Not Started: ${countNotStarted}\n`+
      '\n';

    const csvReport =
      columns.map((c)=>csvify(c.name)).join(',')+'\n'+
      rows.map((r)=>Object.values(r).map((v)=>csvify(v)).join(',')).join('\n')+'\n';

    await mail(
      process.env.REPORT_MAIL,
      'Report '+req.params.date+' - '+`Testzentrum Wassermühle`,
      textReport,
      ``,
      [{
        filename: 'Report_'+req.params.date+'.csv',
        content: csvReport,
        contentType: 'text/csv; charset=UTF-8',
      }],
    );

    res.send({text: textReport, csv: csvReport});
  },
);
