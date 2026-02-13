import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Missing token' });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).populate('roleIds').lean();
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid user' });
    }

    const permissionSet = new Set(
      (user.roleIds || []).flatMap((role) => role.permissionKeys || []),
    );
    req.user = { ...user, permissions: Array.from(permissionSet) };
    return next();
  } catch {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}