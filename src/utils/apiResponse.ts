import { Response } from 'express';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export const sendSuccess = <T>(res: Response, data: T, meta?: PaginationMeta): void => {
  res.json(meta ? { data, meta } : { data });
};

/**
 * Send success response with custom status code
 */
export const sendSuccessWithStatus = <T>(
  res: Response,
  statusCode: number,
  data: T,
  meta?: PaginationMeta
): void => {
  res.status(statusCode).json(meta ? { data, meta } : { data });
};

/**
 * Send created response (201)
 */
export const sendCreated = <T>(res: Response, data: T): void => {
  res.status(201).json({ data });
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};

/**
 * Send response with message
 */
export const sendMessage = (res: Response, statusCode: number, message: string): void => {
  res.status(statusCode).json({ message });
};

export const getPagination = (query: { page?: string; limit?: string }) => {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};
