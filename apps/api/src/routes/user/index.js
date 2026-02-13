import { Router } from 'express';
import dashboardRoutes from './dashboard.js';
import resourceRoutes from './resources.js';

const router = Router();

router.use('/', dashboardRoutes);
router.use('/', resourceRoutes);

export default router;
