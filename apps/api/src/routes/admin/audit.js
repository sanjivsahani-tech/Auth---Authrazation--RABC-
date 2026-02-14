import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { parseListQuery } from '../../utils/pagination.js';
import { AuditLog } from '../../models/AuditLog.js';

const router = Router();

router.get(
  '/audit-logs',
  requireAuth,
  requirePermission('audit:view'),
  asyncHandler(async (req, res) => {
    // Why: Audit list supports free-text filtering so admins can quickly trace actions.
    const { page, limit, skip, sort, search } = parseListQuery(req.query);
    const filter = search
      ? {
          $or: [
            { module: { $regex: search, $options: 'i' } },
            { action: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort(sort).skip(skip).limit(limit).populate('actorUserId', 'name email').lean(),
      AuditLog.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { items, pagination: { page, limit, total } } });
  }),
);

export default router;
