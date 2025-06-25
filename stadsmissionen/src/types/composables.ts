// Vue-specific imports for types
import type { Ref } from 'vue';

// Import types from other organized files
import type { Notification, Toast, ToastConfig, ToastOptions } from './ui';

// Composable return type interfaces

export interface UseToastReturn {
  toasts: Ref<Toast[]>;
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, options: Partial<ToastOptions>) => void;
  success: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  error: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  warning: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  info: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  confirm: (
    title: string,
    description?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => string;
  promise: <T>(
    promise: Promise<T>,
    options: { loading: string; success: string; error: string }
  ) => Promise<T>;
  unsavedChanges: (onSave: () => void, onDiscard: () => void) => string;
  config: ToastConfig;
  setConfig: (newConfig: Partial<ToastConfig>) => void;
}

export interface UseNotificationsReturn {
  notifications: Ref<Notification[]>;
  unreadCount: Ref<number>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}
