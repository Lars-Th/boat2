<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import SearchAndFilter from '@/components/shared/SearchAndFilter.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, UserPlus, Users } from 'lucide-vue-next';
import type { TableColumn } from '@/types';
import { useToast } from '@/composables/useToast';

// Import JSON data
import participantsData from '@/assets/data/participants.json';
import familyRelationsData from '@/assets/data/familyRelations.json';
import organizationSettings from '@/assets/data/organizationSettings.json';

const router = useRouter();
const { success } = useToast();
const searchTerm = ref('');

// Get current organization
const currentOrg = organizationSettings.organizations.find(
  org => org.id === organizationSettings.currentOrganization
);
const enheter = currentOrg?.enheter ?? [];

// Calculate age from personnummer or return unknown
const calculateAge = (personnummer: string) => {
  if (!personnummer) return 'Okänd';
  const year = parseInt(personnummer.substring(0, 4));
  const currentYear = new Date().getFullYear();
  return currentYear - year;
};

// Get family relations for a participant
const getFamilyRelations = (participantId: number) => {
  return familyRelationsData.filter(
    rel => rel.ParticipantID === participantId || rel.RelatedParticipantID === participantId
  );
};

// Get related participant names
const getRelatedParticipantNames = (participantId: number, relationType: string) => {
  const relations = familyRelationsData.filter(
    rel =>
      (rel.ParticipantID === participantId || rel.RelatedParticipantID === participantId) &&
      rel.RelationType === relationType
  );

  return relations.map(rel => {
    const relatedId =
      rel.ParticipantID === participantId ? rel.RelatedParticipantID : rel.ParticipantID;
    const relatedParticipant = participantsData.find(p => p.ParticipantID === relatedId);
    return relatedParticipant
      ? `${relatedParticipant.Fornamn} ${relatedParticipant.Efternamn}`
      : 'Okänd';
  });
};

// Enhanced participants with calculated data
const enhancedParticipants = computed(() => {
  return participantsData.map(participant => {
    const familyRelations = getFamilyRelations(participant.ParticipantID);
    const guardianNames = getRelatedParticipantNames(participant.ParticipantID, 'Målsman');
    const siblingNames = getRelatedParticipantNames(participant.ParticipantID, 'Syskon');

    return {
      ...participant,
      fullName: `${participant.Fornamn} ${participant.Efternamn}`,
      age: calculateAge(participant.Personnummer),
      familyRelations,
      hasGuardian: familyRelations.some(rel => rel.RelationType === 'Målsman'),
      hasSiblings: familyRelations.some(rel => rel.RelationType === 'Syskon'),
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
    value: participantsData.length,
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Barn (under 18)',
    value: enhancedParticipants.value.filter(p => typeof p.age === 'number' && p.age < 18).length,
    icon: Users,
    color: 'green',
  },
  {
    title: 'Med familjerelationer',
    value: enhancedParticipants.value.filter(p => p.totalRelations > 0).length,
    icon: Users,
    color: 'purple',
  },
  {
    title: 'Totala enheter',
    value: enheter.length,
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
    options: enheter.map(enhet => ({
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

// Define interface directly in component to avoid import issues
interface Participant {
  ParticipantID: number;
  Fornamn: string;
  Efternamn: string;
  Kon: string;
  Enheter: string[];
  fullName?: string;
  hasGuardian?: boolean;
  hasSiblings?: boolean;
  guardianNames?: string[];
  siblingNames?: string[];
  totalRelations?: number;
}

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
  </PageLayout>
</template>
