import Router from 'express-promise-router';

import {appointmentRouter} from './admin/appointments.js';
import {windowsRouter} from './admin/windows.js';

const router = new Router();
export const adminRouter = router;

router.use('/appointments', appointmentRouter);
router.use('/windows', windowsRouter);

router.get('/me', (req, res)=>{
  res.send(req.oidc.user);
});
