// Core API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// HTTP Client Configuration
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

export interface ApiRequestOptions {
  signal?: AbortSignal;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// HTTP Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export type RequestParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: FilterParams;
};

export type FilterParams = Record<string, unknown>;

export type PaginationParams = {
  page: number;
  pageSize: number;
};

// Service Interfaces
export interface BaseCrudService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  getAll(params?: RequestParams): Promise<ApiResponse<T[]>>;
  getById(id: string): Promise<ApiResponse<T | null>>;
  create?(data: TCreate): Promise<ApiResponse<T>>;
  update?(id: string, data: TUpdate): Promise<ApiResponse<T>>;
  delete?(id: string): Promise<ApiResponse<boolean>>;
}

export interface PaginatedCrudService<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  getAll(params?: RequestParams): Promise<ApiResponse<PaginatedResponse<T>>>;
  getById(id: string): Promise<ApiResponse<T | null>>;
  create?(data: TCreate): Promise<ApiResponse<T>>;
  update?(id: string, data: TUpdate): Promise<ApiResponse<T>>;
  delete?(id: string): Promise<ApiResponse<boolean>>;
}
