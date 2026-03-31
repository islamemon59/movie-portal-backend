import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { CreateMovieSchema, UpdateMovieSchema } from '../schemas/movie.schema';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate.middleware';
import { NotFoundError } from '../utils/globalErrorHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/apiResponse';

const router = Router();

// Get all movies (DEPRECATED: Use /api/v1/titles instead)
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const movies = await prisma.movie.findMany();
    sendSuccess(res, movies);
  })
);

// Get movie by ID (DEPRECATED: Use /api/v1/titles/:id instead)
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const movie = await prisma.movie.findUnique({
      where: { id },
    });
    if (!movie) {
      throw new NotFoundError('Movie');
    }
    sendSuccess(res, movie);
  })
);

// Create movie (DEPRECATED: Use /api/v1/admin/movies instead)
router.post(
  '/',
  validate({ body: CreateMovieSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const movie = await prisma.movie.create({
      data: req.body,
    });
    sendCreated(res, movie);
  })
);

// Update movie (DEPRECATED: Use /api/v1/admin/movies/:id instead)
router.put(
  '/:id',
  validate({ body: UpdateMovieSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const movie = await prisma.movie.update({
      where: { id },
      data: req.body,
    });
    sendSuccess(res, movie);
  })
);

// Delete movie (DEPRECATED: Use /api/v1/admin/movies/:id instead)
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.movie.delete({
      where: { id },
    });
    sendNoContent(res);
  })
);

export default router;
