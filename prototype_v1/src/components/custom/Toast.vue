<script setup>
import { ref, onMounted, watch } from 'vue'
import { CheckCircle, X, Info, AlertTriangle, XCircle } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'success', // success, info, warning, error
    validator: (value) => ['success', 'info', 'warning', 'error'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 3000
  },
  position: {
    type: String,
    default: 'top-center', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
    validator: (value) => ['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top-center', 'bottom-center'].includes(value)
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
let timeoutId = null

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertTriangle,
  error: XCircle
}

const colorClasses = {
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800'
}

const iconColorClasses = {
  success: 'text-green-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
  error: 'text-red-400'
}

const close = () => {
  visible.value = false
  if (timeoutId) {
    clearTimeout(timeoutId)
  }
  emit('close')
}

watch(() => props.show, (newValue) => {
  if (newValue) {
    visible.value = true
    if (props.duration > 0) {
      timeoutId = setTimeout(() => {
        close()
      }, props.duration)
    }
  } else {
    visible.value = false
  }
})

onMounted(() => {
  if (props.show) {
    visible.value = true
    if (props.duration > 0) {
      timeoutId = setTimeout(() => {
        close()
      }, props.duration)
    }
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="opacity-0 transform translate-y-2"
    enter-to-class="opacity-100 transform translate-y-0"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100 transform translate-y-0"
    leave-to-class="opacity-0 transform translate-y-2"
  >
    <div
      v-if="visible"
      :class="[
        'w-96 shadow-lg rounded-lg border p-4 pointer-events-auto',
        colorClasses[type]
      ]"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component
            :is="iconMap[type]"
            :class="['h-5 w-5', iconColorClasses[type]]"
          />
        </div>
        <div class="ml-3 w-0 flex-1">
          <p class="text-sm font-medium">
            {{ title }}
          </p>
          <p
            v-if="message"
            class="mt-1 text-sm opacity-90"
          >
            {{ message }}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button
            class="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
            @click="close"
          >
            <span class="sr-only">Stäng</span>
            <X :class="['h-4 w-4', iconColorClasses[type]]" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template> 