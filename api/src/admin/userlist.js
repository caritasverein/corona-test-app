import Router from 'express-promise-router';
import {v4 as uuidv4} from 'uuid';

import db from '../db.js';
import {validateProperties} from '../schema.js';
const router = new Router();
export const userlistRouter = router;

import userlist, {groupedUserlist, grouplist} from '../userlist.js';

async function addAppointment(time, user) {
  const uuid = uuidv4();

  await db.execute(`
    INSERT INTO appointments (
      uuid, time, nameGiven, nameFamily, address, dateOfBirth,
      email, phoneMobile, phoneLandline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    uuid,
    new Date(time),
    user.nameGiven,
    user.nameFamily,
    user.address,
    user.dateOfBirth,
    user.email,
    user.phoneMobile,
    user.phoneLandline,
  ]);

  return uuid;
}

router.get(
  '/',
  validateProperties('query', {
    q: {
      'type': 'string',
      'minLength': 1,
      'maxLength': 250,
      'pattern': '^.+$',
      'regexp': {'pattern': '^\\p{L}[\\p{L} \'.-]*$', 'flags': 'u'},
    },
  }),
  async (req, res)=>{
    if (!userlist) return res.sendStatus(404);
    const qsplit = req.query.q.toLowerCase().split(' ');
    const match = userlist.filter((u)=>{
      const names = [...u.nameGiven.toLowerCase().split(' '), ...u.nameFamily.toLowerCase().split(' ')];
      return qsplit.every((q)=>names.some((n)=>n.startsWith(q)));
    });

    res.send(match.length === 1 ? match[0] : {
      nameGiven: '',
      nameFamily: '',
      address: '',
      dateOfBirth: '',
      phoneMobile: '',
      phoneLandline: '',
      email: '',
    });
  },
);

router.get(
  '/groups',
  async (req, res)=>{
    res.send(Object.keys(grouplist));
  },
);

router.post(
  '/testgroup',
  validateProperties('body', {
    name: {
      'type': 'string',
      'minLength': 1,
      'maxLength': 250,
      'pattern': '^.*$',
    },
    time: {
      'type': 'string',
      'format': 'date-time',
    },
  }),
  async (req, res) => {
    const group = groupedUserlist[req.body.name];
    if (!group) return res.send([]);

    const addingUuids = group.map((user)=>addAppointment(new Date(req.body.time), user));
    res.send(await Promise.all(addingUuids));
  },
);
