// Common API response types

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
  timestamp: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  error: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
