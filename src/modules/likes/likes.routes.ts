import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const reviewIdParamSchema = z.object({ reviewId: z.string().uuid() });

router.post(
  '/reviews/:reviewId/like',
  authMiddleware,
  validate({ params: reviewIdParamSchema }),
  asyncHandler(async (req, res) => {
    const like = await prisma.reviewLike.upsert({
      where: {
        userId_reviewId: {
          userId: req.authUser!.id,
          reviewId: req.params.reviewId,
        },
      },
      create: {
        userId: req.authUser!.id,
        reviewId: req.params.reviewId,
      },
      update: {},
    });

    res.status(201).json({ data: like });
  })
);

router.delete(
  '/reviews/:reviewId/like',
  authMiddleware,
  validate({ params: reviewIdParamSchema }),
  asyncHandler(async (req, res) => {
    await prisma.reviewLike.deleteMany({
      where: {
        userId: req.authUser!.id,
        reviewId: req.params.reviewId,
      },
    });

    res.status(204).send();
  })
);

export default router;
