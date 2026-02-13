export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'UNAUTHORIZED', message: 'Unauthorized' });
    }

    if (!req.user.permissions.includes(permission)) {
      return res
        .status(403)
        .json({ success: false, code: 'FORBIDDEN', message: `Missing permission: ${permission}` });
    }

    return next();
  };
}