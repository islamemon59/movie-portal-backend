import { Router } from 'express';
import { ReviewStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/database';
import { asyncHandler } from '../../middleware/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ForbiddenError, NotFoundError } from '../../utils/globalErrorHandler';
import { getPagination, sendSuccess } from '../../utils/apiResponse';

const router = Router();

const contentSchema = z.object({ content: z.string().min(1).max(3000) }).strict();

router.get(
  '/reviews/:reviewId/comments',
  validate({
    params: z.object({ reviewId: z.string().uuid() }),
    query: z.object({ page: z.string().optional(), limit: z.string().optional() }),
  }),
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as { page?: string; limit?: string });
    const where = {
      reviewId: req.params.reviewId,
      status: ReviewStatus.APPROVED,
      isDeleted: false,
      parentId: null,
    };

    const [rows, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, image: true } },
          replies: {
            where: { status: ReviewStatus.APPROVED, isDeleted: false },
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    sendSuccess(res, rows, {
      page: pagination.page,
      limit: pagination.limit,
      total,
    });
  }),
);

router.post(
  '/reviews/:reviewId/comments',
  authMiddleware,
  validate({ params: z.object({ reviewId: z.string().uuid() }), body: contentSchema }),
  asyncHandler(async (req, res) => {
    const comment = await prisma.comment.create({
      data: {
        reviewId: req.params.reviewId,
        userId: req.authUser!.id,
        content: req.body.content,
        status: ReviewStatus.PENDING,
      },
    });

    res.status(201).json({ data: comment });
  }),
);

router.post(
  '/comments/:commentId/replies',
  authMiddleware,
  validate({ params: z.object({ commentId: z.string().uuid() }), body: contentSchema }),
  asyncHandler(async (req, res) => {
    const parent = await prisma.comment.findUnique({ where: { id: req.params.commentId } });
    if (!parent || parent.isDeleted) {
      throw new NotFoundError('Comment');
    }

    const reply = await prisma.comment.create({
      data: {
        reviewId: parent.reviewId,
        parentId: parent.id,
        userId: req.authUser!.id,
        content: req.body.content,
        status: ReviewStatus.PENDING,
      },
    });

    res.status(201).json({ data: reply });
  }),
);

router.patch(
  '/comments/:id',
  authMiddleware,
  validate({ params: z.object({ id: z.string().uuid() }), body: contentSchema }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Comment');
    }
    if (existing.userId !== req.authUser!.id) {
      throw new ForbiddenError('You can only edit your own comment');
    }
    if (existing.status === ReviewStatus.APPROVED) {
      throw new ForbiddenError('Approved comments cannot be edited');
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: {
        content: req.body.content,
        status: ReviewStatus.PENDING,
      },
    });

    sendSuccess(res, updated);
  }),
);

router.delete(
  '/comments/:id',
  authMiddleware,
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.comment.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.isDeleted) {
      throw new NotFoundError('Comment');
    }
    if (existing.userId !== req.authUser!.id && req.authUser!.role !== 'ADMIN') {
      throw new ForbiddenError('Not allowed to delete this comment');
    }

    await prisma.comment.update({
      where: { id: req.params.id },
      data: { isDeleted: true, status: ReviewStatus.UNPUBLISHED },
    });

    res.status(204).send();
  }),
);

router.patch(
  '/admin/comments/:id/unpublish',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { status: ReviewStatus.UNPUBLISHED },
    });

    await prisma.adminActionLog.create({
      data: {
        adminUserId: req.authUser!.id,
        targetCommentId: req.params.id,
        action: 'COMMENT_UNPUBLISH',
      },
    });

    sendSuccess(res, updated);
  }),
);

router.delete(
  '/admin/comments/:id',
  authMiddleware,
  requireRole('ADMIN'),
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    await prisma.comment.update({
      where: { id: req.params.id },
      data: { isDeleted: true, status: ReviewStatus.UNPUBLISHED },
    });

    await prisma.adminActionLog.create({
      data: {
        adminUserId: req.authUser!.id,
        targetCommentId: req.params.id,
        action: 'COMMENT_DELETE',
      },
    });

    res.status(204).send();
  }),
);

export default router;
