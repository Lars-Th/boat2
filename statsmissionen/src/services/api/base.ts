import type { ApiResponse, ApiError } from '@/types/api'

export interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

export class BaseApiService {
  protected config: ApiConfig

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    }
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as T
      
      return {
        data,
        success: true,
        message: 'Request successful',
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'FETCH_ERROR',
        details: error,
      }

      return {
        data: null as unknown as T,
        success: false,
        error: apiError,
      }
    }
  }

  protected async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  protected async post<T>(
    endpoint: string,
    data: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  protected async put<T>(
    endpoint: string,
    data: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
} 