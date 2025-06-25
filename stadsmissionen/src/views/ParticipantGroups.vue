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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Edit, Plus, Trash2 } from 'lucide-vue-next';

import type { Participant, ParticipantGroup } from '@/types';

const router = useRouter();
const { success, error } = useToast();

// Filter state
const typeFilter = ref('all');
const unitFilter = ref('all');
const searchQuery = ref('');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Dialog state
const showNewGroupDialog = ref(false);

// Reset pagination when filters change
watch([searchQuery, typeFilter, unitFilter], () => {
  currentPage.value = 1;
});

// Fetch data using enhanced API with relational data
const {
  data: participantGroups,
  loading: groupsLoading,
  error: groupsError,
  refresh: refreshGroups,
} = useApiList<ParticipantGroup>(
  () => api.participantGroups.getAll({ include: ['participants', 'activities'] }),
  {
    cacheKey: 'participantGroupsWithRelations',
  }
);

const {
  data: participants,
  loading: participantsLoading,
  error: participantsError,
  refresh: refreshParticipants,
} = useApiList<Participant>(() => api.participants.getAll(), {
  cacheKey: 'participants',
});

// Loading and error states
const isLoading = computed(() => groupsLoading.value || participantsLoading.value);
const hasError = computed(() => groupsError.value !== null || participantsError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshGroups(), refreshParticipants()]);
};

// New group form
const newGroupForm = ref({
  namn: '',
  beskrivning: '',
  enheter: [] as string[],
  deltagare: [] as string[],
  automatiskregel: '',
  isAutomatic: false,
});

// Available units
const enheter = [
  'Barn och unga',
  'Familjecentral',
  'Ekonomisk rådgivning',
  'Boendestöd',
  'Arbetsträning',
  'Språkstöd',
  'Fritidsgård',
];

// Enhanced groups with calculated data from relations
const enhancedGroups = computed(() => {
  if (!participantGroups.value) return [];

  return participantGroups.value.map(group => {
    // Get participant names from included relations
    const participantNames = group.participants
      ? group.participants.map(p => `${p.Fornamn} ${p.Efternamn}`)
      : [];

    // Calculate activity statistics from included relations
    const activityCount = group.activities ? group.activities.length : 0;
    const recentActivityCount = group.activities
      ? group.activities.filter(activity => {
          const activityDate = new Date(activity.Datum ?? activity.CreatedDate);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return activityDate >= thirtyDaysAgo;
        }).length
      : 0;

    return {
      ...group,
      participantNames,
      participantCount: group.participants ? group.participants.length : 0,
      activityCount,
      recentActivityCount,
      isAutomatic: !!group.automatiskregel,
      enheterText: (group.enheter ?? []).join(', '),
    };
  });
});

// Table columns
const columns = [
  { key: 'namn', label: 'Gruppnamn', sortable: true, type: 'custom' },
  { key: 'beskrivning', label: 'Beskrivning', sortable: false, type: 'custom' },
  { key: 'enheter', label: 'Enheter', sortable: false, type: 'custom' },
  { key: 'participantCount', label: 'Deltagare', sortable: true, type: 'custom' },
  { key: 'activityCount', label: 'Aktiviteter', sortable: true, type: 'custom' },
  { key: 'isAutomatic', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, type: 'actions' },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Deltagare', to: '/participants' },
  { label: 'Deltagargrupper', to: '', isCurrentPage: true },
]);

// Statistics calculated from enhanced relational data
const stats = computed(() => {
  if (!participantGroups.value) {
    return [
      { label: 'Totalt', value: 0, color: 'text-blue-600' },
      { label: 'Manuella', value: 0, color: 'text-green-600' },
      { label: 'Automatiska', value: 0, color: 'text-purple-600' },
      { label: 'Deltagare', value: 0, color: 'text-orange-600' },
    ];
  }

  const groups = participantGroups.value;
  const manualGroups = groups.filter(g => !g.automatiskregel);
  const automaticGroups = groups.filter(g => g.automatiskregel);

  // Calculate unique participants across all groups
  const allParticipantIds = new Set();
  groups.forEach(group => {
    if (group.participants) {
      group.participants.forEach(p => allParticipantIds.add(p.ParticipantID));
    }
  });

  return [
    {
      label: 'Totalt',
      value: groups.length,
      color: 'text-blue-600',
    },
    {
      label: 'Manuella',
      value: manualGroups.length,
      color: 'text-green-600',
    },
    {
      label: 'Automatiska',
      value: automaticGroups.length,
      color: 'text-purple-600',
    },
    {
      label: 'Deltagare',
      value: allParticipantIds.size,
      color: 'text-orange-600',
    },
  ];
});

// Filtered groups based on filters and search
const filteredGroups = computed(() => {
  if (!enhancedGroups.value) return [];

  return enhancedGroups.value.filter(group => {
    // Type filter
    const matchesType =
      typeFilter.value === 'all' ||
      (typeFilter.value === 'manual' && !group.isAutomatic) ||
      (typeFilter.value === 'automatic' && group.isAutomatic);

    // Unit filter
    const matchesUnit =
      unitFilter.value === 'all' || (group.enheter ?? []).includes(unitFilter.value);

    // Search filter
    const matchesSearch =
      !searchQuery.value ||
      [group.namn, group.beskrivning, ...(group.enheter ?? []), ...group.participantNames].some(
        field => field?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
      );

    return matchesType && matchesUnit && matchesSearch;
  });
});

// Paginated groups
const paginatedGroups = computed(() => {
  const filtered = filteredGroups.value;
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
  currentPage.value = 1;
};

// Action buttons for ViewControls
const addActions = computed(() => [
  {
    label: 'Ny grupp',
    icon: Plus,
    onClick: handleNewGroup,
    variant: 'default' as const,
  },
]);

// Filters for ViewControls
const filters = computed(() => [
  {
    modelValue: typeFilter.value,
    placeholder: 'Alla typer',
    options: [
      { key: 'all', label: 'Alla typer', value: 'all' },
      { key: 'manual', label: 'Manuella', value: 'manual' },
      { key: 'automatic', label: 'Automatiska', value: 'automatic' },
    ],
    onChange: (value: string) => {
      typeFilter.value = value;
    },
  },
  {
    modelValue: unitFilter.value,
    placeholder: 'Alla enheter',
    options: [
      { key: 'all', label: 'Alla enheter', value: 'all' },
      ...enheter.map(enhet => ({ key: enhet, label: enhet, value: enhet })),
    ],
    onChange: (value: string) => {
      unitFilter.value = value;
    },
  },
]);

// Handle unit selection for new group
const handleUnitChange = (enhet: string, checked: boolean) => {
  if (checked) {
    newGroupForm.value.enheter.push(enhet);
  } else {
    const index = newGroupForm.value.enheter.indexOf(enhet);
    if (index > -1) {
      newGroupForm.value.enheter.splice(index, 1);
    }
  }
};

// Handle participant selection for new group
const handleParticipantChange = (participantId: string, checked: boolean) => {
  if (checked) {
    newGroupForm.value.deltagare.push(participantId);
  } else {
    const index = newGroupForm.value.deltagare.indexOf(participantId);
    if (index > -1) {
      newGroupForm.value.deltagare.splice(index, 1);
    }
  }
};

// Available participants for selection
const availableParticipants = computed(() => {
  return participants.value ?? [];
});

// Event handlers
const handleNewGroup = () => {
  showNewGroupDialog.value = true;
};

const handleRowClick = (
  group: ParticipantGroup & {
    participantCount: number;
    activityCount: number;
    isAutomatic: boolean;
  }
) => {
  router.push('/placeholder');
};

const handleEditGroup = (
  group: ParticipantGroup & {
    participantCount: number;
    activityCount: number;
    isAutomatic: boolean;
  }
) => {
  router.push(`/participant-groups/${group.id}/edit`);
};

const handleDeleteGroup = async (
  group: ParticipantGroup & {
    participantCount: number;
    activityCount: number;
    isAutomatic: boolean;
  },
  event: Event
) => {
  event.stopPropagation();

  const confirmed = confirm(`Är du säker på att du vill ta bort gruppen "${group.namn}"?`);

  if (confirmed) {
    try {
      // TODO: Implement API call to delete group
      console.log('Deleting group:', group.id);
      success('Grupp borttagen', 'Gruppen har tagits bort framgångsrikt');
      await refreshGroups();
    } catch (_err) {
      error('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.');
    }
  }
};

const handleSaveNewGroup = () => {
  // TODO: Implement API call to create new group
  success('Ny grupp skapad');
  showNewGroupDialog.value = false;

  // Reset form
  newGroupForm.value = {
    namn: '',
    beskrivning: '',
    enheter: [],
    deltagare: [],
    automatiskregel: '',
    isAutomatic: false,
  };
};

const handleCancelNewGroup = () => {
  showNewGroupDialog.value = false;
  // Reset form
  newGroupForm.value = {
    namn: '',
    beskrivning: '',
    enheter: [],
    deltagare: [],
    automatiskregel: '',
    isAutomatic: false,
  };
};
</script>

<template>
  <div>
    <!-- Header with title, breadcrumbs, and stats -->
    <StandardHeader
      title="Deltagargrupper"
      description="Hantera grupper av deltagare för aktiviteter och rapporter"
      :breadcrumbs="breadcrumbs"
      show-stats
      :stats="stats"
    />

    <!-- View Controls with search, filters, and actions -->
    <ViewControls
      v-model:search-query="searchQuery"
      :add-actions="addActions"
      :filters="filters"
      search-placeholder="Sök deltagargrupper..."
      :show-view-switcher="false"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar deltagargrupper...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av deltagargrupper</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>

    <!-- DataTable -->
    <div v-else>
      <DataTable
        :data="paginatedGroups || []"
        :columns="columns"
        :loading="isLoading"
        @row-click="handleRowClick"
      >
        <template #cell-namn="{ row }">
          <span class="font-bold">{{ row.namn }}</span>
        </template>

        <template #cell-beskrivning="{ row }">
          <span class="text-muted-foreground">{{ row.beskrivning }}</span>
        </template>

        <template #cell-enheter="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="enhet in (row.enheter || []).slice(0, 2)"
              :key="enhet"
              variant="default"
              class="text-xs"
            >
              {{ enhet }}
            </Badge>
            <Badge v-if="(row.enheter || []).length > 2" variant="default" class="text-xs">
              +{{ (row.enheter || []).length - 2 }}
            </Badge>
          </div>
        </template>

        <template #cell-participantCount="{ row }">
          <Badge variant="default" class="text-xs">{{ row.participantCount }} deltagare</Badge>
        </template>

        <template #cell-activityCount="{ row }">
          <div class="text-center">
            <div class="text-sm font-medium">{{ row.activityCount }}</div>
            <div v-if="row.recentActivityCount > 0" class="text-xs text-green-600">
              {{ row.recentActivityCount }} senaste 30d
            </div>
          </div>
        </template>

        <template #cell-isAutomatic="{ row }">
          <div class="flex items-center gap-2">
            <Badge :variant="row.isAutomatic ? 'secondary' : 'default'" class="text-xs">
              {{ row.isAutomatic ? 'Automatisk' : 'Manuell' }}
            </Badge>
          </div>
        </template>

        <template #row-actions="{ row }">
          <Button
            size="sm"
            variant="ghost"
            class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Redigera"
            @click="handleEditGroup(row)"
          >
            <Edit class="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Radera"
            @click="handleDeleteGroup(row, $event)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </template>
      </DataTable>

      <!-- Pagination Controls -->
      <PaginationControls
        :total-items="filteredGroups.length"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        @update:current-page="handlePageUpdate"
        @update:items-per-page="handleItemsPerPageUpdate"
      />
    </div>

    <!-- New Group Dialog -->
    <Dialog v-model:open="showNewGroupDialog">
      <DialogContent class="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Skapa ny deltagargrupp</DialogTitle>
        </DialogHeader>

        <div class="space-y-6">
          <!-- Basic Information -->
          <div class="space-y-4">
            <div>
              <Label for="group-name">Gruppnamn</Label>
              <Input id="group-name" v-model="newGroupForm.namn" placeholder="Ange gruppnamn..." />
            </div>

            <div>
              <Label for="group-description">Beskrivning</Label>
              <Textarea
                id="group-description"
                v-model="newGroupForm.beskrivning"
                placeholder="Beskriv gruppens syfte..."
                rows="3"
              />
            </div>
          </div>

          <!-- Group Type -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <Switch id="automatic-group" v-model="newGroupForm.isAutomatic" />
              <Label for="automatic-group">Automatisk grupp</Label>
            </div>

            <div v-if="newGroupForm.isAutomatic">
              <Label for="automatic-rule">Automatisk regel</Label>
              <Input
                id="automatic-rule"
                v-model="newGroupForm.automatiskregel"
                placeholder="t.ex. 'ålder >= 18 AND enhet = Arbetsträning'"
              />
            </div>
          </div>

          <!-- Units -->
          <div>
            <Label>Enheter</Label>
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div v-for="enhet in enheter" :key="enhet" class="flex items-center space-x-2">
                <Checkbox
                  :id="`unit-${enhet}`"
                  :checked="newGroupForm.enheter.includes(enhet)"
                  @update:checked="checked => handleUnitChange(enhet, checked)"
                />
                <Label :for="`unit-${enhet}`" class="text-sm">{{ enhet }}</Label>
              </div>
            </div>
          </div>

          <!-- Participants (only for manual groups) -->
          <div v-if="!newGroupForm.isAutomatic && availableParticipants.length > 0">
            <Label>Deltagare</Label>
            <div class="max-h-40 overflow-y-auto border rounded-md p-3 mt-2">
              <div
                v-for="participant in availableParticipants.slice(0, 20)"
                :key="participant.ParticipantID"
                class="flex items-center space-x-2 py-1"
              >
                <Checkbox
                  :id="`participant-${participant.ParticipantID}`"
                  :checked="newGroupForm.deltagare.includes(participant.ParticipantID.toString())"
                  @update:checked="
                    checked =>
                      handleParticipantChange(participant.ParticipantID.toString(), checked)
                  "
                />
                <Label :for="`participant-${participant.ParticipantID}`" class="text-sm">
                  {{ participant.Fornamn }} {{ participant.Efternamn }}
                </Label>
              </div>
              <div
                v-if="availableParticipants.length > 20"
                class="text-xs text-muted-foreground mt-2"
              >
                Visar första 20 deltagare. Använd sökfunktion för fler.
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3">
            <Button variant="outline" @click="handleCancelNewGroup">Avbryt</Button>
            <Button @click="handleSaveNewGroup">Skapa grupp</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
