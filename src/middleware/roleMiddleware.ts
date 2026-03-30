import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthError } from '../utils/globalErrorHandler';

/**
 * Helper to create role-based access middleware
 * Can specify required roles and whether admin can bypass by default
 */
export const createRoleMiddleware = (
  requiredRoles: string[],
  adminBypassEnabled: boolean = true
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.authUser) {
      throw new AuthError('Not authenticated');
    }

    // Admin can access any protected route by default
    if (adminBypassEnabled && req.authUser.role === 'ADMIN') {
      return next();
    }

    // Check if user has required role
    if (!requiredRoles.includes(req.authUser.role)) {
      throw new ForbiddenError(`This route is only accessible to: ${requiredRoles.join(', ')}`);
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.authUser) {
    throw new AuthError('Not authenticated');
  }

  if (req.authUser.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }

  next();
};

/**
 * Check if user is regular user (not admin)
 */
export const isUser = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.authUser) {
    throw new AuthError('Not authenticated');
  }

  if (req.authUser.role !== 'USER') {
    throw new ForbiddenError('User access required');
  }

  next();
};

/**
 * Check if user own the resource or is admin
 */
export const isOwnerOrAdmin = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.authUser) {
    throw new AuthError('Not authenticated');
  }

  // Admin can access any resource
  if (req.authUser.role === 'ADMIN') {
    return next();
  }

  // User can access their own resources
  const resourceUserId = req.body.userId || req.params.userId;
  if (resourceUserId === req.authUser.id) {
    return next();
  }

  throw new ForbiddenError('You do not have permission to access this resource');
};
