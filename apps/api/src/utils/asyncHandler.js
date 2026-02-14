// Why: Wrap async route handlers once to avoid repetitive try/catch in every route.
// Behavior: Any thrown error is forwarded to Express error middleware.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
