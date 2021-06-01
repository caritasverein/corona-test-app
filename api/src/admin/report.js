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

router.get(
  '/:date',
  async (req, res)=>{
    const date = new Date(req.params.date);
    if (isNaN(date)) return;

    await mailReport(false, date);

    res.sendStatus(200);
  },
);
