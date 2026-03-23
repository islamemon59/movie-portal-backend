# Setup Guide

This guide will help you get the Movie Portal Backend up and running.

## Prerequisites

Make sure you have the following installed:
- **Node.js LTS** (v18+) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12+) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** - Comes with Node.js

Alternatively, you can use [Docker](https://www.docker.com/) to run PostgreSQL:
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up PostgreSQL

PostgreSQL must be installed and running on your system.

### Installation

**Windows/Mac/Linux**:
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
- Follow the installation wizards for your OS
- Note your username and password (usually `postgres`)

**Verify Installation**:
```bash
psql --version
```

### Create Database

Start PostgreSQL, then create a database for the project:

```bash
# Connect to PostgreSQL (replace postgres with your username if different)
psql -U postgres

# Create database
CREATE DATABASE movie_portal;

# Exit psql
\q
```

Or use psql in one command:
```bash
createdb -U postgres movie_portal
```

## Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your database credentials:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/movie_portal"
PORT=3000
NODE_ENV="development"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
CORS_ORIGIN="http://localhost:3000"
```

## Step 4: Set Up the Database

Initialize the Prisma database:

```bash
npm run db:push
```

This will:
1. Create the database schema
2. Generate Prisma Client

## Step 5: Start the Development Server

```bash
npm run dev
```

You should see output like:
```
✓ Database connection successful
✓ Server running on http://localhost:3000
✓ Environment: development
✓ API Documentation: http://localhost:3000
```

## Step 6: Verify the Setup

Test the API with curl or Postman:

```bash
# Health check
curl http://localhost:3000/health

# Get API info
curl http://localhost:3000/

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

## Useful Commands

- **Start dev server**: `npm run dev`
- **Build for production**: `npm run build`
- **Create a migration**: `npm run db:migrate -- --name "description"`
- **View database visually**: `npm run db:studio`
- **Lint code**: `npm run lint`
- **Type check**: `npm run type-check`

Or use the Makefile:

```bash
make help          # Show all available commands
make dev           # Start development
make db-up         # Start PostgreSQL
make db-migrate    # Create migrations
```

## Database Schema

The initial schema includes:

### Users Table
- id (UUID)
- email (String, unique)
- name (String, nullable)
- image (String, nullable)
- createdAt (DateTime)
- updatedAt (DateTime)

### Movies Table
- id (UUID)
- title (String)
- description (String, nullable)
- releaseDate (DateTime, nullable)
- posterUrl (String, nullable)
- createdAt (DateTime)
- updatedAt (DateTime)

## Project Structure

```
movie-portal-backend/
├── src/
│   ├── config/              # Configuration
│   │   ├── env.ts          # Environment variables
│   │   └── database.ts     # Prisma setup
│   ├── middleware/          # Custom middleware
│   │   ├── validation.ts   # Request validation
│   │   └── errorHandler.ts # Error handling
│   ├── routes/              # API routes
│   │   ├── users.ts
│   │   └── movies.ts
│   ├── schemas/             # Zod schemas
│   │   ├── user.schema.ts
│   │   └── movie.schema.ts
│   ├── types/               # TypeScript types
│   │   └── api.ts
│   ├── server.ts           # Express app setup
│   └── index.ts            # Entry point
├── prisma/
│   └── schema.prisma       # Database schema
├── dist/                   # Compiled JavaScript
├── .env                    # Environment variables
├── .env.example            # Template
├── package.json
├── tsconfig.json
├── docker-compose.yml      # PostgreSQL container
├── Makefile               # Convenient commands
└── README.md
```

## Troubleshooting

### "Cannot connect to database"
- Verify PostgreSQL is running (`docker-compose ps` if using Docker)
- Check DATABASE_URL in .env file
- Ensure port 5432 is not blocked

### "Command not found: npm"
- Install Node.js LTS from https://nodejs.org/
- Restart your terminal

### "prisma: command not found"
- Run `npm install`
- Ensure you're in the project directory

### Port 3000 already in use
- Change PORT in .env to a different port (e.g., 3001)
- Or kill the process using port 3000

## Next Steps

1. **Add More Models**: Update `prisma/schema.prisma` and run migrations
2. **Authentication**: Integrate Better Auth for user authentication
3. **Advanced Validation**: Extend Zod schemas with more complex rules
4. **Testing**: Add Jest and write unit/integration tests
5. **API Documentation**: Add Swagger/OpenAPI documentation
6. **Deployment**: Deploy to Vercel, Railway, or other platforms

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Zod Documentation](https://zod.dev/)
- [Better Auth Documentation](https://www.better-auth.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Support

For issues or questions:
1. Check the README.md
2. Review the API endpoint documentation
3. Check Prisma logs (`npm run db:studio`)
4. Enable debug logging: NODE_ENV=development npm run dev
