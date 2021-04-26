import Router from 'express-promise-router';
import {v4 as uuidv4} from 'uuid';

import {
  validateParamSubset,
  validateBodySubset,
} from '../schema.js';
import db from '../db.js';

const router = new Router();
export const appointmentRouter = router;

async function checkValidNewAppoitment(date) {
  if (date.getTime() < new Date().getTime()) return false;

  const [[window]] = await db.execute(
    'SELECT start, end, numQueues, appointmentDuration FROM windows WHERE start <= ? AND end > ?;',
    [date, date],
  );
  if (!window) return false;

  const [[res]] = await db.execute(`
    SELECT count(*) >= ? as full FROM appointments_valid
      WHERE (UNIX_TIMESTAMP(time) DIV ?) = (UNIX_TIMESTAMP(?) DIV ?)
  `, [
    parseInt(window.numQueues),
    parseInt(window.appointmentDuration),
    date,
    parseInt(window.appointmentDuration),
  ]);

  if (res.full) return false;
  return true;
}

async function getAppointment(uuid) {
  const [[appointment]] = await db.execute(`
    SELECT
      uuid, time, nameGiven, nameFamily, address, dateOfBirth,
      email, phoneMobile, phoneLandline, testStartedAt, testResult
    FROM
      appointments
    WHERE uuid = ?
  `, [
    uuid,
  ]);
  return appointment;
}

router.post(
  '/',
  validateBodySubset([
    'time',
  ]),
  async (req, res)=>{
    const isValid = await checkValidNewAppoitment(new Date(req.body.time));
    if (!isValid) {
      return res.sendStatus(409);
    }

    const uuid = uuidv4();
    await db.execute(
      'INSERT INTO appointments (uuid, time) VALUES (?, ?);',
      [uuid, new Date(req.body.time)],
    );
    res.status(201).send({uuid});
  },
);

router.get(
  '/:uuid',
  validateParamSubset(['uuid']),
  async (req, res)=>{
    const appointment = await getAppointment(req.params.uuid);

    if (!appointment) return res.sendStatus(404);
    res.send(appointment);
  },
);

router.patch(
  '/:uuid',
  validateParamSubset(['uuid']),
  validateBodySubset([
    'nameGiven',
    'nameFamily',
    'address',
    'dateOfBirth',
    'email',
    'phoneMobile',
    'phoneLandline',
  ]),
  async (req, res)=>{
    await db.execute(`
      UPDATE appointments
      SET
        nameGiven = ?,
        nameFamily = ?,
        address = ?,
        dateOfBirth = ?,
        email = ?,
        phoneMobile = ?,
        phoneLandline = ?
      WHERE uuid = ?
    `, [
      req.body.nameGiven,
      req.body.nameFamily,
      req.body.address,
      req.body.dateOfBirth,
      req.body.email,
      req.body.phoneMobile,
      req.body.phoneLandline,
      req.params.uuid,
    ]);

    const appointment = await getAppointment(req.params.uuid);

    if (!appointment) return res.sendStatus(404);
    res.send(appointment);
  },
);

router.delete(
  '/:uuid',
  validateParamSubset(['uuid']),
  async (req, res)=>{
    await db.execute(`
      UPDATE appointments
      SET
        invalidatedAt = NOW()
      WHERE uuid = ?
    `, [
      req.params.uuid,
    ]);

    return res.sendStatus(204);
  },
);