import { AuditLog } from '../models/AuditLog.js';

export async function logAudit(req, { module, action, entityId, before, after }) {
  try {
    // Why: Audit records create an immutable operational trail for sensitive changes.
    await AuditLog.create({
      actorUserId: req.user?._id,
      module,
      action,
      entityId: entityId ? String(entityId) : undefined,
      before,
      after,
      meta: {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
        route: req.originalUrl,
        method: req.method,
      },
    });
  } catch {
    // Why: Business action should not fail only because audit persistence failed.
    // Best-effort logging only.
  }
}
