import Router from 'express-promise-router';
import {v4 as uuidv4} from 'uuid';

import {
  validateParamSubset,
  validateBodySubset,
  validateQuerySubset,
  validate,
  windowSchema,
  appointmentTestSchema,
} from '../schema.js';
import db from '../db.js';
import {getAppointment} from '../user/appointments.js';
import {sendNotifications} from '../notifications.js';

const router = new Router();
export const appointmentRouter = router;


router.post(
  '/',
  validateBodySubset([
    'time',
    'nameGiven',
    'nameFamily',
    'address',
    'dateOfBirth',
    'email',
    'phoneMobile',
    'phoneLandline',
  ]),
  async (req, res)=>{
    const uuid = uuidv4();

    await db.execute(`
      INSERT INTO appointments (
        uuid, time, nameGiven, nameFamily, address, dateOfBirth,
        email, phoneMobile, phoneLandline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuid,
      new Date(req.body.time),
      req.body.nameGiven,
      req.body.nameFamily,
      req.body.address,
      req.body.dateOfBirth,
      req.body.email,
      req.body.phoneMobile,
      req.body.phoneLandline,
    ]);

    res.status(201).send({uuid});
  },
);

router.patch(
  '/:uuid',
  validateParamSubset(['uuid']),
  validate({'body': appointmentTestSchema}),
  async (req, res)=>{
    if (req.body.testStartedAt !== undefined) {
      await db.execute(`
        UPDATE appointments
        SET
          testStartedAt = ?
        WHERE uuid = ?
      `, [
        new Date(req.body.testStartedAt),
        req.params.uuid,
      ]);
    }

    if (req.body.testResult !== undefined) {
      await db.execute(`
        UPDATE appointments
        SET
          testResult = ?
        WHERE uuid = ?
      `, [
        req.body.testResult,
        req.params.uuid,
      ]);
    }

    if (req.body.needsCertificate !== undefined) {
      await db.execute(`
        UPDATE appointments
        SET
          needsCertificate = ?
        WHERE uuid = ?
      `, [
        req.body.needsCertificate,
        req.params.uuid,
      ]);
    }

    const appointment = await getAppointment(req.params.uuid);
    if (!appointment) return res.sendStatus(404);

    if (appointment.testResult) await sendNotifications(appointment);

    res.send(appointment);
  },
);

router.get(
  '/',
  validateQuerySubset(['start', 'end'], windowSchema),
  async (req, res)=>{
    const [appointments] = await db.execute(`
      SELECT
        uuid, time, nameGiven, nameFamily, address, dateOfBirth,
        email, phoneMobile, phoneLandline, testStartedAt, testResult,
        needsCertificate, createdAt, invalidatedAt
      FROM appointments WHERE time >= ? AND time <= ? ORDER BY time
    `, [
      new Date(req.query.start),
      new Date(req.query.end),
    ]);

    res.send(appointments);
  },
);
