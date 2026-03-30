import { createHmac } from 'crypto';
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { paymentsService } from '../../services/payments.service';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { sendSuccess } from '../../utils/apiResponse';
import { prisma } from '../../config/database';

const router = Router();

// ============================================
// STRIPE PAYMENT ROUTES
// ============================================

const createCheckoutSessionSchema = z
  .object({
    plan: z.enum(['monthly', 'yearly']),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  })
  .strict();

const cancelSubscriptionSchema = z
  .object({
    cancelAtPeriodEnd: z.boolean().default(true),
  })
  .strict();

/**
 * POST /api/v1/payments/stripe/create-checkout-session
 * Create a Stripe checkout session for subscription
 * Requires authentication
 */
router.post(
  '/payments/stripe/create-checkout-session',
  authMiddleware,
  validate({ body: createCheckoutSessionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.authUser!.id;
    const {
      plan,
      successUrl = `${env.CORS_ORIGIN}/payment/success`,
      cancelUrl = `${env.CORS_ORIGIN}/payment/cancel`,
    } = req.body;

    const result = await paymentsService.createStripeCheckoutSession(
      userId,
      plan,
      successUrl,
      cancelUrl
    );

    sendSuccess(res, result);
  })
);

/**
 * GET /api/v1/payments/stripe/subscription-status
 * Get subscription status for current user
 * Requires authentication
 */
router.get(
  '/payments/stripe/subscription-status',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.authUser!.id;
    const status = await paymentsService.getSubscriptionStatus(userId);
    sendSuccess(res, status);
  })
);

/**
 * POST /api/v1/payments/stripe/cancel-subscription
 * Cancel user's subscription
 * Requires authentication
 */
router.post(
  '/payments/stripe/cancel-subscription',
  authMiddleware,
  validate({ body: cancelSubscriptionSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.authUser!.id;
    const { cancelAtPeriodEnd } = req.body;

    const subscription = await paymentsService.cancelSubscription(userId, cancelAtPeriodEnd);

    sendSuccess(res, subscription);
  })
);

/**
 * POST /api/v1/payments/stripe/webhook
 * Handle Stripe webhook events
 * Raw body required for signature verification
 */
router.post(
  '/payments/stripe/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    // For raw body handling in the webhook
    let rawBody: Buffer | string = '';

    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      // If body is parsed as JSON, we need to stringify it
      rawBody = JSON.stringify(req.body);
    }

    if (!signature || !rawBody) {
      res.status(400).json({ error: 'Missing signature or body' });
      return;
    }

    try {
      const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody;
      const event = stripe.webhooks.constructEvent(
        bodyBuffer,
        signature,
        env.STRIPE_WEBHOOK_SECRET
      );

      const result = await paymentsService.handleStripeWebhook(event);

      sendSuccess(res, result);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      res.status(400).json({ error: 'Webhook signature verification failed' });
    }
  })
);

// ============================================
// SSLCOMMERZ PAYMENT ROUTES (Alternative Payment)
// ============================================

const sslInitSchema = z
  .object({
    amount: z.number().positive(),
    currency: z.string().default('BDT'),
    plan: z.enum(['monthly', 'yearly']),
  })
  .strict();

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
  })
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
      res
        .status(400)
        .json({ error: { code: 'BAD_REQUEST', message: 'Missing transaction payload' } });
      return;
    }

    const expected = createHmac('sha256', env.SSLC_STORE_PASSWORD)
      .update(payload.tran_id)
      .digest('hex');

    if (expected !== payload.verify_sign) {
      res
        .status(400)
        .json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid IPN signature' } });
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
  })
);

router.get('/payments/sslcommerz/success', (_req, res) =>
  sendSuccess(res, { status: 'processing' })
);
router.get('/payments/sslcommerz/fail', (_req, res) => sendSuccess(res, { status: 'failed' }));
router.get('/payments/sslcommerz/cancel', (_req, res) => sendSuccess(res, { status: 'canceled' }));

export default router;
