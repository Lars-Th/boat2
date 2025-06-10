<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import SearchAndFilter from '@/components/shared/SearchAndFilter.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Edit, Loader2, Trash2, UserPlus, Users } from 'lucide-vue-next';
import type { Organization, Participant, TableColumn } from '@/types';
import { useToast } from '@/composables/useToast';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';

const router = useRouter();
const { success } = useToast();
const searchTerm = ref('');

// Fetch data using API services
const {
  data: participants,
  loading: participantsLoading,
  error: participantsError,
  refresh: refreshParticipants,
} = useApiList<Participant>(() => api.participants.getAll(), {
  cacheKey: 'participants',
});

const {
  data: organizations,
  loading: organizationsLoading,
  error: organizationsError,
  refresh: refreshOrganizations,
} = useApiList<Organization>(() => api.organizations.getAll(), {
  cacheKey: 'organizations',
});

// Mock family relations data (since API endpoint doesn't exist)
interface FamilyRelation {
  ParticipantID: number;
  RelatedParticipantID: number;
  RelationType: string;
}

// Enhanced participant interface
interface EnhancedParticipant extends Participant {
  fullName: string;
  age: string | number;
  familyRelations: FamilyRelation[];
  hasGuardian: boolean;
  hasSiblings: boolean;
  guardianNames: string[];
  siblingNames: string[];
  totalRelations: number;
}

const familyRelationsData = computed((): FamilyRelation[] => {
  // TODO: Replace with actual API call when endpoint is available
  return []; // Empty array for now
});

// Loading and error states
const isLoading = computed(() => participantsLoading.value || organizationsLoading.value);
const hasError = computed(
  () => participantsError.value !== null || organizationsError.value !== null
);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshParticipants(), refreshOrganizations()]);
};

// Get current organization (use first organization as current)
const currentOrg = computed(() => organizations.value?.[0]);
const enheter = computed(() => currentOrg.value?.enheter ?? []);

// Calculate age from personnummer or return unknown
const calculateAge = (personnummer: string) => {
  if (!personnummer) return 'Okänd';
  const year = parseInt(personnummer.substring(0, 4));
  const currentYear = new Date().getFullYear();
  return currentYear - year;
};

// Get family relations for a participant
const getFamilyRelations = (participantId: number) => {
  return familyRelationsData.value.filter(
    rel => rel.ParticipantID === participantId || rel.RelatedParticipantID === participantId
  );
};

// Get related participant names
const getRelatedParticipantNames = (participantId: number, relationType: string) => {
  const relations = familyRelationsData.value.filter(
    (rel: FamilyRelation) =>
      (rel.ParticipantID === participantId || rel.RelatedParticipantID === participantId) &&
      rel.RelationType === relationType
  );

  return relations.map((rel: FamilyRelation) => {
    const relatedId =
      rel.ParticipantID === participantId ? rel.RelatedParticipantID : rel.ParticipantID;
    const relatedParticipant = participants.value?.find(
      (p: Participant) => p.ParticipantID === relatedId
    );
    return relatedParticipant
      ? `${relatedParticipant.Fornamn} ${relatedParticipant.Efternamn}`
      : 'Okänd';
  });
};

// Enhanced participants with calculated data
const enhancedParticipants = computed(() => {
  if (!participants.value) return [];

  return participants.value.map((participant: Participant) => {
    const familyRelations = getFamilyRelations(participant.ParticipantID);
    const guardianNames = getRelatedParticipantNames(participant.ParticipantID, 'Målsman');
    const siblingNames = getRelatedParticipantNames(participant.ParticipantID, 'Syskon');

    return {
      ...participant,
      fullName: `${participant.Fornamn} ${participant.Efternamn}`,
      age: calculateAge(participant.Personnummer),
      familyRelations,
      hasGuardian: familyRelations.some((rel: FamilyRelation) => rel.RelationType === 'Målsman'),
      hasSiblings: familyRelations.some((rel: FamilyRelation) => rel.RelationType === 'Syskon'),
      guardianNames,
      siblingNames,
      totalRelations: familyRelations.length,
    };
  });
});

// Filter participants based on search
const filteredParticipants = computed(() => {
  if (!searchTerm.value) return enhancedParticipants.value;

  const search = searchTerm.value.toLowerCase();
  return enhancedParticipants.value.filter(
    participant =>
      participant.fullName.toLowerCase().includes(search) ||
      participant.Telefon?.toLowerCase().includes(search) ||
      participant['E-post']?.toLowerCase().includes(search) ||
      participant.Adress?.toLowerCase().includes(search) ||
      participant.Enheter?.some(enhet => enhet.toLowerCase().includes(search))
  );
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

// Table columns with new structure
const columns: TableColumn[] = [
  {
    key: 'fullName',
    label: 'Namn',
    sortable: true,
  },
  {
    key: 'enheter',
    label: 'Enhet',
    sortable: false,
    type: 'custom' as const,
  },
  {
    key: 'age',
    label: 'Ålder',
    sortable: true,
  },
  {
    key: 'kon',
    label: 'Kön',
    sortable: true,
    type: 'custom' as const,
  },
  {
    key: 'relations',
    label: 'Familj',
    sortable: false,
    type: 'custom' as const,
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    type: 'actions' as const,
  },
];

// Statistics with new data structure
const stats = computed(() => [
  {
    title: 'Totalt deltagare',
    value: participants.value?.length ?? 0,
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Barn (under 18)',
    value: enhancedParticipants.value.filter(
      (p: EnhancedParticipant) => typeof p.age === 'number' && p.age < 18
    ).length,
    icon: Users,
    color: 'green',
  },
  {
    title: 'Med familjerelationer',
    value: enhancedParticipants.value.filter((p: EnhancedParticipant) => p.totalRelations > 0)
      .length,
    icon: Users,
    color: 'purple',
  },
  {
    title: 'Totala enheter',
    value: enheter.value.length,
    icon: Users,
    color: 'orange',
  },
]);

const filters = [
  {
    key: 'age',
    label: 'Åldersgrupp',
    options: [
      { value: 'child', label: 'Barn (under 18)' },
      { value: 'adult', label: 'Vuxen (18+)' },
      { value: 'unknown', label: 'Okänd ålder' },
    ],
  },
  {
    key: 'kon',
    label: 'Kön',
    options: [
      { value: 'Man', label: 'Man' },
      { value: 'Kvinna', label: 'Kvinna' },
      { value: 'Annat', label: 'Annat' },
      { value: 'Vill ej uppge', label: 'Vill ej uppge' },
    ],
  },
  {
    key: 'enheter',
    label: 'Enhet',
    options: enheter.value.map((enhet: string) => ({
      value: enhet,
      label: enhet,
    })),
  },
  {
    key: 'relations',
    label: 'Familjerelationer',
    options: [
      { value: 'has_relations', label: 'Har familjerelationer' },
      { value: 'guardian', label: 'Har målsman' },
      { value: 'siblings', label: 'Har syskon' },
      { value: 'no_relations', label: 'Inga relationer' },
    ],
  },
];

const handleNewParticipant = () => {
  router.push('/participants/new');
};

// Update function signatures to use proper types with casting
const handleRowClick = (item: Record<string, unknown>) => {
  const participant = item as unknown as Participant;
  router.push(`/participants/${participant.ParticipantID}`);
};

const handleEditParticipant = (item: Record<string, unknown>) => {
  const participant = item as unknown as Participant;
  router.push(`/participants/${participant.ParticipantID}/edit`);
};

const handleDeleteParticipant = (item: Record<string, unknown>) => {
  const participant = item as unknown as Participant;
  if (confirm(`Är du säker på att du vill ta bort ${participant.fullName}?`)) {
    // Remove from array
    console.log('Deleting participant:', participant.ParticipantID);
    success('Deltagare borttagen', 'Deltagaren har tagits bort framgångsrikt');
  }
};

const handleFamilyConnections = () => {
  router.push('/family-connections');
};
</script>

<template>
  <PageLayout title="Deltagare" breadcrumbs="Dashboard / Deltagare" show-stats :stats="stats">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <Loader2 class="h-6 w-6 animate-spin" />
        <span class="text-lg">Laddar deltagare...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex flex-col items-center justify-center py-12">
      <div class="flex items-center gap-3 mb-4">
        <AlertCircle class="h-6 w-6 text-red-500" />
        <span class="text-lg text-red-600">Kunde inte ladda deltagare</span>
      </div>
      <Button variant="outline" @click="handleRefresh">Försök igen</Button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- SearchAndFilter with padding -->
      <div class="px-6 py-4">
        <SearchAndFilter
          v-model:search="searchTerm"
          :filters="filters"
          placeholder="Sök deltagare..."
        >
          <template #actions>
            <Button variant="outline" class="gap-2" @click="handleFamilyConnections">
              <Users class="h-4 w-4" />
              Familjekopplingar
            </Button>
            <Button class="gap-2" @click="handleNewParticipant">
              <UserPlus class="h-4 w-4" />
              Ny deltagare
            </Button>
          </template>
        </SearchAndFilter>
      </div>

      <!-- DataTable full width -->
      <DataTable
        :data="filteredParticipants"
        :columns="columns"
        class="cursor-pointer"
        @row-click="handleRowClick"
      >
        <!-- Custom column renderers -->
        <template #enheter="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge v-for="enhet in row.Enheter" :key="enhet" variant="secondary" class="text-xs">
              {{ enhet }}
            </Badge>
          </div>
        </template>

        <template #kon="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ getGenderIcon(row.Kon) }}</span>
            <span class="text-sm">{{ row.Kon }}</span>
          </div>
        </template>

        <template #relations="{ row }">
          <div class="flex gap-1">
            <Badge
              v-if="row.hasGuardian"
              variant="outline"
              class="text-xs"
              :title="`Målsman: ${row.guardianNames.join(', ')}`"
            >
              👨‍👩‍👧‍👦 {{ row.guardianNames.length }}
            </Badge>
            <Badge
              v-if="row.hasSiblings"
              variant="outline"
              class="text-xs"
              :title="`Syskon: ${row.siblingNames.join(', ')}`"
            >
              👫 {{ row.siblingNames.length }}
            </Badge>
            <Badge
              v-if="row.totalRelations > 0 && !row.hasGuardian && !row.hasSiblings"
              variant="outline"
              class="text-xs"
            >
              👥 {{ row.totalRelations }}
            </Badge>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Redigera deltagare"
              @click="() => handleEditParticipant(row)"
            >
              <Edit class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Ta bort deltagare"
              @click="() => handleDeleteParticipant(row)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </template>
      </DataTable>
    </template>
  </PageLayout>
</template>
