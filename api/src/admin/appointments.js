import Router from 'express-promise-router';
import { v4 as uuidv4 } from 'uuid';

import {
  validateParamSubset,
  validateBodySubset,
  validateQuerySubset,
  validate,
  windowSchema,
  appointmentTestSchema,
} from '../schema.js';
import db from '../db.js';
import { getAppointment } from '../user/appointments.js';
import {
  sendResultNotifications,
} from '../notifications.js';

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

    res.status(201).send({ uuid });
  },
);

router.patch(
  '/:uuid',
  validateParamSubset(['uuid']),
  validate({ 'body': appointmentTestSchema }),
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


    if (req.body.onSite !== undefined) {

      const [slots] = await db.query(`
        SELECT 
          slot
        FROM
          \`appointments\`
        WHERE
          \`appointments\`.\`onSite\` = 'true'
          AND 
          \`appointments\`.\`testResult\` IS NULL
          AND 
            DATE(\`appointments\`.\`time\`) = CURDATE()
        ORDER BY slot ASC;
      `);

      const newSlot = slots.findIndex((slot, index) => slot.slot !== index + 1) + 1

      await db.execute(`
        UPDATE appointments
        SET
        onSite = ?,
        slot = ?
        WHERE uuid = ?
      `, [
        req.body.onSite,
        (newSlot ? newSlot : slots.length + 1),
        req.params.uuid,
      ]);
    }

    const appointment = await getAppointment(req.params.uuid);
    if (!appointment) return res.sendStatus(404);

    if (appointment.testResult) await sendResultNotifications(appointment);

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
        email, phoneMobile, phoneLandline, testStartedAt, testResult,
        needsCertificate, marked, onSite, slot, createdAt, invalidatedAt
      FROM appointments WHERE time >= ? AND time <= ? ORDER BY time, createdAt
    `, [
      new Date(req.query.start),
      new Date(req.query.end),
    ]);

    const ids = [];

    appointments.forEach((t) => {
      const time = new Date(t.time);
      const newId = time.getMinutes() + (time.getHours() * 60);
      const additionals = ids.filter((id) => id === newId).length + 1;
      ids.push(newId);
      t.id = newId + '-' + additionals;
    });

    res.send(appointments);
  },
);
