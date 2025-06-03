import { ref, type Ref } from "vue";

export interface Toast {
  id: number;
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration: number;
  position:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
}

export interface ToastOptions {
  type?: Toast["type"];
  title: string;
  message?: string;
  duration?: number;
  position?: Toast["position"];
}

export interface UseToastReturn {
  toasts: Ref<Toast[]>;
  showToast: (options: ToastOptions) => number;
  removeToast: (id: number) => void;
  success: (
    title: string,
    message?: string,
    options?: Partial<ToastOptions>
  ) => number;
  error: (
    title: string,
    message?: string,
    options?: Partial<ToastOptions>
  ) => number;
  warning: (
    title: string,
    message?: string,
    options?: Partial<ToastOptions>
  ) => number;
  info: (
    title: string,
    message?: string,
    options?: Partial<ToastOptions>
  ) => number;
  clearAll: () => void;
}

const toasts = ref<Toast[]>([]);
let toastId = 0;

export function useToast(): UseToastReturn {
  const showToast = (options: ToastOptions): number => {
    const id = ++toastId;
    const toast: Toast = {
      id,
      show: true,
      type: options.type || "success",
      title: options.title,
      message: options.message || "",
      duration: options.duration || 3000,
      position: options.position || "top-center",
    };

    toasts.value.push(toast);

    // Auto remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  };

  const removeToast = (id: number): void => {
    const index = toasts.value.findIndex((toast: Toast) => toast.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const success = (
    title: string,
    message?: string,
    options: Partial<ToastOptions> = {}
  ): number => {
    return showToast({
      type: "success",
      title,
      message,
      ...options,
    });
  };

  const error = (
    title: string,
    message?: string,
    options: Partial<ToastOptions> = {}
  ): number => {
    return showToast({
      type: "error",
      title,
      message,
      ...options,
    });
  };

  const warning = (
    title: string,
    message?: string,
    options: Partial<ToastOptions> = {}
  ): number => {
    return showToast({
      type: "warning",
      title,
      message,
      ...options,
    });
  };

  const info = (
    title: string,
    message?: string,
    options: Partial<ToastOptions> = {}
  ): number => {
    return showToast({
      type: "info",
      title,
      message,
      ...options,
    });
  };

  const clearAll = (): void => {
    toasts.value = [];
  };

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
    clearAll,
  };
}
