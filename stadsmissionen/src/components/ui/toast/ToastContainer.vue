<script setup lang="ts">
import { computed } from 'vue';
import { useToast } from '@/composables/useToast';
import ToastComponent from '@/components/ui/Toast.vue';

import type { Toast } from '@/types';

const { toasts, removeToast } = useToast();

const handleClose = (toastId: string): void => {
  removeToast(toastId);
};

// Group toast messages by position for better organization
const groupedByPosition = computed(() => {
  const groups: Record<string, Toast[]> = {};

  toasts.value.forEach((toast: Toast) => {
    const position = (toast as Toast & { position?: string }).position ?? 'top-center';
    groups[position] ??= [];
    groups[position].push(toast);
  });

  return groups;
});

// Get container classes for each position
const getContainerClasses = (position: string): string => {
  const baseClasses = 'fixed pointer-events-none z-50 flex flex-col gap-2';

  const positionClasses: Record<string, string> = {
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
    'top-right': 'top-4 right-4 items-end',
    'top-left': 'top-4 left-4 items-start',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
  };

  return `${baseClasses} ${positionClasses[position] ?? positionClasses['top-center']}`;
};

// Calculate z-index for stacking toasts properly
const getToastZIndex = (index: number): number => {
  return 1000 - index;
};
</script>

<template>
  <Teleport to="body">
    <div class="toast-container-root" role="region" aria-label="Notifications" aria-live="polite">
      <!-- Group toast messages by position -->
      <div
        v-for="(groupedToasts, position) in groupedByPosition"
        :key="position"
        :class="getContainerClasses(position)"
        :data-position="position"
      >
        <ToastComponent
          v-for="(toast, index) in groupedToasts"
          :key="toast.id"
          :notification="toast"
          :index="index"
          :style="{
            zIndex: getToastZIndex(index),
          }"
          @close="handleClose"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container-root {
  pointer-events: none;
}

.toast-container-root > * {
  pointer-events: auto;
}

/* Ensure toasts don't interfere with page content */
.toast-container-root [data-position] {
  max-width: calc(100vw - 2rem);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .toast-container-root [data-position] {
    left: 1rem !important;
    right: 1rem !important;
    transform: none !important;
    max-width: calc(100vw - 2rem);
  }

  .toast-container-root [data-position='top-center'],
  .toast-container-root [data-position='bottom-center'] {
    left: 1rem !important;
    right: 1rem !important;
  }
}
</style>
