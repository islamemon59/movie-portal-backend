import { z } from 'zod';

export const titleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const titlesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  genre: z.string().optional(),
  platform: z.string().optional(),
  year: z.string().optional(),
  minRating: z.string().optional(),
  type: z.enum(['MOVIE', 'SERIES']).optional(),
});

export const createTitleBodySchema = z
  .object({
    title: z.string().min(1).max(250),
    slug: z
      .string()
      .min(1)
      .max(250)
      .regex(/^[a-z0-9-]+$/),
    description: z.string().max(5000).optional(),
    type: z.enum(['MOVIE', 'SERIES']),
    priceTier: z.enum(['FREE', 'PREMIUM']).default('FREE'),
    releaseYear: z.number().int().min(1900).max(2100).optional(),
    posterUrl: z.string().url().optional(),
    backdropUrl: z.string().url().optional(),
    trailerUrl: z.string().url().optional(),
    durationMin: z.number().int().positive().optional(),
    isPublished: z.boolean().optional(),
    genreIds: z.array(z.string().uuid()).optional(),
    platformIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

export const updateTitleBodySchema = createTitleBodySchema.partial().strict();
