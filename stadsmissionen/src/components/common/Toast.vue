<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import type { Toast as ToastType } from '@/types/index';

interface Props {
  toast: ToastType;
  paused?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  paused: false,
});

const emit = defineEmits<{
  close: [id: string];
  mouseenter: [];
  mouseleave: [];
  click: [];
}>();

// Progress bar for duration
const progress = ref(100);
const progressInterval = ref<ReturnType<typeof setInterval> | undefined>();

// Toast type to classes mapping
const getToastClasses = (toast: ToastType): string => {
  const baseClasses =
    'pointer-events-auto rounded-lg border p-4 shadow-lg backdrop-blur-sm transition-all duration-300 transform-gpu will-change-transform';

  const typeClasses = {
    success:
      'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200',
    error:
      'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200',
    warning:
      'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200',
    confirm:
      'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  return `${baseClasses} ${typeClasses[toast.type ?? 'info']}`;
};

// Icon classes
const getIconClasses = (toast: ToastType): string => {
  const iconClasses = {
    success: 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200',
    error: 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200',
    warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-200',
    confirm: 'bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-200',
  };

  return iconClasses[toast.type ?? 'info'];
};

// Action button classes
const getActionClasses = (style?: string): string => {
  const styleClasses: { [key: string]: string } = {
    primary: 'bg-current text-white border-current hover:opacity-90',
    secondary: 'border-current hover:bg-current hover:text-white',
    destructive: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
  };

  return `text-xs font-medium px-3 py-1.5 rounded border transition-all ${styleClasses[style ?? 'secondary']}`;
};

// Handle actions
const handleAction = (action: () => void): void => {
  action();
  emit('close', props.toast.id);
};

// Handle close
const handleClose = (): void => {
  emit('close', props.toast.id);
};

// Progress bar logic
const startProgress = (): void => {
  if (!props.toast.duration || props.toast.persistent) return;

  const interval = 50; // Update every 50ms
  const totalSteps = props.toast.duration / interval;
  let currentStep = 0;

  progressInterval.value = setInterval(() => {
    if (props.paused) return;

    currentStep++;
    progress.value = Math.max(0, 100 - (currentStep / totalSteps) * 100);

    if (progress.value <= 0) {
      if (progressInterval.value) {
        clearInterval(progressInterval.value);
      }
      emit('close', props.toast.id);
    }
  }, interval);
};

// Watch for pause changes
watch(
  () => props.paused,
  isPaused => {
    if (isPaused) {
      if (progressInterval.value) {
        clearInterval(progressInterval.value);
      }
    } else if (progress.value > 0 && !props.toast.persistent) {
      startProgress();
    }
  }
);

onMounted(() => {
  if (!props.toast.persistent && props.toast.duration) {
    startProgress();
  }
});

onUnmounted(() => {
  if (progressInterval.value) {
    clearInterval(progressInterval.value);
  }
});
</script>

<template>
  <div
    :class="getToastClasses(toast)"
    role="alert"
    :aria-live="toast.type === 'error' ? 'assertive' : 'polite'"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
    @click="emit('click')"
  >
    <!-- Progress bar -->
    <div
      v-if="toast.duration && !toast.persistent"
      class="absolute top-0 left-0 h-1 bg-current opacity-30 transition-all duration-100 ease-linear"
      :style="{ width: `${progress}%` }"
    />

    <div class="flex items-start gap-3">
      <!-- Icon -->
      <div
        v-if="toast.icon"
        class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-sm font-bold"
        :class="getIconClasses(toast)"
      >
        {{ toast.icon }}
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h4 v-if="toast.title" class="text-sm font-medium mb-1">
          {{ toast.title }}
        </h4>
        <p v-if="toast.description" class="text-sm opacity-90">
          {{ toast.description }}
        </p>

        <!-- Actions -->
        <div v-if="toast.actions && toast.actions.length > 0" class="flex gap-2 mt-3">
          <button
            v-for="action in toast.actions"
            :key="action.label"
            :class="getActionClasses(action.style)"
            @click.stop="handleAction(action.action)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>

      <!-- Close button -->
      <button
        v-if="toast.closable"
        class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
        :aria-label="`Stäng ${toast.type} meddelande`"
        @click.stop="handleClose"
      >
        <span class="text-sm">✕</span>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* Ensure proper positioning for progress bar */
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}
</style>
