import { Router } from 'express';
import { z } from 'zod';
import { PERMISSIONS } from '../../constants.js';
import { SYSTEM_ROLES } from '../../constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { Role } from '../../models/Role.js';
import { User } from '../../models/User.js';
import { hashPassword } from '../../utils/password.js';
import { parseListQuery } from '../../utils/pagination.js';
import { logAudit } from '../../utils/audit.js';
import { RefreshToken } from '../../models/RefreshToken.js';

const router = Router();

const roleSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(''),
  permissionKeys: z.array(z.enum(PERMISSIONS)).min(1),
});

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  password: z.string().min(6),
  roleIds: z.array(z.string()).min(1),
});

router.get('/permissions', requireAuth, requirePermission('permissions:view'), (_req, res) => {
  return res.json({ success: true, data: { items: PERMISSIONS } });
});

router.post(
  '/roles',
  requireAuth,
  requirePermission('roles:create'),
  asyncHandler(async (req, res) => {
    const payload = roleSchema.parse(req.body);
    const role = await Role.create(payload);
    await logAudit(req, { module: 'roles', action: 'create', entityId: role._id, after: role.toObject() });
    return res.status(201).json({ success: true, data: role });
  }),
);

router.get(
  '/roles',
  requireAuth,
  requirePermission('roles:view'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip, sort, search } = parseListQuery(req.query);
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};
    const [items, total] = await Promise.all([
      Role.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Role.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { items, pagination: { page, limit, total } } });
  }),
);

router.patch(
  '/roles/:id',
  requireAuth,
  requirePermission('roles:update'),
  asyncHandler(async (req, res) => {
    const payload = roleSchema.partial().parse(req.body);
    const before = await Role.findById(req.params.id);
    if (!before) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Role not found' });
    }
    if (before.name === SYSTEM_ROLES.SUPERADMIN) {
      return res.status(400).json({
        success: false,
        code: 'ROLE_PROTECTED',
        message: 'SuperAdmin role cannot be edited',
      });
    }
    const role = await Role.findByIdAndUpdate(req.params.id, { $set: payload }, { returnDocument: 'after' });
    await logAudit(req, {
      module: 'roles',
      action: 'update',
      entityId: role._id,
      before: before.toObject(),
      after: role.toObject(),
    });
    return res.json({ success: true, data: role });
  }),
);

router.delete(
  '/roles/:id',
  requireAuth,
  requirePermission('roles:delete'),
  asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Role not found' });
    }
    if (role.isSystem) {
      return res.status(400).json({ success: false, code: 'BAD_REQUEST', message: 'System role cannot be deleted' });
    }
    await Role.deleteOne({ _id: role._id });
    await logAudit(req, { module: 'roles', action: 'delete', entityId: role._id, before: role.toObject() });
    return res.json({ success: true, message: 'Role deleted' });
  }),
);

router.post(
  '/users',
  requireAuth,
  requirePermission('users:create'),
  asyncHandler(async (req, res) => {
    const payload = userSchema.parse(req.body);
    const user = await User.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      password: await hashPassword(payload.password),
      roleIds: payload.roleIds,
      createdBy: req.user._id,
      isActive: true,
    });
    await logAudit(req, { module: 'users', action: 'create', entityId: user._id, after: user.toObject() });
    return res.status(201).json({ success: true, data: user });
  }),
);

router.get(
  '/users',
  requireAuth,
  requirePermission('users:view'),
  asyncHandler(async (req, res) => {
    const { page, limit, skip, sort, search } = parseListQuery(req.query);
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      User.find(filter).select('-password').populate('roleIds').sort(sort).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.json({ success: true, data: { items, pagination: { page, limit, total } } });
  }),
);

router.patch(
  '/users/:id',
  requireAuth,
  requirePermission('users:update'),
  asyncHandler(async (req, res) => {
    const payload = z
      .object({ name: z.string().min(2).optional(), phone: z.string().optional(), isActive: z.boolean().optional() })
      .parse(req.body);

    const before = await User.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: payload },
      { returnDocument: 'after' },
    )
      .select('-password')
      .populate('roleIds');

    await logAudit(req, { module: 'users', action: 'update', entityId: user._id, before, after: user.toObject() });
    return res.json({ success: true, data: user });
  }),
);

router.patch(
  '/users/:id/roles',
  requireAuth,
  requirePermission('roles:assign'),
  asyncHandler(async (req, res) => {
    const payload = z.object({ roleIds: z.array(z.string()) }).parse(req.body);
    if (payload.roleIds.length !== 1) {
      return res.status(400).json({
        success: false,
        code: 'ROLE_ASSIGNMENT_INVALID',
        message: 'Exactly one role is required',
      });
    }

    const targetUser = await User.findById(req.params.id).select('-password').populate('roleIds');
    if (!targetUser) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'User not found' });
    }
    const isSuperAdminUser = (targetUser.roleIds || []).some((role) => role?.name === SYSTEM_ROLES.SUPERADMIN);
    if (isSuperAdminUser) {
      return res.status(400).json({
        success: false,
        code: 'ROLE_PROTECTED',
        message: 'SuperAdmin user role cannot be changed',
      });
    }
    const before = targetUser.toObject();

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { roleIds: payload.roleIds } },
      { returnDocument: 'after' },
    )
      .select('-password')
      .populate('roleIds');

    await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    await logAudit(req, {
      module: 'roles',
      action: 'assign',
      entityId: user._id,
      before,
      after: user.toObject(),
    });

    return res.json({ success: true, data: user });
  }),
);

export default router;
