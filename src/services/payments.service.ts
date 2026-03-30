import { SubscriptionStatus, PaymentProvider } from '@prisma/client';
import { prisma } from '../config/database';
import { stripe, STRIPE_PRICING } from '../config/stripe';
import { NotFoundError, AppError } from '../utils/globalErrorHandler';

export class PaymentsService {
  /**
   * Create a Stripe checkout session for subscription
   */
  async createStripeCheckoutSession(
    userId: string,
    plan: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const pricing = STRIPE_PRICING[plan];

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: user.email,
        client_reference_id: userId,
        line_items: [
          {
            price: pricing.priceId,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          plan,
        },
      });

      // Log the checkout session creation
      await prisma.paymentEvent.create({
        data: {
          provider: PaymentProvider.STRIPE,
          externalEventId: session.id,
          userId,
          eventType: 'checkout.session.created',
          payload: {
            sessionId: session.id,
            plan,
          },
        },
      });

      return {
        checkoutSessionId: session.id,
        url: session.url,
        status: 'created',
      };
    } catch (error: any) {
      throw new AppError(500, `Failed to create checkout session: ${error.message}`);
    }
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        provider: PaymentProvider.STRIPE,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        status: 'inactive',
        hasActiveSubscription: false,
      };
    }

    return {
      status: subscription.status,
      hasActiveSubscription: subscription.status === SubscriptionStatus.ACTIVE,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd = true) {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        provider: PaymentProvider.STRIPE,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription || !subscription.providerSubscriptionId) {
      throw new NotFoundError('Active subscription');
    }

    try {
      if (cancelAtPeriodEnd) {
        // Schedule cancellation at period end
        await stripe.subscriptions.update(subscription.providerSubscriptionId, {
          cancel_at_period_end: true,
        });

        return await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            cancelAtPeriodEnd: true,
            canceledAt: new Date(),
          },
        });
      } else {
        // Cancel immediately
        await stripe.subscriptions.cancel(subscription.providerSubscriptionId);

        return await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: SubscriptionStatus.CANCELED,
            canceledAt: new Date(),
          },
        });
      }
    } catch (error: any) {
      throw new AppError(500, `Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: any) {
    const { type, id, data } = event;

    // Check if event was already processed
    const existing = await prisma.paymentEvent.findUnique({
      where: {
        provider_externalEventId: {
          provider: PaymentProvider.STRIPE,
          externalEventId: id,
        },
      },
    });

    if (existing?.processedAt) {
      return { received: true, duplicate: true };
    }

    try {
      switch (type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(data.object);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCanceled(data.object);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(data.object);
          break;

        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(data.object);
          break;

        default:
          console.log(`Unhandled event type: ${type}`);
      }

      // Mark event as processed
      await prisma.paymentEvent.upsert({
        where: {
          provider_externalEventId: {
            provider: PaymentProvider.STRIPE,
            externalEventId: id,
          },
        },
        create: {
          provider: PaymentProvider.STRIPE,
          externalEventId: id,
          userId: event.data?.object?.metadata?.userId,
          eventType: type,
          payload: event,
          processedAt: new Date(),
        },
        update: {
          eventType: type,
          payload: event,
          processedAt: new Date(),
        },
      });

      return { received: true, processed: true };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Handle checkout.session.completed event
   */
  private async handleCheckoutSessionCompleted(session: any) {
    const userId = session.client_reference_id;

    if (!userId) return;

    // Subscription will be created by customer.subscription.created event
    // Just log for now
    await prisma.paymentEvent.create({
      data: {
        provider: PaymentProvider.STRIPE,
        externalEventId: `checkout_completed_${session.id}`,
        userId,
        eventType: 'checkout.session.completed',
        payload: { sessionId: session.id },
      },
    });
  }

  /**
   * Handle customer.subscription.created event
   */
  private async handleSubscriptionCreated(subscription: any) {
    const userId = subscription.metadata?.userId;

    if (!userId) return;

    await prisma.subscription.create({
      data: {
        userId,
        provider: PaymentProvider.STRIPE,
        status: SubscriptionStatus.ACTIVE,
        providerCustomerId: subscription.customer,
        providerSubscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        metadata: subscription,
      },
    });
  }

  /**
   * Handle customer.subscription.updated event
   */
  private async handleSubscriptionUpdated(subscription: any) {
    const subscription_record = await prisma.subscription.findFirst({
      where: {
        providerSubscriptionId: subscription.id,
        provider: PaymentProvider.STRIPE,
      },
    });

    if (!subscription_record) return;

    const newStatus = subscription.status === 'active' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAST_DUE;

    await prisma.subscription.update({
      where: { id: subscription_record.id },
      data: {
        status: newStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        metadata: subscription,
      },
    });
  }

  /**
   * Handle customer.subscription.deleted event
   */
  private async handleSubscriptionCanceled(subscription: any) {
    const subscription_record = await prisma.subscription.findFirst({
      where: {
        providerSubscriptionId: subscription.id,
        provider: PaymentProvider.STRIPE,
      },
    });

    if (!subscription_record) return;

    await prisma.subscription.update({
      where: { id: subscription_record.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        metadata: subscription,
      },
    });
  }

  /**
   * Handle invoice.paid event
   */
  private async handleInvoicePaid(invoice: any) {
    const subscription_record = await prisma.subscription.findFirst({
      where: {
        providerSubscriptionId: invoice.subscription,
        provider: PaymentProvider.STRIPE,
      },
    });

    if (!subscription_record) return;

    await prisma.subscription.update({
      where: { id: subscription_record.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      },
    });
  }

  /**
   * Handle invoice.payment_failed event
   */
  private async handleInvoicePaymentFailed(invoice: any) {
    const subscription_record = await prisma.subscription.findFirst({
      where: {
        providerSubscriptionId: invoice.subscription,
        provider: PaymentProvider.STRIPE,
      },
    });

    if (!subscription_record) return;

    await prisma.subscription.update({
      where: { id: subscription_record.id },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });
  }
}

export const paymentsService = new PaymentsService();
