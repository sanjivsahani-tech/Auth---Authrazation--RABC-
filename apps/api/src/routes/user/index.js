import { Router } from 'express';
import dashboardRoutes from './dashboard.js';
import resourceRoutes from './resources.js';

const router = Router();

// Why: User-facing operational endpoints are split from admin management concerns.
router.use('/', dashboardRoutes);
// Why: Resource CRUD routes are generated from a shared factory for consistency and maintainability, and are mounted under the same router for simplicity.
router.use('/', resourceRoutes);

export default router;
