import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { env } from './config/env';
import { prisma } from './config/database';
import { globalErrorHandler, NotFoundError } from './utils/globalErrorHandler';
import authRouter from './routes/auth';
import usersRouter from './modules/users/user.routes';
import moviesRouter from './modules/movies/movie.routes';
import titlesRouter from './modules/titles/titles.routes';
import reviewsRouter from './modules/reviews/reviews.routes';
import likesRouter from './modules/likes/likes.routes';
import commentsRouter from './modules/comments/comments.routes';
import watchlistRouter from './modules/watchlist/watchlist.routes';
import paymentsRouter from './modules/payments/payments.routes';
import adminRouter from './modules/admin/admin.routes';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { apiRateLimiter, authRateLimiter, writeRateLimiter } from './config/rateLimit';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(requestIdMiddleware);
app.use(morgan('dev'));
app.use('/api', apiRateLimiter);

// Stripe webhook requires raw body for signature verification.
app.use('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Routes
app.use('/api/v1/auth', authRateLimiter, authRouter);
app.use('/api/auth', authRateLimiter, authRouter);

// Health check route
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// API Routes
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/movies', moviesRouter);
app.use('/api/v1', writeRateLimiter, reviewsRouter);
app.use('/api/v1', writeRateLimiter, commentsRouter);
app.use('/api/v1', titlesRouter);
app.use('/api/v1', likesRouter);
app.use('/api/v1', watchlistRouter);
app.use('/api/v1', paymentsRouter);
app.use('/api/v1', adminRouter);

// Legacy routes kept for backward compatibility
app.use('/api/users', usersRouter);
app.use('/api/movies', moviesRouter);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Movie Portal Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      movies: '/api/movies',
      v1: '/api/v1',
    },
  });
});

// Error handling middleware
app.use(globalErrorHandler);

// 404 handler
app.use((_req: Request, _res: Response, next) => {
  const error = new NotFoundError('Route');
  next(error);
});

const PORT = env.PORT;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connection successful');

    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Environment: ${env.NODE_ENV}`);
      console.log(`✓ API Documentation: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
export { startServer };
