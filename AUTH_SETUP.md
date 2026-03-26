# Better Auth Setup

## Overview
This project uses **Better Auth** for authentication. Better Auth is a modern, open-source authentication solution for TypeScript applications.

## Features Enabled
- ✅ Email & Password authentication
- ✅ Auto sign-up on sign-in  
- ✅ Session management
- ✅ Email verification (can be enabled)
- ✅ Account linking
- ✅ Password reset

## Environment Variables

Add these to your `.env` file:

```
BETTER_AUTH_SECRET=your-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3000
```

For production, generate a strong secret:
```bash
openssl rand -base64 32
```

## Database Schema

Better Auth automatically manages these tables:
- **User** - User profiles with email, name, image, password
- **Account** - OAuth account linking
- **Session** - Session tokens and expiration
- **Verification** - Email verification and password reset tokens

## API Endpoints

All auth endpoints are available at `/api/auth/*`:

### Sign Up
```
POST /api/auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

### Sign In
```
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Get Session
```
GET /api/auth/get-session
```

Returns the current user's session info

### Sign Out
```
POST /api/auth/sign-out
```

### Change Password
```
POST /api/auth/change-password
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword"
}
```

## Using Auth in Routes

### 1. Protect a Route

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
```

### 2. Access User Information

```typescript
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({
    user: req.user,      // User object
    sessionId: req.session?.id
  });
});
```

## Setup Steps Completed

1. ✅ Installed `better-auth` package
2. ✅ Updated Prisma schema with auth tables (User, Account, Session, Verification)
3. ✅ Created auth configuration at `src/config/auth.ts`
4. ✅ Set up auth routes at `src/routes/auth.ts`
5. ✅ Created auth middleware at `src/middleware/authMiddleware.ts`
6. ✅ Integrated auth router into main server

## Migration & Database Setup

After setup, run:

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run dev           # Start development server
```

## Configuration

To customize auth settings, edit `src/config/auth.ts`:

```typescript
export const auth = betterAuth({
  // Add social providers
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  
  // Enable email verification
  emailVerification: {
    enabled: true,
    autoSignUpOnSignIn: false,
  },
});
```

## Client Integration

For frontend applications, install the Better Auth client:

```bash
npm install @better-auth/react
```

Example React setup:
```typescript
import { useClient } from '@better-auth/react';

export function MyComponent() {
  const client = useClient();

  const handleSignUp = async () => {
    await client.signUp.email({
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe',
    });
  };

  return <button onClick={handleSignUp}>Sign Up</button>;
}
```

## Security Best Practices

1. **Set a strong `BETTER_AUTH_SECRET`** in production
2. **Use HTTPS** in production
3. **Enable email verification** for sensitive operations
4. **Set appropriate CORS origins** in `CORS_ORIGIN` env variable
5. **Never commit `.env`** to version control
6. **Regularly rotate secrets** and session tokens

## Testing Auth

Use curl or Postman to test:

```bash
# Sign Up
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'

# Sign In  
curl -X POST http://localhost:3000/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Get Session
curl http://localhost:3000/api/auth/get-session
```

## Troubleshooting

### Session Not Working
- Check BETTER_AUTH_SECRET is set
- Verify BETTER_AUTH_URL matches your server URL
- Ensure session token is being sent in Authorization header or cookies

### Database Errors
- Run `npm run db:push` to sync schema
- Check DATABASE_URL in .env
- Verify PostgreSQL is running

## Resources

- [Better Auth Documentation](https://better-auth.com)
- [Prisma Documentation](https://prisma.io/docs)
- [Session Management Best Practices](https://owasp.org/www-community/attacks/Session_fixation)
