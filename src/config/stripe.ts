import Stripe from 'stripe';
import { env } from './env';

export const stripe = new Stripe(env.STRIPE_API_KEY, {
  typescript: true,
});

// Stripe pricing configuration
export const STRIPE_PRICING = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_dev',
    amount: 999, // $9.99 in cents
    currency: 'usd',
    interval: 'month',
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_dev',
    amount: 9999, // $99.99 in cents
    currency: 'usd',
    interval: 'year',
  },
};
