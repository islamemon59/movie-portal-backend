/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

declare module 'express' {
  interface Request {
    user?: any;
    session?: any;
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get session token from header or cookies
    const authHeader = req.headers.authorization?.split(' ')[1];
    const sessionToken =
      req.cookies?.['better-auth.session_token'] || req.headers['x-session-token'] || authHeader;

    if (!sessionToken) {
      res.status(401).json({ error: 'No session token provided' });
      return;
    }

    // Verify session against database
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
