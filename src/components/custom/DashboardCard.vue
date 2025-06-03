<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  title: string
  description?: string
  value?: string | number
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'outline' | 'destructive'
  }
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  fullWidth: false
})
</script>

<template>
  <Card :class="{ 'col-span-full': fullWidth }">
    <CardHeader class="pb-3">
      <CardTitle class="text-base">{{ title }}</CardTitle>
      <CardDescription v-if="description" class="text-xs">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="value" class="text-lg font-bold">{{ value }}</div>
      <Badge 
        v-if="badge" 
        :variant="badge.variant || 'secondary'" 
        class="mt-2 text-xs"
      >
        {{ badge.text }}
      </Badge>
      <slot />
    </CardContent>
  </Card>
</template> 