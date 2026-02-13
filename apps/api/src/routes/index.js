import { Router } from 'express';
import adminRoutes from './admin/index.js';
import userRoutes from './user/index.js';

const router = Router();

router.use('/', adminRoutes);
router.use('/', userRoutes);

export default router;
