import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { CreateUserSchema, UpdateUserSchema } from '../schemas/user.schema';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate.middleware';
import { NotFoundError } from '../utils/globalErrorHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse';

const router = Router();

// Get all users (DEPRECATED: Use /api/v1/users instead)
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    sendSuccess(res, users);
  })
);

// Get user by ID (DEPRECATED: Use /api/v1/users/:id instead)
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundError('User');
    }
    sendSuccess(res, user);
  })
);

// Create user (DEPRECATED: Use /api/v1/auth/register instead)
router.post(
  '/',
  validate({ body: CreateUserSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.create({
      data: req.body,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    sendCreated(res, user);
  })
);

// Update user (DEPRECATED: Use /api/v1/users/me instead)
router.put(
  '/:id',
  validate({ body: UpdateUserSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id },
      data: req.body,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
    sendSuccess(res, user);
  })
);

// Delete user (DEPRECATED - Use /api/v1/users/:id instead)
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.user.deleteMany({
      where: { id },
    });
    sendNoContent(res);
  }
});

export default router;
