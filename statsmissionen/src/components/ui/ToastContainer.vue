<script setup lang="ts">

import { useToast } from '@/composables'
import type { Toast } from '@/types'

const { toasts, removeToast } = useToast()

// Toast type to icon mapping
const getToastIcon = (type: Toast['type']): string => {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    confirm: '❓'
  }
  return icons[type ?? 'info'] ?? icons.info
}

// Toast type to color mapping
const getToastClasses = (type: Toast['type']): string => {
  const classes = {
    success: 'border-green-200 bg-green-50 text-green-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    confirm: 'border-purple-200 bg-purple-50 text-purple-800'
  }
  return classes[type ?? 'info'] ?? classes.info
}

const handleAction = (action: () => void, toastId: string): void => {
  action()
  removeToast(toastId)
}
</script>

<template>
  <Teleport to="body">
    <div 
      class="fixed top-4 right-4 z-[1080] flex flex-col gap-3 pointer-events-none max-w-sm w-full"
      role="region"
      aria-label="Notifications"
    >
      <Transition
        v-for="toast in toasts"
        :key="toast.id"
        name="toast"
        appear
      >
        <div
          :class="[
            'pointer-events-auto rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300',
            'transform-gpu will-change-transform',
            getToastClasses(toast.type)
          ]"
          role="alert"
          :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div 
              class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-sm font-bold"
              :class="{
                'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200': toast.type === 'success',
                'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200': toast.type === 'error',
                'bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-200': toast.type === 'warning',
                'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200': toast.type === 'info'
              }"
            >
              {{ getToastIcon(toast.type) }}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h4 
                v-if="toast.title"
                class="text-sm font-medium mb-1"
              >
                {{ toast.title }}
              </h4>
              <p class="text-sm opacity-90">
                {{ toast.message }}
              </p>

              <!-- Actions -->
              <div 
                v-if="toast.actions && toast.actions.length > 0"
                class="flex gap-2 mt-3"
              >
                <button
                  v-for="action in toast.actions"
                  :key="action.label"
                  class="text-xs font-medium px-2 py-1 rounded border border-current opacity-80 hover:opacity-100 transition-opacity"
                  @click="handleAction(action.action, toast.id)"
                >
                  {{ action.label }}
                </button>
              </div>
            </div>

            <!-- Close button -->
            <button
              class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
              :aria-label="`Stäng ${toast.type} meddelande`"
              @click="removeToast(toast.id)"
            >
              <span class="text-sm">✕</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .fixed.top-4.right-4 {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style> 