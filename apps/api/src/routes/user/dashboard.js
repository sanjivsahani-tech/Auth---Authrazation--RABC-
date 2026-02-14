import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { User } from '../../models/User.js';
import { Role } from '../../models/Role.js';
import { Product } from '../../models/Product.js';
import { Category } from '../../models/Category.js';
import { Customer } from '../../models/Customer.js';
import { Shelf } from '../../models/Shelf.js';
import { AuditLog } from '../../models/AuditLog.js';

const router = Router();

router.get(
  '/dashboard/summary',
  // Why: A single endpoint serves both apps; header selects admin vs user summary shape.
  // Behavior: Admin dashboard focuses on governance metrics and recent activity, while user dashboard focuses on business inventory/customer totals.
  requireAuth,
  // requirePermission for 'dashboard:view' ensures that only users with explicit permission can access the dashboard summary, which may contain sensitive information and should not be exposed to all authenticated users by default.
  requirePermission('dashboard:view'),
  // 
  asyncHandler(async (req, res) => {
    // Why: A single endpoint serves both apps; header selects admin vs user summary shape.
    const isAdminPanel = req.header('x-app-context') === 'admin';

    if (isAdminPanel) {
      // Behavior: Admin dashboard focuses on governance metrics and recent activity.
      const [userCount, roleCount, recentAudit] = await Promise.all([
        User.countDocuments(),
        Role.countDocuments(),
        AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
      ]);
      return res.json({ success: true, data: { userCount, roleCount, recentAudit } });
    }

    // Behavior: User dashboard focuses on business inventory/customer totals.
    const [products, categories, customers, shelves] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Customer.countDocuments(),
      Shelf.countDocuments(),
    ]);

    return res.json({ success: true, data: { products, categories, customers, shelves } });
  }),
);

export default router;
