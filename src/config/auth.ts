import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './database';
import { env } from './env';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET || 'your-secret-key-change-in-production',
  baseURL: env.BETTER_AUTH_URL || `http://localhost:${env.PORT}`,
  basePath: '/api/auth',

  emailAndPassword: {
    enabled: true,
    autoSignUpOnSignIn: true,
  },

  socialProviders: {
    // Add social providers here if needed
    // github: {
    //   clientId: env.GITHUB_CLIENT_ID,
    //   clientSecret: env.GITHUB_CLIENT_SECRET,
    // },
  },

  plugins: [],
});
