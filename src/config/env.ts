import dotenv from 'dotenv';

dotenv.config();

export interface Env {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGIN: string;
}

export const env: Env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/movie_portal',
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: (process.env.NODE_ENV || 'development') as Env['NODE_ENV'],
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'dev-secret-key',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};
