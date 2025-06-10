import { type Ref, computed, ref, shallowRef } from 'vue';
import type { ApiError, ApiResponse } from '@/api/client/types';

export interface UseApiOptions {
  immediate?: boolean;
  cache?: boolean;
  cacheKey?: string;
  onSuccess?: (data: unknown) => void;
  onError?: (error: ApiError) => void;
}

export interface UseApiReturn<T> {
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<ApiError | null>;
  execute: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  isSuccess: Ref<boolean>;
  isError: Ref<boolean>;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const { immediate = false, cache: useCache = false, cacheKey, onSuccess, onError } = options;

  const data = shallowRef<T | null>(null);
  const loading = ref(false);
  const error = ref<ApiError | null>(null);

  const isSuccess = computed(() => data.value !== null && error.value === null);
  const isError = computed(() => error.value !== null);

  const getCachedData = (key: string): T | null => {
    if (!useCache || !key) return null;

    const cached = cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    return cached.data as T;
  };

  const setCachedData = (key: string, value: T): void => {
    if (!useCache || !key) return;

    cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  };

  const execute = async (): Promise<void> => {
    // Check cache first
    if (useCache && cacheKey) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        data.value = cachedData;
        error.value = null;
        return;
      }
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await apiCall();

      if (response.success && response.data !== null) {
        data.value = response.data;

        // Cache the data
        if (useCache && cacheKey) {
          setCachedData(cacheKey, response.data);
        }

        onSuccess?.(response.data);
      } else {
        error.value = response.error ?? {
          message: 'Unknown error occurred',
          code: 'UNKNOWN_ERROR',
        };
        onError?.(error.value);
      }
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: err,
      };
      error.value = apiError;
      onError?.(apiError);
    } finally {
      loading.value = false;
    }
  };

  const refresh = async (): Promise<void> => {
    // Clear cache for this key
    if (useCache && cacheKey) {
      cache.delete(cacheKey);
    }
    await execute();
  };

  const reset = (): void => {
    data.value = null;
    loading.value = false;
    error.value = null;
  };

  // Execute immediately if requested
  if (immediate) {
    execute();
  }

  return {
    data,
    loading,
    error,
    execute,
    refresh,
    reset,
    isSuccess,
    isError,
  };
}

// Specialized composables for common patterns
export function useApiList<T>(
  apiCall: () => Promise<ApiResponse<T[]>>,
  options: UseApiOptions = {}
) {
  const api = useApi(apiCall, { immediate: true, cache: true, ...options });

  const isEmpty = computed(
    () => api.isSuccess.value && (!api.data.value || api.data.value.length === 0)
  );

  return {
    ...api,
    isEmpty,
  };
}

export function useApiItem<T>(
  apiCall: () => Promise<ApiResponse<T | null>>,
  options: UseApiOptions = {}
) {
  return useApi(apiCall, { immediate: true, cache: true, ...options });
}

// Mutation composable for create/update/delete operations
export function useApiMutation<TData, TVariables = unknown>(
  apiCall: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options: UseApiOptions = {}
) {
  const loading = ref(false);
  const error = ref<ApiError | null>(null);
  const data = ref<TData | null>(null);

  const mutate = async (variables: TVariables): Promise<TData | null> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiCall(variables);

      if (response.success && response.data !== null) {
        data.value = response.data;
        options.onSuccess?.(response.data);
        return response.data;
      } else {
        error.value = response.error ?? {
          message: 'Mutation failed',
          code: 'MUTATION_ERROR',
        };
        options.onError?.(error.value);
        return null;
      }
    } catch (err) {
      const apiError: ApiError = {
        message: err instanceof Error ? err.message : 'Network error occurred',
        code: 'NETWORK_ERROR',
        details: err,
      };
      error.value = apiError;
      options.onError?.(apiError);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const reset = (): void => {
    data.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    mutate,
    loading,
    error,
    data,
    reset,
    isLoading: loading,
    isError: computed(() => error.value !== null),
    isSuccess: computed(() => data.value !== null && error.value === null),
  };
}
