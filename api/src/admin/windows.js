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
  ], windowSchema),
  async (req, res)=>{
    const [ins] = await db.execute(`
        INSERT INTO windows (start, end, numQueues, appointmentDuration)
          VALUES (?, ?, ?, ?);
      `,
      [
        new Date(req.body.start),
        new Date(req.body.end),
        parseInt(req.body.numQueues),
        parseInt(req.body.appointmentDuration),
      ],
    );

    res.send(201, {id: ins.insertId});
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
