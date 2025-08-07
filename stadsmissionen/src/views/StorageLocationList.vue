<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ListPage from '@/components/shared/ListPage.vue';
import { Plus, Warehouse, MapPin, Edit, Trash2, Navigation } from 'lucide-vue-next';

const router = useRouter();

// Import storage units data (enligt DataHandlingGuidelines.md)
import storageUnitsData from '@/assets/data/storageUnits.json';

// State
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const loading = ref(false);
const hasError = ref(false);
const typeFilter = ref('all');
const statusFilter = ref('all');

// Helper functions to extract information from comments
const getStatusFromComment = (comment: string): string => {
  if (comment.includes('reparation') || comment.includes('Service')) return 'maintenance';
  if (comment.includes('Vinter')) return 'seasonal';
  if (comment.includes('Full') || comment.includes('full')) return 'full';
  return 'available';
};

const getStatusDisplayFromComment = (comment: string): string => {
  const status = getStatusFromComment(comment);
  switch (status) {
    case 'maintenance': return 'Underhåll';
    case 'seasonal': return 'Säsong';
    case 'full': return 'Full';
    case 'available': return 'Tillgänglig';
    default: return 'Okänd';
  }
};

const extractCapacityFromComment = (comment: string): string => {
  // Extract capacity information from comment
  const capacityMatch = comment.match(/(\d+)\s+(båtar|platser)/);
  if (capacityMatch) {
    return `${capacityMatch[1]} ${capacityMatch[2]}`;
  }
  return 'Okänd kapacitet';
};

// Process storage units data
const storageLocations = computed(() => {
  return storageUnitsData.map((location: any) => ({
    id: location.id,
    name: location.name,
    category: location.unit_type, // warehouse or dock directly
    type: location.unit_type === 'dock' ? 'Brygga' : 'Lager',
    displayType: location.unit_type === 'dock' ? 'Brygga' : 'Lager',
    latitude: location.latitude,
    longitude: location.longitude,
    status: location.is_connected_to_land ? 'available' : 'maintenance',
    displayStatus: location.is_connected_to_land ? 'Tillgänglig' : 'Underhåll',
    capacity: `${location.level_count} våningar`,
    details: `H: ${location.length}m, B: ${location.width}m`,
    location: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
    height: location.length,
    width: location.width,
    comment: `${location.unit_type === 'dock' ? 'Brygga' : 'Lager'} med ${location.level_count} våningar`,
  }));
});

// Filter options
const typeFilterOptions = computed(() => [
  { key: 'all', label: 'Alla typer', value: 'all' },
  { key: 'dock', label: 'Bryggor', value: 'dock' },
  { key: 'warehouse', label: 'Lager', value: 'warehouse' },
]);

const statusFilterOptions = computed(() => [
  { key: 'all', label: 'Alla status', value: 'all' },
  { key: 'available', label: 'Tillgänglig', value: 'available' },
  { key: 'maintenance', label: 'Underhåll', value: 'maintenance' },
  { key: 'seasonal', label: 'Säsong', value: 'seasonal' },
  { key: 'full', label: 'Full', value: 'full' },
]);

// Filtered data based on search and filters
const filteredData = computed(() => {
  let filtered = storageLocations.value;

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      location =>
        location.name.toLowerCase().includes(query) ||
        location.type.toLowerCase().includes(query) ||
        location.displayStatus.toLowerCase().includes(query) ||
        location.capacity.toLowerCase().includes(query) ||
        location.comment.toLowerCase().includes(query)
    );
  }

  // Type filter
  if (typeFilter.value !== 'all') {
    const filterType = typeFilter.value === 'dock' ? 'Brygga' : 'Lager';
    filtered = filtered.filter(location => location.type === filterType);
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(location => location.status === statusFilter.value);
  }

  return filtered;
});

// Paginated data
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

// Table columns
const columns = [
  {
    key: 'name',
    label: 'Namn',
    sortable: true,
    width: '200px',
  },
  {
    key: 'type',
    label: 'Typ',
    sortable: true,
    width: '100px',
  },
  {
    key: 'capacity',
    label: 'Kapacitet',
    sortable: true,
    width: '120px',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: '120px',
    type: 'badge',
    badgeVariant: (value: string) => {
      switch (value) {
        case 'available':
          return 'success';
        case 'maintenance':
          return 'warning';
        case 'seasonal':
          return 'info';
        case 'full':
          return 'error';
        default:
          return 'default';
      }
    },
    transform: (value: string) => {
      switch (value) {
        case 'available': return 'Tillgänglig';
        case 'maintenance': return 'Underhåll';
        case 'seasonal': return 'Säsong';
        case 'full': return 'Full';
        default: return value;
      }
    },
  },
  {
    key: 'details',
    label: 'Dimensioner',
    sortable: true,
    width: '120px',
  },
  {
    key: 'location',
    label: 'Position',
    sortable: false,
    width: '140px',
  },
  {
    key: 'comment',
    label: 'Kommentar',
    sortable: false,
    width: '200px',
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    type: 'actions',
    width: '120px',
    align: 'right',
  },
];

// Action buttons
const addActions = [
  {
    label: 'Lägg till plats',
    icon: Plus,
    onClick: () => {
      console.log('Lägg till ny lagringsplats');
      // Implement add functionality
    },
    variant: 'primary' as const,
  },
];

// Additional actions
const additionalActions = [
  {
    label: 'Visa på karta',
    icon: MapPin,
    onClick: () => {
      router.push('/dashboard'); // Navigate to dashboard map view
    },
    variant: 'secondary' as const,
  },
];

// Filters for ViewControls
const filters = computed(() => [
  {
    modelValue: typeFilter.value,
    placeholder: 'Filtrera typ',
    options: typeFilterOptions.value,
    onChange: (value: string) => {
      typeFilter.value = value;
      currentPage.value = 1; // Reset pagination
    },
  },
  {
    modelValue: statusFilter.value,
    placeholder: 'Filtrera status',
    options: statusFilterOptions.value,
    onChange: (value: string) => {
      statusFilter.value = value;
      currentPage.value = 1; // Reset pagination
    },
  },
]);

// Breadcrumbs
const breadcrumbs = [
  { label: 'Start', path: '/dashboard' },
  { label: 'Båtlagring', path: '/storage' },
  { label: 'Skapa lager', path: '/storage/locations' },
];

// Stats
const stats = computed(() => [
  {
    label: 'Totalt antal platser',
    value: storageLocations.value.length.toString(),
    icon: Warehouse,
  },
  {
    label: 'Bryggor',
    value: storageLocations.value.filter(l => l.type === 'Brygga').length.toString(),
    icon: MapPin,
  },
  {
    label: 'Lager',
    value: storageLocations.value.filter(l => l.type === 'Lager').length.toString(),
    icon: Warehouse,
  },
  {
    label: 'Tillgängliga',
    value: storageLocations.value.filter(l => l.status === 'available').length.toString(),
    icon: Plus,
  },
]);

// Event handlers
const handleRowClick = (location: any) => {
  console.log('Klickade på plats:', location);
  // Navigate to detail view
  router.push(`/storage/locations/${location.id}`);
};

const handleEdit = (location: any) => {
  console.log('Redigera plats:', location);
  // Navigate to detail view in edit mode
  router.push(`/storage/locations/${location.id}`);
};

const handleDelete = (location: any, event: Event) => {
  event.stopPropagation();
  console.log('Radera plats:', location);
  // Implement delete functionality
};

const handleShowOnMap = (location: any, event: Event) => {
  event.stopPropagation();
  // Navigate to dashboard map with specific location coordinates
  router.push({
    path: '/dashboard',
    query: {
      lat: location.latitude,
      lng: location.longitude,
      zoom: '17',
      focus: location.id,
      name: location.name
    }
  });
};

const handleRefresh = () => {
  loading.value = true;
  // Simulate refresh
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

onMounted(() => {
  // Any initialization logic
});
</script>

<template>
  <ListPage
    title="Skapa lager"
    description="Hantera alla lagringsplatser - bryggor och lager"
    :breadcrumbs="breadcrumbs"
    :show-stats="true"
    :stats="stats"
    :search-query="searchQuery"
    search-placeholder="Sök lagringsplatser..."
    :add-actions="addActions"
    :additional-actions="additionalActions"
    :filters="filters"
    :data="paginatedData"
    :columns="columns"
    :search-fields="['name', 'displayType', 'capacity', 'status']"
    :loading="loading"
    :total-items="filteredData.length"
    :current-page="currentPage"
    :items-per-page="itemsPerPage"
    :has-error="hasError"
    @update:search-query="searchQuery = $event"
    @update:current-page="currentPage = $event"
    @update:items-per-page="itemsPerPage = $event"
    @row-click="handleRowClick"
    @edit="handleEdit"
    @delete="handleDelete"
    @refresh="handleRefresh"
  >
    <!-- Custom row actions with map button -->
    <template #row-actions="{ row }">
      <button
        class="flex items-center justify-center h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
        title="Visa på karta"
        @click="handleShowOnMap(row, $event)"
      >
        <Navigation class="h-3.5 w-3.5" />
      </button>
      <button
        class="flex items-center justify-center h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        title="Redigera"
        @click="handleEdit(row)"
      >
        <Edit class="h-3.5 w-3.5" />
      </button>
      <button
        class="flex items-center justify-center h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        title="Radera"
        @click="handleDelete(row, $event)"
      >
        <Trash2 class="h-3.5 w-3.5" />
      </button>
    </template>
  </ListPage>
</template>
