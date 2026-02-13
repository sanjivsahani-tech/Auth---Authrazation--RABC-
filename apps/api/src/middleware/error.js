import { fail } from '../utils/response.js';

export function notFound(_req, res) {
  return fail(res, 404, 'NOT_FOUND', 'Route not found');
}

export function errorHandler(err, _req, res, _next) {
  if (err.name === 'ValidationError') {
    return fail(res, 400, 'VALIDATION_ERROR', err.message);
  }

  if (err.code === 11000) {
    const key = Object.keys(err.keyPattern || {})[0] || 'unique';
    return fail(res, 409, 'CONFLICT', `${key} already exists`);
  }

  return fail(res, err.status || 500, err.code || 'INTERNAL_ERROR', err.message || 'Server error');
}