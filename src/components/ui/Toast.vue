<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { CheckCircle, X, Info, AlertTriangle, XCircle, HelpCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message: string
  isGlobal?: boolean
  options?: {
    confirmText: string
    cancelText: string
    confirmVariant: string
  }
  resolve?: (value: boolean) => void
}

interface Props {
  notification: Notification
  index: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  confirm: [id: number, confirmed: boolean]
}>()

const visible = ref(false)
let timeoutId = null

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  confirm: HelpCircle
}

const colorClasses = {
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  confirm: 'bg-gray-50 border-gray-200'
}

const iconColorClasses = {
  success: 'text-green-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  confirm: 'text-gray-400'
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
}

const typeClasses = computed(() => {
  return colorClasses[props.notification.type] || colorClasses.info
})

const iconComponent = computed(() => {
  return iconMap[props.notification.type] || Info
})

const iconClasses = computed(() => {
  return iconColorClasses[props.notification.type] || iconColorClasses.info
})

const close = () => {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  emit('close')
}

const handleConfirm = () => {
  emit('confirm', props.notification.id, true)
}

const handleCancel = () => {
  emit('confirm', props.notification.id, false)
}

watch(() => props.notification.type, (newValue) => {
  if (newValue) {
    visible.value = true
    if (props.notification.options?.duration > 0) {
      timeoutId = setTimeout(() => {
        close()
      }, props.notification.options.duration)
    }
  } else {
    visible.value = false
  }
})

onMounted(() => {
  if (props.notification.type) {
    visible.value = true
    if (props.notification.options?.duration > 0) {
      timeoutId = setTimeout(() => {
        close()
      }, props.notification.options.duration)
    }
  }
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
    <!-- Confirm dialog -->
    <div v-if="notification.type === 'confirm'" class="space-y-3">
      <div class="flex items-start space-x-3">
        <component :is="iconComponent" :class="iconClasses" />
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-gray-900">{{ notification.title }}</h4>
          <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
        </div>
      </div>
      
      <div class="flex space-x-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          @click="handleCancel"
          class="text-xs h-7"
        >
          {{ notification.options?.cancelText }}
        </Button>
        <Button
          :variant="notification.options?.confirmVariant"
          size="sm"
          @click="handleConfirm"
          class="text-xs h-7"
        >
          {{ notification.options?.confirmText }}
        </Button>
      </div>
    </div>

    <!-- Regular notification -->
    <div v-else class="flex items-start space-x-3">
      <component :is="iconComponent" :class="iconClasses" />
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold text-gray-900">{{ notification.title }}</h4>
        <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
      </div>
      <button
        @click="$emit('close')"
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template> 