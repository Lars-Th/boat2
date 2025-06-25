// Composable return type interfaces
export interface UseApiOptions<T = unknown> {
  immediate?: boolean;
  cache?: boolean;
  cacheKey?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

export interface UseApiReturn<T> {
  data: any;
  loading: any;
  error: any;
  execute: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
  isSuccess: any;
  isError: any;
}

export interface UseToastReturn {
  toast: (message: string, options?: any) => void;
  success: (message: string, options?: any) => void;
  error: (message: string, options?: any) => void;
  warning: (message: string, options?: any) => void;
  info: (message: string, options?: any) => void;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
}

export interface UseNotificationsReturn {
  notifications: any;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}
