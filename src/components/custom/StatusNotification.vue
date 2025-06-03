<script setup lang="ts">
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-vue-next'

interface Props {
  type: 'warning' | 'success' | 'info' | 'error'
  title?: string
  message: string
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: true
})

const getIcon = () => {
  switch (props.type) {
    case 'warning':
      return AlertTriangle
    case 'success':
      return CheckCircle
    case 'info':
      return Info
    case 'error':
      return XCircle
    default:
      return Info
  }
}

const getClasses = () => {
  const baseClasses = 'mx-6 mb-4 flex items-center gap-2 px-4 py-3 border rounded-lg'
  
  switch (props.type) {
    case 'warning':
      return `${baseClasses} bg-amber-50 border-amber-200`
    case 'success':
      return `${baseClasses} bg-green-50 border-green-200`
    case 'info':
      return `${baseClasses} bg-blue-50 border-blue-200`
    case 'error':
      return `${baseClasses} bg-red-50 border-red-200`
    default:
      return `${baseClasses} bg-gray-50 border-gray-200`
  }
}

const getIconClasses = () => {
  switch (props.type) {
    case 'warning':
      return 'h-4 w-4 text-amber-600'
    case 'success':
      return 'h-4 w-4 text-green-600'
    case 'info':
      return 'h-4 w-4 text-blue-600'
    case 'error':
      return 'h-4 w-4 text-red-600'
    default:
      return 'h-4 w-4 text-gray-600'
  }
}

const getTextClasses = () => {
  switch (props.type) {
    case 'warning':
      return 'text-xs text-amber-800 font-medium'
    case 'success':
      return 'text-xs text-green-800 font-medium'
    case 'info':
      return 'text-xs text-blue-800 font-medium'
    case 'error':
      return 'text-xs text-red-800 font-medium'
    default:
      return 'text-xs text-gray-800 font-medium'
  }
}
</script>

<template>
  <div v-if="show" :class="getClasses()">
    <component :is="getIcon()" :class="getIconClasses()" />
    <div>
      <p v-if="title" :class="getTextClasses()">{{ title }}</p>
      <p :class="getTextClasses()">{{ message }}</p>
    </div>
  </div>
</template> 