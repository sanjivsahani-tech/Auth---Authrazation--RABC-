import crypto from 'crypto';

export function makeOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}