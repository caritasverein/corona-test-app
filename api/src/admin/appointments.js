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
import {
  sendResultNotifications,
  sendAppointmentNotifications,
} from '../notifications.js';

const router = new Router();
export const appointmentRouter = router;

async function getAppointment(uuid, valid=false) {
  const [[appointment]] = await db.execute(`
    SELECT
      uuid, time, nameGiven, nameFamily, address, dateOfBirth,
      email, phoneMobile, phoneLandline, arrivedAt, testStartedAt, testResult,
      needsCertificate, marked, slot, createdAt, updatedAt, reportedAt, invalidatedAt
    FROM
      ${valid?'appointments_valid':'appointments'}
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
    'nameGiven',
    'nameFamily',
    'address',
    'dateOfBirth',
    'email',
    'phoneMobile',
    'phoneLandline',
  ]),
  async (req, res) => {
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

    const appointment = await getAppointment(uuid, true);
    if (appointment && appointment.nameFamily) await sendAppointmentNotifications(appointment);

    res.status(201).send({uuid});
  },
);

router.patch(
  '/:uuid',
  validateParamSubset(['uuid']),
  validate({'body': appointmentTestSchema}),
  async (req, res) => {
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

    if (req.body.marked !== undefined) {
      await db.execute(`
        UPDATE appointments
        SET
          marked = ?
        WHERE uuid = ?
      `, [
        req.body.marked,
        req.params.uuid,
      ]);
    }

    if (req.body.arrivedAt !== undefined) {
      const [rows] = await db.query(`
        SELECT
          slot
        FROM
          \`appointments\`
        WHERE
          \`appointments\`.\`arrivedAt\` IS NOT NULL
          AND
          \`appointments\`.\`testResult\` IS NULL
          AND
          \`appointments\`.\`invalidatedAt\` IS NULL
        ORDER BY slot ASC;
      `);

      const slots = rows.map((r)=>r.slot-1);
      const existingSlot = slots.findIndex((slot, index) => slot !== index);
      const slot = (existingSlot !== -1 ? existingSlot : slots.length) + 1;

      await db.execute(`
        UPDATE appointments
        SET
        arrivedAt = ?,
        slot = ?
        WHERE uuid = ?
      `, [
        new Date(req.body.arrivedAt),
        slot,
        req.params.uuid,
      ]);
    }

    const appointment = await getAppointment(req.params.uuid);
    if (!appointment) return res.sendStatus(404);

    if (req.body.testResult) await sendResultNotifications(appointment);

    res.send(appointment);
  },
);

router.get(
  '/',
  validateQuerySubset(['start', 'end'], windowSchema),
  async (req, res) => {
    const [appointments] = await db.execute(`
      SELECT
        uuid, time, nameGiven, nameFamily, address, dateOfBirth,
        email, phoneMobile, phoneLandline, arrivedAt, testStartedAt, testResult,
        needsCertificate, marked, slot, createdAt, updatedAt, reportedAt, invalidatedAt
      FROM appointments WHERE time >= ? AND time <= ? ORDER BY time, createdAt
    `, [
      new Date(req.query.start),
      new Date(req.query.end),
    ]);

    res.send(appointments);
  },
);
