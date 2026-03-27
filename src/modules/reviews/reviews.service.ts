import { ReviewStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { ConflictError, ForbiddenError, NotFoundError } from '../../utils/globalErrorHandler';
import { getPagination } from '../../utils/apiResponse';

export class ReviewsService {
  async create(titleId: string, userId: string, data: { rating: number; content: string; tags?: string[]; hasSpoiler?: boolean }) {
    const title = await prisma.title.findFirst({ where: { id: titleId, isDeleted: false } });
    if (!title) {
      throw new NotFoundError('Title');
    }

    try {
      return await prisma.review.create({
        data: {
          userId,
          titleId,
          rating: data.rating,
          content: data.content,
          tags: data.tags ?? [],
          hasSpoiler: data.hasSpoiler ?? false,
          status: ReviewStatus.PENDING,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictError('You already reviewed this title');
      }
      throw error;
    }
  }

  async update(reviewId: string, userId: string, data: { rating?: number; content?: string; tags?: string[]; hasSpoiler?: boolean }) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.isDeleted) {
      throw new NotFoundError('Review');
    }
    if (review.userId !== userId) {
      throw new ForbiddenError('You can only update your own review');
    }
    if (review.status === ReviewStatus.APPROVED) {
      throw new ForbiddenError('Approved reviews cannot be edited');
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: {
        ...data,
        status: ReviewStatus.PENDING,
      },
    });
  }

  async remove(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.isDeleted) {
      throw new NotFoundError('Review');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenError('You can only delete your own review');
    }

    if (!isAdmin && review.status === ReviewStatus.APPROVED) {
      throw new ForbiddenError('Approved reviews cannot be deleted by user');
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: { isDeleted: true, status: ReviewStatus.UNPUBLISHED },
    });
  }

  async listApprovedByTitle(titleId: string, query: { page?: string; limit?: string }) {
    const pagination = getPagination(query);

    const where = {
      titleId,
      status: ReviewStatus.APPROVED,
      isDeleted: false,
    };

    const [rows, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: rows,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
      },
    };
  }

  async listForAdmin(query: { page?: string; limit?: string; status?: ReviewStatus }) {
    const pagination = getPagination(query);

    const where = {
      isDeleted: false,
      ...(query.status ? { status: query.status } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          title: { select: { id: true, title: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: rows,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
      },
    };
  }

  async approve(reviewId: string, adminUserId: string) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.APPROVED },
    });

    await prisma.adminActionLog.create({
      data: {
        adminUserId,
        targetReviewId: reviewId,
        action: 'REVIEW_APPROVE',
      },
    });

    return review;
  }

  async unpublish(reviewId: string, adminUserId: string, reason?: string) {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: ReviewStatus.UNPUBLISHED },
    });

    await prisma.adminActionLog.create({
      data: {
        adminUserId,
        targetReviewId: reviewId,
        action: 'REVIEW_UNPUBLISH',
        reason,
      },
    });

    return review;
  }
}
