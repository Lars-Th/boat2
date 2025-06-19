<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ListPage from '@/components/shared/ListPage.vue';
import type { TableColumn } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Edit, Plus, Save, Tag, Trash2 } from 'lucide-vue-next';

import { useApiList } from '@/composables/useApi';
import api from '@/api';

// Define interfaces
interface ActivityType {
  ActivityTypeID: number;
  Typnamn: string;
  Syfte: string;
  Beskrivning: string;
}

interface EnhancedActivityType extends ActivityType {
  usageCount: number;
  isActive: boolean;
}

// Filter and search state
const searchQuery = ref('');
const statusFilter = ref('all');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Reset pagination when filters change
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
});

// Fetch activity types with complete relationship data using enhanced API
const {
  data: activityTypesWithRelations,
  loading: isLoading,
  error: hasError,
  refresh: handleRetry,
} = useApiList(() => api.activityTypes.getAll({ include: ['activities'] }), {
  cacheKey: 'activityTypes-with-activities',
});

const showNewTypeDialog = ref(false);
const showEditTypeDialog = ref(false);
const showDeleteDialog = ref(false);
const typeToDelete = ref<ActivityType | null>(null);

// Form data
const newType = ref({
  Typnamn: '',
  Syfte: '',
  Beskrivning: '',
});

const editingType = ref<ActivityType>({
  ActivityTypeID: 0,
  Typnamn: '',
  Syfte: '',
  Beskrivning: '',
});

// Enhanced activity types with usage statistics from included relations
const enhancedActivityTypes = computed((): EnhancedActivityType[] => {
  if (!activityTypesWithRelations.value) return [];

  return activityTypesWithRelations.value.map((type: any) => {
    const usageCount = (type.activities ?? []).length;
    return {
      ...type,
      usageCount,
      isActive: usageCount > 0,
    };
  });
});

// Filter activity types based on search and status
const filteredActivityTypes = computed(() => {
  if (!enhancedActivityTypes.value) return [];

  return enhancedActivityTypes.value.filter((type: EnhancedActivityType) => {
    // Status filter
    const matchesStatus =
      statusFilter.value === 'all' ||
      (statusFilter.value === 'active' && type.isActive) ||
      (statusFilter.value === 'inactive' && !type.isActive);

    // Search filter
    const matchesSearch =
      !searchQuery.value ||
      [type.Typnamn, type.Syfte, type.Beskrivning].some(field =>
        field?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
      );

    return matchesStatus && matchesSearch;
  });
});

// Paginated activity types
const paginatedActivityTypes = computed(() => {
  const filtered = filteredActivityTypes.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filtered.slice(start, end);
});

// Table columns
const columns: TableColumn<Record<string, unknown>>[] = [
  {
    key: 'Typnamn',
    label: 'Typnamn',
    sortable: true,
  },
  {
    key: 'Syfte',
    label: 'Syfte',
    sortable: true,
    type: 'custom',
  },
  {
    key: 'usageCount',
    label: 'Antal aktiviteter',
    sortable: true,
    type: 'custom',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: false,
    type: 'custom',
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    type: 'actions',
  },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Inställningar', to: '/settings' },
  { label: 'Aktivitetstyper', to: '', isCurrentPage: true },
]);

// Statistics - converted to ListPage format
const stats = computed(() => {
  if (!activityTypesWithRelations.value) {
    return [
      { label: 'Totalt', value: '---', color: 'text-blue-600' },
      { label: 'Aktiva', value: '---', color: 'text-green-600' },
      { label: 'Oanvända', value: '---', color: 'text-orange-600' },
      { label: 'Mest använda', value: '---', color: 'text-purple-600' },
    ];
  }

  const activeCount = enhancedActivityTypes.value.filter(t => t.isActive).length;
  const inactiveCount = enhancedActivityTypes.value.filter(t => !t.isActive).length;
  const maxUsage = Math.max(...enhancedActivityTypes.value.map(t => t.usageCount), 0);

  return [
    {
      label: 'Totalt',
      value: activityTypesWithRelations.value.length,
      color: 'text-blue-600',
    },
    {
      label: 'Aktiva',
      value: activeCount,
      color: 'text-green-600',
    },
    {
      label: 'Oanvända',
      value: inactiveCount,
      color: 'text-orange-600',
    },
    {
      label: 'Mest använda',
      value: maxUsage,
      color: 'text-purple-600',
    },
  ];
});

// Action buttons for ListPage
const addActions = computed(() => [
  {
    label: 'Ny aktivitetstyp',
    icon: Plus,
    onClick: handleNewActivityType,
    variant: 'default' as const,
  },
]);

// Filters for ListPage
const filters = computed(() => [
  {
    modelValue: statusFilter.value,
    placeholder: 'Alla statusar',
    options: [
      { key: 'all', label: 'Alla statusar', value: 'all' },
      { key: 'active', label: 'Aktiva', value: 'active' },
      { key: 'inactive', label: 'Oanvända', value: 'inactive' },
    ],
    onChange: (value: string) => {
      statusFilter.value = value;
    },
  },
]);

// Navigate to edit when clicking on row
const navigateToEdit = (type: Record<string, unknown>) => {
  editingType.value = type as unknown as ActivityType;
  showEditTypeDialog.value = true;
};

// Create new activity type
const createActivityType = () => {
  if (!activityTypesWithRelations.value) return;

  const maxId = Math.max(...activityTypesWithRelations.value.map((t: any) => t.ActivityTypeID), 0);
  const newActivityType: ActivityType = {
    ActivityTypeID: maxId + 1,
    Typnamn: newType.value.Typnamn,
    Syfte: newType.value.Syfte,
    Beskrivning: newType.value.Beskrivning,
  };

  activityTypesWithRelations.value.push(newActivityType);
  showNewTypeDialog.value = false;
  resetNewTypeForm();
  console.log('Created new activity type:', newActivityType);
};

// Reset new type form
const resetNewTypeForm = () => {
  newType.value = {
    Typnamn: '',
    Syfte: '',
    Beskrivning: '',
  };
};

// Edit activity type
const handleEditActivityType = (type: Record<string, unknown>, event: Event) => {
  event.stopPropagation();
  editingType.value = type as unknown as ActivityType;
  showEditTypeDialog.value = true;
};

// Save edited activity type
const saveEditedActivityType = () => {
  if (!activityTypesWithRelations.value) return;

  const index = activityTypesWithRelations.value.findIndex(
    (t: any) => t.ActivityTypeID === editingType.value.ActivityTypeID
  );
  if (index > -1) {
    activityTypesWithRelations.value[index] = { ...editingType.value };
    showEditTypeDialog.value = false;
    console.log('Updated activity type:', editingType.value);
  }
};

// Delete activity type
const handleDeleteActivityType = (type: Record<string, unknown>, event: Event) => {
  event.stopPropagation();

  const usageCount = Number(type['usageCount']) || 0;
  if (usageCount > 0) {
    console.warn(
      `Kan inte ta bort aktivitetstyp "${type['Typnamn']}" som används av ${usageCount} aktiviteter`
    );
    return;
  }

  typeToDelete.value = type as unknown as ActivityType;
  showDeleteDialog.value = true;
};

// Confirm delete
const confirmDelete = () => {
  if (typeToDelete.value && activityTypesWithRelations.value) {
    const index = activityTypesWithRelations.value.findIndex(
      (t: any) => t.ActivityTypeID === typeToDelete.value!.ActivityTypeID
    );
    if (index > -1) {
      activityTypesWithRelations.value.splice(index, 1);
      console.log('Deleted activity type:', typeToDelete.value.ActivityTypeID);
    }
  }
  showDeleteDialog.value = false;
  typeToDelete.value = null;
};

// Open new activity type dialog
const handleNewActivityType = () => {
  resetNewTypeForm();
  showNewTypeDialog.value = true;
};

// Pagination handlers
const handlePageUpdate = (page: number) => {
  currentPage.value = page;
};

const handleItemsPerPageUpdate = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage;
  currentPage.value = 1;
};

// Loading and error states
const loading = computed(() => isLoading.value);
const error = computed(() => hasError.value !== null);
</script>

<template>
  <div>
    <ListPage
      title="Aktivitetstyper"
      description="Hantera aktivitetstyper och deras information"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
      :search-query="searchQuery"
      search-placeholder="Sök aktivitetstyper..."
      :add-actions="addActions"
      :filters="filters"
      :show-view-switcher="false"
      :data="paginatedActivityTypes || []"
      :columns="columns"
      :search-fields="['Typnamn', 'Syfte', 'Beskrivning']"
      :loading="loading"
      :total-items="filteredActivityTypes.length"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :has-error="error"
      error-message="Ett fel uppstod vid laddning av aktivitetstyper"
      @update:search-query="searchQuery = $event"
      @update:current-page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
      @row-click="navigateToEdit"
      @refresh="handleRetry"
    >
      <!-- Custom cell templates -->
      <template #cell-Syfte="{ value }">
        <span class="text-xs text-muted-foreground line-clamp-2">
          {{ value || 'Inget syfte angivet' }}
        </span>
      </template>

      <template #cell-usageCount="{ value }">
        <Badge :variant="(value as number) > 0 ? 'default' : 'secondary'" class="text-xs">
          {{ value }} aktiviteter
        </Badge>
      </template>

      <template #cell-status="{ row }">
        <Badge :variant="row['isActive'] ? 'default' : 'secondary'" class="text-xs">
          {{ row['isActive'] ? 'Aktiv' : 'Oanvänd' }}
        </Badge>
      </template>

      <template #row-actions="{ row }">
        <Button
          size="sm"
          variant="ghost"
          title="Redigera aktivitetstyp"
          class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          @click="event => handleEditActivityType(row, event)"
        >
          <Edit class="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="Number(row['usageCount']) > 0"
          title="Ta bort aktivitetstyp"
          class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          @click="event => handleDeleteActivityType(row, event)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </template>
    </ListPage>

    <!-- New Activity Type Dialog -->
    <Dialog v-model:open="showNewTypeDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Skapa ny aktivitetstyp</DialogTitle>
        </DialogHeader>
        <div class="space-y-6">
          <div class="space-y-2">
            <Label for="typeName">Typnamn *</Label>
            <Input
              id="typeName"
              v-model="newType.Typnamn"
              placeholder="T.ex. Social gemenskap"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="typePurpose">Syfte *</Label>
            <Input
              id="typePurpose"
              v-model="newType.Syfte"
              placeholder="T.ex. Främja social samhörighet och minska isolering"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="typeDescription">Beskrivning *</Label>
            <Textarea
              id="typeDescription"
              v-model="newType.Beskrivning"
              placeholder="Detaljerad beskrivning av aktivitetstypen och vad den omfattar..."
              rows="4"
              required
            />
          </div>

          <div class="flex gap-4 justify-end pt-4 border-t">
            <Button
              variant="outline"
              @click="
                showNewTypeDialog = false;
                resetNewTypeForm();
              "
            >
              Avbryt
            </Button>
            <Button
              :disabled="
                !newType.Typnamn.trim() || !newType.Syfte.trim() || !newType.Beskrivning.trim()
              "
              class="gap-2"
              @click="createActivityType"
            >
              <Plus class="h-4 w-4" />
              Skapa aktivitetstyp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Edit Activity Type Dialog -->
    <Dialog v-model:open="showEditTypeDialog">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Redigera aktivitetstyp</DialogTitle>
        </DialogHeader>
        <div class="space-y-6">
          <div class="space-y-2">
            <Label for="editTypeName">Typnamn *</Label>
            <Input
              id="editTypeName"
              v-model="editingType.Typnamn"
              placeholder="T.ex. Social gemenskap"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="editTypePurpose">Syfte *</Label>
            <Input
              id="editTypePurpose"
              v-model="editingType.Syfte"
              placeholder="T.ex. Främja social samhörighet och minska isolering"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="editTypeDescription">Beskrivning *</Label>
            <Textarea
              id="editTypeDescription"
              v-model="editingType.Beskrivning"
              placeholder="Detaljerad beskrivning av aktivitetstypen och vad den omfattar..."
              rows="4"
              required
            />
          </div>

          <div class="flex gap-4 justify-end pt-4 border-t">
            <Button variant="outline" @click="showEditTypeDialog = false">Avbryt</Button>
            <Button
              :disabled="
                !editingType.Typnamn.trim() ||
                !editingType.Syfte.trim() ||
                !editingType.Beskrivning.trim()
              "
              class="gap-2"
              @click="saveEditedActivityType"
            >
              <Save class="h-4 w-4" />
              Spara ändringar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>Ta bort aktivitetstyp</DialogTitle>
        </DialogHeader>
        <div class="space-y-4">
          <p class="text-sm text-muted-foreground">
            Är du säker på att du vill ta bort aktivitetstypen
            <strong>"{{ typeToDelete?.Typnamn || '' }}"</strong>
            ? Denna åtgärd kan inte ångras.
          </p>

          <div class="flex gap-4 justify-end pt-4">
            <Button variant="outline" @click="showDeleteDialog = false">Avbryt</Button>
            <Button variant="destructive" @click="confirmDelete">Ta bort aktivitetstyp</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style lang="scss" scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
