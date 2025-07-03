<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTooltip } from '@/composables/useTooltip';
import type { TooltipOptions, TooltipType } from '@/composables/useTooltip';
import { AlertCircle, AlertTriangle, CheckCircle, HelpCircle, Info } from 'lucide-vue-next';

interface Props {
  content: string;
  type?: TooltipType;
  position?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  showArrow?: boolean;
  maxWidth?: string;
  interactive?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  position: 'top',
  size: 'md',
  delay: 200,
  showArrow: true,
  maxWidth: '280px',
  interactive: false,
  disabled: false,
});

const emit = defineEmits<{
  open: [];
  close: [];
}>();

const {
  generateTooltipId,
  createTooltipOptions,
  getTooltipClasses,
  registerTooltip,
  unregisterTooltip,
} = useTooltip();

// Generate unique ID for this tooltip
const tooltipId = ref(generateTooltipId());

// Create processed options
const tooltipOptions = computed(() =>
  createTooltipOptions({
    content: props.content,
    type: props.type,
    position: props.position,
    size: props.size,
    delay: props.delay,
    showArrow: props.showArrow,
    maxWidth: props.maxWidth,
    interactive: props.interactive,
  })
);

// Get appropriate icon for tooltip type
const getTypeIcon = (type: TooltipType) => {
  const iconMap = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
    help: HelpCircle,
  };
  return iconMap[type];
};

// Computed classes
const tooltipClasses = computed(() =>
  getTooltipClasses(tooltipOptions.value.type, tooltipOptions.value.size)
);

const contentClasses = computed(() => {
  const baseClasses = 'flex items-start gap-2 text-left leading-relaxed';
  return `${baseClasses} ${tooltipClasses.value}`;
});

// Event handlers
const handleOpen = () => {
  if (!props.disabled) {
    registerTooltip(tooltipId.value);
    emit('open');
  }
};

const handleClose = () => {
  unregisterTooltip(tooltipId.value);
  emit('close');
};

// Lifecycle
onMounted(() => {
  // Any initialization if needed
});

onUnmounted(() => {
  unregisterTooltip(tooltipId.value);
});
</script>

<template>
  <TooltipProvider :delay-duration="tooltipOptions.delay">
    <Tooltip @update:open="$event ? handleOpen() : handleClose()">
      <!-- Trigger slot - whatever element should show the tooltip -->
      <TooltipTrigger as-child>
        <slot name="trigger">
          <!-- Default trigger if none provided -->
          <button
            type="button"
            class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            :disabled="disabled"
            :aria-describedby="tooltipId"
          >
            <Component :is="getTypeIcon(tooltipOptions.type)" :size="12" />
          </button>
        </slot>
      </TooltipTrigger>

      <!-- Tooltip content -->
      <TooltipContent
        v-if="!disabled"
        :id="tooltipId"
        :side="tooltipOptions.position"
        :side-offset="4"
        :class="contentClasses"
        :style="{ maxWidth: tooltipOptions.maxWidth }"
        role="tooltip"
      >
        <!-- Icon if not custom trigger -->
        <div class="flex-shrink-0 mt-0.5">
          <Component
            :is="getTypeIcon(tooltipOptions.type)"
            :size="tooltipOptions.size === 'sm' ? 12 : tooltipOptions.size === 'lg' ? 18 : 14"
            class="opacity-80"
          />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <slot name="content">
            <p class="text-inherit leading-normal">
              {{ content }}
            </p>
          </slot>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<style scoped>
/* Additional custom styles if needed */
.tooltip-enter-active,
.tooltip-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
