import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

// Global state för notifikationer
const notifications = ref([])
const nextId = ref(1)

// Router instance för att lyssna på route changes
let router = null

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
  const addNotification = (type, title, message, options = {}) => {
    const notification = {
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
    if (!notification.isGlobal && notification.duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id)
      }, notification.duration)
    }

    return notification.id
  }

  // Ta bort notifikation
  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  // Rensa lokala notifikationer (vid navigering)
  const clearLocalNotifications = () => {
    notifications.value = notifications.value.filter(n => n.isGlobal)
  }

  // Rensa alla notifikationer
  const clearAllNotifications = () => {
    notifications.value = []
  }

  // Rensa notifikationer av viss typ
  const clearLocalNotificationsOfType = (type) => {
    notifications.value = notifications.value.filter(
      n => n.isGlobal || n.type !== type
    )
  }

  // Lokala notifikationer (försvinner vid navigering)
  const success = (title, message, options = {}) => {
    return addNotification('success', title, message, { ...options, isGlobal: false })
  }

  const error = (title, message, options = {}) => {
    return addNotification('error', title, message, { ...options, isGlobal: false })
  }

  const warning = (title, message, options = {}) => {
    return addNotification('warning', title, message, { ...options, isGlobal: false })
  }

  const info = (title, message, options = {}) => {
    return addNotification('info', title, message, { ...options, isGlobal: false })
  }

  // Globala notifikationer (kvarstår)
  const globalSuccess = (title, message, options = {}) => {
    return addNotification('success', title, message, { ...options, isGlobal: true })
  }

  const globalError = (title, message, options = {}) => {
    return addNotification('error', title, message, { ...options, isGlobal: true })
  }

  const globalWarning = (title, message, options = {}) => {
    return addNotification('warning', title, message, { ...options, isGlobal: true })
  }

  const globalInfo = (title, message, options = {}) => {
    return addNotification('info', title, message, { ...options, isGlobal: true })
  }

  // Bekräftelsedialog
  const confirm = (title, message, options = {}) => {
    return new Promise((resolve) => {
      const defaultOptions = {
        confirmText: 'OK',
        cancelText: 'Avbryt',
        confirmVariant: 'default'
      }
      
      const finalOptions = { ...defaultOptions, ...options }
      
      const confirmNotification = {
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
  const handleConfirm = (id, confirmed) => {
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