import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { env } from './env';

type GlobalPrismaState = {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

const globalForPrisma = globalThis as unknown as GlobalPrismaState;

const pgPool =
  globalForPrisma.pgPool ||
  new Pool({
    connectionString: env.DATABASE_URL,
  });

const adapter = new PrismaPg(pgPool);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pgPool;
}
