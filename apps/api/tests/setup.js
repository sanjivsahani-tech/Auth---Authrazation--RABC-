import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Why: In-memory MongoDB keeps tests isolated and deterministic without external DB dependency.
const mongoServer = await MongoMemoryServer.create();
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = mongoServer.getUri();
process.env.JWT_ACCESS_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';
process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:5174';
process.env.SUPERADMIN_EMAIL = 'admin@example.com';
process.env.SUPERADMIN_PASSWORD = 'Admin@123456';
process.env.SUPERADMIN_NAME = 'Super Admin';
process.env.COOKIE_SECURE = 'false';

afterAll(async () => {
  // Behavior: Always release DB resources so test runner can exit cleanly.
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
