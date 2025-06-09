<script setup lang="ts">
export interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  show?: boolean;
}

interface Props {
  toast: Toast;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [id: string];
}>();

const handleClose = () => {
  emit('close', props.toast.id);
};
</script>

<template>
  <div v-if="toast.show !== false" class="toast" :class="`toast-${toast.type || 'info'}`">
    <div class="toast-content">
      {{ toast.message }}
    </div>
    <button class="toast-close" @click="handleClose">×</button>
  </div>
</template>

<style scoped>
@reference "src/main.css";

.toast {
  @apply p-4 rounded-md shadow-lg mb-2 flex items-center justify-between;
}

.toast-success {
  @apply bg-green-100 text-green-800 border border-green-200;
}

.toast-error {
  @apply bg-red-100 text-red-800 border border-red-200;
}

.toast-warning {
  @apply bg-yellow-100 text-yellow-800 border border-yellow-200;
}

.toast-info {
  @apply bg-blue-100 text-blue-800 border border-blue-200;
}

.toast-close {
  @apply ml-4 text-lg font-bold cursor-pointer hover:opacity-70;
}
</style>
