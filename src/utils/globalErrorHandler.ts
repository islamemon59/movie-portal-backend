/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom Application Error Classes
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: Record<string, any>
  ) {
    super(400, message, true);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message, true);
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(403, message, true);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, true);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, true);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string = 'Database operation failed',
    public originalError?: Error
  ) {
    super(500, message, false);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Global Error Handler Middleware
 */

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    timestamp: string;
    details?: Record<string, any>;
  };
  stack?: string;
}

const getErrorCode = (statusCode: number): string => {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return codes[statusCode] || 'INTERNAL_SERVER_ERROR';
};

const formatZodError = (error: ZodError): Record<string, any> => {
  const errors: Record<string, any> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = {
      message: err.message,
      code: err.code,
    };
  });
  return errors;
};

const handlePrismaError = (error: any): AppError => {
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    return new ConflictError(`${field} already exists`);
  }
  if (error.code === 'P2025') {
    return new NotFoundError('Record');
  }
  if (error.code === 'P2003') {
    return new ValidationError('Invalid foreign key reference');
  }
  if (error.code === 'P2014') {
    return new ValidationError(
      'The change you are trying to make would violate a required relation'
    );
  }
  return new DatabaseError('Database operation failed', error);
};

export const globalErrorHandler = (
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    error = new ValidationError('Validation failed', formatZodError(err));
  }
  // Handle Prisma errors
  else if ((err as any).name === 'PrismaClientKnownRequestError') {
    error = handlePrismaError(err);
  }
  // Handle custom app errors
  else if (err instanceof AppError) {
    error = err;
  }
  // Handle unknown errors
  else if (err instanceof Error) {
    console.error('Unexpected error:', err);
    error = new AppError(500, 'An unexpected error occurred', false);
  } else {
    console.error('Unknown error:', err);
    error = new AppError(500, 'An unexpected error occurred', false);
  }

  // Log error based on environment
  const logLevel = error.statusCode >= 500 ? 'error' : 'warn';
  const logMessage = `[${getErrorCode(error.statusCode)}] ${error.message}`;

  if (logLevel === 'error') {
    console.error(logMessage, {
      statusCode: error.statusCode,
      stack: error.stack,
      originalError: (error as DatabaseError).originalError,
    });
  } else {
    console.warn(logMessage, {
      statusCode: error.statusCode,
    });
  }

  // Build response
  const response: ErrorResponse = {
    success: false,
    error: {
      code: getErrorCode(error.statusCode),
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      ...(error instanceof ValidationError && error.details && { details: error.details }),
    },
  };

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors automatically
 */

export const catchAsyncError = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error Utilities
 */

export const createError = {
  badRequest: (message: string) => new ValidationError(message),
  unauthorized: (message?: string) => new AuthError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  notFound: (resource: string) => new NotFoundError(resource),
  conflict: (message: string) => new ConflictError(message),
  database: (message: string, originalError?: Error) => new DatabaseError(message, originalError),
  custom: (statusCode: number, message: string) => new AppError(statusCode, message),
};
