import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthError } from '../utils/globalErrorHandler';

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: {
      id: string;
      email: string;
      role: 'USER' | 'ADMIN';
      name?: string | null;
    };
    sessionId?: string;
  }
}

const parseToken = (req: Request): string | null => {
  const authHeader = req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const sessionToken = req.header('x-session-token');
  if (sessionToken?.trim()) {
    return sessionToken.trim();
  }

  return null;
};

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = parseToken(req);
    if (!token) {
      throw new AuthError('Missing session token');
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      throw new AuthError('Invalid or expired session');
    }

    req.authUser = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name,
    };
    req.sessionId = session.id;

    next();
  } catch (error) {
    next(error);
  }
};
