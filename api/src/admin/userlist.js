import Router from 'express-promise-router';
import fs from 'fs';

import {validateProperties} from '../schema.js';
const router = new Router();
export const userlistRouter = router;

// eslint-disable-next-line security/detect-non-literal-fs-filename
const userlist = process.env.USERLIST_PATH ? JSON.parse(fs.readFileSync(process.env.USERLIST_PATH)) : false;

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
