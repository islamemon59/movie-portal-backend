# Stripe Payment Integration Setup Guide

This guide explains how to set up and configure Stripe payment processing for the Movie Portal backend.

## Overview

The Movie Portal supports subscription-based access with two payment providers:
- **Stripe** (Recommended) - Modern SaaS payment platform
- **SSLCommerz** (Alternative) - Bangladesh-based payment gateway

This document focuses on Stripe integration.

## Prerequisites

1. Stripe account (https://stripe.com)
2. Node.js application running
3. PostgreSQL database configured
4. HTTPS endpoint for webhook (required in production)

## Step 1: Create Stripe Account

1. Go to https://stripe.com and sign up for an account
2. Complete identity verification
3. Activate your account

## Step 2: Get API Keys

1. Log into Stripe Dashboard
2. Navigate to **Developers > API Keys** (or https://dashboard.stripe.com/apikeys)
3. You'll see two keys:
   - **Test mode** (starts with `sk_test_`)  ← Use during development
   - **Live mode** (starts with `sk_live_`)  ← Use in production
4. Copy your **Test Secret Key** for development:

```
STRIPE_API_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Create Subscription Prices

Stripe uses "Products" and "Prices" for billing model. Set up monthly and yearly plans:

1. Go to **Products** (https://dashboard.stripe.com/products)
2. Click **Add product**
3. Fill in:
   - **Name**: "Movie Portal Premium - Monthly"
   - **Description**: "Monthly subscription (optional)"
   - **Type**: Recurring
   - **Pricing**: Enter your price (e.g., $9.99/month)
   - **Billing period**: Monthly
4. Click **Save product**
5. Copy the **Price ID** (starts with `price_...`):

```
STRIPE_MONTHLY_PRICE_ID=price_1234567890abcdef
```

6. Repeat for yearly plan:
   - **Name**: "Movie Portal Premium - Yearly"
   - **Price**: $99.99 or appropriate annual rate
   - **Billing period**: Yearly
   - Copy the **Price ID**:

```
STRIPE_YEARLY_PRICE_ID=price_abcdefghij1234567890
```

## Step 4: Set Up Webhook Endpoint

Webhooks allow Stripe to notify your API of payment events (successful payment, cancellation, etc.).

### For Development (Using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Authenticate with your Stripe account:
```bash
stripe login
```

3. Forward webhook events to your local server:
```bash
stripe listen --forward-to localhost:3000/api/v1/payments/stripe/webhook
```

4. The CLI will display your webhook signing secret:
```
Your webhook signing secret is: whsec_test_xxxxxxxxxxxxx
```

5. Copy this to your `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
```

### For Production (Using Stripe Dashboard)

1. Go to **Developers > Webhooks** (https://dashboard.stripe.com/webhooks)

2. Click **Add an endpoint**

3. Enter your endpoint URL:
```
https://yourdomain.com/api/v1/payments/stripe/webhook
```

4. Select events to receive. At minimum, select:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Click **Add endpoint**

6. Click the endpoint to view it, then **Reveal** the signing secret and copy to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_live_xxxxxxxxxxxxx
```

## Step 5: Update .env Configuration

Create or update your `.env` file with:

```dotenv
# Stripe Configuration
STRIPE_API_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxx
STRIPE_MONTHLY_PRICE_ID=price_1234567890abcdef
STRIPE_YEARLY_PRICE_ID=price_abcdefghij1234567890
```

## Step 6: Database Setup

Ensure your database is initialized with the Prisma schema:

```bash
# Apply migrations
npm run db:migrate

# Or sync schema (development only)
npm run db:push
```

## Step 7: Test Payment Flow

### Using Stripe Test Cards

Stripe provides test card numbers for different scenarios:

**Successful payment:**
```
Card: 4242 4242 4242 4242
Exp: 12/25 (any future date)
CVC: 123 (any 3 digits)
```

**Card declined error:**
```
Card: 4000 0000 0000 0002
Exp: 12/25
CVC: 123
```

### Testing Locally

1. Start your development server:
```bash
npm run dev
```

2. In another terminal, start Stripe webhook listener:
```bash
stripe listen --forward-to localhost:3000/api/v1/payments/stripe/webhook
```

3. Make a request to create checkout session:
```bash
curl -X POST http://localhost:3000/api/v1/payments/stripe/create-checkout-session \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "monthly"}'
```

4. Go to the returned checkout URL and complete payment with test card

5. Check your Stripe Dashboard > Payments to see the transaction

6. Verify webhook events were processed in your logs

## API Endpoints

### Create Checkout Session

```
POST /api/v1/payments/stripe/create-checkout-session
Authorization: Bearer <sessionToken>
Content-Type: application/json

{
  "plan": "monthly",
  "successUrl": "https://yourdomain.com/subscription/success",
  "cancelUrl": "https://yourdomain.com/subscription/cancel"
}
```

**Response:**
```json
{
  "data": {
    "checkoutSessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/...",
    "status": "created"
  }
}
```

### Get Subscription Status

```
GET /api/v1/payments/stripe/subscription-status
Authorization: Bearer <sessionToken>
```

**Response:**
```json
{
  "data": {
    "status": "ACTIVE",
    "hasActiveSubscription": true,
    "currentPeriodEnd": "2024-04-30T00:00:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

### Cancel Subscription

```
POST /api/v1/payments/stripe/cancel-subscription
Authorization: Bearer <sessionToken>
Content-Type: application/json

{
  "cancelAtPeriodEnd": true
}
```

## Database Models

### Subscription Model

```prisma
model Subscription {
  id                     String             @id @default(uuid())
  userId                 String
  provider               PaymentProvider    // "STRIPE" or "SSLCOMMERZ"
  status                 SubscriptionStatus // "ACTIVE", "PAST_DUE", "CANCELED", "EXPIRED"
  providerCustomerId     String?            // Stripe customer ID
  providerSubscriptionId String?            // Stripe subscription ID
  currentPeriodStart     DateTime?
  currentPeriodEnd       DateTime?
  cancelAtPeriodEnd      Boolean            @default(false)
  canceledAt             DateTime?
  metadata               Json?              // Stores Stripe subscription object
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  user                   User               @relation(fields: [userId], references: [id])
  paymentEvents          PaymentEvent[]

  @@index([userId, status])
  @@unique([provider, providerSubscriptionId])
}
```

### PaymentEvent Model

```prisma
model PaymentEvent {
  id              String          @id @default(uuid())
  provider        PaymentProvider // "STRIPE" or "SSLCOMMERZ"
  externalEventId String          // Stripe event ID
  subscriptionId  String?
  userId          String?
  eventType       String          // "checkout.session.completed", etc.
  payload         Json            // Full Stripe event object
  processedAt     DateTime?       // When this event was processed
  createdAt       DateTime        @default(now())

  subscription    Subscription?   @relation(fields: [subscriptionId], references: [id])

  @@unique([provider, externalEventId])
}
```

## Webhook Events Handled

### checkout.session.completed
Fired when checkout session completes. Logs the event for tracking.

### customer.subscription.created
Creates a new Subscription record in our database when Stripe subscription is created.

### customer.subscription.updated
Updates subscription status and period dates based on Stripe notifications.

### customer.subscription.deleted
Marks subscription as CANCELED when user cancels in Stripe Dashboard.

### invoice.paid
Updates subscription to ACTIVE status when invoice payment is successful.

### invoice.payment_failed
Updates subscription to PAST_DUE when payment fails.

## Error Handling

### Webhook Signature Verification Failed
```json
{
  "error": "Webhook signature verification failed"
}
```

**Solution**: Ensure `STRIPE_WEBHOOK_SECRET` is correct in your `.env`.

### Invalid Checkout Session
```json
{
  "data": {
    "checkoutSessionId": null,
    "error": "Failed to create checkout session"
  }
}
```

**Solution**: Verify `STRIPE_API_KEY` and `STRIPE_MONTHLY_PRICE_ID` are correct.

## Transition to Production

1. **Replace Test Keys with Live Keys**
   - Get live keys from Stripe Dashboard (non-test mode)
   - Update `.env` with `sk_live_...` and `whsec_live_...`

2. **Update Webhook URL**
   - In Stripe Dashboard, add production webhook endpoint
   - URL must be HTTPS with valid SSL certificate

3. **Test End-to-End**
   - Make a test purchase with live keys (use testing card or small amount)
   - Verify subscription activation in database
   - Check webhook processing logs

4. **Monitor**
   - Set up Stripe email notifications for failed payments
   - Monitor webhook delivery in Stripe Dashboard
   - Track payment events in application logs

## Troubleshooting

### Webhooks Not Received

1. Check webhook URL is publicly accessible (HTTPS for production)
2. Verify webhook signing secret in `.env`
3. Check Stripe Dashboard > Webhooks for delivery attempts
4. Ensure events are selected in webhook configuration

### Subscription Not Activating

1. Verify `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID` are correct
2. Check PaymentEvent logs in database for webhook events
3. Ensure webhook processing completes without errors
4. Verify database timestamps are correct

### Session Token Issues

1. Ensure user is authenticated with Better Auth
2. Session token must be valid and non-expired
3. Check `Authorization` header format: `Bearer <token>`

## Support

For Stripe-specific issues, see: https://support.stripe.com/
For application issues, check application logs and database PaymentEvent records.
