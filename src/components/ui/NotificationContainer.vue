<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, XCircle, Info, X } from 'lucide-vue-next'

const { notifications, removeNotification } = useNotifications()

const getIcon = (type: string) => {
  switch (type) {
    case 'warning': return AlertTriangle
    case 'success': return CheckCircle
    case 'error': return XCircle
    case 'info': return Info
    case 'confirm': return AlertTriangle
    default: return Info
  }
}

const getStyles = (type: string) => {
  switch (type) {
    case 'warning':
      return {
        container: 'bg-amber-50 border-amber-200',
        icon: 'text-amber-600',
        text: 'text-amber-800'
      }
    case 'success':
      return {
        container: 'bg-green-50 border-green-200',
        icon: 'text-green-600',
        text: 'text-green-800'
      }
    case 'error':
      return {
        container: 'bg-red-50 border-red-200',
        icon: 'text-red-600',
        text: 'text-red-800'
      }
    case 'info':
      return {
        container: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
        text: 'text-blue-800'
      }
    case 'confirm':
      return {
        container: 'bg-orange-50 border-orange-200',
        icon: 'text-orange-600',
        text: 'text-orange-800'
      }
    default:
      return {
        container: 'bg-gray-50 border-gray-200',
        icon: 'text-gray-600',
        text: 'text-gray-800'
      }
  }
}
</script>

<template>
  <div class="notification-container">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="mx-6 mb-4 flex items-center gap-2 px-4 py-3 border rounded-lg"
      :class="getStyles(notification.type).container"
    >
      <component 
        :is="getIcon(notification.type)" 
        class="h-4 w-4 flex-shrink-0"
        :class="getStyles(notification.type).icon"
      />
      
      <div class="flex-1">
        <p class="text-xs font-medium" :class="getStyles(notification.type).text">
          {{ notification.title }}
        </p>
        <p v-if="notification.message" class="text-xs mt-1" :class="getStyles(notification.type).text">
          {{ notification.message }}
        </p>
      </div>

      <!-- Knappar för bekräftelse -->
      <div v-if="notification.type === 'confirm'" class="flex gap-2 ml-4">
        <Button
          size="sm"
          :variant="notification.confirmVariant || 'destructive'"
          class="text-xs h-7"
          @click="notification.onConfirm?.()"
        >
          {{ notification.confirmText || 'Bekräfta' }}
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="text-xs h-7"
          @click="notification.onCancel?.()"
        >
          {{ notification.cancelText || 'Avbryt' }}
        </Button>
      </div>

      <!-- Stäng-knapp för andra typer -->
      <Button
        v-else-if="!notification.persistent || notification.type !== 'warning'"
        variant="ghost"
        size="sm"
        class="h-6 w-6 p-0 ml-2"
        @click="removeNotification(notification.id)"
      >
        <X class="h-3 w-3" />
      </Button>
    </div>
  </div>
</template>

<style scoped>
.notification-container {
  position: relative;
  z-index: 50;
}
</style> 