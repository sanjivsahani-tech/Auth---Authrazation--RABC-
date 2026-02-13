export function ok(res, data, message = 'OK') {
  return res.json({ success: true, message, data });
}

export function fail(res, status, code, message, details = null) {
  return res.status(status).json({ success: false, code, message, details });
}