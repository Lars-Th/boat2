<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { CheckCircle, X, Info, AlertTriangle, XCircle, HelpCircle } from 'lucide-vue-next'
import type { Notification } from '@/types'

interface Props {
  notification: Notification
  index: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: [id: string]
}>()

const visible = ref(false)
let timeoutId: number | null = null

const colorClasses = computed(() => {
  const colorClasses = {
    success: 'border-green-200 bg-green-50 text-green-800',
    info: 'border-blue-200 bg-blue-50 text-blue-800',
    warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    error: 'border-red-200 bg-red-50 text-red-800',
    confirm: 'border-purple-200 bg-purple-50 text-purple-800'
  }
  return colorClasses[props.notification.type ?? 'info'] ?? colorClasses.info
})

const iconComponent = computed(() => {
  const iconMap = {
    success: CheckCircle,
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
    confirm: HelpCircle
  }
  return iconMap[props.notification.type ?? 'info'] ?? Info
})

const iconColorClasses = computed(() => {
  const iconColorClasses = {
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    confirm: 'text-purple-600'
  }
  return iconColorClasses[props.notification.type ?? 'info'] ?? iconColorClasses.info
})

const typeClasses = computed(() => {
  return colorClasses.value
})

const iconClasses = computed(() => {
  return iconColorClasses.value
})

const close = () => {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  emit('close', props.notification.id)
}

onMounted(() => {
  visible.value = true
  // Auto-close after 5 seconds for non-error notifications
  const duration = props.notification.type === 'error' ? 8000 : 5000
  timeoutId = setTimeout(() => {
    close()
  }, duration)
})
</script>

<template>
  <div
    :class="[
      'fixed right-4 z-50 w-full max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
      typeClasses,
      'animate-in slide-in-from-right-full'
    ]"
    :style="{ top: `${index * 70 + 20}px` }"
  >
    <div class="flex items-start space-x-3">
      <component
        :is="iconComponent"
        :class="iconClasses"
        class="h-5 w-5 mt-0.5"
      />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold text-gray-900">
          {{ notification.title }}
        </h4>
        <p class="text-sm text-gray-600 mt-1">
          {{ notification.message }}
        </p>
        
        <!-- Action buttons if available -->
        <div 
          v-if="notification.actions && notification.actions.length > 0"
          class="flex gap-2 mt-2"
        >
          <button
            v-for="action in notification.actions"
            :key="action.label"
            class="text-xs px-2 py-1 rounded border border-current opacity-80 hover:opacity-100 transition-opacity"
            @click="action.action"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
      <button
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        @click="close"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template> 