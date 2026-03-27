import { Router } from 'express';
import { UserController } from './user.controller';
import { validateRequest } from '../../middleware/validation';
import { CreateUserSchema, UpdateUserSchema } from './user.schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.get('/me', authMiddleware, asyncHandler((req, res) => userController.getMe(req, res)));
router.patch('/me', authMiddleware, validateRequest(UpdateUserSchema), asyncHandler((req, res) => userController.updateMe(req, res)));
router.get('/me/purchases', authMiddleware, asyncHandler((req, res) => userController.getMyPurchases(req, res)));
router.get('/me/subscription', authMiddleware, asyncHandler((req, res) => userController.getMySubscription(req, res)));

// Get all users
router.get(
  '/',
  asyncHandler((req, res) => userController.getAllUsers(req, res))
);

// Get user by ID
router.get(
  '/:id',
  asyncHandler((req, res) => userController.getUserById(req, res))
);

// Create user
router.post(
  '/',
  validateRequest(CreateUserSchema),
  asyncHandler((req, res) => userController.createUser(req, res))
);

// Update user
router.put(
  '/:id',
  validateRequest(UpdateUserSchema),
  asyncHandler((req, res) => userController.updateUser(req, res))
);

// Delete user
router.delete(
  '/:id',
  asyncHandler((req, res) => userController.deleteUser(req, res))
);

export default router;
