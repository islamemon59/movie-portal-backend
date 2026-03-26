import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env';
import { prisma } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import usersRouter from './modules/users/user.routes';
import moviesRouter from './modules/movies/movie.routes';

const app: Express = express();

// Middleware
app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Routes
app.use('/api/auth', authRouter);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
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
    },
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
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
