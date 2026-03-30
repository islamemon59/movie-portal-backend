import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  adminReviewQuerySchema,
  createReviewBodySchema,
  reviewIdParamSchema,
  titleIdParamSchema,
  updateReviewBodySchema,
} from './reviews.schemas';
import { ReviewsController } from './reviews.controller';

const router = Router();
const controller = new ReviewsController();

router.post(
  '/titles/:titleId/reviews',
  authMiddleware,
  validate({ params: titleIdParamSchema, body: createReviewBodySchema }),
  asyncHandler((req, res) => controller.create(req, res))
);

router.patch(
  '/reviews/:id',
  authMiddleware,
  validate({ params: reviewIdParamSchema, body: updateReviewBodySchema }),
  asyncHandler((req, res) => controller.update(req, res))
);

router.delete(
  '/reviews/:id',
  authMiddleware,
  validate({ params: reviewIdParamSchema }),
  asyncHandler((req, res) => controller.remove(req, res))
);

router.get(
  '/titles/:titleId/reviews',
  validate({
    params: titleIdParamSchema,
    query: z.object({ page: z.string().optional(), limit: z.string().optional() }),
  }),
  asyncHandler((req, res) => controller.listApprovedByTitle(req, res))
);

router.get(
  '/admin/reviews',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ query: adminReviewQuerySchema }),
  asyncHandler((req, res) => controller.listForAdmin(req, res))
);

router.patch(
  '/admin/reviews/:id/approve',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ params: reviewIdParamSchema }),
  asyncHandler((req, res) => controller.approve(req, res))
);

router.patch(
  '/admin/reviews/:id/unpublish',
  authMiddleware,
  requireRole('ADMIN'),
  validate({
    params: reviewIdParamSchema,
    body: z.object({ reason: z.string().max(500).optional() }).strict(),
  }),
  asyncHandler((req, res) => controller.unpublish(req, res))
);

router.delete(
  '/admin/reviews/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ params: reviewIdParamSchema }),
  asyncHandler((req, res) => controller.remove(req, res))
);

export default router;
