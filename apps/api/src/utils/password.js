import bcrypt from 'bcryptjs';

// Why: Cost factor 12 balances brute-force resistance with acceptable API latency.
const SALT_ROUNDS = 12;

export function hashPassword(password) {
  // Behavior: Stores one-way hash only; plaintext passwords are never persisted.
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password, passwordHash) {
  // Why: Centralized compare helper avoids inconsistent password verification paths.
  return bcrypt.compare(password, passwordHash);
}
