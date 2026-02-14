import { Router } from 'express';
import authRoutes from './auth.js';
import managementRoutes from './management.js';
import auditRoutes from './audit.js';

const router = Router();

// Why: Admin endpoints are grouped for governance operations and privileged actions.
router.use('/auth', authRoutes);
router.use('/', managementRoutes);
router.use('/', auditRoutes);

export default router;
