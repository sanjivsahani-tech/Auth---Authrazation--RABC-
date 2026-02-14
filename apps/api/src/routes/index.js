import { Router } from 'express';
import adminRoutes from './admin/index.js';
import userRoutes from './user/index.js';

const router = Router();

// Why: One API surface serves both admin and user clients while sharing backend services.
router.use('/', adminRoutes);
// Why: User-facing operational endpoints are split from admin management concerns, but still share the same router for simplicity since they use the same auth and error handling middleware.
router.use('/', userRoutes);

export default router;
