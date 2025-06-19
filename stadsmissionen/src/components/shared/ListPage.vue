<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import ViewControls from '@/components/shared/ViewControls.vue';
import DataTable from '@/components/shared/DataTable.vue';
import GridView from '@/components/shared/GridView.vue';
import PaginationControls from '@/components/shared/PaginationControls.vue';

interface Breadcrumb {
  label: string;
  to?: string;
  isCurrentPage?: boolean;
}

interface Stat {
  label: string;
  value: string | number;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  color?: string;
}

interface ActionButton {
  label: string;
  icon?: any;
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
  title: string;
  description?: string;
  data: any[];
  columns: any[];
  loading?: boolean;
  breadcrumbs?: Breadcrumb[];
  stats?: Stat[];
  showStats?: boolean;
  searchFields?: string[];
  searchPlaceholder?: string;
  addActions?: ActionButton[];
  additionalActions?: ActionButton[];
  filters?: Filter[];
  customFilter?: (item: any, searchQuery: string, filterValues: Record<string, string>) => boolean;
  viewMode?: 'list' | 'grid';
  showViewSwitcher?: boolean;
  itemsPerPage?: number;
  showPagination?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  breadcrumbs: () => [],
  stats: () => [],
  showStats: true,
  searchFields: () => [],
  searchPlaceholder: 'Sök...',
  addActions: () => [],
  additionalActions: () => [],
  filters: () => [],
  customFilter: undefined,
  viewMode: 'list',
  showViewSwitcher: true,
  itemsPerPage: 25,
  showPagination: true,
});

const emit = defineEmits<{
  rowClick: [row: any];
  'update:viewMode': [value: 'list' | 'grid'];
}>();

// Reactive state
const searchQuery = ref('');
const currentViewMode = ref(props.viewMode);
const currentPage = ref(1);
const itemsPerPageState = ref(props.itemsPerPage);

// Watch for prop changes
watch(
  () => props.viewMode,
  newValue => {
    currentViewMode.value = newValue;
  }
);

watch(
  () => props.itemsPerPage,
  newValue => {
    itemsPerPageState.value = newValue;
  }
);

// Computed filtered data
const filteredData = computed(() => {
  let filtered = props.data;

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(item => {
      if (props.customFilter) {
        return props.customFilter(item, searchQuery.value, {});
      }

      return props.searchFields.some(field => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(query);
      });
    });
  }

  return filtered;
});

// Paginated data
const paginatedData = computed(() => {
  if (!props.showPagination) {
    return filteredData.value;
  }

  const start = (currentPage.value - 1) * itemsPerPageState.value;
  const end = start + itemsPerPageState.value;
  return filteredData.value.slice(start, end);
});

// Handle view mode updates
const handleViewModeUpdate = (mode: 'list' | 'grid') => {
  currentViewMode.value = mode;
  emit('update:viewMode', mode);
};

// Handle pagination updates
const handlePageUpdate = (page: number) => {
  currentPage.value = page;
};

const handleItemsPerPageUpdate = (itemsPerPage: number) => {
  itemsPerPageState.value = itemsPerPage;
  currentPage.value = 1; // Reset to first page when changing items per page
};

// Reset search when query changes
watch(searchQuery, () => {
  currentPage.value = 1; // Reset to first page when search changes
});

// Reset page when filters change
watch(
  () => props.filters,
  () => {
    currentPage.value = 1;
  },
  { deep: true }
);
</script>
<template>
  <!-- Title, breadcrumbs, and stats -->
  <StandardHeader
    :title="title"
    :description="description"
    :breadcrumbs="breadcrumbs"
    :stats="stats"
    :show-stats="showStats"
  />

  <!-- ViewControls for search, filters, and actions -->
  <ViewControls
    v-model:search-query="searchQuery"
    v-model:view-mode="currentViewMode"
    :search-placeholder="searchPlaceholder"
    :add-actions="addActions"
    :additional-actions="additionalActions"
    :filters="filters"
    :show-view-switcher="showViewSwitcher"
  />

  <!-- Data display (table or grid based on viewMode) -->
  <div class="pb-6">
    <!-- List View (DataTable) -->
    <DataTable
      v-if="currentViewMode === 'list'"
      :data="paginatedData"
      :columns="columns"
      :search-fields="searchFields"
      :show-pagination="false"
      :loading="loading"
      @row-click="$emit('rowClick', $event)"
    >
      <!-- Pass through table-specific slots -->
      <template v-if="$slots['row-actions']" #row-actions="slotData">
        <slot name="row-actions" v-bind="slotData"></slot>
      </template>
      <template v-if="$slots['cell']" #cell="slotData">
        <slot name="cell" v-bind="slotData"></slot>
      </template>
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot v-if="name.startsWith('cell-')" :name="name" v-bind="slotData"></slot>
      </template>
    </DataTable>

    <!-- Grid View (Cards) -->
    <GridView
      v-else-if="currentViewMode === 'grid'"
      :data="paginatedData"
      :columns="columns"
      :loading="loading"
      @card-click="$emit('rowClick', $event)"
    >
      <!-- Pass through custom card slot if provided -->
      <template v-if="$slots['grid-card']" #card="slotData">
        <slot name="grid-card" v-bind="slotData"></slot>
      </template>
      <!-- Pass through actions slot if provided -->
      <template v-if="$slots['grid-actions']" #actions="slotData">
        <slot name="grid-actions" v-bind="slotData"></slot>
      </template>
    </GridView>

    <!-- Pagination Controls -->
    <PaginationControls
      v-if="showPagination"
      :total-items="filteredData.length"
      :current-page="currentPage"
      :items-per-page="itemsPerPageState"
      @update:current-page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
    />
  </div>
</template>
