import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(payload) {
  // Why: Short-lived access token limits blast radius if token is leaked.
  return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.accessTokenTtl });
}

export function signRefreshToken(payload) {
  // Why: Refresh secret is separated from access secret to isolate compromise domains.
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: `${env.refreshTokenTtlDays}d` });
}

export function verifyAccessToken(token) {
  // Behavior: Throws on expiry/signature mismatch so middleware can return 401.
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}
