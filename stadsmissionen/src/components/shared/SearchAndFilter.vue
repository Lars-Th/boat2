<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, X } from 'lucide-vue-next'
import type { FilterOption } from '@/types'

interface FilterConfig {
  key: string
  label: string
  options: FilterOption[]
}

interface Props {
  search?: string
  placeholder?: string
  filters?: FilterConfig[]
}

interface Emits {
  (e: 'update:search', value: string | number): void
}

const { search = '', placeholder = 'Sök...', filters = [] } = defineProps<Props>()

const emit = defineEmits<Emits>()

const showFilters = ref(false)
const activeFilters = ref<Record<string, string>>({})

const updateSearch = (value: string | number) => {
  emit('update:search', value)
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const clearFilters = () => {
  activeFilters.value = {}
}

const hasActiveFilters = () => {
  return Object.keys(activeFilters.value).length > 0
}

const updateFilter = (filterKey: string, value: string | number | null) => {
  if (value !== null) {
    activeFilters.value[filterKey] = String(value)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Search and Actions Row -->
    <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <!-- Search Input -->
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          :model-value="search"
          :placeholder="placeholder"
          class="pl-10"
          @update:model-value="updateSearch"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-2 items-center">
        <!-- Filter Toggle -->
        <Button
          v-if="filters.length > 0"
          variant="outline"
          size="sm"
          class="gap-2"
          @click="toggleFilters"
        >
          <Filter class="h-4 w-4" />
          Filter
          <span
            v-if="hasActiveFilters()"
            class="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-xs"
          >
            {{ Object.keys(activeFilters).length }}
          </span>
        </Button>

        <!-- Custom Actions Slot -->
        <slot name="actions" />
      </div>
    </div>

    <!-- Filters Panel -->
    <Card
      v-if="showFilters && filters.length > 0"
      class="border-dashed"
    >
      <CardContent class="pt-4">
        <div class="flex flex-wrap gap-4 items-end">
          <!-- Filter Selects -->
          <div
            v-for="filter in filters"
            :key="filter.key"
            class="min-w-[200px]"
          >
            <label class="text-sm font-medium mb-2 block">{{ filter.label }}</label>
            <Select 
              :model-value="activeFilters[filter.key] ?? ''" 
              @update:model-value="(value) => updateFilter(filter.key, value as string | number | null)"
            >
              <SelectTrigger>
                <SelectValue :placeholder="`Välj ${filter.label.toLowerCase()}`" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in filter.options"
                  :key="String(option.value)"
                  :value="String(option.value)"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Clear Filters -->
          <Button
            v-if="hasActiveFilters()"
            variant="outline"
            size="sm"
            class="gap-2"
            @click="clearFilters"
          >
            <X class="h-4 w-4" />
            Rensa filter
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template> 