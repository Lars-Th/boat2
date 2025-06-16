import { ref } from 'vue';
import type { Toast, ToastOptions, UseToastReturn } from '@/types';

const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast(): UseToastReturn {
  const generateId = (): string => {
    return `toast-${++toastId}-${Date.now()}`;
  };

  const addToast = (options: ToastOptions): string => {
    const toast: Toast = {
      id: generateId(),
      title: options.title,
      message: options.message,
      description: options.description ?? options.message ?? '',
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
    if (toast.duration && toast.duration > 0) {
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
    message?: string,
    options: Omit<ToastOptions, 'type' | 'title' | 'message'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'success',
      title,
      ...(message && { message }),
    });
  };

  const error = (
    title: string,
    message?: string,
    options: Omit<ToastOptions, 'type' | 'title' | 'message'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'error',
      title,
      ...(message && { message }),
    });
  };

  const warning = (
    title: string,
    message?: string,
    options: Omit<ToastOptions, 'type' | 'title' | 'message'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'warning',
      title,
      ...(message && { message }),
    });
  };

  const info = (
    title: string,
    message?: string,
    options: Omit<ToastOptions, 'type' | 'title' | 'message'> = {}
  ): string => {
    return addToast({
      ...options,
      type: 'info',
      title,
      ...(message && { message }),
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
export type { Toast, ToastOptions, ToastAction, UseToastReturn } from '@/types';
