import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { CreateMovieSchema, UpdateMovieSchema } from '../schemas/movie.schema';
import { z } from 'zod';

const router = Router();

// Get all movies
router.get('/', async (req: Request, res: Response) => {
  try {
    const movies = await prisma.movie.findMany();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

// Get movie by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movie = await prisma.movie.findUnique({
      where: { id },
    });
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// Create movie
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateMovieSchema.parse(req.body);
    const movie = await prisma.movie.create({
      data: validatedData,
    });
    res.status(201).json(movie);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to create movie' });
  }
});

// Update movie
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateMovieSchema.parse(req.body);
    const movie = await prisma.movie.update({
      where: { id },
      data: validatedData,
    });
    res.json(movie);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update movie' });
  }
});

// Delete movie
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.movie.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete movie' });
  }
});

export default router;
