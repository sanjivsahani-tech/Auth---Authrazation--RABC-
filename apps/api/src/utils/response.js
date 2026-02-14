export function ok(res, data, message = 'OK') {
  // Why: Success envelope stays consistent for frontend parsing and tooling.
  return res.json({ success: true, message, data });
}

export function fail(res, status, code, message, details = null) {
  // Why: Standard error payload reduces UI condition branching and logging ambiguity.
  return res.status(status).json({ success: false, code, message, details });
}
