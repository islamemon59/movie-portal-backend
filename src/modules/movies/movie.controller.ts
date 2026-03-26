import { Request, Response } from 'express';
import { MovieService } from './movie.service';
import { AppError } from '../../middleware/errorHandler';

const movieService = new MovieService();

export class MovieController {
  async getAllMovies(_req: Request, res: Response) {
    try {
      const movies = await movieService.getAllMovies();
      res.json(movies);
    } catch (error) {
      throw new AppError(500, 'Failed to fetch movies');
    }
  }

  async getMovieById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const movie = await movieService.getMovieById(id);

      if (!movie) {
        throw new AppError(404, 'Movie not found');
      }

      res.json(movie);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to fetch movie');
    }
  }

  async createMovie(req: Request, res: Response) {
    try {
      const movie = await movieService.createMovie(req.body);
      res.status(201).json(movie);
    } catch (error) {
      throw new AppError(500, 'Failed to create movie');
    }
  }

  async updateMovie(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const movie = await movieService.updateMovie(id, req.body);
      res.json(movie);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(404, 'Movie not found');
      }
      throw new AppError(500, 'Failed to update movie');
    }
  }

  async deleteMovie(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await movieService.deleteMovie(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(404, 'Movie not found');
      }
      throw new AppError(500, 'Failed to delete movie');
    }
  }
}
