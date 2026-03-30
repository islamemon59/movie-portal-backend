import dotenv from 'dotenv';

dotenv.config();

export interface Env {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGIN: string;
  STRIPE_API_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  SSLC_STORE_ID: string;
  SSLC_STORE_PASSWORD: string;
  SSLC_SUCCESS_URL: string;
  SSLC_FAIL_URL: string;
  SSLC_CANCEL_URL: string;
  SSLC_IPN_URL: string;
}

export const env: Env = {
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_CtUzQqd9Ob1w@ep-lively-poetry-a8ciehq1-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require',
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: (process.env.NODE_ENV || 'development') as Env['NODE_ENV'],
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'dev-secret-key',
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  STRIPE_API_KEY: process.env.STRIPE_API_KEY || 'sk_test_fake_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'stripe-webhook-dev-secret',
  SSLC_STORE_ID: process.env.SSLC_STORE_ID || 'sandbox-store-id',
  SSLC_STORE_PASSWORD: process.env.SSLC_STORE_PASSWORD || 'sandbox-store-password',
  SSLC_SUCCESS_URL: process.env.SSLC_SUCCESS_URL || 'http://localhost:3000/payment/success',
  SSLC_FAIL_URL: process.env.SSLC_FAIL_URL || 'http://localhost:3000/payment/fail',
  SSLC_CANCEL_URL: process.env.SSLC_CANCEL_URL || 'http://localhost:3000/payment/cancel',
  SSLC_IPN_URL: process.env.SSLC_IPN_URL || 'http://localhost:3000/api/v1/payments/sslcommerz/ipn',
};
