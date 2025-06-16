<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-vue-next';
import type { Toast } from '@/types';

const props = defineProps<{
  notification: Toast;
}>();

const emit = defineEmits<{
  (e: 'close', id: string): void;
}>();

const visible = ref(false);
let timeoutId: number | null = null;

const colorClasses = computed(() => {
  const classes = {
    success: 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    error: 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    warning: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    info: 'bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    confirm: 'bg-purple-50 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  };
  return classes[props.notification.type ?? 'info'] ?? classes.info;
});

const iconComponent = computed(() => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    confirm: Info,
  };
  return icons[props.notification.type ?? 'info'] ?? Info;
});

const iconColorClasses = computed(() => {
  const classes = {
    success: 'text-green-500 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    warning: 'text-yellow-500 dark:text-yellow-400',
    info: 'text-blue-500 dark:text-blue-400',
    confirm: 'text-purple-500 dark:text-purple-400',
  };
  return classes[props.notification.type ?? 'info'] ?? classes.info;
});

const close = () => {
  visible.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  emit('close', props.notification.id);
};

onMounted(() => {
  visible.value = true;
  // Auto-close after 5 seconds for non-error notifications
  const duration = props.notification.type === 'error' ? 8000 : 5000;
  timeoutId = setTimeout(() => {
    close();
  }, duration);
});
</script>

<template>
  <div
    class="toast-root"
    :class="[
      colorClasses,
      'flex items-start gap-3 p-4 rounded-lg shadow-lg border border-current/10',
    ]"
    role="alert"
  >
    <component :is="iconComponent" class="h-5 w-5 flex-shrink-0" :class="iconColorClasses" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium">{{ notification.title }}</p>
      <p v-if="notification.description" class="mt-1 text-sm opacity-90">
        {{ notification.description }}
      </p>
      <div v-if="notification.actions && notification.actions.length > 0" class="flex gap-2 mt-2">
        <button
          v-for="action in notification.actions"
          :key="action.label"
          class="text-xs px-2 py-1 rounded"
          :class="[
            action.style === 'destructive'
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : action.style === 'secondary'
                ? 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
          ]"
          @click="action.action"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
    <button
      v-if="!notification.persistent"
      class="ml-4 -mt-1 -mr-1 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
      @click="emit('close', notification.id)"
    >
      <XCircle class="h-4 w-4" />
    </button>
  </div>
</template>
