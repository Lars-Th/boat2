<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import { useAuth } from '@/composables/useAuth';
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
const { currentUser } = useAuth();

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

// Fetch data using the new structure
const {
  data: participantGroups,
  loading: groupsLoading,
  error: groupsError,
  refresh: refreshGroups,
} = useApiList<any>(() => api.participantGroups.getAll(), {
  cacheKey: 'participantGroups',
});

const {
  data: participants,
  loading: participantsLoading,
  error: participantsError,
  refresh: refreshParticipants,
} = useApiList<Participant>(() => api.participants.getAll(), {
  cacheKey: 'participants',
});

const {
  data: users,
  loading: usersLoading,
  error: usersError,
  refresh: refreshUsers,
} = useApiList<any>(() => api.users.getAll(), {
  cacheKey: 'users',
});

const {
  data: offices,
  loading: officesLoading,
  error: officesError,
  refresh: refreshOffices,
} = useApiList<any>(() => api.offices.getAll(), {
  cacheKey: 'offices',
});

const {
  data: groupsJunction,
  loading: junctionLoading,
  error: junctionError,
  refresh: refreshJunction,
} = useApiList<any>(
  () => api.groupsJunction?.getAll() || Promise.resolve({ data: [], success: true }),
  {
    cacheKey: 'groupsJunction',
  }
);

// Loading and error states
const isLoading = computed(
  () =>
    Boolean(groupsLoading.value) ||
    Boolean(
      participantsLoading.value ||
        usersLoading.value ||
        officesLoading.value ||
        junctionLoading.value
    )
);
const hasError = computed(
  () =>
    groupsError.value !== null ||
    participantsError.value !== null ||
    usersError.value !== null ||
    officesError.value !== null ||
    junctionError.value !== null
);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([
    refreshGroups(),
    refreshParticipants(),
    refreshUsers(),
    refreshOffices(),
    refreshJunction(),
  ]);
};

// New group form
const newGroupForm = ref({
  name: '',
  description: '',
  type: '',
});

// Get current user's organization offices
const currentUserOffices = computed(() => {
  if (!currentUser.value?.stadsmission || !offices.value) return [];

  return offices.value.filter(
    (office: any) => office.stadsmission === currentUser.value?.stadsmission
  );
});

// Enhanced groups with calculated data from junction table and organization filtering
const enhancedGroups = computed(() => {
  if (!participantGroups.value || !groupsJunction.value || !participants.value || !users.value)
    return [];

  // Filter groups by current user's organization
  const userStadsmission = currentUser.value?.stadsmission;
  if (!userStadsmission) return [];

  return participantGroups.value
    .filter((group: any) => {
      // Check if group was created by someone from the same organization
      const creator = users.value.find((user: any) => user.id === group.createdBy);
      return creator?.stadsmission === userStadsmission;
    })
    .map((group: any) => {
      // Get junction records for this group
      const groupJunctions = groupsJunction.value.filter(
        (junction: any) => junction.groupID === group.id
      );

      // Get participants for this group
      const groupParticipants = groupJunctions
        .map((junction: any) => {
          return participants.value.find((p: any) => p.ParticipantID === junction.participantID);
        })
        .filter(Boolean);

      // Get offices for this group
      const groupOffices = groupJunctions
        .map((junction: any) => {
          return currentUserOffices.value.find(
            (office: any) => office.OfficeID === junction.officeID
          );
        })
        .filter(Boolean);

      // Get unique office names
      const uniqueOffices = [...new Set(groupOffices.map((office: any) => office.Name))];

      // Get participant names
      const participantNames = groupParticipants
        .map((p: any) => (p ? `${p.Fornamn} ${p.Efternamn}` : ''))
        .filter(Boolean);

      // Get creator name
      const creator = users.value.find((user: any) => user.id === group.createdBy);
      const creatorName = creator ? creator.name : 'Okänd';

      return {
        ...group,
        participantNames,
        participantCount: groupParticipants.length,
        activityCount: 0, // TODO: Calculate from activities if needed
        recentActivityCount: 0,
        enheter: uniqueOffices,
        enheterText: uniqueOffices.join(', '),
        creatorName,
        isAutomatic: false, // New structure doesn't have automatic groups
      };
    });
});

// Table columns
const columns = [
  { key: 'name', label: 'Gruppnamn', sortable: true, type: 'custom' },
  { key: 'description', label: 'Beskrivning', sortable: false, type: 'custom' },
  { key: 'type', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'enheter', label: 'Enheter', sortable: false, type: 'custom' },
  { key: 'participantCount', label: 'Deltagare', sortable: true, type: 'custom' },
  { key: 'creatorName', label: 'Skapad av', sortable: true, type: 'custom' },
  { key: 'createdDate', label: 'Skapad', sortable: true, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, type: 'actions' },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Deltagare', to: '/participants' },
  { label: 'Deltagargrupper', to: '', isCurrentPage: true },
]);

// Statistics calculated from enhanced data
const stats = computed(() => {
  if (!enhancedGroups.value) {
    return [
      { label: 'Totalt', value: 0, color: 'text-blue-600' },
      { label: 'Deltagare', value: 0, color: 'text-orange-600' },
      { label: 'Kontor', value: 0, color: 'text-green-600' },
      { label: 'Typer', value: 0, color: 'text-purple-600' },
    ];
  }

  const groups = enhancedGroups.value;

  // Calculate unique participants across all groups
  const allParticipantIds = new Set();
  groups.forEach((group: any) => {
    if (group.participantNames) {
      group.participantNames.forEach((name: string) => allParticipantIds.add(name));
    }
  });

  // Calculate unique offices
  const allOffices = new Set();
  groups.forEach((group: any) => {
    if (group.enheter) {
      group.enheter.forEach((office: string) => allOffices.add(office));
    }
  });

  // Calculate unique types
  const allTypes = new Set();
  groups.forEach((group: any) => {
    if (group.type) {
      allTypes.add(group.type);
    }
  });

  return [
    {
      label: 'Totalt',
      value: groups.length,
      color: 'text-blue-600',
    },
    {
      label: 'Deltagare',
      value: allParticipantIds.size,
      color: 'text-orange-600',
    },
    {
      label: 'Kontor',
      value: allOffices.size,
      color: 'text-green-600',
    },
    {
      label: 'Typer',
      value: allTypes.size,
      color: 'text-purple-600',
    },
  ];
});

// Filtered groups based on filters and search
const filteredGroups = computed(() => {
  if (!enhancedGroups.value) return [];

  return enhancedGroups.value.filter((group: any) => {
    // Type filter
    const matchesType = typeFilter.value === 'all' || group.type === typeFilter.value;

    // Unit filter
    const matchesUnit =
      unitFilter.value === 'all' || (group.enheter ?? []).includes(unitFilter.value);

    // Search filter
    const searchFields = [
      group.name,
      group.description,
      group.type,
      group.creatorName,
      ...(group.enheter || []),
      ...group.participantNames,
    ];

    const matchesSearch =
      !searchQuery.value ||
      searchFields.some((field: any) =>
        field?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
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
const filters = computed(() => {
  // Get unique types from current groups
  const groupTypes = enhancedGroups.value
    .map((group: any) => group.type)
    .filter((type: string) => type);
  const uniqueTypes = [...new Set(groupTypes)];

  return [
    {
      modelValue: typeFilter.value,
      placeholder: 'Alla typer',
      options: [
        { key: 'all', label: 'Alla typer', value: 'all' },
        ...uniqueTypes.map(type => ({ key: type, label: type, value: type })),
      ],
      onChange: (value: string) => {
        typeFilter.value = value;
      },
    },
    {
      modelValue: unitFilter.value,
      placeholder: 'Alla kontor',
      options: [
        { key: 'all', label: 'Alla kontor', value: 'all' },
        ...currentUserOffices.value.map((office: any) => ({
          key: office.Name,
          label: office.Name,
          value: office.Name,
        })),
      ],
      onChange: (value: string) => {
        unitFilter.value = value;
      },
    },
  ];
});

// Available participants for selection (for future use)
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
    name: '',
    description: '',
    type: '',
  };
};

const handleCancelNewGroup = () => {
  showNewGroupDialog.value = false;
  // Reset form
  newGroupForm.value = {
    name: '',
    description: '',
    type: '',
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
        <template #cell-name="{ row }">
          <span class="font-bold">{{ row.name }}</span>
        </template>

        <template #cell-description="{ row }">
          <span class="text-muted-foreground">{{ row.description }}</span>
        </template>

        <template #cell-type="{ row }">
          <Badge variant="outline" class="text-xs">{{ row.type }}</Badge>
        </template>

        <template #cell-enheter="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="office in (row.enheter || []).slice(0, 2)"
              :key="office"
              variant="default"
              class="text-xs"
            >
              {{ office }}
            </Badge>
            <Badge v-if="(row.enheter || []).length > 2" variant="default" class="text-xs">
              +{{ (row.enheter || []).length - 2 }}
            </Badge>
          </div>
        </template>

        <template #cell-participantCount="{ row }">
          <Badge variant="default" class="text-xs">{{ row.participantCount }} deltagare</Badge>
        </template>

        <template #cell-creatorName="{ row }">
          <span class="text-sm">{{ row.creatorName }}</span>
        </template>

        <template #cell-createdDate="{ row }">
          <span class="text-sm text-muted-foreground">
            {{ new Date(row.createdDate).toLocaleDateString('sv-SE') }}
          </span>
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
              <Input id="group-name" v-model="newGroupForm.name" placeholder="Ange gruppnamn..." />
            </div>

            <div>
              <Label for="group-description">Beskrivning</Label>
              <Textarea
                id="group-description"
                v-model="newGroupForm.description"
                placeholder="Beskriv gruppens syfte..."
                rows="3"
              />
            </div>

            <div>
              <Label for="group-type">Typ</Label>
              <Input
                id="group-type"
                v-model="newGroupForm.type"
                placeholder="Ange gruppens typ..."
              />
            </div>
          </div>

          <!-- Note -->
          <div class="text-sm text-muted-foreground p-3 bg-muted rounded-md">
            <p>Deltagare och kontor kan läggas till efter att gruppen har skapats.</p>
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
