import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { User } from '../../models/User.js';
import { RefreshToken } from '../../models/RefreshToken.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { makeOpaqueToken, hashToken } from '../../utils/tokenHash.js';
import { signAccessToken } from '../../utils/jwt.js';
import { env } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { logAudit } from '../../utils/audit.js';
import { Role } from '../../models/Role.js';
import { SYSTEM_ROLES } from '../../constants.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const adminSignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(3),
  password: z.string().min(6),
});

async function getSuperAdminRole() {
  // Why: First signup flow must always bind to the system SuperAdmin role.
  return Role.findOne({ name: SYSTEM_ROLES.SUPERADMIN });
}

async function hasAnyAdmin() {
  // Why: Signup gate depends on existence of at least one SuperAdmin user.
  const superRole = await getSuperAdminRole();
  if (!superRole) {
    return false;
  }
  const count = await User.countDocuments({ roleIds: superRole._id });
  return count > 0;
}

function cookieOptions() {
  // Why: Refresh token is cookie-based and should not be accessible from JS.
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: 'lax',
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  };
}

async function issueTokens(req, userId) {
  // Why: Refresh token is stored hashed so DB leaks cannot expose active sessions.
  const accessToken = signAccessToken({ sub: String(userId) });
  const rawRefreshToken = makeOpaqueToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);

  await RefreshToken.create({
    userId,
    tokenHash,
    userAgent: req.get('user-agent') || '',
    ip: req.ip,
    expiresAt,
  });

  return { accessToken, rawRefreshToken };
}

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    // Why: Enforce bootstrap order so system is initialized via first admin signup.
    if (!(await hasAnyAdmin())) {
      return res.status(403).json({
        success: false,
        code: 'SIGNUP_REQUIRED',
        message: 'Admin signup required before login',
      });
    }

    const parsed = loginSchema.parse(req.body);
    const user = await User.findOne({ email: parsed.email.toLowerCase() }).populate('roleIds');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const match = await comparePassword(parsed.password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' });
    }

    const { accessToken, rawRefreshToken } = await issueTokens(req, user._id);
    const permissions = Array.from(new Set(user.roleIds.flatMap((r) => r.permissionKeys || [])));

    res.cookie('refreshToken', rawRefreshToken, cookieOptions());
    await logAudit(req, { module: 'auth', action: 'login', entityId: user._id });

    return res.json({
      success: true,
      data: {
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          roleIds: user.roleIds.map((r) => r._id),
          permissions,
        },
      },
    });
  }),
);

router.get(
  '/admin-signup-status',
  asyncHandler(async (_req, res) => {
    const canSignup = !(await hasAnyAdmin());
    return res.json({ success: true, data: { canSignup } });
  }),
);

router.post(
  '/admin-signup',
  asyncHandler(async (req, res) => {
    // Why: Signup is intentionally one-time; subsequent attempts must be blocked.
    const payload = adminSignupSchema.parse(req.body);
    if (await hasAnyAdmin()) {
      return res.status(409).json({
        success: false,
        code: 'SIGNUP_CLOSED',
        message: 'Admin signup is closed',
      });
    }

    const superRole = await getSuperAdminRole();
    if (!superRole) {
      return res.status(500).json({
        success: false,
        code: 'ROLE_NOT_READY',
        message: 'SuperAdmin role is not available',
      });
    }

    if (await hasAnyAdmin()) {
      return res.status(409).json({
        success: false,
        code: 'SIGNUP_CLOSED',
        message: 'Admin signup is closed',
      });
    }

    const user = await User.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      password: await hashPassword(payload.password),
      roleIds: [superRole._id],
      isActive: true,
    });

    const populatedUser = await User.findById(user._id).populate('roleIds');
    const { accessToken, rawRefreshToken } = await issueTokens(req, populatedUser._id);
    const permissions = Array.from(
      new Set((populatedUser.roleIds || []).flatMap((role) => role.permissionKeys || [])),
    );

    res.cookie('refreshToken', rawRefreshToken, cookieOptions());
    await logAudit(req, { module: 'auth', action: 'signup', entityId: populatedUser._id });

    return res.status(201).json({
      success: true,
      data: {
        accessToken,
        user: {
          _id: populatedUser._id,
          name: populatedUser.name,
          email: populatedUser.email,
          phone: populatedUser.phone,
          roleIds: populatedUser.roleIds.map((r) => r._id),
          permissions,
        },
      },
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    // Behavior: Refresh token rotation revokes current token and issues a new one.
    const rawRefreshToken = req.cookies.refreshToken;
    if (!rawRefreshToken) {
      return res.status(401).json({ success: false, code: 'INVALID_REFRESH', message: 'Refresh token missing' });
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existing = await RefreshToken.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
    if (!existing) {
      return res.status(401).json({ success: false, code: 'INVALID_REFRESH', message: 'Refresh token invalid' });
    }

    existing.revokedAt = new Date();
    await existing.save();

    const user = await User.findById(existing.userId).populate('roleIds');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid user' });
    }

    const { accessToken, rawRefreshToken: newRaw } = await issueTokens(req, user._id);
    res.cookie('refreshToken', newRaw, cookieOptions());

    return res.json({ success: true, data: { accessToken } });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    // Why: Logout revokes refresh token so old browser session cannot mint new access tokens.
    const rawRefreshToken = req.cookies.refreshToken;
    if (rawRefreshToken) {
      await RefreshToken.updateOne({ tokenHash: hashToken(rawRefreshToken) }, { $set: { revokedAt: new Date() } });
    }

    res.clearCookie('refreshToken', cookieOptions());
    await logAudit(req, { module: 'auth', action: 'logout' });
    return res.json({ success: true, message: 'Logged out' });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    return res.json({
      success: true,
      data: {
        user: {
          _id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone,
          roleIds: req.user.roleIds.map((r) => r._id),
          permissions: req.user.permissions,
        },
      },
    });
  }),
);

router.post(
  '/force-logout/:userId',
  requireAuth,
  asyncHandler(async (req, res) => {
    await RefreshToken.updateMany({ userId: req.params.userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    return res.json({ success: true, message: 'All sessions revoked' });
  }),
);

export default router;
