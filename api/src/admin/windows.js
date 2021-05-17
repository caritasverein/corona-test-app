import Router from 'express-promise-router';

import {
  validateProperties,
  validateBodySubset,
  windowSchema,
} from '../schema.js';
import db from '../db.js';

const router = new Router();
export const windowsRouter = router;

router.post(
  '/',
  validateBodySubset([
    'start',
    'end',
    'numQueues',
    'appointmentDuration',
    'externalRef',
  ], windowSchema),
  async (req, res)=>{
    const [existing] = await db.query(`
        SELECT start FROM windows
          WHERE start < ? AND end > ?;
      `,
      [
        new Date(req.body.end),
        new Date(req.body.start),
      ],
    );
    if (existing.length) return res.send(409);

    const [ins] = await db.execute(`
        INSERT INTO windows (start, end, numQueues, appointmentDuration, externalRef)
          VALUES (?, ?, ?, ?, ?);
      `,
      [
        new Date(req.body.start),
        new Date(req.body.end),
        parseInt(req.body.numQueues),
        parseInt(req.body.appointmentDuration),
        req.body.externalRef,
      ],
    );

    res.status(201).send({id: ins.insertId});
  },
);

router.delete(
  '/:id',
  validateProperties('params', {
    // express params are always strings so remember to cast accordingly
    id: {type: 'string', pattern: '^[1-9][0-9]*$'},
  }),
  async (req, res)=>{
    await db.execute(`
        DELETE FROM windows WHERE id=?;
      `,
      [parseInt(req.params.id)],
    );

    res.sendStatus(204);
  },
);
