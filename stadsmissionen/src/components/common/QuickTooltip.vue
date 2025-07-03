<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TooltipType } from '@/composables/useTooltip';

interface Props {
  text: string;
  type?: TooltipType;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info',
  position: 'top',
  delay: 200,
  disabled: false,
});

// Get background color based on type
const getTypeClasses = (type: TooltipType): string => {
  const typeClasses = {
    info: 'bg-blue-900 text-blue-100 border-blue-700',
    warning: 'bg-yellow-900 text-yellow-100 border-yellow-700',
    error: 'bg-red-900 text-red-100 border-red-700',
    success: 'bg-green-900 text-green-100 border-green-700',
    help: 'bg-purple-900 text-purple-100 border-purple-700',
  };
  return typeClasses[type];
};
</script>

<template>
  <TooltipProvider :delay-duration="delay">
    <Tooltip>
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>

      <TooltipContent
        v-if="!disabled && text"
        :side="position"
        :side-offset="4"
        :class="[
          'px-3 py-2 text-xs font-medium rounded-md shadow-lg border backdrop-blur-sm max-w-xs',
          getTypeClasses(type),
        ]"
      >
        {{ text }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
