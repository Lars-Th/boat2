<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import api from '@/api';

// Components
import StandardHeader from '@/components/layout/StandardHeader.vue';
import ViewControls from '@/components/shared/ViewControls.vue';
import DataTable from '@/components/shared/DataTable.vue';
import PaginationControls from '@/components/shared/PaginationControls.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Edit, MapPin, Plus, Trash2, Users } from 'lucide-vue-next';

const router = useRouter();
const { success, error: showError } = useToast();

// Filter and search state
const typeFilter = ref('all');
const searchQuery = ref('');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Delete state
const isDeleting = ref(false);
const showDeleteDialog = ref(false);
const activityToDelete = ref<any>(null);

// Reset pagination when filters change
watch([searchQuery, typeFilter], () => {
  currentPage.value = 1;
});

// Fetch activities with types using relational API
const {
  data: activitiesWithTypes,
  loading: activitiesLoading,
  error: activitiesError,
  refresh: refreshActivities,
} = useApiList(() => api.activities.getAll({ include: ['types'] }), {
  cacheKey: 'activities-with-types',
});

// Fetch activity types for statistics and filters
const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
} = useApiList(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Loading state
const isLoading = computed(() => activitiesLoading.value || activityTypesLoading.value);

// Error state
const hasError = computed(
  () => activitiesError.value !== null || activityTypesError.value !== null
);

// Table columns
const columns = [
  { key: 'Namn', label: 'Aktivitet', sortable: true, type: 'custom' },
  { key: 'ActivityType', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'DatumTid', label: 'Datum & Tid', sortable: true, type: 'custom' },
  { key: 'Plats', label: 'Plats', sortable: true },
  { key: 'actions', label: 'Åtgärder', sortable: false, type: 'actions' },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Aktiviteter', to: '', isCurrentPage: true },
]);

// Statistics
const stats = computed(() => {
  if (!activitiesWithTypes.value || !activityTypes.value) {
    return [
      { label: 'Totalt', value: 0, color: 'text-blue-600' },
      { label: 'Denna vecka', value: 0, color: 'text-green-600' },
      { label: 'Unika platser', value: 0, color: 'text-purple-600' },
      { label: 'Aktivitetstyper', value: 0, color: 'text-orange-600' },
    ];
  }

  const thisWeekCount = activitiesWithTypes.value.filter(activity => {
    const activityDate = new Date(activity.DatumTid);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return activityDate >= weekStart && activityDate <= weekEnd;
  }).length;

  const uniquePlaces = new Set(activitiesWithTypes.value.map(activity => activity.Plats)).size;

  return [
    {
      label: 'Totalt',
      value: activitiesWithTypes.value.length,
      color: 'text-blue-600',
    },
    {
      label: 'Denna vecka',
      value: thisWeekCount,
      color: 'text-green-600',
    },
    {
      label: 'Unika platser',
      value: uniquePlaces,
      color: 'text-purple-600',
    },
    {
      label: 'Aktivitetstyper',
      value: activityTypes.value.length,
      color: 'text-orange-600',
    },
  ];
});

// Filtered activities based on type and search
const filteredActivities = computed(() => {
  if (!activitiesWithTypes.value) return [];

  return activitiesWithTypes.value.filter((activity: any) => {
    // Type filter
    const matchesType =
      typeFilter.value === 'all' || activity.activityType?.Typnamn === typeFilter.value;

    // Search filter
    const matchesSearch =
      !searchQuery.value ||
      [activity.Namn, activity.Beskrivning, activity.Plats, activity.activityType?.Typnamn].some(
        field => field?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
      );

    return matchesType && matchesSearch;
  });
});

// Paginated activities
const paginatedActivities = computed(() => {
  const filtered = filteredActivities.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filtered.slice(start, end);
});

// Pagination handlers
const handlePageUpdate = (page: number) => {
  currentPage.value = page;
};

const handleItemsPerPageUpdate = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage;
  currentPage.value = 1; // Reset to first page when changing items per page
};

// Action buttons for ViewControls
const addActions = computed(() => [
  {
    label: 'Ny aktivitet',
    icon: Plus,
    onClick: handleNewActivity,
    variant: 'default' as const,
  },
]);

// Filters for ViewControls
const filters = computed(() => {
  const typeOptions = [
    { key: 'all', label: 'Alla typer', value: 'all' },
    ...(activityTypes.value || []).map((type: any) => ({
      key: type.Typnamn,
      label: type.Typnamn,
      value: type.Typnamn,
    })),
  ];

  return [
    {
      modelValue: typeFilter.value,
      placeholder: 'Alla typer',
      options: typeOptions,
      onChange: (value: string) => {
        typeFilter.value = value;
      },
    },
  ];
});

// Helper functions
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('sv-SE');
};

const getActivityTypeName = (activity: any) => {
  return activity.activityType?.Typnamn || 'Okänd typ';
};

// Event handlers
const handleNewActivity = () => {
  router.push('/activities/new');
};

const handleRowClick = (activity: any) => {
  router.push(`/activities/${activity.ActivityID}`);
};

const handleEditActivity = (activity: any) => {
  router.push(`/activities/${activity.ActivityID}`);
};

const handleDeleteActivity = (activity: any, event: Event) => {
  event.stopPropagation();
  activityToDelete.value = activity;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  if (!activityToDelete.value) return;

  isDeleting.value = true;

  try {
    const result = await api.activities.delete(activityToDelete.value.ActivityID.toString());
    if (result.success) {
      success('Aktivitet borttagen', 'Aktiviteten har tagits bort framgångsrikt.');
      await refreshActivities();
    } else {
      showError('Fel vid borttagning', result.error?.message || 'Kunde inte ta bort aktiviteten.');
    }
  } catch (err) {
    showError('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.');
  } finally {
    isDeleting.value = false;
    showDeleteDialog.value = false;
    activityToDelete.value = null;
  }
};
</script>

<template>
  <div>
    <!-- Header with title, breadcrumbs, and stats -->
    <StandardHeader
      title="Aktiviteter"
      description="Hantera aktiviteter och deras information"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- View Controls with search, filters, and actions -->
    <ViewControls
      v-model:search-query="searchQuery"
      :add-actions="addActions"
      :filters="filters"
      search-placeholder="Sök aktiviteter..."
      :show-view-switcher="false"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar aktiviteter...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av aktiviteter</p>
        <Button
          variant="outline"
          @click="
            () => {
              refreshActivities();
            }
          "
        >
          Försök igen
        </Button>
      </div>
    </div>

    <!-- DataTable -->
    <div v-else>
      <DataTable
        :data="paginatedActivities || []"
        :columns="columns"
        :search-fields="['Namn', 'Beskrivning', 'Plats']"
        :loading="isLoading"
        @row-click="handleRowClick"
      >
        <template #cell-Namn="{ row }">
          <span class="font-bold">{{ row.Namn }}</span>
        </template>

        <template #cell-ActivityType="{ row }">
          <span class="text-muted-foreground">{{ getActivityTypeName(row) }}</span>
        </template>

        <template #cell-DatumTid="{ row }">
          <span class="text-muted-foreground">{{ formatDateTime(row.DatumTid) }}</span>
        </template>

        <template #row-actions="{ row }">
          <Button
            size="sm"
            variant="ghost"
            class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Redigera"
            @click="handleEditActivity(row)"
          >
            <Edit class="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Radera"
            @click="handleDeleteActivity(row, $event)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </template>
      </DataTable>

      <!-- Pagination Controls -->
      <PaginationControls
        :total-items="filteredActivities.length"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        @update:current-page="handlePageUpdate"
        @update:items-per-page="handleItemsPerPageUpdate"
      />
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ta bort aktivitet</DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort aktiviteten "{{ activityToDelete?.Namn }}"? Denna
            åtgärd kan inte ångras och kommer att ta bort all relaterad data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" :disabled="isDeleting" @click="showDeleteDialog = false">
            Avbryt
          </Button>
          <Button variant="destructive" :disabled="isDeleting" @click="confirmDelete">
            <Trash2 class="mr-2 h-4 w-4" />
            {{ isDeleting ? 'Tar bort...' : 'Ta bort' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
