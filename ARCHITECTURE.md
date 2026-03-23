# Modular Architecture Guide

This document explains the modular architecture pattern used in this project.

## Overview

The backend follows a **feature-based modular architecture** where each feature (e.g., Users, Movies, Auth) is self-contained in its own module. This approach provides better organization, scalability, and maintainability.

## Architecture Pattern

### Directory Structure

```
src/
├── config/           # Shared configuration
├── middleware/       # Shared middleware
├── modules/          # Feature modules
│   ├── users/       # Users feature
│   ├── movies/      # Movies feature
│   └── auth/        # (Future) Auth feature
├── types/           # Shared types
├── server.ts        # Express app
└── index.ts         # Entry point
```

### Module Structure

Each module contains:

```
module/
├── module.controller.ts  # Request handling & response formatting
├── module.service.ts     # Business logic & data operations
├── module.schema.ts      # Zod validation schemas
└── module.routes.ts      # Route definitions
```

## Layers Explained

### 1. Routes Layer (`*.routes.ts`)

**Responsibility**: Define HTTP routes and attach middleware

**Example** (`user.routes.ts`):
```typescript
router.post('/', validateRequest(CreateUserSchema), asyncHandler(...))
```

**Key Points**:
- Define all HTTP endpoints
- Apply route-specific middleware
- Call controller methods
- Use `asyncHandler` for error handling

### 2. Controller Layer (`*.controller.ts`)

**Responsibility**: Handle HTTP requests and format responses

**Example** (`user.controller.ts`):
```typescript
async createUser(req: Request, res: Response) {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
}
```

**Key Points**:
- Extract data from request
- Call service methods
- Format and return responses
- Throw `AppError` for errors
- Never access database directly

### 3. Service Layer (`*.service.ts`)

**Responsibility**: Business logic and database operations

**Example** (`user.service.ts`):
```typescript
async createUser(data: CreateUserInput) {
  return await prisma.user.create({ data });
}
```

**Key Points**:
- Implement business logic
- Handle database operations
- Perform data transformations
- Handle validation errors
- No HTTP context needed (testable in isolation)

### 4. Schema Layer (`*.schema.ts`)

**Responsibility**: Input validation schemas and types

**Example** (`user.schema.ts`):
```typescript
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(1),
});
```

**Key Points**:
- Define Zod validation schemas
- Export TypeScript types from schemas
- Reuse schemas across layers
- Keep validation rules DRY

## Data Flow

```
Client Request
    ↓
Routes (validate request)
    ↓
Controller (extract data)
    ↓
Service (business logic)
    ↓
Prisma (database)
    ↓
Response to Client
```

## Middleware Pattern

### Global Middleware
Located in `src/middleware/`:
- `validation.ts` - Request body validation
- `errorHandler.ts` - Error handling
- `asyncHandler.ts` - Async error wrapper

### Route-Specific Middleware
Applied in route files:
```typescript
router.post(
  '/',
  validateRequest(CreateUserSchema),  // Validation
  asyncHandler((req, res) => ...)     // Handler
);
```

## Error Handling

### AppError Class
```typescript
throw new AppError(400, 'Invalid input');
throw new AppError(404, 'User not found');
throw new AppError(500, 'Database error');
```

### Error Handler Middleware
Catches all errors and formats responses:
```typescript
{
  error: "Error message",
  timestamp: "2024-03-23T10:00:00Z",
  stack: "..." // (only in development)
}
```

## Adding a New Module

To add a new feature (e.g., `comments`):

### 1. Create Module Structure
```bash
mkdir -p src/modules/comments
```

### 2. Create Schema (`comment.schema.ts`)
```typescript
import { z } from 'zod';

export const CreateCommentSchema = z.object({
  content: z.string().min(1),
  movieId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
```

### 3. Create Service (`comment.service.ts`)
```typescript
import { prisma } from '../../config/database';
import { CreateCommentInput } from './comment.schema';

export class CommentService {
  async createComment(data: CreateCommentInput) {
    return await prisma.comment.create({ data });
  }

  async getCommentsByMovie(movieId: string) {
    return await prisma.comment.findMany({ where: { movieId } });
  }
}
```

### 4. Create Controller (`comment.controller.ts`)
```typescript
import { Request, Response } from 'express';
import { CommentService } from './comment.service';
import { AppError } from '../../middleware/errorHandler';

const service = new CommentService();

export class CommentController {
  async createComment(req: Request, res: Response) {
    const comment = await service.createComment(req.body);
    res.status(201).json(comment);
  }

  async getCommentsByMovie(req: Request, res: Response) {
    const { movieId } = req.params;
    const comments = await service.getCommentsByMovie(movieId);
    res.json(comments);
  }
}
```

### 5. Create Routes (`comment.routes.ts`)
```typescript
import { Router } from 'express';
import { CommentController } from './comment.controller';
import { validateRequest } from '../../middleware/validation';
import { CreateCommentSchema } from './comment.schema';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();
const controller = new CommentController();

router.post(
  '/',
  validateRequest(CreateCommentSchema),
  asyncHandler((req, res) => controller.createComment(req, res))
);

router.get(
  '/movie/:movieId',
  asyncHandler((req, res) => controller.getCommentsByMovie(req, res))
);

export default router;
```

### 6. Update Prisma Schema (`prisma/schema.prisma`)
```prisma
model Comment {
  id        String   @id @default(uuid())
  content   String
  movieId   String
  userId    String
  movie     Movie    @relation(fields: [movieId], references: [id])
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 7. Update Server Routes (`src/server.ts`)
```typescript
import commentsRouter from './modules/comments/comment.routes';

app.use('/api/comments', commentsRouter);
```

### 8. Update Module Exports (`src/modules/index.ts`)
```typescript
export { default as commentsRouter } from './comments/comment.routes';
```

## Best Practices

### Do's ✅
- Keep modules focused on a single feature
- Use services for database operations
- Validate input in schemas
- Use TypeScript types from schemas
- Catch and handle Prisma errors
- Use `asyncHandler` for async routes
- Keep controllers thin and readable
- Document complex business logic

### Don'ts ❌
- Don't access database directly in controllers
- Don't mix business logic in routes
- Don't create separate validation files (use schemas)
- Don't ignore async errors
- Don't hardcode configuration values
- Don't make services HTTP-aware
- Don't create circular dependencies between modules
- Don't forget to export routes to main server

## Testing

Each layer can be tested independently:

```typescript
// Test Service (no HTTP)
describe('UserService', () => {
  it('should create user', async () => {
    const user = await service.createUser({
      email: 'test@example.com',
      name: 'Test',
    });
    expect(user.email).toBe('test@example.com');
  });
});

// Test Controller (mock service)
describe('UserController', () => {
  it('should return 201 on create', async () => {
    const req = { body: { email: 'test@example.com' } };
    const res = { status: jest.fn().json: jest.fn() };
    await controller.createUser(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// Test Routes (full integration)
describe('POST /api/users', () => {
  it('should create user', async () => {
    const res = await request(app).post('/api/users').send({
      email: 'test@example.com',
      name: 'Test',
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');
  });
});
```

## Scaling Considerations

### Adding Complexity
As the project grows, you might add:

1. **Middleware per module** - Auth, rate limiting, logging
2. **Utilities per module** - Helper functions, formatters
3. **Constants per module** - Business logic constants
4. **Enums per module** - Type-safe enumerations

**New structure**:
```
module/
├── constants.ts      # Module constants
├── module.controller.ts
├── module.routes.ts
├── module.schema.ts
├── module.service.ts
├── module.types.ts   # Module-specific types
└── utils.ts         # Module utilities
```

2. **Shared Utilities** - Move common helper functions to `src/utils/`

3. **Dependency Injection** - For complex modules with many dependencies

## Summary

The modular architecture provides:
- **Organization**: Each feature is self-contained
- **Scalability**: Easy to add new features
- **Maintainability**: Clear separation of concerns
- **Testability**: Each layer can be tested independently
- **Reusability**: Services can be used across controllers
- **Flexibility**: Easy to modify or remove features

By following this pattern, your backend remains clean, organized, and easy to scale as your application grows.
