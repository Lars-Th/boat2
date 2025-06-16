import { ref } from 'vue';
import type { BaseToastOptions, Toast, UseToastReturn } from '@/types';

const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast(): UseToastReturn {
  const generateId = (): string => {
    return `toast-${++toastId}-${Date.now()}`;
  };

  const addToast = (options: BaseToastOptions): string => {
    const toast: Toast = {
      id: generateId(),
      title: options.title,
      description: options.description ?? '',
      variant: options.variant ?? 'default',
      type: options.type ?? 'info',
      timestamp: Date.now(),
      read: false,
      duration: options.duration ?? 5000,
      persistent: options.persistent ?? false,
      actions: options.actions ?? [],
      timeout: options.timeout,
    };

    toasts.value.push(toast);

    // Auto remove toast after duration
    if (toast.duration && toast.duration > 0 && !toast.persistent) {
      setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration);
    }

    return toast.id;
  };

  const removeToast = (id: string): void => {
    const index = toasts.value.findIndex(toast => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearToasts = (): void => {
    toasts.value = [];
  };

  const success = (
    title: string,
    description?: string,
    options: Omit<BaseToastOptions, 'type' | 'title' | 'description'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'success',
      title,
      ...(description && { description }),
    });
  };

  const error = (
    title: string,
    description?: string,
    options: Omit<BaseToastOptions, 'type' | 'title' | 'description'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'error',
      title,
      ...(description && { description }),
    });
  };

  const warning = (
    title: string,
    description?: string,
    options: Omit<BaseToastOptions, 'type' | 'title' | 'description'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'warning',
      title,
      ...(description && { description }),
    });
  };

  const info = (
    title: string,
    description?: string,
    options: Omit<BaseToastOptions, 'type' | 'title' | 'description'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'info',
      title,
      ...(description && { description }),
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };
}

// Export types for backward compatibility
export type { Toast, BaseToastOptions, ToastAction, UseToastReturn } from '@/types';
