<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'
import StandardHeader from '@/components/layout/StandardHeader.vue'
import type { BreadcrumbItem } from '@/types'

interface Props {
  title: string
  breadcrumbs?: string | BreadcrumbItem[]
  showStats?: boolean
  stats?: Array<{
    title: string
    value: string | number
    icon?: Component
    color?: string
    change?: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  showStats: false,
  stats: () => []
})

// const router = useRouter()

// Convert breadcrumbs string to array format with proper navigation
const breadcrumbsArray = computed(() => {
  if (typeof props.breadcrumbs === 'string') {
    const parts = props.breadcrumbs.split(' / ')
    return parts.map((part, index) => ({
      label: part.trim(),
      isCurrentPage: index === parts.length - 1
    }))
  }
  return props.breadcrumbs ?? []
})

// Convert stats format to match StandardHeader expectations
const mappedStats = computed(() => {
  return props.stats.map(stat => ({
    label: stat.title,
    value: stat.value,
    color: stat.color ?? '',
    variant: 'default' as const
  }))
})
</script>

<template>
  <div class="w-full">
    <!-- Header with margins -->
    <StandardHeader
      :title="title"
      :breadcrumbs="breadcrumbsArray"
      :show-stats="showStats"
      :stats="mappedStats"
    />

    <!-- Main content without padding - full width -->
    <div class="w-full">
      <slot />
    </div>
  </div>
</template> 