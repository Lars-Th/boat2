<script setup lang="ts">
import { useToast } from '@/composables/useToast';
import ToastComponent from '@/components/ui/toast/Toast.vue';

const { toasts, removeToast } = useToast();

const handleClose = (toastId: string): void => {
  removeToast(toastId);
};

// Get container classes
const containerClasses = 'fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm';

// Calculate z-index for stacking toasts properly
const getToastZIndex = (index: number): number => {
  return 1000 - index;
};
</script>

<template>
  <Teleport to="body">
    <div class="toast-container-root" role="region" aria-label="Notifications" aria-live="polite">
      <div :class="containerClasses">
        <ToastComponent
          v-for="(toast, index) in toasts"
          :key="toast.id"
          :notification="toast"
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
.toast-container-root > div {
  max-width: calc(100vw - 2rem);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .toast-container-root > div {
    left: 1rem !important;
    right: 1rem !important;
    max-width: calc(100vw - 2rem);
  }
}
</style>
