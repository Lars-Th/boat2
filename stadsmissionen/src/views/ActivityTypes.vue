<script setup lang="ts">
import { computed, ref } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import SearchAndFilter from '@/components/shared/SearchAndFilter.vue';

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

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Activity, ActivityType, TableColumn } from '@/types';

interface EnhancedActivityType extends ActivityType {
  usageCount: number;
  isActive: boolean;
}

// Fetch data using API service
const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
  refresh: refreshActivityTypes,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

const {
  data: activities,
  loading: activitiesLoading,
  error: activitiesError,
  refresh: refreshActivities,
} = useApiList<Activity>(() => api.activities.getAll(), {
  cacheKey: 'activities',
});

// Loading and error states
const isLoading = computed(() => activityTypesLoading.value || activitiesLoading.value);
const hasError = computed(
  () => activityTypesError.value !== null || activitiesError.value !== null
);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshActivityTypes(), refreshActivities()]);
};

// Reactive data
const searchTerm = ref('');
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

// Enhanced activity types with usage statistics
const enhancedActivityTypes = computed((): EnhancedActivityType[] => {
  if (!activityTypes.value || !activities.value) return [];

  return activityTypes.value.map(type => {
    const usageCount =
      activities.value?.filter(a => Number(a.ActivityTypeID) === Number(type.ActivityTypeID))
        .length ?? 0;
    return {
      ...type,
      usageCount,
      isActive: usageCount > 0,
    };
  });
});

// Filter activity types based on search
const filteredActivityTypes = computed(() => {
  if (!searchTerm.value) return enhancedActivityTypes.value;

  const search = searchTerm.value.toLowerCase();
  return enhancedActivityTypes.value.filter(
    type =>
      type.Typnamn.toLowerCase().includes(search) ||
      type.Syfte?.toLowerCase().includes(search) ||
      type.Beskrivning?.toLowerCase().includes(search)
  );
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

// Statistics
const stats = computed(() => {
  if (!activityTypes.value) {
    return [
      { title: 'Totalt aktivitetstyper', value: 0, icon: Tag, color: 'blue' },
      { title: 'Aktiva typer', value: 0, icon: Tag, color: 'green' },
      { title: 'Oanvända typer', value: 0, icon: Tag, color: 'orange' },
      { title: 'Mest använda', value: 0, icon: Tag, color: 'purple' },
    ];
  }

  return [
    {
      title: 'Totalt aktivitetstyper',
      value: activityTypes.value.length,
      icon: Tag,
      color: 'blue',
    },
    {
      title: 'Aktiva typer',
      value: enhancedActivityTypes.value.filter(t => t.isActive).length,
      icon: Tag,
      color: 'green',
    },
    {
      title: 'Oanvända typer',
      value: enhancedActivityTypes.value.filter(t => !t.isActive).length,
      icon: Tag,
      color: 'orange',
    },
    {
      title: 'Mest använda',
      value: Math.max(...enhancedActivityTypes.value.map(t => t.usageCount), 0),
      icon: Tag,
      color: 'purple',
    },
  ];
});

// Navigate to edit when clicking on row
const navigateToEdit = (type: Record<string, unknown>) => {
  editingType.value = type as unknown as ActivityType;
  showEditTypeDialog.value = true;
};

// Create new activity type
const createActivityType = () => {
  if (!activityTypes.value) return;

  const maxId = Math.max(...activityTypes.value.map(t => t.ActivityTypeID), 0);
  const newActivityType: ActivityType = {
    ActivityTypeID: maxId + 1,
    Typnamn: newType.value.Typnamn,
    Syfte: newType.value.Syfte,
    Beskrivning: newType.value.Beskrivning,
  };

  // TODO: Implement actual create API call
  // For now, just add to local data
  activityTypes.value.push(newActivityType);
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
  if (!activityTypes.value) return;

  const index = activityTypes.value.findIndex(
    t => t.ActivityTypeID === editingType.value.ActivityTypeID
  );
  if (index > -1) {
    // TODO: Implement actual update API call
    // For now, just update local data
    activityTypes.value[index] = { ...editingType.value };
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
  if (typeToDelete.value && activityTypes.value) {
    const index = activityTypes.value.findIndex(
      t => t.ActivityTypeID === typeToDelete.value?.ActivityTypeID
    );
    if (index > -1) {
      // TODO: Implement actual delete API call
      // For now, just remove from local data
      activityTypes.value.splice(index, 1);
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
</script>

<template>
  <PageLayout
    title="Aktivitetstyper"
    breadcrumbs="Dashboard / Administration / Aktivitetstyper"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar aktivitetstyper...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av aktivitetstyper</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Search and Actions -->
      <div class="px-6 py-4">
        <SearchAndFilter v-model:search="searchTerm" placeholder="Sök aktivitetstyper...">
          <template #actions>
            <Dialog v-model:open="showNewTypeDialog">
              <DialogTrigger as-child>
                <Button class="gap-2" @click="handleNewActivityType">
                  <Plus class="h-4 w-4" />
                  Ny aktivitetstyp
                </Button>
              </DialogTrigger>
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
                        !newType.Typnamn.trim() ||
                        !newType.Syfte.trim() ||
                        !newType.Beskrivning.trim()
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
          </template>
        </SearchAndFilter>
      </div>

      <!-- Empty State -->
      <div
        v-if="!activityTypes || activityTypes.length === 0"
        class="flex items-center justify-center py-12"
      >
        <div class="text-center">
          <Tag class="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p class="text-muted-foreground mb-4">Inga aktivitetstyper tillgängliga</p>
          <Button @click="handleNewActivityType">
            <Plus class="h-4 w-4 mr-2" />
            Skapa första aktivitetstypen
          </Button>
        </div>
      </div>

      <!-- Activity Types Table -->
      <DataTable
        v-else
        :data="filteredActivityTypes as unknown as Record<string, unknown>[]"
        :columns="columns"
        class="cursor-pointer activity-types-table"
        @row-click="navigateToEdit"
      >
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

        <template #actions="{ row }">
          <div class="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              title="Redigera aktivitetstyp"
              class="h-8 w-8 p-0"
              @click="event => handleEditActivityType(row, event)"
            >
              <Edit class="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              :disabled="Number(row['usageCount']) > 0"
              title="Ta bort aktivitetstyp"
              class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              @click="event => handleDeleteActivityType(row, event)"
            >
              <Trash2 class="h-3 w-3" />
            </Button>
          </div>
        </template>
      </DataTable>

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
    </template>
  </PageLayout>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.activity-types-table :deep(td),
.activity-types-table :deep(th) {
  font-size: 12px;
}

.activity-types-table :deep(.table-cell) {
  font-size: 12px;
}
</style>
