import { Prisma, ReviewStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { getPagination } from '../../utils/apiResponse';

type ListTitlesInput = {
  page?: string;
  limit?: string;
  type?: 'MOVIE' | 'SERIES';
  year?: string;
  genre?: string;
  platform?: string;
  minRating?: string;
};

export class TitlesService {
  async listTitles(query: ListTitlesInput) {
    const pagination = getPagination(query);

    const where: Prisma.TitleWhereInput = {
      isDeleted: false,
      isPublished: true,
      ...(query.type ? { type: query.type } : {}),
      ...(query.year ? { releaseYear: Number(query.year) } : {}),
      ...(query.genre
        ? {
            genres: {
              some: {
                genre: {
                  name: { equals: query.genre, mode: 'insensitive' },
                },
              },
            },
          }
        : {}),
      ...(query.platform
        ? {
            platforms: {
              some: {
                platform: {
                  name: { equals: query.platform, mode: 'insensitive' },
                },
              },
            },
          }
        : {}),
    };

    const [titles, total] = await Promise.all([
      prisma.title.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          platforms: { include: { platform: true } },
          _count: { select: { reviews: true, watchlistBy: true } },
        },
      }),
      prisma.title.count({ where }),
    ]);

    const filtered =
      query.minRating !== undefined
        ? titles.filter((t) => {
            const approved = t._count.reviews;
            return approved >= Number(query.minRating);
          })
        : titles;

    return {
      data: filtered,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
      },
    };
  }

  async getById(id: string) {
    return prisma.title.findFirst({
      where: { id, isDeleted: false, isPublished: true },
      include: {
        genres: { include: { genre: true } },
        platforms: { include: { platform: true } },
      },
    });
  }

  async getAggregate(id: string) {
    const [stats, likesCount, commentsCount] = await Promise.all([
      prisma.review.aggregate({
        where: { titleId: id, status: ReviewStatus.APPROVED, isDeleted: false },
        _avg: { rating: true },
        _count: { id: true },
      }),
      prisma.reviewLike.count({ where: { review: { titleId: id, status: ReviewStatus.APPROVED } } }),
      prisma.comment.count({ where: { review: { titleId: id, status: ReviewStatus.APPROVED } } }),
    ]);

    return {
      avgRating: stats._avg.rating,
      reviewCount: stats._count.id,
      likeCount: likesCount,
      commentCount: commentsCount,
    };
  }

  async create(data: {
    title: string;
    slug: string;
    description?: string;
    type: 'MOVIE' | 'SERIES';
    priceTier?: 'FREE' | 'PREMIUM';
    releaseYear?: number;
    posterUrl?: string;
    backdropUrl?: string;
    trailerUrl?: string;
    durationMin?: number;
    isPublished?: boolean;
    genreIds?: string[];
    platformIds?: string[];
  }) {
    const { genreIds, platformIds, ...base } = data;

    return prisma.title.create({
      data: {
        ...base,
        genres: genreIds?.length
          ? {
              create: genreIds.map((genreId) => ({ genreId })),
            }
          : undefined,
        platforms: platformIds?.length
          ? {
              create: platformIds.map((platformId) => ({ platformId })),
            }
          : undefined,
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    slug?: string;
    description?: string;
    type?: 'MOVIE' | 'SERIES';
    priceTier?: 'FREE' | 'PREMIUM';
    releaseYear?: number;
    posterUrl?: string;
    backdropUrl?: string;
    trailerUrl?: string;
    durationMin?: number;
    isPublished?: boolean;
    genreIds?: string[];
    platformIds?: string[];
  }) {
    const { genreIds, platformIds, ...base } = data;

    return prisma.$transaction(async (tx) => {
      if (genreIds) {
        await tx.titleGenre.deleteMany({ where: { titleId: id } });
      }
      if (platformIds) {
        await tx.titlePlatform.deleteMany({ where: { titleId: id } });
      }

      return tx.title.update({
        where: { id },
        data: {
          ...base,
          genres: genreIds
            ? {
                create: genreIds.map((genreId) => ({ genreId })),
              }
            : undefined,
          platforms: platformIds
            ? {
                create: platformIds.map((platformId) => ({ platformId })),
              }
            : undefined,
        },
      });
    });
  }

  async softDelete(id: string) {
    return prisma.title.update({
      where: { id },
      data: { isDeleted: true, isPublished: false },
    });
  }
}
