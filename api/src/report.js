import db, {initPromise} from './db.js';
import mail from './mail.js';

const csvify = (v)=>{
  if (typeof v === 'string') return JSON.stringify(v);
  if (v instanceof Date) return v.toISOString();
  return ''+v;
};

export async function mailReport(markReported=false) {
  await initPromise;
  const date = new Date();

  let rows;
  let columns;
  const connection = await db.getConnection();
  try {
    await connection.query('START TRANSACTION');

    [rows, columns] = await connection.query(`
      SELECT * FROM appointments WHERE reportedAt IS NULL
    `, [date]);

    if (markReported) {
      await connection.query(`
        UPDATE appointments SET reportedAt = ? WHERE reportedAt IS NULL AND (testResult IS NOT NULL OR invalidatedAt IS NOT NULL)
      `, [date]);
    }

    await connection.query('COMMIT');
    await connection.release();
  } catch (e) {
    await connection.query('ROLLBACK');
    await connection.release();
    throw e;
  }

  const countPositive = rows.filter((r)=>r.testResult === 'positive').length;
  const countNegative = rows.filter((r)=>r.testResult === 'negative').length;
  const countInvalid = rows.filter((r)=>r.testResult === 'invalid').length;
  const countFinished = rows.filter((r)=>r.testResult).length;
  const countPending = rows.filter((r)=>r.testStartedAt && !r.testResult).length;
  const countCanceled = rows.filter((r)=>r.invalidatedAt).length;
  const countNotArrived = rows.filter((r)=>!r.arrivedAt && !r.invalidatedAt && !r.testStartedAt).length;
  const countNotStarted = rows.filter((r)=>r.arrivedAt && !r.testStartedAt).length;

  const reportSpanStart = rows.filter((r)=>r.testResult).reduce((p, c)=>Math.min(p, c.updatedAt), new Date());
  const reportSpanEnd = rows.filter((r)=>r.testResult).reduce((p, c)=>Math.max(p, c.updatedAt), new Date(0));

  const textReport =
    `${process.env.LOCATION_NAME}\n`+
    `Report (generated at ${new Date().toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})})\n\n`+
    `Test Timespan: ${new Date(reportSpanStart).toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})} - ${new Date(reportSpanEnd).toLocaleString('de-DE', {timeZone: 'Europe/Berlin'})}\n`+
    `Tests Finished: ${countFinished}\n`+
    `Tests Negative: ${countNegative}\n`+
    `Tests Positive: ${countPositive}\n`+
    `Tests Invalid: ${countInvalid}\n`+
    `\n`+
    `Canceled: ${countCanceled}\n`+
    `Not Arrived: ${countNotArrived}\n`+
    `Not Started: ${countNotStarted}\n`+
    `Not Finsihed: ${countPending}\n`+
    '\n';

  const csvReport =
    columns.map((c)=>csvify(c.name)).join(',')+'\n'+
    rows.map((r)=>Object.values(r).map((v)=>csvify(v)).join(',')).join('\n')+'\n';

  await mail(
    process.env.REPORT_MAIL,
    'Report '+date+' - '+process.env.LOCATION_NAME,
    textReport,
    ``,
    [{
      filename: 'Report_'+date+'.csv',
      content: csvReport,
      contentType: 'text/csv; charset=UTF-8',
    }],
  );
}
