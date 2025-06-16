import { computed, ref } from 'vue';
import type { BaseToastOptions, Toast, UseNotificationsReturn } from '@/types';

// Global state for notifications
const notifications = ref<Toast[]>([]);
let notificationId = 0;

const generateId = (): string => {
  return `notification-${++notificationId}-${Date.now()}`;
};

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

const addNotification = (options: BaseToastOptions): string => {
  const newNotification: Toast = {
    ...options,
    id: generateId(),
    timestamp: Date.now(),
    read: false,
    actions: options.actions ?? [],
    variant: options.variant ?? 'default',
    type: options.type ?? 'info',
    duration: options.duration ?? (options.type === 'error' ? 8000 : 5000),
    persistent: options.persistent ?? false,
  };

  notifications.value.push(newNotification);

  // Auto remove after duration (except for confirm type and persistent notifications)
  if (newNotification.type !== 'confirm' && !newNotification.persistent) {
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, newNotification.duration);
  }

  return newNotification.id;
};

const removeNotification = (id: string): void => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
};

const markAsRead = (id: string): void => {
  const notification = notifications.value.find(n => n.id === id);
  if (notification) {
    notification.read = true;
  }
};

const clearAll = (): void => {
  notifications.value = [];
};

export const useNotifications = (): UseNotificationsReturn => {
  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    clearAll,
  };
};

// Export types for convenience
export type { Toast, BaseToastOptions, UseNotificationsReturn } from '@/types';
