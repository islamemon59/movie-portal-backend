import { NextFunction, Request, Response } from 'express';
import { ForbiddenError } from '../utils/globalErrorHandler';

export const requireRole = (...roles: Array<'USER' | 'ADMIN'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    if (!roles.includes(req.authUser.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
};
