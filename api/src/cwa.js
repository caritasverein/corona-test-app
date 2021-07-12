import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import fetch from 'fetch-h2';

// Documentation for CWA integration: https://github.com/corona-warn-app/cwa-quicktest-onboarding/wiki/Anbindung-der-Partnersysteme

const backendUrl = new URL(process.env.CWA_BACKEND_URL);
const backendUrlAgent = new https.Agent({
  hostname: backendUrl.host,
  port: backendUrl.port,
  path: backendUrl.pathname,
  method: 'POST',
  keepAlive: true,
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  key: process.env.CWA_BACKEND_KEY && fs.readFileSync(process.env.CWA_BACKEND_KEY),
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  cert: process.env.CWA_BACKEND_CERT && fs.readFileSync(process.env.CWA_BACKEND_CERT),
});

export const toCWADataFull = async (appointment) => {
  const cwa = {
    fn: appointment.nameGiven,
    ln: appointment.nameFamily,
    dob: appointment.dateOfBirth.toISOString().split('T')[0],
    timestamp: Math.round(appointment.time.getTime() / 1000),
    testid: appointment.uuid,
    salt: appointment.cwasalt,
  };

  return buildHashedUrl(cwa);
};

export const toCWADataMini = async (appointment) => {
  const cwa = {
    timestamp: Math.round(appointment.time.getTime() / 1000),
    salt: appointment.cwasalt,
  };

  return buildHashedUrl(cwa);
};

export const buildHashedUrl = async (cwa) => {
  const hashString = cwa.testid ?
    `${cwa.dob}#${cwa.fn}#${cwa.ln}#${cwa.timestamp}#${cwa.testid}#${cwa.salt}` : `${cwa.timestamp}#${cwa.salt}`;

  cwa.hash = crypto.createHash('sha256').update(hashString).digest('hex');
  const url = new URL(process.env.CWA_APP_URL);
  url.hash = Buffer.from(JSON.stringify(cwa)).toString('base64');

  return {
    hash: cwa.hash,
    url,
  };
};

export const submitCWAResult = async (appointment) => {
  if (!appointment.cwasalt) return false;

  const full = await toCWADataFull(appointment);
  const mini = await toCWADataMini(appointment);
  const sc = Math.round(appointment.testStartedAt.getTime() / 1000);
  const result = ({negative: 6, positive: 7, invalid: 8})[appointment.testResult];

  return fetch(process.env.CWA_BACKEND_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    agent: backendUrlAgent,
    body: JSON.stringify({
      testresults: [{
        id: full.hash,
        result,
        sc,
      }, {
        id: mini.hash,
        result,
        sc,
      }],
    }),
  });
};
