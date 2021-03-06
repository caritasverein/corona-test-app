import db, {initPromise} from './db.js';
import mail from './mail.js';
import xlsx from 'xlsx';
import userlist from './userlist.js';

const formatTime = (d, opts)=>{
  if (isNaN(new Date(d))) return null;
  return new Date(d).toLocaleString('de-DE', {timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', ...opts});
};
const formatDate = (d, opts)=>{
  if (isNaN(new Date(d))) return null;
  return new Date(d).toLocaleString('de-DE', {timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', ...opts});
};
const formatDateTime = (d, opts)=>{
  if (isNaN(new Date(d))) return null;
  return new Date(d).toLocaleString('de-DE', {timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', ...opts});
};

const getMidnight = ()=>{
  const d = new Date();
  d.setHours(0, 0, 0, 0, 0);
  return d;
};

export async function mailReport(reportUnreported=false, start=getMidnight(), skipWithoutResult=true) {
  await initPromise;
  const date = new Date();
  const end = new Date(start);
  end.setHours(start.getHours()+24);

  let rows;
  const connection = await db.getConnection();
  try {
    await connection.query('START TRANSACTION');


    if (reportUnreported) {
      [rows] = await connection.query(`
        SELECT * FROM appointments WHERE reportedAt IS NULL ORDER BY time
      `, [date]);

      await connection.query(`
        UPDATE appointments SET reportedAt = ?
        WHERE reportedAt IS NULL AND NOT (testResult IS NULL AND invalidatedAt IS NULL)
      `, [date]);

      if (skipWithoutResult && !rows.find((r)=>r.testResult)) return;
    } else {
      [rows] = await connection.query(`
        SELECT * FROM appointments WHERE ? < time AND ? > time ORDER BY time
      `, [start, end]);
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

  const reportSpanStart = rows.filter((r)=>r.testResult).reduce((p, c)=>Math.min(p, c.time.getTime()), Infinity);
  const reportSpanEnd = rows.filter((r)=>r.testResult).reduce((p, c)=>Math.max(p, c.time.getTime()), new Date(0).getTime());

  const textReport =
    `${process.env.LOCATION_NAME}\n`+
    `Report (erstellt am ${formatDateTime(new Date())})\n\n`+
    `Test Zeitspanne: ${formatDateTime(reportSpanStart)} - ${formatDateTime(reportSpanEnd)}\n`+
    `Tests beendet: ${countFinished}\n`+
    `Tests negativ: ${countNegative}\n`+
    `Tests positiv: ${countPositive}\n`+
    `Tests ung??ltig: ${countInvalid}\n`+
    `\n`+
    `Abgesagt: ${countCanceled}\n`+
    `nicht erschienen: ${countNotArrived}\n`+
    `nicht gestartet: ${countNotStarted}\n`+
    `nicht beendet: ${countPending}\n`+
    '\n';

  const reportRows = rows.filter((r)=>r.testResult).map((r)=>({
    'Test-Datum': formatDate(r.time),
    'Uhrzeit': formatTime(r.time),
    'Name': r.nameFamily,
    'Vorname': r.nameGiven,
    'Geburtsdatum': formatDate(r.dateOfBirth, {timeZone: 'UTC'}),
    'Festnetz': r.phoneLandline,
    'Mobil': r.phoneMobile,
    'E-Mail': r.email,
    'Testergebnis': r.testResult,
    'Stra??e': r.address?.split('\n')[0],
    'Ort': r.address?.split('\n')[1],
    'Benutzerliste': userlist.find((u)=>u.nameGiven === r.nameGiven && u.nameFamily === r.nameFamily && new Date(u.dateOfBirth) === r.dateOfBirth) ? 'Ja':'Nein',
  }));

  const report = xlsx.utils.json_to_sheet(reportRows);
  report['!cols'] = new Array(reportRows[0] ? Object.keys(rows[0]).length : 0).fill({wch: 20});
  const reportAll = xlsx.utils.json_to_sheet(rows.map((r)=>({...r, address: r.address?.replace('\n', ' ')})));
  reportAll['!cols'] = new Array(rows[0] ? Object.keys(rows[0]).length : 0).fill({wch: 20});

  const reportBook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(reportBook, report, process.env.LOCATION_NAME.slice(0, 30));
  xlsx.utils.book_append_sheet(reportBook, reportAll, ('All ' + process.env.LOCATION_NAME).slice(0, 30));

  await mail(
    process.env.REPORT_MAIL,
    'Report '+date.toISOString()+' - '+process.env.LOCATION_NAME,
    textReport,
    ``,
    [{
      filename: 'Report_'+date.toISOString()+'.xlsx',
      content: xlsx.write(reportBook, {type: 'buffer', bookType: 'xlsx'}),
      contentType: 'text/csv; charset=UTF-8',
    }],
  );
}
