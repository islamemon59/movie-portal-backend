import { prisma } from '../../config/database';
import { CreateMovieInput, UpdateMovieInput } from './movie.schema';

export class MovieService {
  async getAllMovies() {
    return await prisma.movie.findMany();
  }

  async getMovieById(id: string) {
    return await prisma.movie.findUnique({
      where: { id },
    });
  }

  async createMovie(data: CreateMovieInput) {
    return await prisma.movie.create({
      data,
    });
  }

  async updateMovie(id: string, data: UpdateMovieInput) {
    return await prisma.movie.update({
      where: { id },
      data,
    });
  }

  async deleteMovie(id: string) {
    return await prisma.movie.delete({
      where: { id },
    });
  }
}
