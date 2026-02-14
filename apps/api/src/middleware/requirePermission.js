export function requirePermission(permission) {
  return (req, res, next) => {
    // Why: Permission checks must fail closed when auth middleware did not attach user.
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    // Why: UI hiding controls is not security; backend enforces every action.
    if (!req.user.permissions.includes(permission)) {
      return res
        .status(403)
        .json({ success: false, code: 'FORBIDDEN', message: `Missing permission: ${permission}` });
    }

    return next();
  };
}
