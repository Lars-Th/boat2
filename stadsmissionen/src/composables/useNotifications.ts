import { computed, ref } from 'vue';
import type { Notification, UseNotificationsReturn } from '@/types';

// Global state for notifications
const notifications = ref<Notification[]>([]);
let notificationId = 0;

const generateId = (): string => {
  return `notification-${++notificationId}-${Date.now()}`;
};

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void => {
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    timestamp: Date.now(),
    read: false,
    actions: notification.actions ?? [],
    message: notification.message,
  };

  notifications.value.push(newNotification);

  // Auto remove after duration (except for confirm type)
  if (newNotification.type !== 'confirm') {
    const duration = newNotification.type === 'error' ? 8000 : 5000;
    setTimeout(() => {
      removeNotification(newNotification.id);
    }, duration);
  }
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
export type { Notification, UseNotificationsReturn } from '@/types';
