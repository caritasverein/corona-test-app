import Router from 'express-promise-router';

import {
  validateProperties,
} from '../schema.js';
import db from '../db.js';

const router = new Router();
export const windowsRouter = router;

async function getWindows() {
  const [windows] = await db.execute(
    'SELECT id, start, end FROM windows WHERE end > NOW();',
  );
  return windows;
}

async function getWindowsAt(date) {
  const [windows] = await db.execute(
    'SELECT id, start, end, numQueues, appointmentDuration FROM windows WHERE DATE(start) = ? AND end > NOW();',
    [date],
  );
  return windows;
}

async function getOccupiedTimeslots(window) {
  const [times] = await db.execute(`
    SELECT
      from_unixtime(UNIX_TIMESTAMP(time) - UNIX_TIMESTAMP(time) MOD ?) as time,
      count(*) >= ? as full
    FROM appointments_valid
    WHERE time >= ? AND time <= ?
    GROUP BY
      UNIX_TIMESTAMP(time) DIV ?
  `, [
    parseInt(window.appointmentDuration),
    parseInt(window.numQueues),
    new Date(window.start),
    new Date(window.end),
    parseInt(window.appointmentDuration),
  ]);

  return times.filter((t)=>t.full);
}

function fillUnoccupiedTimeslots(window, occupied) {
  const occupationMap = Object.fromEntries(occupied.map(
    (o)=>[o.time.toISOString(), !!o.full],
  ));

  const start = new Date(window.start).getTime() / 1000;
  const end = new Date(window.end).getTime() / 1000;
  const duration = end-start;
  const numSlots = Math.floor(duration / window.appointmentDuration);
  const limit = new Date();
  limit.setMinutes(0, 0, 0);

  return new Array(numSlots)
    .fill(start)
    .map((start, i)=>start+i*window.appointmentDuration)
    .map((timeslot)=>{
      const time = new Date(timeslot*1000).toISOString();
      // object-injection not possible for ISO-formatted datetime
      // eslint-disable-next-line security/detect-object-injection
      return {time, full: occupationMap[time] || new Date(time) < new Date()};
    })
    .filter((timeslot) => new Date(timeslot.time) >= limit);
}

router.get(
  '/',
  async (req, res)=>{
    res.send(await getWindows());
  },
);

router.get(
  '/:date',
  validateProperties('params', {
    date: {type: 'string', format: 'date'},
  }),
  async (req, res)=>{
    const windows = await getWindowsAt(new Date(req.params.date));

    const windowTimes = await Promise.all(
      windows.map(async (window)=>{
        const occupied = await getOccupiedTimeslots(window);
        const times = fillUnoccupiedTimeslots(window, occupied);

        return {
          id: window.id,
          start: window.start,
          end: window.end,
          times,
        };
      }),
    );
    res.send(windowTimes);
  },
);
