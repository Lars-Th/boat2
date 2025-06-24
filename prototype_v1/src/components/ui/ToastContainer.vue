<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import Toast from './Toast.vue'

const { notifications, removeNotification, handleConfirm } = useNotifications()
</script>

<template>
  <div class="fixed top-0 right-0 z-50 p-4 space-y-2">
    <Toast
      v-for="(notification, index) in notifications"
      :key="notification.id"
      :notification="notification"
      :index="index"
      @close="removeNotification(notification.id)"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped>
.toast-container {
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}
</style> 