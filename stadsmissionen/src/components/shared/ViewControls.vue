<script setup lang="ts">
import { type Component, computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LayoutGrid, List } from 'lucide-vue-next';

interface ActionButton {
  label: string;
  icon?: Component;
  onClick: () => void;
  class?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
}

interface FilterOption {
  key: string;
  label: string;
  value: string;
}

interface Filter {
  modelValue: string;
  placeholder: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

interface Props {
  // Action buttons (left side) - support both old and new prop names
  actionButtons?: ActionButton[];
  addActions?: ActionButton[];

  // Search functionality
  searchQuery?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;

  // View switcher - use v-model pattern
  viewMode?: 'list' | 'grid';
  showViewSwitcher?: boolean;

  // Filter system - support both old individual filters and new filters array
  filters?: Filter[];

  // Legacy filter props (for backward compatibility)
  statusFilter?: string;
  filterOptions?: FilterOption[];
  secondaryFilter?: string;
  secondaryFilterOptions?: FilterOption[];
  secondaryFilterLabel?: string;

  // Additional actions (right side)
  additionalActions?: ActionButton[];
}

const props = withDefaults(defineProps<Props>(), {
  actionButtons: () => [],
  addActions: () => [],
  additionalActions: () => [],
  filters: () => [],
  filterOptions: () => [],
  secondaryFilterOptions: () => [],
  searchQuery: '',
  searchPlaceholder: 'Sök...',
  showSearch: true,
  viewMode: 'list',
  showViewSwitcher: true,
  statusFilter: '',
  secondaryFilter: '',
  secondaryFilterLabel: 'Filter',
});

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'update:search-query': [value: string];
  'update:statusFilter': [value: string];
  'update:secondaryFilter': [value: string];
  'update:viewMode': [value: 'list' | 'grid'];
}>();

// Computed property to get the correct action buttons (support both prop names)
const leftActionButtons = computed(() => {
  return props.addActions.length > 0 ? props.addActions : props.actionButtons;
});

const updateSearchQuery = (value: string | number) => {
  const stringValue = `${value}`;
  emit('update:searchQuery', stringValue);
  emit('update:search-query', stringValue);
};

const updateStatusFilter = (value: string) => {
  emit('update:statusFilter', value);
};

const updateSecondaryFilter = (value: string) => {
  emit('update:secondaryFilter', value);
};

const updateViewMode = (mode: 'list' | 'grid') => {
  emit('update:viewMode', mode);
};
</script>

<template>
  <div class="bg-background px-6 mb-3 space-y-3">
    <!-- Top Row: Action Buttons (left) and Additional Actions (right) -->
    <div class="flex items-center justify-between">
      <!-- Action Buttons (left side) -->
      <div class="flex items-center gap-2">
        <Button
          v-for="button in leftActionButtons"
          :key="button.label"
          :variant="button.variant || 'default'"
          :size="button.size || 'sm'"
          :class="['gap-2 text-xs font-semibold', button.class]"
          @click="button.onClick"
        >
          <component :is="button.icon" v-if="button.icon" class="h-4 w-4" />
          {{ button.label }}
        </Button>
      </div>

      <!-- Additional Actions (right side) -->
      <div class="flex items-center gap-2">
        <Button
          v-for="button in additionalActions"
          :key="button.label"
          :variant="button.variant || 'outline'"
          :size="button.size || 'sm'"
          :class="['gap-2 text-xs font-semibold', button.class]"
          @click="button.onClick"
        >
          <component :is="button.icon" v-if="button.icon" class="h-4 w-4" />
          {{ button.label }}
        </Button>
      </div>
    </div>

    <!-- Bottom Row: Search (left), View Switcher (center), and Filters (right) -->
    <div class="flex items-center justify-between">
      <!-- Search Input (left side) -->
      <div class="flex items-center">
        <Input
          v-if="showSearch"
          :model-value="searchQuery"
          :placeholder="searchPlaceholder"
          class="w-64 h-8 text-xs"
          @update:model-value="updateSearchQuery"
        />
      </div>

      <!-- View Switcher and Filters (right side) -->
      <div class="flex items-center gap-2">
        <!-- View Switcher -->
        <div v-if="showViewSwitcher" class="flex items-center border rounded-md bg-muted p-0.5">
          <Button
            variant="ghost"
            size="sm"
            :class="[
              'h-8 w-8 p-0 transition-all duration-200',
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            ]"
            @click="updateViewMode('list')"
          >
            <List class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            :class="[
              'h-8 w-8 p-0 transition-all duration-200',
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            ]"
            @click="updateViewMode('grid')"
          >
            <LayoutGrid class="h-4 w-4" />
          </Button>
        </div>

        <!-- Filters -->
        <!-- New filters array system -->
        <template v-if="filters.length > 0">
          <Select
            v-for="(filter, index) in filters"
            :key="index"
            :model-value="filter.modelValue"
            @update:model-value="filter.onChange"
          >
            <SelectTrigger class="w-[160px] h-8 text-xs">
              <SelectValue :placeholder="filter.placeholder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in filter.options" :key="option.key" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>

        <!-- Legacy filter system (for backward compatibility) -->
        <template v-else>
          <!-- Primary Filter (Status) -->
          <Select
            v-if="filterOptions.length > 0"
            :model-value="statusFilter"
            @update:model-value="updateStatusFilter"
          >
            <SelectTrigger class="w-[160px] h-8 text-xs">
              <SelectValue placeholder="Filtrera status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in filterOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Secondary Filter (e.g., Permission Groups) -->
          <Select
            v-if="secondaryFilterOptions.length > 0"
            :model-value="secondaryFilter"
            @update:model-value="updateSecondaryFilter"
          >
            <SelectTrigger class="w-[180px] h-8 text-xs">
              <SelectValue :placeholder="`Filtrera ${secondaryFilterLabel.toLowerCase()}`" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in secondaryFilterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </template>
      </div>
    </div>
  </div>
</template>
