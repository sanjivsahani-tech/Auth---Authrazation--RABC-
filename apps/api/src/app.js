import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/error.js';

export function createApp() {
  const app = express();

  // Why: Helmet sets secure HTTP headers to reduce common web attack surface.
  app.use(helmet());
  app.use(
    cors({
      // Why: API must only accept browser origins that are explicitly allowed.
      // Risk: Open CORS policy can expose authenticated cookie flows to untrusted origins.
      origin: (origin, cb) => {
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Why: Auth endpoints are brute-force targets and should be rate-limited separately.
  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/refresh', authLimiter);
  app.use('/api/v1', routes);

  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'healthy' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
