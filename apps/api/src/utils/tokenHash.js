import crypto from 'crypto';

export function makeOpaqueToken() {
  // Why: Opaque random value avoids embedding user claims in refresh token payload.
  return crypto.randomBytes(48).toString('hex');
}

export function hashToken(raw) {
  // Why: Hashing refresh token before DB storage reduces damage from data exposure.
  return crypto.createHash('sha256').update(raw).digest('hex');
}
