<script setup>
import { computed } from 'vue'
import { useToast } from '@/composables/useToast.ts'
import Toast from './Toast.vue'

const { toasts, removeToast } = useToast()

const handleClose = (toastId) => {
  removeToast(toastId)
}

// Gruppera toast-meddelanden efter position
const groupedByPosition = computed(() => {
  const groups = {}
  toasts.value.forEach(toast => {
    if (!groups[toast.position]) {
      groups[toast.position] = []
    }
    groups[toast.position].push(toast)
  })
  return groups
})

// Få container-klasser för varje position
const getContainerClasses = (position) => {
  const baseClasses = 'fixed pointer-events-none z-50'
  
  switch (position) {
    case 'top-center':
      return `${baseClasses} top-4 left-1/2 -translate-x-1/2 flex flex-col items-center w-auto`
    case 'bottom-center':
      return `${baseClasses} bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center w-auto`
    case 'top-right':
      return `${baseClasses} top-4 right-4 flex flex-col items-end w-auto`
    case 'top-left':
      return `${baseClasses} top-4 left-4 flex flex-col items-start w-auto`
    case 'bottom-right':
      return `${baseClasses} bottom-4 right-4 flex flex-col items-end w-auto`
    case 'bottom-left':
      return `${baseClasses} bottom-4 left-4 flex flex-col items-start w-auto`
    default:
      return `${baseClasses} top-4 left-1/2 -translate-x-1/2 flex flex-col items-center w-auto`
  }
}
</script>

<template>
  <div class="toast-container">
    <!-- Gruppera toast-meddelanden efter position -->
    <div 
      v-for="(groupedToasts, position) in groupedByPosition" 
      :key="position"
      :class="getContainerClasses(position)"
    >
      <Toast
        v-for="(toast, index) in groupedToasts"
        :key="toast.id"
        :show="toast.show"
        :type="toast.type"
        :title="toast.title"
        :message="toast.message"
        :duration="0"
        :position="toast.position"
        :style="{ 
          position: 'relative',
          marginTop: index > 0 ? '8px' : '0',
          zIndex: 1000 - index
        }"
        @close="handleClose(toast.id)"
      />
    </div>
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