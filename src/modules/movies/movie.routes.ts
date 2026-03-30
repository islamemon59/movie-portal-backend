import { Router } from 'express';
import { MovieController } from './movie.controller';
import { validateRequest } from '../../middleware/validation';
import { CreateMovieSchema, UpdateMovieSchema } from './movie.schema';
import { asyncHandler } from '../../middleware/asyncHandler';

const router = Router();
const movieController = new MovieController();

// Get all movies
router.get(
  '/',
  asyncHandler((req, res) => movieController.getAllMovies(req, res))
);

// Get movie by ID
router.get(
  '/:id',
  asyncHandler((req, res) => movieController.getMovieById(req, res))
);

// Create movie
router.post(
  '/',
  validateRequest(CreateMovieSchema),
  asyncHandler((req, res) => movieController.createMovie(req, res))
);

// Update movie
router.put(
  '/:id',
  validateRequest(UpdateMovieSchema),
  asyncHandler((req, res) => movieController.updateMovie(req, res))
);

// Delete movie
router.delete(
  '/:id',
  asyncHandler((req, res) => movieController.deleteMovie(req, res))
);

export default router;
