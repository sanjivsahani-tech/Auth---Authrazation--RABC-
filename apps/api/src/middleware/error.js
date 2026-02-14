import { fail } from '../utils/response.js';

export function notFound(_req, res) {
  // Why: Unknown routes should return a normalized API error contract.
  return fail(res, 404, 'NOT_FOUND', 'Route not found');
}

export function errorHandler(err, _req, res, _next) {
  // Why: Surface validation failures as client errors, not generic 500 responses.
  if (err.name === 'ValidationError') {
    return fail(res, 400, 'VALIDATION_ERROR', err.message);
  }

  // Why: Mongo duplicate-key errors are mapped to stable conflict responses for frontend handling.
  if (err.code === 11000) {
    const key = Object.keys(err.keyPattern || {})[0] || 'unique';
    return fail(res, 409, 'CONFLICT', `${key} already exists`);
  }

  return fail(res, err.status || 500, err.code || 'INTERNAL_ERROR', err.message || 'Server error');
}
