import { z } from 'zod';

export const MovieSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  releaseDate: z.date().nullable().optional(),
  posterUrl: z.string().url().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateMovieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  releaseDate: z.string().datetime().optional(),
  posterUrl: z.string().url().optional(),
});

export const UpdateMovieSchema = CreateMovieSchema.partial();

export type Movie = z.infer<typeof MovieSchema>;
export type CreateMovieInput = z.infer<typeof CreateMovieSchema>;
export type UpdateMovieInput = z.infer<typeof UpdateMovieSchema>;
