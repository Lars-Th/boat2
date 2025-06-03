<script setup lang="ts">
interface Stat {
  value: string | number
  label: string
  color?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

interface Props {
  stats?: Stat[]
  showStats?: boolean
}

defineProps<Props>()
</script>

<template>
  <div v-if="showStats && stats && stats.length > 0" class="flex gap-3 mt-3 flex-wrap">
    <div v-for="stat in stats" :key="stat.label" class="flex items-center gap-2">
      <span class="text-xs text-muted-foreground">{{ stat.label }}:</span>
      <span 
        class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium"
        :class="{
          'bg-primary text-primary-foreground': stat.variant === 'default' || !stat.variant,
          'bg-secondary text-secondary-foreground': stat.variant === 'secondary',
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': stat.color === 'text-green-600',
          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300': stat.color === 'text-orange-600',
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': stat.color === 'text-blue-600',
          'bg-muted text-muted-foreground': stat.variant === 'outline'
        }"
      >
        {{ stat.value }}
      </span>
    </div>
  </div>
</template> 