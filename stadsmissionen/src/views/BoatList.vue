<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import api from '@/api';
import ListPage from '@/components/shared/ListPage.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Anchor,
  Calendar,
  Download,
  Edit,
  MapPin,
  Plus,
  Ship,
  Trash2,
  User,
} from 'lucide-vue-next';

const router = useRouter();
const { promise, confirm } = useToast();

// View mode state
const viewMode = ref<'list' | 'grid'>('list');

// Filter state
const statusFilter = ref('all');
const locationFilter = ref('all');

// Fetch boats using the API service with customer relationship
const {
  data: boats,
  loading: boatsLoading,
  error: boatsError,
} = useApiList(
  () =>
    api.boats.getAll({
      include: ['customer'],
    }),
  {
    cacheKey: 'boats-with-customers',
  }
);

// Custom filter function for ListPage
const customFilter = (boat: any, searchQuery: string, filterValues: Record<string, string>) => {
  // Apply status and location filters
  const matchesStatus = statusFilter.value === 'all' || boat.status === statusFilter.value;
  const matchesLocation = locationFilter.value === 'all' || boat.location === locationFilter.value;

  return matchesStatus && matchesLocation;
};

// Loading state
const isLoading = computed(() => boatsLoading.value);

// Error state
const hasError = computed(() => boatsError.value !== null);

// Breadcrumbs
const breadcrumbs = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Båtar', to: '/boats' },
  { label: 'Båtlista', isCurrentPage: true },
];

// Table columns configuration
const columns = [
  { key: 'boatType', label: 'Båttyp', sortable: true },
  {
    key: 'customer',
    label: 'Kund',
    sortable: true,
    type: 'custom',
  },
  {
    key: 'length',
    label: 'Längd',
    sortable: true,
    width: '80px',
    format: (value: number) => (value ? `${value}m` : '-'),
    class: 'hidden lg:table-cell',
  },
  {
    key: 'width',
    label: 'Bredd',
    sortable: true,
    width: '80px',
    format: (value: number) => (value ? `${value}m` : '-'),
    class: 'hidden lg:table-cell',
  },
  {
    key: 'launchDate',
    label: 'Isättning',
    sortable: true,
    width: '100px',
    format: (value: string) => (value ? new Date(value).toLocaleDateString('sv-SE') : '-'),
    class: 'hidden xl:table-cell',
  },
  {
    key: 'haul_outDate',
    label: 'Upptagning',
    sortable: true,
    width: '100px',
    format: (value: string) => (value ? new Date(value).toLocaleDateString('sv-SE') : '-'),
    class: 'hidden xl:table-cell',
  },
  {
    key: 'location',
    label: 'Plats',
    sortable: true,
    width: '100px',
    type: 'badge',
    badgeVariant: (value: string) => {
      switch (value) {
        case 'brygga':
          return 'default';
        case 'lager':
          return 'secondary';
        case 'both':
          return 'outline';
        default:
          return 'secondary';
      }
    },
    format: (value: string) => {
      switch (value) {
        case 'brygga':
          return 'Brygga';
        case 'lager':
          return 'Lager';
        case 'both':
          return 'Båda';
        default:
          return value;
      }
    },
    class: 'hidden md:table-cell',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    type: 'badge',
    badgeVariant: (value: string) => {
      switch (value) {
        case 'placed':
          return 'default';
        case 'unplaced':
          return 'destructive';
        case 'in-water':
          return 'secondary';
        default:
          return 'outline';
      }
    },
    format: (value: string) => {
      switch (value) {
        case 'placed':
          return 'Placerad';
        case 'unplaced':
          return 'Oplacerad';
        case 'in-water':
          return 'I sjön';
        default:
          return value;
      }
    },
    class: 'hidden md:table-cell',
  },
  { key: 'actions', label: 'Åtgärder', type: 'actions', width: '120px', align: 'right' },
];

// Statistics
const stats = computed(() => {
  if (!boats.value) {
    return [
      { label: 'Totalt', value: 0, color: 'text-blue-600' },
      { label: 'Placerade', value: 0, color: 'text-green-600' },
      { label: 'Oplacerade', value: 0, color: 'text-orange-600' },
      { label: 'I sjön', value: 0, color: 'text-purple-600' },
    ];
  }

  const placedBoats = boats.value.filter((b: any) => b.status === 'placed').length;
  const unplacedBoats = boats.value.filter((b: any) => b.status === 'unplaced').length;
  const inWaterBoats = boats.value.filter((b: any) => b.status === 'in-water').length;

  return [
    {
      label: 'Totalt',
      value: boats.value.length,
      color: 'text-blue-600',
    },
    {
      label: 'Placerade',
      value: placedBoats,
      color: 'text-green-600',
    },
    {
      label: 'Oplacerade',
      value: unplacedBoats,
      color: 'text-orange-600',
    },
    {
      label: 'I sjön',
      value: inWaterBoats,
      color: 'text-purple-600',
    },
  ];
});

// Action handlers
const addBoat = () => {
  router.push('/boats/list/new');
};

const goToPlacement = () => {
  router.push('/boats/placement');
};

const exportBoats = async (): Promise<void> => {
  try {
    await promise(new Promise<void>(resolve => setTimeout(resolve, 2000)), {
      loading: 'Exporterar båtdata...',
      success: 'Båtdata har exporterats framgångsrikt!',
      error: 'Ett fel uppstod vid export av båtdata.',
    });
  } catch (err) {
    console.error('Export failed:', err);
  }
};

// ViewControls configuration
const addActions = [
  {
    label: 'Båtplacering',
    icon: MapPin,
    onClick: goToPlacement,
    class: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    label: 'Lägg till båt',
    icon: Plus,
    onClick: addBoat,
  },
];

const additionalActions = [
  {
    label: 'Båtplacering',
    icon: MapPin,
    onClick: goToPlacement,
  },
  {
    label: 'Exportera',
    icon: Download,
    onClick: exportBoats,
  },
];

const filters = computed(() => [
  {
    modelValue: statusFilter.value,
    placeholder: 'Status',
    options: [
      { key: 'all', label: 'Alla status', value: 'all' },
      { key: 'placed', label: 'Placerade', value: 'placed' },
      { key: 'unplaced', label: 'Oplacerade', value: 'unplaced' },
      { key: 'in-water', label: 'I sjön', value: 'in-water' },
    ],
    onChange: (value: string) => {
      statusFilter.value = value;
    },
  },
  {
    modelValue: locationFilter.value,
    placeholder: 'Plats',
    options: [
      { key: 'all', label: 'Alla platser', value: 'all' },
      { key: 'brygga', label: 'Brygga', value: 'brygga' },
      { key: 'lager', label: 'Lager', value: 'lager' },
      { key: 'both', label: 'Båda', value: 'both' },
    ],
    onChange: (value: string) => {
      locationFilter.value = value;
    },
  },
]);

// Navigate to boat detail
const navigateToBoatDetail = (boat: any) => {
  router.push(`/boats/list/${boat.id}`);
};

// Action handlers for boat operations
const editBoat = (boat: any, event: MouseEvent) => {
  event.stopPropagation();
  router.push(`/boats/list/${boat.id}`);
};

const deleteBoat = async (boat: any, event: MouseEvent): Promise<void> => {
  event.stopPropagation();

  const boatName = `${boat.boatType} (${boat.customer?.CompanyName || 'Okänd kund'})`;

  confirm(
    'Radera båt?',
    `Är du säker på att du vill radera ${boatName}? Denna åtgärd kan inte ångras.`,
    async (): Promise<void> => {
      try {
        await promise(api.boats.delete(boat.id.toString()), {
          loading: `Raderar ${boatName}...`,
          success: `${boatName} har raderats framgångsrikt.`,
          error: 'Ett fel uppstod när båten skulle raderas.',
        });
      } catch (err) {
        console.error('Error deleting boat:', err);
      }
    },
    () => {
      // Användaren avbröt - ingen åtgärd behövs
    }
  );
};

const viewCustomer = (boat: any, event: MouseEvent) => {
  event.stopPropagation();
  router.push(`/customers/${boat.customerId}`);
};

// Handle view mode changes
const handleViewModeChange = (mode: 'list' | 'grid') => {
  viewMode.value = mode;
};
</script>

<template>
  <ListPage
    title="Båtar"
    description="Hantera och övervaka alla registrerade båtar"
    :breadcrumbs="breadcrumbs"
    :data="boats || []"
    :columns="columns"
    :loading="isLoading"
    :stats="stats"
    :search-fields="[
      'boatType',
      'customer.CompanyName',
      'customer.ContactPerson',
      'comments',
      'location',
    ]"
    :add-actions="addActions"
    :additional-actions="additionalActions"
    :filters="filters"
    :custom-filter="customFilter"
    :view-mode="viewMode"
    search-placeholder="Sök båtar..."
    @row-click="navigateToBoatDetail"
    @update:view-mode="handleViewModeChange"
  >
    <!-- Custom cell templates -->
    <template #cell-customer="{ value, row }">
      <span>{{ row?.customer?.CompanyName || 'Okänd kund' }}</span>
    </template>

    <template #row-actions="{ row }">
      <div class="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="sm"
          title="Visa kund"
          class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          @click="viewCustomer(row, $event)"
        >
          <User class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Redigera"
          class="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          @click="editBoat(row, $event)"
        >
          <Edit class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Radera"
          class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          @click="deleteBoat(row, $event)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </div>
    </template>

    <!-- Custom grid card for boats -->
    <template #grid-card="{ item }">
      <div class="flex items-start gap-3 p-6">
        <!-- Boat icon -->
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Ship class="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <!-- Boat details -->
        <div class="flex-1 min-w-0">
          <!-- Header with boat type and status -->
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-base font-semibold text-gray-900 truncate">
              {{ item.boatType }}
            </h3>
            <Badge
              :variant="
                item.status === 'placed'
                  ? 'default'
                  : item.status === 'unplaced'
                    ? 'destructive'
                    : 'secondary'
              "
              class="text-xs ml-2"
            >
              {{
                item.status === 'placed'
                  ? 'Placerad'
                  : item.status === 'unplaced'
                    ? 'Oplacerad'
                    : 'I sjön'
              }}
            </Badge>
          </div>

          <!-- Customer -->
          <div class="text-sm text-gray-600 mb-2">
            <span class="font-medium">{{ item.customer?.CompanyName || 'Okänd kund' }}</span>
          </div>

          <!-- Details grid -->
          <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div>
              <span class="font-medium">Mått:</span>
              {{ item.length }}m × {{ item.width }}m
            </div>
            <div>
              <span class="font-medium">Plats:</span>
              {{
                item.location === 'brygga' ? 'Brygga' : item.location === 'lager' ? 'Lager' : 'Båda'
              }}
            </div>
            <div v-if="item.launchDate" class="col-span-2">
              <span class="font-medium">Isättning:</span>
              {{ new Date(item.launchDate).toLocaleDateString('sv-SE') }}
            </div>
          </div>

          <!-- Comments -->
          <div v-if="item.comments" class="mt-2 text-xs text-gray-500 line-clamp-2">
            {{ item.comments }}
          </div>
        </div>
      </div>
    </template>

    <!-- Custom grid actions for boats -->
    <template #grid-actions="{ item }">
      <div class="flex items-center justify-end gap-1 border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          title="Visa kund"
          class="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          @click="viewCustomer(item, $event)"
        >
          <User class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Redigera"
          class="h-7 w-7 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          @click="editBoat(item, $event)"
        >
          <Edit class="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="Radera"
          class="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          @click="deleteBoat(item, $event)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </div>
    </template>
  </ListPage>
</template>
