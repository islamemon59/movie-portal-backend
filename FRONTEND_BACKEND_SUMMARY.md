# Frontend Integration Summary

This document is a single source of truth for frontend developers to understand how this backend works, how APIs behave, and how to test everything quickly.

## 1. Backend at a Glance

- Runtime: Node.js + Express + TypeScript
- DB: PostgreSQL + Prisma
- Auth: Better Auth (session based)
- Validation: Zod
- Security: Helmet, CORS, rate limits
- Main API base: `/api/v1`

### Request pipeline

1. Security headers (`helmet`)
2. CORS check
3. Request ID injected (`X-Request-Id`)
4. Rate-limit checks
5. JSON/urlencoded parsing
6. Route validation/auth/RBAC middleware
7. Controller + service logic + Prisma
8. Standard success/error response

## 2. Important Base URLs

- Health: `GET /api/v1/health`
- Auth handler: `/api/auth/*` and `/api/v1/auth/*`
- Main domain API: `/api/v1/*`

Use this frontend env setting:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AUTH_BASE_URL=http://localhost:3000/api/auth
```

## 3. How Auth Works for Frontend

Better Auth manages register/login/session routes.

- Sign up/login via Better Auth endpoints
- Backend protected APIs expect session token in header:
  - `Authorization: Bearer <session_token>` OR
  - `x-session-token: <session_token>`

### Practical frontend approach

1. Call Better Auth sign-in endpoint.
2. Keep session token from auth flow (or from session endpoint depending client usage).
3. Send that token in every protected request.

## 4. API Response Behavior

### Preferred success shape

```json
{ "data": {...}, "meta": {...optional} }
```

### Error shape

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST|UNAUTHORIZED|FORBIDDEN|NOT_FOUND|...",
    "message": "Human readable message",
    "statusCode": 400,
    "timestamp": "...",
    "details": {"...": "..."}
  }
}
```

### Note about legacy endpoints

Some older user/movie endpoints may still return raw payloads (without `data`). Frontend should prefer `/api/v1` routes and be tolerant if consuming legacy paths.

## 5. Authorization Rules

- USER: regular features (reviews, comments, likes, watchlist, own profile)
- ADMIN: all moderation and admin analytics routes
- Admin-only path family: `/api/v1/admin/*`

## 6. Domain Flows (What Happens)

### Titles

- Admin creates/updates titles
- Delete is soft delete (`isDeleted=true`, unpublished)
- Public list/detail only returns active published titles

### Reviews moderation

- User creates review -> `PENDING`
- Admin approves -> `APPROVED` (visible publicly)
- Admin unpublishes -> hidden, retained in DB
- User cannot edit/delete approved review

### Comments moderation

- New comment/reply -> `PENDING`
- Public list shows approved comments/replies
- Admin can unpublish/delete

### Likes and watchlist

- One like per user+review
- One watchlist item per user+title
- Duplicate actions are idempotent-safe

### Payments

- Frontend starts payment intent/session
- Backend activates subscription only after verified webhook/IPN
- Never trust client-side paid status

## 7. Endpoint Map for Frontend

## 7.1 Public routes

- `GET /api/v1/health`
- `GET /api/v1/titles`
- `GET /api/v1/titles/:id`
- `GET /api/v1/titles/:id/aggregate`
- `GET /api/v1/titles/:titleId/reviews`
- `GET /api/v1/reviews/:reviewId/comments`

## 7.2 Auth/session routes (Better Auth)

Use `/api/auth/*` (recommended) or `/api/v1/auth/*`.

Common actions:

- sign-up
- sign-in
- sign-out
- get-session
- refresh/reset flows if configured in Better Auth client

## 7.3 Protected user routes

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/me/purchases`
- `GET /api/v1/users/me/subscription`

- `POST /api/v1/titles/:titleId/reviews`
- `PATCH /api/v1/reviews/:id`
- `DELETE /api/v1/reviews/:id`

- `POST /api/v1/reviews/:reviewId/like`
- `DELETE /api/v1/reviews/:reviewId/like`

- `POST /api/v1/reviews/:reviewId/comments`
- `POST /api/v1/comments/:commentId/replies`
- `PATCH /api/v1/comments/:id`
- `DELETE /api/v1/comments/:id`

- `GET /api/v1/watchlist`
- `POST /api/v1/watchlist`
- `DELETE /api/v1/watchlist/:titleId`

- `POST /api/v1/payments/stripe/create-checkout-session`
- `POST /api/v1/payments/sslcommerz/init`

## 7.4 Admin routes

- `POST /api/v1/admin/titles`
- `PATCH /api/v1/admin/titles/:id`
- `DELETE /api/v1/admin/titles/:id`

- `GET /api/v1/admin/reviews?status=PENDING|APPROVED|UNPUBLISHED`
- `PATCH /api/v1/admin/reviews/:id/approve`
- `PATCH /api/v1/admin/reviews/:id/unpublish`
- `DELETE /api/v1/admin/reviews/:id`

- `PATCH /api/v1/admin/comments/:id/unpublish`
- `DELETE /api/v1/admin/comments/:id`

- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/stats/titles/top-rated`
- `GET /api/v1/admin/stats/titles/most-reviewed`
- `GET /api/v1/admin/stats/revenue`
- `GET /api/v1/admin/audit-logs?page=1&limit=20`

## 8. Frontend API Client Template

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("session_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { "x-session-token": token } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = payload?.error?.message || "Request failed";
    throw new Error(message);
  }

  return payload;
}
```

## 9. Local Setup for Frontend Team

1. Ensure backend `.env` is configured.
2. Run backend:

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

3. Verify:

```bash
curl http://localhost:3000/api/v1/health
```

4. In frontend app env, set:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AUTH_BASE_URL=http://localhost:3000/api/auth
```

## 10. End-to-End Testing Checklist (Frontend QA)

1. Register and login user.
2. Fetch profile (`/users/me`).
3. Admin creates a title.
4. User sees title list and detail.
5. User submits review (pending state expected).
6. Admin approves review.
7. Public review list shows approved review.
8. User likes review once (second click should not duplicate).
9. User adds title to watchlist (repeat safe).
10. User comments and replies.
11. Admin moderation actions reflect in UI.
12. Payment init works and UI handles processing states.
13. Admin dashboard pages load analytics endpoints.

## 11. Known Integration Notes

- `X-Request-Id` is returned by backend; include it in frontend error logs for support.
- Stripe webhook and SSL IPN routes are server-to-server only; frontend should not call them directly.
- Keep frontend robust for both `{data}` and legacy raw responses if touching old endpoints.
- Prefer `/api/v1` endpoints for all new frontend work.

## 12. Quick Troubleshooting

- 401 Unauthorized:
  - session token missing/expired/not sent in header.
- 403 Forbidden:
  - route requires ADMIN role.
- 400 Validation failed:
  - request body/params/query do not match schema.
- 429 Too Many Requests:
  - rate limiter triggered; retry with backoff.
- 500:
  - inspect backend logs with `X-Request-Id`.
