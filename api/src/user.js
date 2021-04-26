import Router from 'express-promise-router';

import {appointmentRouter} from './user/appointments.js';
import {windowsRouter} from './user/windows.js';

const router = new Router();
export const userRouter = router;

router.use('/appointments', appointmentRouter);
router.use('/windows', windowsRouter);
