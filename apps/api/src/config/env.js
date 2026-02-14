import dotenv from 'dotenv';

// Why: Load runtime configuration from .env before any module reads process.env.
dotenv.config();

const required = ['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  // Why: Fail fast on startup if critical secrets/connection strings are missing.
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7),
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean),
  superAdminEmail: process.env.SUPERADMIN_EMAIL,
  superAdminPassword: process.env.SUPERADMIN_PASSWORD,
  superAdminName: process.env.SUPERADMIN_NAME || 'Super Admin',
  cookieSecure: String(process.env.COOKIE_SECURE || 'false') === 'true',
};
