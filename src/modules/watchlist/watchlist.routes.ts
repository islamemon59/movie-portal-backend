import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getPagination, sendSuccess } from '../../utils/apiResponse';

const router = Router();

router.get(
  '/watchlist',
  authMiddleware,
  validate({ query: z.object({ page: z.string().optional(), limit: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as { page?: string; limit?: string });
    const where = { userId: req.authUser!.id };

    const [rows, total] = await Promise.all([
      prisma.watchlistItem.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          title: true,
        },
      }),
      prisma.watchlistItem.count({ where }),
    ]);

    sendSuccess(res, rows, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  }),
);

router.post(
  '/watchlist',
  authMiddleware,
  validate({ body: z.object({ titleId: z.string().uuid() }).strict() }),
  asyncHandler(async (req, res) => {
    const created = await prisma.watchlistItem.upsert({
      where: {
        userId_titleId: {
          userId: req.authUser!.id,
          titleId: req.body.titleId,
        },
      },
      update: {},
      create: {
        userId: req.authUser!.id,
        titleId: req.body.titleId,
      },
    });

    res.status(201).json({ data: created });
  }),
);

router.delete(
  '/watchlist/:titleId',
  authMiddleware,
  validate({ params: z.object({ titleId: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    await prisma.watchlistItem.deleteMany({
      where: {
        userId: req.authUser!.id,
        titleId: req.params.titleId,
      },
    });

    res.status(204).send();
  }),
);

export default router;
