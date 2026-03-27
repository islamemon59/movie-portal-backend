import { NextFunction, Request, Response } from 'express';
import { z, ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/globalErrorHandler';

type RequestSchema = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validate = (schema: RequestSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { issues: error.flatten() }));
        return;
      }
      next(error);
    }
  };
};
