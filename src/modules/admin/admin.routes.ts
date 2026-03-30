import { Router } from 'express';
import { ReviewStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { getPagination, sendSuccess } from '../../utils/apiResponse';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware, requireRole('ADMIN'));

router.get(
  '/admin/dashboard',
  asyncHandler(async (_req, res) => {
    const [users, titles, pendingReviews, activeSubscriptions] = await Promise.all([
      prisma.user.count(),
      prisma.title.count({ where: { isDeleted: false } }),
      prisma.review.count({ where: { status: ReviewStatus.PENDING, isDeleted: false } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    sendSuccess(res, {
      users,
      titles,
      pendingReviews,
      activeSubscriptions,
    });
  })
);

router.get(
  '/admin/stats/titles/top-rated',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.review.groupBy({
      by: ['titleId'],
      where: { status: ReviewStatus.APPROVED, isDeleted: false },
      _avg: { rating: true },
      _count: { id: true },
      orderBy: { _avg: { rating: 'desc' } },
      take: 10,
    });

    const titles = await prisma.title.findMany({
      where: { id: { in: rows.map((r) => r.titleId) } },
      select: { id: true, title: true, slug: true },
    });

    const mapped = rows.map((r) => ({
      title: titles.find((t) => t.id === r.titleId),
      avgRating: r._avg.rating,
      reviewCount: r._count.id,
    }));

    sendSuccess(res, mapped);
  })
);

router.get(
  '/admin/stats/titles/most-reviewed',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.review.groupBy({
      by: ['titleId'],
      where: { isDeleted: false },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    const titles = await prisma.title.findMany({
      where: { id: { in: rows.map((r) => r.titleId) } },
      select: { id: true, title: true, slug: true },
    });

    sendSuccess(
      res,
      rows.map((r) => ({
        title: titles.find((t) => t.id === r.titleId),
        reviewCount: r._count.id,
      }))
    );
  })
);

router.get(
  '/admin/stats/revenue',
  asyncHandler(async (_req, res) => {
    const [stripeCount, sslCount, activeSubs] = await Promise.all([
      prisma.paymentEvent.count({ where: { provider: 'STRIPE', processedAt: { not: null } } }),
      prisma.paymentEvent.count({ where: { provider: 'SSLCOMMERZ', processedAt: { not: null } } }),
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    sendSuccess(res, {
      stripeEvents: stripeCount,
      sslcommerzEvents: sslCount,
      activeSubscriptions: activeSubs,
    });
  })
);

router.get(
  '/admin/audit-logs',
  validate({ query: z.object({ page: z.string().optional(), limit: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as { page?: string; limit?: string });
    const [rows, total] = await Promise.all([
      prisma.adminActionLog.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.adminActionLog.count(),
    ]);

    sendSuccess(res, rows, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  })
);

export default router;
