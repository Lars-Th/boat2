import { type Ref, ref } from 'vue';
import { useToast } from '@/composables/useToast';

export interface AsyncOperationState {
  isLoading: boolean;
  error: string | null;
  data: unknown;
}

export interface AsyncOperationOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  retryCount?: number;
}

export function useAsyncOperation() {
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const data = ref<unknown>(null);
  const { success, error: showError } = useToast();

  const execute = async <T>(
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    const {
      showSuccessToast = false,
      showErrorToast = true,
      successMessage = 'Operation completed successfully',
      errorMessage = 'An error occurred',
      retryCount = 0,
    } = options;

    let attempts = 0;
    const maxAttempts = retryCount + 1;

    while (attempts < maxAttempts) {
      try {
        isLoading.value = true;
        error.value = null;

        const result = await operation();
        data.value = result;

        if (showSuccessToast) {
          success('Success', successMessage);
        }

        return result;
      } catch (err: unknown) {
        attempts++;
        let errorMsg: string;
        if (err instanceof Error) {
          errorMsg = err.message;
        } else {
          errorMsg = String(errorMessage);
        }

        if (attempts >= maxAttempts) {
          error.value = errorMsg;

          if (showErrorToast) {
            showError('Error', errorMsg);
          }

          return null;
        }

        // Wait before retry (exponential backoff)
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      } finally {
        if (attempts >= maxAttempts) {
          isLoading.value = false;
        }
      }
    }

    return null;
  };

  const reset = () => {
    isLoading.value = false;
    error.value = null;
    data.value = null;
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
    clearError,
  };
}

// Specialized composable for form operations
export function useFormOperation() {
  const { execute, isLoading, error, clearError } = useAsyncOperation();

  const submitForm = async <T>(
    formData: Record<string, unknown>,
    submitFn: (data: Record<string, unknown>) => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    return execute(() => submitFn(formData), {
      showSuccessToast: true,
      successMessage: 'Form submitted successfully',
      ...options,
    });
  };

  return {
    submitForm,
    isLoading,
    error,
    clearError,
  };
}

// Specialized composable for data fetching
export function useDataFetching<T>() {
  const { execute, isLoading, error, data, reset } = useAsyncOperation();

  const fetchData = async (
    fetchFn: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ): Promise<T | null> => {
    return execute(fetchFn, {
      showErrorToast: true,
      errorMessage: 'Failed to load data',
      retryCount: 1,
      ...options,
    });
  };

  const refetch = async (fetchFn: () => Promise<T>) => {
    reset();
    return fetchData(fetchFn);
  };

  return {
    fetchData,
    refetch,
    isLoading,
    error,
    data: data as Ref<T | null>,
    reset,
  };
}
