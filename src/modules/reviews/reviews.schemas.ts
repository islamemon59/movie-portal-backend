import { z } from 'zod';

export const reviewIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const titleIdParamSchema = z.object({
  titleId: z.string().uuid(),
});

export const createReviewBodySchema = z
  .object({
    rating: z.number().int().min(1).max(10),
    content: z.string().min(1).max(5000),
    tags: z.array(z.string().min(1).max(50)).default([]),
    hasSpoiler: z.boolean().default(false),
  })
  .strict();

export const updateReviewBodySchema = createReviewBodySchema.partial().strict();

export const adminReviewQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'UNPUBLISHED']).optional(),
});
