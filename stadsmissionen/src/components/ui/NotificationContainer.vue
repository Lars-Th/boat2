<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, HelpCircle, Info, X, XCircle } from 'lucide-vue-next';

const { notifications, removeNotification } = useNotifications();

const getIcon = (type: string = 'info') => {
  const icons: Record<string, unknown> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
    confirm: HelpCircle,
  };
  return icons[type] ?? icons['info'];
};

const getStyles = (type: string = 'info') => {
  const styles: Record<string, Record<string, string>> = {
    info: {
      container: 'border-blue-200 bg-blue-50',
      icon: 'text-blue-600',
      text: 'text-blue-800',
    },
    success: {
      container: 'border-green-200 bg-green-50',
      icon: 'text-green-600',
      text: 'text-green-800',
    },
    warning: {
      container: 'border-yellow-200 bg-yellow-50',
      icon: 'text-yellow-600',
      text: 'text-yellow-800',
    },
    error: {
      container: 'border-red-200 bg-red-50',
      icon: 'text-red-600',
      text: 'text-red-800',
    },
    confirm: {
      container: 'border-purple-200 bg-purple-50',
      icon: 'text-purple-600',
      text: 'text-purple-800',
    },
  };
  return styles[type] ?? styles['info'];
};
</script>

<template>
  <div class="notification-container">
    <div
      v-for="notification in notifications"
      :key="notification.id"
      class="mx-6 mb-4 flex items-center gap-2 px-4 py-3 border rounded-lg"
      :class="getStyles(notification.type)?.['container']"
    >
      <component
        :is="getIcon(notification.type)"
        class="h-4 w-4 flex-shrink-0"
        :class="getStyles(notification.type)?.['icon']"
      />

      <div class="flex-1">
        <p class="text-xs font-medium" :class="getStyles(notification.type)?.['text']">
          {{ notification.title }}
        </p>
        <p
          v-if="notification.message"
          class="text-xs mt-1"
          :class="getStyles(notification.type)?.['text']"
        >
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
        <Button size="sm" variant="outline" class="text-xs h-7" @click="notification.onCancel?.()">
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
