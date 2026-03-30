/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { AppError } from '../../middleware/errorHandler';

const userService = new UserService();

export class UserController {
  async getMe(req: Request, res: Response) {
    const userId = req.authUser?.id;
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({ data: user });
  }

  async updateMe(req: Request, res: Response) {
    const userId = req.authUser?.id;
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const user = await userService.updateUser(userId, req.body);
    res.json({ data: user });
  }

  async getMyPurchases(req: Request, res: Response) {
    const userId = req.authUser?.id;
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const purchases = await userService.getPurchases(userId);
    res.json({ data: purchases });
  }

  async getMySubscription(req: Request, res: Response) {
    const userId = req.authUser?.id;
    if (!userId) {
      throw new AppError(401, 'Authentication required');
    }

    const subscription = await userService.getActiveSubscription(userId);
    res.json({ data: subscription });
  }

  async getAllUsers(_req: Request, res: Response) {
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

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
      res.json(user);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(404, 'User not found');
      }
      if (error.code === 'P2002') {
        throw new AppError(400, 'Email already exists');
      }
      throw new AppError(500, 'Failed to update user');
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await userService.deleteUser(id);
      res.json({ message: 'User deleted successfully', user });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(404, 'User not found');
      }
      throw new AppError(500, 'Failed to delete user');
    }
  }
}
