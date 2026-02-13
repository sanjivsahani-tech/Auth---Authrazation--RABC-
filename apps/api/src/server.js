import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { seedSystemData } from './seed/systemSeed.js';
import { createApp } from './app.js';

async function bootstrap() {
  await connectDb();
  await seedSystemData();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });
}

bootstrap();
