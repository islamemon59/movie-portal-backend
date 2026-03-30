# Movie and Series Portal API

## Base URL

Production API base path:

- `/api/v1`

Legacy routes under `/api` remain for basic users and movies compatibility.

## Response Convention

- Success: `{ data, meta? }`
- Error: `{ error: { code, message, details? } }`
- Request id header: `X-Request-Id`

## Auth and Roles

Protected endpoints require one of:

- `Authorization: Bearer <sessionToken>`
- `x-session-token: <sessionToken>`

Role-based access is enforced for admin endpoints.

## Query Conventions

- Pagination: `?page=1&limit=20`
- Sorting: `?sort=createdAt:desc` (planned extension; default sorting exists)
- Filtering examples:
  - `?genre=Action`
  - `?platform=Netflix`
  - `?year=2024`
  - `?minRating=7`

## Health

- `GET /api/v1/health`

## Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

These are handled by Better Auth handler.

## Users

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/me/purchases`
- `GET /api/v1/users/me/subscription`

Administrative/basic user CRUD is still available:

- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PUT /api/v1/users/:id`
- `DELETE /api/v1/users/:id`

## Titles (Media Library)

Public:

- `GET /api/v1/titles`
- `GET /api/v1/titles/:id`
- `GET /api/v1/titles/:id/aggregate`

Admin:

- `POST /api/v1/admin/titles`
- `PATCH /api/v1/admin/titles/:id`
- `DELETE /api/v1/admin/titles/:id`

Delete is soft-delete (marks entity as deleted and unpublished).

## Reviews

User:

- `POST /api/v1/titles/:titleId/reviews`
- `PATCH /api/v1/reviews/:id`
- `DELETE /api/v1/reviews/:id`

Public:

- `GET /api/v1/titles/:titleId/reviews`

Admin moderation:

- `GET /api/v1/admin/reviews?status=PENDING`
- `PATCH /api/v1/admin/reviews/:id/approve`
- `PATCH /api/v1/admin/reviews/:id/unpublish`
- `DELETE /api/v1/admin/reviews/:id`

Workflow rules:

- New review starts as `PENDING`
- User cannot edit/delete approved review
- Admin controls publish/unpublish visibility

## Likes

- `POST /api/v1/reviews/:reviewId/like`
- `DELETE /api/v1/reviews/:reviewId/like`

DB uniqueness (`userId + reviewId`) prevents duplicate likes.

## Comments

- `GET /api/v1/reviews/:reviewId/comments`
- `POST /api/v1/reviews/:reviewId/comments`
- `POST /api/v1/comments/:commentId/replies`
- `PATCH /api/v1/comments/:id`
- `DELETE /api/v1/comments/:id`

Admin moderation:

- `PATCH /api/v1/admin/comments/:id/unpublish`
- `DELETE /api/v1/admin/comments/:id`

## Watchlist

- `GET /api/v1/watchlist`
- `POST /api/v1/watchlist` with `{ titleId }`
- `DELETE /api/v1/watchlist/:titleId`

DB uniqueness (`userId + titleId`) prevents duplicates.

## Payments and Subscriptions

### Stripe Payment Integration

**Authenticated Endpoints:**

- `POST /api/v1/payments/stripe/create-checkout-session` - Create a Stripe checkout session
  - Body: `{ plan: "monthly" | "yearly", successUrl?: string, cancelUrl?: string }`
  - Returns: `{ checkoutSessionId, url, status }`
  - Description: Creates a Stripe checkout session and redirects user to Stripe hosted checkout

- `GET /api/v1/payments/stripe/subscription-status` - Get current subscription status
  - Returns: `{ status, hasActiveSubscription, currentPeriodEnd?, cancelAtPeriodEnd? }`
  - Description: Retrieves the user's subscription status

- `POST /api/v1/payments/stripe/cancel-subscription` - Cancel user's subscription
  - Body: `{ cancelAtPeriodEnd: boolean = true }`
  - Returns: Updated subscription object
  - Description: Cancels subscription (either at period end or immediately)

**Webhook Endpoint (Unauthenticated):**

- `POST /api/v1/payments/stripe/webhook` - Handle Stripe webhook events
  - Header: `stripe-signature` (required for verification)
  - Body: Raw JSON from Stripe
  - Handles events:
    - `checkout.session.completed` - Session payment completed
    - `customer.subscription.created` - Subscription created
    - `customer.subscription.updated` - Subscription updated
    - `customer.subscription.deleted` - Subscription canceled
    - `invoice.paid` - Invoice payment received
    - `invoice.payment_failed` - Invoice payment failed
  - Returns: `{ received: true, processed: true }`
  - Note: Webhook signature verification is mandatory for security

### SSLCommerz Payment Integration (Alternative)

- `POST /api/v1/payments/sslcommerz/init` - Initialize SSLCommerz payment
  - Authenticated: Yes
  - Body: `{ amount: number, currency?: string = "BDT", plan: "monthly" | "yearly" }`
  - Returns: `{ transactionId, successUrl, failUrl, cancelUrl, ipnUrl }`

- `POST /api/v1/payments/sslcommerz/ipn` - Handle SSLCommerz IPN (Instant Payment Notification)
  - Authenticated: No
  - Body: Form data from SSLCommerz
  - Description: Webhook for SSLCommerz payment notifications

- `GET /api/v1/payments/sslcommerz/success` - Success redirect page
- `GET /api/v1/payments/sslcommerz/fail` - Failed payment redirect page
- `GET /api/v1/payments/sslcommerz/cancel` - Cancelled payment redirect page

### Subscription Management

**Key Rules:**

- One active subscription per user per provider
- Idempotent webhook/IPN handling via provider + externalEventId uniqueness
- Subscription status can be: `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`
- When subscription cancels, it transitions to `CANCELED` status
- Period dates are stored for tracking active billing periods

## Admin Analytics

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/stats/titles/top-rated`
- `GET /api/v1/admin/stats/titles/most-reviewed`
- `GET /api/v1/admin/stats/revenue`
- `GET /api/v1/admin/audit-logs`

## Required Environment Variables

### Core Configuration
- `NODE_ENV` - Environment mode: `development` | `production` | `test`
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `CORS_ORIGIN` - Allowed CORS origin

### Authentication (Better Auth)
- `BETTER_AUTH_SECRET` - Secret key for auth (min 32 characters, base64 encoded)
- `BETTER_AUTH_URL` - Base URL for auth routes

### Stripe Payment Integration
- `STRIPE_API_KEY` - Your Stripe secret key (starts with `sk_`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret (starts with `whsec_`)
- `STRIPE_MONTHLY_PRICE_ID` - Stripe price ID for monthly subscription plan
- `STRIPE_YEARLY_PRICE_ID` - Stripe price ID for yearly subscription plan

### SSLCommerz Payment Integration (Optional)
- `SSLC_STORE_ID` - Store ID from SSLCommerz
- `SSLC_STORE_PASSWORD` - Store password from SSLCommerz
- `SSLC_SUCCESS_URL` - URL to redirect on successful payment
- `SSLC_FAIL_URL` - URL to redirect on failed payment
- `SSLC_CANCEL_URL` - URL to redirect on cancelled payment
- `SSLC_IPN_URL` - Webhook URL for IPN notifications from SSLCommerz

## Setup Instructions

### 1. Generate Better Auth Secret
```bash
openssl rand -base64 32
```

### 2. Stripe Setup
1. Create account at https://stripe.com
2. Go to Dashboard > API keys
3. Copy Secret key to `STRIPE_API_KEY`
4. Create subscription prices in Products section
5. Copy price IDs to `STRIPE_MONTHLY_PRICE_ID` and `STRIPE_YEARLY_PRICE_ID`
6. Set up webhook endpoint:
   - URL: `https://yourdomain.com/api/v1/payments/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Database Setup
```bash
# Create .env file with DATABASE_URL

# Run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

### 4. Development Server
```bash
npm run dev
```
