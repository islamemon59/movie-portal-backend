# Movie Portal Backend

A modern Node.js Express.js backend API for a movie portal application, built with TypeScript, PostgreSQL, Prisma ORM, Better Auth, and Zod validation. Follows a modular architecture pattern for scalability and maintainability.

## Tech Stack

- **Runtime**: Node.js LTS (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Better Auth
- **Validation**: Zod
- **HTTP Logging**: Morgan
- **CORS**: Express CORS
- **Architecture**: Modular/Feature-based

## Prerequisites

- Node.js LTS (v18.0.0 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database credentials and configuration:
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/movie_portal"
   PORT=3000
   NODE_ENV="development"
   BETTER_AUTH_SECRET="your-secret-key-here"
   BETTER_AUTH_URL="http://localhost:3000"
   CORS_ORIGIN="http://localhost:3000"
   ```

   **For local PostgreSQL setup**:
   - Install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
   - Create a database:
     ```sql
     CREATE DATABASE movie_portal;
     ```
   - Update DATABASE_URL with your credentials

3. **Initialize the database**:
   ```bash
   npm run db:push
   ```

4. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:push` - Sync Prisma schema with database
- `npm run db:migrate` - Create and apply database migrations
- `npm run db:generate` - Generate Prisma Client
- `npm run db:studio` - Open Prisma Studio (visual database explorer)
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /` - API info and available endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie by ID
- `POST /api/movies` - Create new movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

## Payment Integration (Stripe & SSLCommerz)

The backend includes comprehensive payment processing with Stripe:

### Stripe Payment Features
- ✅ Subscription checkout sessions
- ✅ Webhook handling for payment events
- ✅ Subscription management (create, update, cancel)
- ✅ Multi-provider support (Stripe + SSLCommerz)

### Setup Payment Processing

1. **Stripe Configuration** (Recommended):
   - Create Stripe account at https://stripe.com
   - Get API keys and webhook secrets
   - Create subscription products/prices
   - See [PAYMENT_SETUP.md](PAYMENT_SETUP.md) for detailed instructions

2. **Environment Variables Required**:
   ```
   STRIPE_API_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_test_...
   STRIPE_MONTHLY_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...
   ```

3. **Test Payment Flow**:
   - Start server: `npm run dev`
   - Use Stripe test cards
   - Listen to webhooks with Stripe CLI: `stripe listen --forward-to localhost:3000/api/v1/payments/stripe/webhook`

### Payment API Endpoints
- `POST /api/v1/payments/stripe/create-checkout-session` - Create payment session
- `GET /api/v1/payments/stripe/subscription-status` - Check subscription status
- `POST /api/v1/payments/stripe/cancel-subscription` - Cancel subscription
- `POST /api/v1/payments/stripe/webhook` - Webhook handler

See [API.md](API.md) for complete endpoint documentation.

## Authentication (Better Auth)

The project uses [Better Auth](https://better-auth.com/) for modern, secure authentication:

- ✅ Email/password authentication
- ✅ Session management
- ✅ Password reset flow
- ✅ Email verification
- ✅ Social login support (configurable)
- ✅ Role-based access control (User, Admin)

### Auth Configuration
See [AUTH_SETUP.md](AUTH_SETUP.md) for authentication setup details.

### Usage
```bash
# JWT token-based requests
curl -H "Authorization: Bearer <sessionToken>" http://localhost:3000/api/v1/users/me
```



```
movie-portal-backend/
├── src/
│   ├── config/                    # Global configuration
│   │   ├── env.ts                # Environment variables
│   │   └── database.ts           # Prisma client setup
│   │
│   ├── middleware/                # Shared middleware
│   │   ├── validation.ts         # Request validation
│   │   ├── errorHandler.ts       # Error handling
│   │   └── asyncHandler.ts       # Async wrapper
│   │
│   ├── modules/                   # Feature modules (modular architecture)
│   │   ├── users/
│   │   │   ├── user.controller.ts    # Business logic
│   │   │   ├── user.service.ts       # Data operations
│   │   │   ├── user.schema.ts        # Zod validation
│   │   │   └── user.routes.ts        # Route handlers
│   │   │
│   │   ├── movies/
│   │   │   ├── movie.controller.ts   # Business logic
│   │   │   ├── movie.service.ts      # Data operations
│   │   │   ├── movie.schema.ts       # Zod validation
│   │   │   └── movie.routes.ts       # Route handlers
│   │   │
│   │   └── index.ts              # Module exports
│   │
│   ├── types/                     # Shared TypeScript types
│   │   └── api.ts               # API response types
│   │
│   ├── server.ts                  # Express app setup
│   └── index.ts                   # Entry point
│
├── prisma/
│   ├── schema.prisma              # Prisma database schema
│   └── .gitignore
│
├── dist/                          # Compiled JavaScript (build output)
│
├── .env                           # Environment variables (local)
├── .env.example                   # Environment template
├── .env.development               # Development reference
├── .prettier                      # Code formatter config
├── .eslintrc.json                 # Lint rules
├── .gitignore
├── tsconfig.json                  # TypeScript configuration
├── package.json                   # Project dependencies
├── Makefile                       # Convenient commands
├── README.md                      # This file
├── SETUP.md                       # Setup guide
├── API.md                         # API reference
└── PROJECT_SUMMARY.md             # Setup summary
```

### Module Architecture Pattern

Each module (e.g., `users`, `movies`) follows this structure:

```
module/
├── *.controller.ts  - Handles HTTP requests/responses
├── *.service.ts     - Business logic and data operations
├── *.schema.ts      - Zod validation schemas
└── *.routes.ts      - Express route definitions
```

**Data Flow**: Routes → Controller → Service → Prisma → Database

**Benefits**:
- ✅ Clear separation of concerns
- ✅ Easy to test (each layer independently)
- ✅ Scalable (add new modules easily)
- ✅ Maintainable (cohesive modules)
- ✅ Reusable services across routes

## Database Schema

### User
- `id` - UUID primary key
- `email` - Unique email address
- `name` - User's name
- `image` - User's profile image URL
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Movie
- `id` - UUID primary key
- `title` - Movie title
- `description` - Movie description
- `releaseDate` - Movie release date
- `posterUrl` - Movie poster image URL
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Example Requests

### Create User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

### Create Movie
```bash
curl -X POST http://localhost:3000/api/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inception",
    "description": "A sci-fi thriller about dreams",
    "releaseDate": "2010-07-16T00:00:00Z",
    "posterUrl": "https://example.com/poster.jpg"
  }'
```

## Validation

Input validation is handled using Zod schemas. All API endpoints validate request bodies against their respective schemas before processing.

### User Validation
- `email` - Required, must be valid email
- `name` - Optional, must be non-empty string
- `image` - Optional, must be valid URL

### Movie Validation
- `title` - Required, must be non-empty string
- `description` - Optional
- `releaseDate` - Optional, must be valid ISO date
- `posterUrl` - Optional, must be valid URL

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Status codes:
- `200` - Success
- `201` - Created
- `204` - No content (successful deletion)
- `400` - Bad request (validation error)
- `404` - Not found
- `500` - Internal server error

## Authentication (Better Auth)

Better Auth integration is configured but not yet fully implemented in the routes. To add authentication:

1. Configure Better Auth in a new auth configuration file
2. Add middleware to protected routes
3. Update route handlers to use authenticated user context

## Prisma Migration

To create a new migration after schema changes:

```bash
npm run db:migrate -- --name <migration_name>
```

Example:
```bash
npm run db:migrate -- --name add_user_roles
```

## Production Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Set environment variables for production in `.env`

3. Run migrations:
   ```bash
   npm run db:push
   ```

4. Start the server:
   ```bash
   npm start
   ```

## License

MIT
