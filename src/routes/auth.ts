import { Router, Request, Response } from 'express';
import { auth } from '../config/auth';

const authRouter = Router();

// Better Auth will handle all auth routes at /api/auth/*
authRouter.all('*', async (req: Request, _res: Response) => {
  return await auth.handler(req as any);
});

export default authRouter;
