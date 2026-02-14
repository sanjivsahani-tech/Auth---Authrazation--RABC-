import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { seedSystemData } from './seed/systemSeed.js';
import { createApp } from './app.js';

async function bootstrap() {
  // Why: DB connection is required before accepting API traffic.
  await connectDb();
  // Why: System role seeding is idempotent and guarantees baseline RBAC availability.
  await seedSystemData();
  const app = createApp();
  // Behavior: Server starts only after core dependencies are ready.
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });
}

bootstrap();
