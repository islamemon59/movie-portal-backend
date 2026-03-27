import { Response } from 'express';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export const sendSuccess = <T>(res: Response, data: T, meta?: PaginationMeta): void => {
  res.json(meta ? { data, meta } : { data });
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
