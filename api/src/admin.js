import Router from 'express-promise-router';

import {appointmentRouter} from './admin/appointments.js';
import {windowsRouter} from './admin/windows.js';
import {reportRouter} from './admin/report.js';
import {userlistRouter} from './admin/userlist.js';

const router = new Router();
export const adminRouter = router;

router.use('/appointments', appointmentRouter);
router.use('/windows', windowsRouter);
router.use('/report', reportRouter);
router.use('/userlist', userlistRouter);

router.get('/me', (req, res)=>{
  res.send(req.oidc.user);
});
