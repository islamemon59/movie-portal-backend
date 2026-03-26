import { Request, Response } from 'express';
import { UserService } from './user.service';
import { AppError } from '../../middleware/errorHandler';

const userService = new UserService();

export class UserController {
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      throw new AppError(500, 'Failed to fetch users');
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      res.json(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Failed to fetch user');
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError(400, 'Email already exists');
      }
      throw new AppError(500, 'Failed to create user');
    }
  }

}