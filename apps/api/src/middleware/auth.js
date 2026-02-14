import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  // Why: API trusts only bearer token from header for stateless authorization.
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  // if no token, short-circuit with 401 before any DB calls to save resources and avoid unnecessary load. Also prevents accidental public access if middleware is misconfigured.
  if (!token) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Missing token' });
  }

  try {
    // token validation includes signature and expiry checks; throws if invalid/expired.
    const decoded = verifyAccessToken(token);
    // Why: Token alone is not enough; user must still exist and be active.
    const user = await User.findById(decoded.sub).populate('roleIds').lean();
    // Behavior: User status is checked on every request to allow immediate revocation without waiting for token expiry.
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid user' });
    }

    // Behavior: Permissions are flattened once per request for fast route checks.
    const permissionSet = new Set(
      (user.roleIds || []).flatMap((role) => role.permissionKeys || []),
    );
    // Why: Attaching user info to req allows downstream handlers to make authz decisions without extra DB calls.
    // Note: We only attach necessary info (like permissions) to keep the token lightweight and avoid exposing sensitive data.
    req.user = { ...user, permissions: Array.from(permissionSet) };
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Invalid token' });
  }
}
