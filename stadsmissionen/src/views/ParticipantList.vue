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
import { Edit, Plus, Trash2 } from 'lucide-vue-next';

const router = useRouter();
const { success, error } = useToast();

// Filter state
const ageFilter = ref('all');
const genderFilter = ref('all');
const searchQuery = ref('');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Reset pagination when filters change
watch([searchQuery, ageFilter, genderFilter], () => {
  currentPage.value = 1;
});

// Use standardized API pattern for participants with relations
const {
  data: participantsWithRelations,
  loading: participantsLoading,
  error: participantsError,
  refresh: refreshParticipants,
} = useApiList(() => api.participants.getAll({ include: ['activities', 'family'] }), {
  cacheKey: 'participants-with-relations',
});

// Loading state
const isLoading = computed(() => Boolean(participantsLoading.value));

// Error state
const hasError = computed(() => participantsError.value !== null);

// Get offices data
const {
  data: officesData,
  loading: officesLoading,
  error: officesError,
} = useApiList(() => api.offices.getAll(), {
  cacheKey: 'offices',
});

const enheter = computed(() => officesData.value ?? []);

// Calculate age from personnummer or return unknown
const calculateAge = (personnummer: string) => {
  if (!personnummer) return 'Okänd';
  const year = parseInt(personnummer.substring(0, 4));
  const currentYear = new Date().getFullYear();
  return currentYear - year;
};

// Enhanced participants with calculated data using the new relationship system
const enhancedParticipants = computed(() => {
  if (!participantsWithRelations.value) return [];

  return participantsWithRelations.value.map(participant => {
    const guardianNames = participant.guardians?.map(g => `${g.Fornamn} ${g.Efternamn}`) ?? [];
    const siblingNames = participant.siblings?.map(s => `${s.Fornamn} ${s.Efternamn}`) ?? [];
    const childrenNames = participant.children?.map(c => `${c.Fornamn} ${c.Efternamn}`) ?? [];

    return {
      ...participant,
      fullName: `${participant.Fornamn} ${participant.Efternamn}`,
      age: calculateAge(participant.Personnummer),
      hasGuardian: (participant.guardians?.length ?? 0) > 0,
      hasSiblings: (participant.siblings?.length ?? 0) > 0,
      hasChildren: (participant.children?.length ?? 0) > 0,
      guardianNames,
      siblingNames,
      childrenNames,
      totalRelations: participant.familyRelations?.length ?? 0,
    };
  });
});

// Gender icon mapping
const getGenderIcon = (kon: string) => {
  switch (kon) {
    case 'Man':
      return '👨';
    case 'Kvinna':
      return '👩';
    case 'Annat':
      return '🧑';
    default:
      return '❓';
  }
};

// Table columns
const columns = [
  { key: 'fullName', label: 'Namn', sortable: true, type: 'custom' },
  { key: 'enheter', label: 'Enhet', sortable: false, type: 'custom' },
  { key: 'age', label: 'Ålder', sortable: true },
  { key: 'kon', label: 'Kön', sortable: true, type: 'custom' },
  { key: 'relations', label: 'Familj', sortable: false, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, type: 'actions' },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Deltagare', to: '', isCurrentPage: true },
]);

// Statistics
const stats = computed(() => {
  if (!enhancedParticipants.value) {
    return [
      { label: 'Totalt', value: 0, color: 'text-blue-600' },
      { label: 'Barn (under 18)', value: 0, color: 'text-green-600' },
      { label: 'Med familjerelationer', value: 0, color: 'text-purple-600' },
      { label: 'Totala enheter', value: enheter.value.length, color: 'text-orange-600' },
    ];
  }

  const childrenCount = enhancedParticipants.value.filter(
    p => typeof p.age === 'number' && p.age < 18
  ).length;
  const withRelationsCount = enhancedParticipants.value.filter(p => p.totalRelations > 0).length;

  return [
    {
      label: 'Totalt',
      value: enhancedParticipants.value.length,
      color: 'text-blue-600',
    },
    {
      label: 'Barn (under 18)',
      value: childrenCount,
      color: 'text-green-600',
    },
    {
      label: 'Med familjerelationer',
      value: withRelationsCount,
      color: 'text-purple-600',
    },
    {
      label: 'Totala enheter',
      value: enheter.value.length,
      color: 'text-orange-600',
    },
  ];
});

// Filtered participants based on filters and search
const filteredParticipants = computed(() => {
  if (!enhancedParticipants.value) return [];

  return enhancedParticipants.value.filter(participant => {
    // Age filter
    const matchesAge =
      ageFilter.value === 'all' ||
      (ageFilter.value === 'child' &&
        typeof participant.age === 'number' &&
        participant.age < 18) ||
      (ageFilter.value === 'adult' &&
        typeof participant.age === 'number' &&
        participant.age >= 18) ||
      (ageFilter.value === 'unknown' && participant.age === 'Okänd');

    // Gender filter
    const matchesGender = genderFilter.value === 'all' || participant.Kon === genderFilter.value;

    // Search filter
    const matchesSearch =
      !searchQuery.value ||
      [
        participant.fullName,
        participant.Telefon,
        participant['E-post'],
        participant.Adress,
        ...(participant.Enheter || []),
      ].some(field => field?.toString().toLowerCase().includes(searchQuery.value.toLowerCase()));

    return matchesAge && matchesGender && matchesSearch;
  });
});

// Paginated participants
const paginatedParticipants = computed(() => {
  const filtered = filteredParticipants.value;
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
    label: 'Ny deltagare',
    icon: Plus,
    onClick: handleNewParticipant,
    variant: 'default' as const,
  },
]);

// Filters for ViewControls
const filters = computed(() => [
  {
    modelValue: ageFilter.value,
    placeholder: 'Alla åldrar',
    options: [
      { key: 'all', label: 'Alla åldrar', value: 'all' },
      { key: 'child', label: 'Barn (under 18)', value: 'child' },
      { key: 'adult', label: 'Vuxen (18+)', value: 'adult' },
      { key: 'unknown', label: 'Okänd ålder', value: 'unknown' },
    ],
    onChange: (value: string) => {
      ageFilter.value = value;
    },
  },
  {
    modelValue: genderFilter.value,
    placeholder: 'Alla kön',
    options: [
      { key: 'all', label: 'Alla kön', value: 'all' },
      { key: 'Man', label: 'Man', value: 'Man' },
      { key: 'Kvinna', label: 'Kvinna', value: 'Kvinna' },
      { key: 'Annat', label: 'Annat', value: 'Annat' },
      { key: 'Vill ej uppge', label: 'Vill ej uppge', value: 'Vill ej uppge' },
    ],
    onChange: (value: string) => {
      genderFilter.value = value;
    },
  },
]);

// Event handlers
const handleNewParticipant = () => {
  router.push('/participants/new');
};

const handleRowClick = (participant: any) => {
  router.push(`/participants/${participant.ParticipantID}`);
};

const handleEditParticipant = (participant: any) => {
  router.push(`/participants/${participant.ParticipantID}/edit`);
};

const handleDeleteParticipant = async (participant: any, event: Event) => {
  event.stopPropagation();

  const confirmed = confirm(`Är du säker på att du vill ta bort ${participant.fullName}?`);

  if (confirmed) {
    try {
      // In a real app, you'd call the API
      console.log('Deleting participant:', participant.ParticipantID);
      success('Deltagare borttagen', 'Deltagaren har tagits bort framgångsrikt');
      await refreshParticipants();
    } catch (err) {
      error('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.');
    }
  }
};
</script>

<template>
  <div>
    <!-- Header with title, breadcrumbs, and stats -->
    <StandardHeader
      title="Deltagare"
      description="Hantera deltagare och deras information"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- View Controls with search, filters, and actions -->
    <ViewControls
      v-model:search-query="searchQuery"
      :add-actions="addActions"
      :filters="filters"
      search-placeholder="Sök deltagare..."
      :show-view-switcher="false"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar deltagare...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av deltagare</p>
        <Button variant="outline" @click="refreshParticipants">Försök igen</Button>
      </div>
    </div>

    <!-- DataTable -->
    <div v-else>
      <DataTable
        :data="paginatedParticipants || []"
        :columns="columns"
        :loading="isLoading"
        @row-click="handleRowClick"
      >
        <template #cell-fullName="{ row }">
          <span class="font-bold">{{ row.fullName }}</span>
        </template>

        <template #cell-enheter="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge v-for="enhet in row.Enheter" :key="enhet" variant="default" class="text-xs">
              {{ enhet }}
            </Badge>
          </div>
        </template>

        <template #cell-kon="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ getGenderIcon(row.Kon) }}</span>
            <span class="text-muted-foreground">{{ row.Kon }}</span>
          </div>
        </template>

        <template #cell-relations="{ row }">
          <div class="flex gap-1">
            <Badge
              v-if="row.hasGuardian"
              variant="default"
              class="text-xs"
              :title="`Målsman: ${row.guardianNames.join(', ')}`"
            >
              👨‍👩‍👧‍👦 {{ row.guardianNames.length }}
            </Badge>
            <Badge
              v-if="row.hasSiblings"
              variant="default"
              class="text-xs"
              :title="`Syskon: ${row.siblingNames.join(', ')}`"
            >
              👫 {{ row.siblingNames.length }}
            </Badge>
            <Badge
              v-if="row.totalRelations > 0 && !row.hasGuardian && !row.hasSiblings"
              variant="default"
              class="text-xs"
            >
              👥 {{ row.totalRelations }}
            </Badge>
          </div>
        </template>

        <template #row-actions="{ row }">
          <Button
            size="sm"
            variant="ghost"
            class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            title="Redigera"
            @click="handleEditParticipant(row)"
          >
            <Edit class="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Radera"
            @click="handleDeleteParticipant(row, $event)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </template>
      </DataTable>

      <!-- Pagination Controls -->
      <PaginationControls
        :total-items="filteredParticipants.length"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        @update:current-page="handlePageUpdate"
        @update:items-per-page="handleItemsPerPageUpdate"
      />
    </div>
  </div>
</template>
