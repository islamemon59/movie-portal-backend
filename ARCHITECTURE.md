# Backend Architecture

## Goals

This backend follows production-oriented principles for a Movie and Series Portal:

- Stateless REST API with role-based authorization
- Strict boundary validation
- Moderation-first UGC workflows
- Webhook/IPN-driven payment correctness
- Auditable administrative actions

## Layered Design

### Routes

- Own URL structure and middleware composition
- No business rules in route handlers

### Controllers

- Orchestrate request and response
- Delegate domain logic to services

### Services

- Implement business rules
- Coordinate Prisma reads/writes and transactions

### Middlewares

- Request id propagation (`X-Request-Id`)
- Authentication (session token based)
- Role checks (ADMIN/USER)
- Validation (Zod for body, query, params)
- Global error normalization

### Data Access

- Prisma Client as repository abstraction
- DB constraints enforce business invariants

## Current Module Map

- Auth: Better Auth handler routes
- Users: profile, self-service, CRUD
- Titles: catalog listing, details, aggregates, admin CRUD
- Reviews: create/update/delete + moderation lifecycle
- Likes: unique like per user and review
- Comments: posting, replies, moderation workflow
- Watchlist: unique watchlist item per user and title
- Payments: Stripe and SSLCommerz event ingestion
- Admin: dashboard and analytical endpoints

## API Versioning

- Primary namespace: `/api/v1`
- Legacy compatibility routes remain under `/api` for earlier modules

## Security and Reliability

- Helmet for secure HTTP headers
- Rate limits:
  - API global limiter
  - Auth endpoints stricter limiter
  - Write endpoints limiter for abuse prevention
- Strict validation for write operations
- Role checks for admin-only actions
- Soft-delete for titles/reviews/comments to preserve history
- Payment event idempotency via `(provider, externalEventId)` uniqueness

## Moderation Flow

Reviews and comments follow this lifecycle:

1. User creates item -> `PENDING`
2. Admin approves -> `APPROVED` (publicly visible)
3. Admin unpublishes -> `UNPUBLISHED` (hidden, retained)
4. User edits reset review/comment to `PENDING`

## Payment Correctness

The architecture treats provider callbacks as the source of truth:

1. Client starts payment (checkout/init)
2. Provider webhook/IPN arrives server-to-server
3. Signature verification is performed
4. Event is stored idempotently
5. Subscription status updates to ACTIVE only after verified event

## Scalability Notes

- Stateless app layer supports horizontal scaling
- Prisma + managed PostgreSQL for persistence
- Request-level context via request id for tracing and incident debugging
- Caching layer can be added (Redis) for hot reads and analytics rollups

## Suggested Next Enhancements

- Move Prisma calls into explicit repository classes
- Add queue/jobs for analytics rollups and email notifications
- Add integration tests for auth, moderation, RBAC, and webhooks
- Add OpenAPI specification generation for client integration
