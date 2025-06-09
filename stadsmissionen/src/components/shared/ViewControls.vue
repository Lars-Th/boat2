<script setup lang="ts">
import type { Component } from 'vue'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { SlidersHorizontal, List, LayoutGrid, ChartPie } from 'lucide-vue-next'

import type { FilterOption } from '@/types'

interface ActionButton {
  label: string
  icon?: Component
  onClick: () => void
  class?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

interface Props {
  searchQuery: string
  statusFilter: string
  searchPlaceholder?: string
  filterOptions?: FilterOption[]
  showActiveFilters?: boolean
  actionButtons?: ActionButton[]
  viewMode?: 'table' | 'grid' | 'chart'
  showViewToggle?: boolean
  currentView?: 'grid' | 'table'
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: 'Sök...',
  filterOptions: () => [],
  showActiveFilters: true,
  actionButtons: () => [],
  viewMode: 'table',
  showViewToggle: true,
  currentView: 'grid'
})

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:statusFilter': [value: string]
  'update:viewMode': [value: 'table' | 'grid' | 'chart']
  'update:currentView': [view: 'grid' | 'table']
  filterChange: [filterId: string, value: unknown]
}>()

const updateSearchQuery = (value: string | number) => {
  emit('update:searchQuery', String(value))
}

const updateStatusFilter = (value: string) => {
  emit('update:statusFilter', value)
}

const updateViewMode = (mode: 'table' | 'grid' | 'chart') => {
  emit('update:viewMode', mode)
}

const clearFilter = () => {
  emit('update:statusFilter', 'all')
}

const getActiveFilterLabel = () => {
  const option = (props.filterOptions ?? []).find(opt => opt.key === props.statusFilter)
  return option ? option.label : props.statusFilter
}
</script>

<template>
  <div class="bg-background px-6">
    <div class="flex items-center justify-between">
      <!-- Action buttons on the left -->
      <div class="flex items-center gap-2">
        <Button 
          v-for="button in actionButtons" 
          :key="button.label"
          :variant="button.variant || 'default'"
          :class="button.class"
          @click="button.onClick"
        >
          <component
            :is="button.icon"
            v-if="button.icon"
            class="h-3 w-3 mr-1"
          />
          {{ button.label }}
        </Button>
      </div>
      
      <!-- View toggle and search/filters on the right -->
      <div class="flex gap-2">
        <!-- View toggle bar -->
        <div
          v-if="showViewToggle"
          class="flex gap-1 rounded-md border border-border"
        >
          <Button
            :variant="viewMode === 'table' ? 'default' : 'ghost'"
            size="sm"
            @click="updateViewMode('table')"
          >
            <List class="h-3 w-3" />
          </Button>
          <Button
            :variant="viewMode === 'grid' ? 'default' : 'ghost'"
            size="sm"
            @click="updateViewMode('grid')"
          >
            <LayoutGrid class="h-3 w-3" />
          </Button>
          <Button
            :variant="viewMode === 'chart' ? 'default' : 'ghost'"
            size="sm"
            @click="updateViewMode('chart')"
          >
            <ChartPie class="h-3 w-3" />
          </Button>
        </div>

        <!-- Search and filters -->
        <div class="flex gap-2 items-center">
          <Input
            :model-value="searchQuery"
            :placeholder="searchPlaceholder"
            class="w-64 h-8"
            style="font-size: 12px;"
            @update:model-value="updateSearchQuery"
          />
          <DropdownMenu v-if="(filterOptions ?? []).length > 0">
            <DropdownMenuTrigger as-child>
              <SlidersHorizontal class="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="updateStatusFilter('all')">
                Alla
              </DropdownMenuItem>
              <DropdownMenuItem 
                v-for="option in (filterOptions ?? [])" 
                :key="option.key ?? 'unknown'"
                @click="updateStatusFilter(option.key ?? '')"
              >
                {{ option.label }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <!-- Active filters display -->
        <div
          v-if="showActiveFilters && statusFilter !== 'all'"
          class="flex gap-2 text-xs justify-end"
        >
          <span class="text-muted-foreground">Filter:</span>
          <span class="bg-primary/10 text-primary px-2 py-1 rounded-md">
            Status: {{ getActiveFilterLabel() }}
            <button
              class="ml-1 hover:text-primary/70"
              @click="clearFilter"
            >×</button>
          </span>
        </div>
      </div>
    </div>
  </div>
</template> 