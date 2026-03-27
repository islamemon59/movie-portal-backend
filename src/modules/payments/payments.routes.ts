import { createHmac, timingSafeEqual } from 'crypto';
import { Router } from 'express';
import { SubscriptionStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { sendSuccess } from '../../utils/apiResponse';

const router = Router();

const stripeCheckoutSchema = z
  .object({
    plan: z.enum(['monthly', 'yearly']),
  })
  .strict();

const sslInitSchema = z
  .object({
    amount: z.number().positive(),
    currency: z.string().default('BDT'),
    plan: z.enum(['monthly', 'yearly']),
  })
  .strict();

const toSafeBuffer = (value: string) => Buffer.from(value, 'utf8');

const verifyHmac = (payload: string, signature: string, secret: string): boolean => {
  const digest = createHmac('sha256', secret).update(payload).digest('hex');
  const left = toSafeBuffer(digest);
  const right = toSafeBuffer(signature);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
};

router.post(
  '/payments/stripe/create-checkout-session',
  authMiddleware,
  validate({ body: stripeCheckoutSchema }),
  asyncHandler(async (req, res) => {
    // Real Stripe checkout session creation should call Stripe SDK.
    // We return a deterministic server-side intent and wait for webhook confirmation.
    const intent = await prisma.paymentEvent.create({
      data: {
        provider: 'STRIPE',
        externalEventId: `checkout_intent_${req.authUser!.id}_${Date.now()}`,
        userId: req.authUser!.id,
        eventType: 'CHECKOUT_CREATED',
        payload: { plan: req.body.plan },
      },
    });

    sendSuccess(res, {
      checkoutSessionId: intent.externalEventId,
      status: 'created',
      message: 'Use Stripe hosted checkout on the frontend and rely on webhook confirmation.',
    });
  }),
);

router.post(
  '/payments/stripe/webhook',
  asyncHandler(async (req, res) => {
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body ?? {});
    const signature = req.header('stripe-signature') || '';

    if (!signature || !verifyHmac(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)) {
      res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid Stripe signature' } });
      return;
    }

    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      data?: { object?: { customer?: string; subscription?: string; metadata?: { userId?: string } } };
    };

    const existing = await prisma.paymentEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: 'STRIPE',
          externalEventId: event.id,
        },
      },
    });

    if (existing?.processedAt) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    const userId = event.data?.object?.metadata?.userId;

    const paymentEvent = await prisma.paymentEvent.upsert({
      where: {
        provider_externalEventId: {
          provider: 'STRIPE',
          externalEventId: event.id,
        },
      },
      create: {
        provider: 'STRIPE',
        externalEventId: event.id,
        userId,
        eventType: event.type,
        payload: event as unknown as object,
        processedAt: new Date(),
      },
      update: {
        eventType: event.type,
        payload: event as unknown as object,
        processedAt: new Date(),
      },
    });

    if (userId && (event.type === 'checkout.session.completed' || event.type === 'invoice.paid')) {
      const providerSubscriptionId = event.data?.object?.subscription;
      const existing = await prisma.subscription.findFirst({
        where: {
          provider: 'STRIPE',
          ...(providerSubscriptionId ? { providerSubscriptionId } : { userId }),
        },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: SubscriptionStatus.ACTIVE,
            providerCustomerId: event.data?.object?.customer,
            providerSubscriptionId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            provider: 'STRIPE',
            status: SubscriptionStatus.ACTIVE,
            providerCustomerId: event.data?.object?.customer,
            providerSubscriptionId,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paymentEvents: {
              connect: { id: paymentEvent.id },
            },
          },
        });
      }
    }

    res.status(200).json({ received: true });
  }),
);

router.post(
  '/payments/sslcommerz/init',
  authMiddleware,
  validate({ body: sslInitSchema }),
  asyncHandler(async (req, res) => {
    const transactionId = `sslc_${req.authUser!.id}_${Date.now()}`;

    await prisma.paymentEvent.create({
      data: {
        provider: 'SSLCOMMERZ',
        externalEventId: transactionId,
        userId: req.authUser!.id,
        eventType: 'PAYMENT_INIT',
        payload: {
          amount: req.body.amount,
          currency: req.body.currency,
          plan: req.body.plan,
        },
      },
    });

    sendSuccess(res, {
      transactionId,
      successUrl: env.SSLC_SUCCESS_URL,
      failUrl: env.SSLC_FAIL_URL,
      cancelUrl: env.SSLC_CANCEL_URL,
      ipnUrl: env.SSLC_IPN_URL,
    });
  }),
);

router.post(
  '/payments/sslcommerz/ipn',
  asyncHandler(async (req, res) => {
    const payload = req.body as {
      tran_id?: string;
      status?: string;
      value_a?: string;
      verify_sign?: string;
    };

    if (!payload?.tran_id || !payload.verify_sign) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Missing transaction payload' } });
      return;
    }

    const expected = createHmac('sha256', env.SSLC_STORE_PASSWORD)
      .update(payload.tran_id)
      .digest('hex');

    if (expected !== payload.verify_sign) {
      res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid IPN signature' } });
      return;
    }

    const payment = await prisma.paymentEvent.upsert({
      where: {
        provider_externalEventId: {
          provider: 'SSLCOMMERZ',
          externalEventId: payload.tran_id,
        },
      },
      create: {
        provider: 'SSLCOMMERZ',
        externalEventId: payload.tran_id,
        userId: payload.value_a,
        eventType: payload.status ?? 'UNKNOWN',
        payload: payload as unknown as object,
        processedAt: new Date(),
      },
      update: {
        eventType: payload.status ?? 'UNKNOWN',
        payload: payload as unknown as object,
        processedAt: new Date(),
      },
    });

    if (payload.status === 'VALID' && payload.value_a) {
      await prisma.subscription.create({
        data: {
          userId: payload.value_a,
          provider: 'SSLCOMMERZ',
          status: 'ACTIVE',
          providerSubscriptionId: payload.tran_id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentEvents: {
            connect: { id: payment.id },
          },
        },
      });
    }

    res.status(200).json({ received: true });
  }),
);

router.get('/payments/sslcommerz/success', (_req, res) => sendSuccess(res, { status: 'processing' }));
router.get('/payments/sslcommerz/fail', (_req, res) => sendSuccess(res, { status: 'failed' }));
router.get('/payments/sslcommerz/cancel', (_req, res) => sendSuccess(res, { status: 'canceled' }));

export default router;
