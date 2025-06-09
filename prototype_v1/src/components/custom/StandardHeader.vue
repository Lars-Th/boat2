<script setup lang="ts">
import TitleBreadcrumbs from './TitleBreadcrumbs.vue'
import TitleAnalytics from './TitleAnalytics.vue'

interface BreadcrumbItem {
  label: string
  to?: string | { name: string; params?: Record<string, any> }
  isCurrentPage?: boolean
}

interface Stat {
  value: string | number
  label: string
  color?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

interface Props {
  title: string
  breadcrumbs: BreadcrumbItem[]
  description?: string
  showStats?: boolean
  stats?: Stat[]
}

defineProps<Props>()
</script>

<template>
  <div class="bg-background px-6 py-4">
    <div class="flex flex-col gap-4">
      <!-- Title and breadcrumbs -->
      <TitleBreadcrumbs 
        :title="title" 
        :breadcrumbs="breadcrumbs" 
        :description="description" 
      />
      
      <!-- Analytics/Stats -->
      <TitleAnalytics 
        :show-stats="showStats" 
        :stats="stats" 
      />
      
      <!-- Actions and filters row -->
      <div class="flex items-center justify-between h-10">
        <!-- Action buttons on the left -->
        <div class="flex items-center gap-2">
          <slot name="actions" />
        </div>
        
        <!-- Search and filters on the right -->
        <div class="flex items-center gap-2">
          <slot name="filters" />
        </div>
      </div>
    </div>
  </div>
</template> 