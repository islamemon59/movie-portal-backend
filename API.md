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

Stripe:

- `POST /api/v1/payments/stripe/create-checkout-session`
- `POST /api/v1/payments/stripe/webhook`

SSLCommerz:

- `POST /api/v1/payments/sslcommerz/init`
- `POST /api/v1/payments/sslcommerz/ipn`
- `GET /api/v1/payments/sslcommerz/success`
- `GET /api/v1/payments/sslcommerz/fail`
- `GET /api/v1/payments/sslcommerz/cancel`

Rules enforced:

- Server records payment intents/events
- Subscription activation happens on verified webhook/IPN flow
- Duplicate event IDs are idempotent via provider+externalEventId uniqueness

## Admin Analytics

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/stats/titles/top-rated`
- `GET /api/v1/admin/stats/titles/most-reviewed`
- `GET /api/v1/admin/stats/revenue`
- `GET /api/v1/admin/audit-logs`

## Required Environment Variables

Core:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `CORS_ORIGIN`

Auth:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

Stripe:

- `STRIPE_WEBHOOK_SECRET`

SSLCommerz:

- `SSLC_STORE_ID`
- `SSLC_STORE_PASSWORD`
- `SSLC_SUCCESS_URL`
- `SSLC_FAIL_URL`
- `SSLC_CANCEL_URL`
- `SSLC_IPN_URL`
