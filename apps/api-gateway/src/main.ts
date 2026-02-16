/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express, { NextFunction, Response } from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import morgan from 'morgan';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

app.use(morgan('dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());
app.set('trust proxy', 1);

//apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000 : 100), // 1000 requests per 15 minutes for authenticated users, 100 requests per 15 minutes for unauthenticated users
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => (req.user ? String(req.user) : ipKeyGenerator(req.ip ?? '', 56)),
});

app.use(limiter);

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to gateway!' });
});

// Connect auth service: /auth/* -> auth-service (strip /auth prefix). Handle connection errors.
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:6001';
app.use(
  '/auth',
  proxy(AUTH_SERVICE_URL, {
    proxyReqPathResolver: (req) => req.url?.replace(/^\/auth/, '') || '/',
    proxyErrorHandler: (err: any, res: Response, next: NextFunction) => {
      const isConnectionError =
        err?.code === 'ECONNREFUSED' ||
        err?.code === 'ECONNRESET' ||
        err?.name === 'AggregateError' ||
        (Array.isArray((err as any)?.errors) && (err as any).errors.some((e: any) => e?.code === 'ECONNREFUSED'));
      if (isConnectionError) {
        res.status(503).json({
          error: 'Auth service unavailable',
          message: 'The auth service is not running or not reachable. Ensure it is listening on port 6001.',
        });
        return;
      }
      next(err);
    },
  })
);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
