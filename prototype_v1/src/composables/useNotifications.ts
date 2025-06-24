import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Type definitions
export interface NotificationOptions {
  isGlobal?: boolean
  duration?: number
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  isGlobal: boolean
  duration?: number
  createdAt: number
  options?: NotificationOptions
  resolve?: (_value: boolean) => void
}

// Global state för notifikationer
const notifications = ref<Notification[]>([])
const nextId = ref(1)

// Router instance för att lyssna på route changes
let router = useRouter()

export function useNotifications() {
  // Sätt router om den inte redan är satt
  if (!router) {
    router = useRouter()
    
    // Lyssna på route changes och rensa lokala notifikationer
    router.beforeEach(() => {
      clearLocalNotifications()
    })
  }

  // Lägg till notifikation
  const addNotification = (
    type: Notification['type'], 
    title: string, 
    message: string, 
    options: NotificationOptions = {}
  ): number => {
    const notification: Notification = {
      id: nextId.value++,
      type,
      title,
      message,
      isGlobal: options.isGlobal || false,
      duration: options.duration || (type === 'error' ? 8000 : 5000),
      createdAt: Date.now()
    }

    notifications.value.unshift(notification)

    // Auto-remove efter duration (om inte global)
    if (!notification.isGlobal && notification.duration && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Ta bort notifikation
  const removeNotification = (id: number): void => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  // Rensa lokala notifikationer (vid navigering)
  const clearLocalNotifications = (): void => {
    notifications.value = notifications.value.filter(n => n.isGlobal)
  }

  // Rensa alla notifikationer
  const clearAllNotifications = (): void => {
    notifications.value = []
  }

  // Rensa notifikationer av viss typ
  const clearLocalNotificationsOfType = (type: Notification['type']): void => {
    notifications.value = notifications.value.filter(
      n => n.isGlobal || n.type !== type
    )
  }

  // Lokala notifikationer (försvinner vid navigering)
  const success = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('success', title, message, { ...options, isGlobal: false })
  }

  const error = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('error', title, message, { ...options, isGlobal: false })
  }

  const warning = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('warning', title, message, { ...options, isGlobal: false })
  }

  const info = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('info', title, message, { ...options, isGlobal: false })
  }

  // Globala notifikationer (kvarstår)
  const globalSuccess = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('success', title, message, { ...options, isGlobal: true })
  }

  const globalError = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('error', title, message, { ...options, isGlobal: true })
  }

  const globalWarning = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('warning', title, message, { ...options, isGlobal: true })
  }

  const globalInfo = (title: string, message: string, options: NotificationOptions = {}): number => {
    return addNotification('info', title, message, { ...options, isGlobal: true })
  }

  // Bekräftelsedialog
  const confirm = (title: string, message: string, options: NotificationOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      const defaultOptions: NotificationOptions = {
        confirmText: 'OK',
        cancelText: 'Avbryt',
        confirmVariant: 'default'
      }
      
      const finalOptions = { ...defaultOptions, ...options }
      
      const confirmNotification: Notification = {
        id: nextId.value++,
        type: 'confirm',
        title,
        message,
        isGlobal: true,
        options: finalOptions,
        resolve,
        createdAt: Date.now()
      }

      notifications.value.unshift(confirmNotification)
    })
  }

  // Hantera bekräftelse
  const handleConfirm = (id: number, confirmed: boolean): void => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification && notification.resolve) {
      notification.resolve(confirmed)
      removeNotification(id)
    }
  }

  return {
    notifications: notifications,
    
    // Lokala notifikationer
    success,
    error,
    warning,
    info,
    
    // Globala notifikationer
    globalSuccess,
    globalError,
    globalWarning,
    globalInfo,
    
    // Bekräftelse
    confirm,
    handleConfirm,
    
    // Hantering
    removeNotification,
    clearLocalNotifications,
    clearAllNotifications,
    clearLocalNotificationsOfType
  }
} 