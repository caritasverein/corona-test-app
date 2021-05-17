import Router from 'express-promise-router';

import {mailReport} from '../report.js';

const router = new Router();
export const reportRouter = router;

router.get(
  '/all',
  async (req, res)=>{
    await mailReport();

    res.sendStatus(200);
  },
);
