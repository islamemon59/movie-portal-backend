// This file is kept for backward compatibility
// All error handling has been moved to src/utils/globalErrorHandler.ts

export { 
  AppError,
  ValidationError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  globalErrorHandler,
  catchAsyncError,
  createError,
} from '../utils/globalErrorHandler';
