import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDb() {
  // Why: Centralized DB bootstrap keeps connection lifecycle controlled in one place.
  await mongoose.connect(env.mongoUri);
  logger.info('MongoDB connected');
}
