<script setup lang="ts">
import { computed, ref } from 'vue';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import DataTable from '@/components/shared/DataTable.vue';
import PaginationControls from '@/components/shared/PaginationControls.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, Network, Plus, UserCheck, Users } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Participant } from '@/types';

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Type definition for FamilyRelation (component-specific)
interface FamilyRelation {
  ParticipantID: string | number;
  RelatedParticipantID: string | number;
  RelationType: string;
}

// Type definitions for component-specific interfaces
interface SiblingRelation {
  person1: Participant;
  person2: Participant;
}

interface FamilyGroup {
  guardian: Participant;
  children: Participant[];
  siblings: SiblingRelation[];
}

// Fetch participants using enhanced API with family relationships
const {
  data: participants,
  loading: participantsLoading,
  error: participantsError,
  refresh: refreshParticipants,
} = useApiList<Participant>(() => api.participants.getAll({ include: ['family'] }), {
  cacheKey: 'participantsWithFamily',
});

// Loading and error states
const isLoading = computed(() => participantsLoading.value);
const hasError = computed(() => participantsError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await refreshParticipants();
  // TODO: Add refreshFamilyRelations() when API is implemented
};

// Calculate age from personnummer
const calculateAge = (personnummer: string) => {
  const year = parseInt(personnummer.substring(0, 4));
  const currentYear = new Date().getFullYear();
  return currentYear - year;
};

// Extract family relations from participants' family relationship data
const familyRelations = computed<FamilyRelation[]>(() => {
  if (!participants.value) return [];

  const relations: FamilyRelation[] = [];

  // Extract family relationships from the enhanced API data
  participants.value.forEach(participant => {
    if (participant.family && participant.family.length > 0) {
      participant.family.forEach(familyMember => {
        relations.push({
          ParticipantID: participant.ParticipantID,
          RelatedParticipantID: familyMember.ParticipantID,
          RelationType: familyMember.RelationType || 'Family',
        });
      });
    }
  });

  return relations;
});

// Enhanced family relations with participant names
const enhancedRelations = computed(() => {
  if (!familyRelations.value || !participants.value) return [];

  return familyRelations.value.map(relation => {
    const participant = participants.value?.find(p => p.ParticipantID === relation.ParticipantID);
    const relatedParticipant = participants.value?.find(
      p => p.ParticipantID === relation.RelatedParticipantID
    );

    return {
      ...relation,
      participantName: participant ? `${participant.Fornamn} ${participant.Efternamn}` : 'Okänd',
      relatedParticipantName: relatedParticipant
        ? `${relatedParticipant.Fornamn} ${relatedParticipant.Efternamn}`
        : 'Okänd',
      participant,
      relatedParticipant,
    };
  });
});

// Group relations by type
const guardianRelations = computed(() =>
  enhancedRelations.value.filter(r => r.RelationType === 'Målsman')
);

const siblingRelations = computed(() =>
  enhancedRelations.value.filter(r => r.RelationType === 'Syskon')
);

// Create family groups for visual representation
const familyGroups = computed((): FamilyGroup[] => {
  if (!enhancedRelations.value.length) return [];

  const groups = new Map<string | number, FamilyGroup>();

  // Process guardian relations to create family groups
  guardianRelations.value.forEach(relation => {
    const guardianId = relation.ParticipantID;

    if (!groups.has(guardianId)) {
      groups.set(guardianId, {
        guardian: relation.participant as Participant,
        children: [],
        siblings: [],
      });
    }

    const group = groups.get(guardianId);
    if (group && relation.relatedParticipant) {
      group.children.push(relation.relatedParticipant);
    }
  });

  // Add sibling relations
  siblingRelations.value.forEach(relation => {
    const person1Id = relation.ParticipantID;
    const person2Id = relation.RelatedParticipantID;

    // Find which family group these siblings belong to
    for (const [, group] of groups.entries()) {
      const person1InGroup = group.children.some(
        (child: Participant) => String(child.ParticipantID) === String(person1Id)
      );
      const person2InGroup = group.children.some(
        (child: Participant) => String(child.ParticipantID) === String(person2Id)
      );

      if (person1InGroup || person2InGroup) {
        if (
          !group.siblings.some((s: SiblingRelation) => {
            return (
              String(s.person1.ParticipantID) === String(person1Id) &&
              String(s.person2.ParticipantID) === String(person2Id)
            );
          })
        ) {
          group.siblings.push({
            person1: relation.participant as Participant,
            person2: relation.relatedParticipant as Participant,
          });
        }
        break;
      }
    }
  });

  return Array.from(groups.values()).filter((group: FamilyGroup) => group.guardian);
});

// Table columns
const columns = [
  {
    key: 'participantName',
    label: 'Person',
    sortable: true,
  },
  {
    key: 'RelationType',
    label: 'Relation',
    sortable: true,
  },
  {
    key: 'relatedParticipantName',
    label: 'Relaterad till',
    sortable: true,
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
  },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Deltagare', to: '/participants' },
  { label: 'Familjerelationer', to: '', isCurrentPage: true },
]);

// Statistics calculated from relational data
const stats = computed(() => {
  if (!familyRelations.value) {
    return [
      { label: 'Totalt relationer', value: 0, color: 'text-blue-600' },
      { label: 'Målsman-relationer', value: 0, color: 'text-green-600' },
      { label: 'Syskon-relationer', value: 0, color: 'text-purple-600' },
      { label: 'Familjegrupper', value: 0, color: 'text-orange-600' },
    ];
  }

  return [
    {
      label: 'Totalt relationer',
      value: familyRelations.value.length,
      color: 'text-blue-600',
    },
    {
      label: 'Målsman-relationer',
      value: guardianRelations.value.length,
      color: 'text-green-600',
    },
    {
      label: 'Syskon-relationer',
      value: siblingRelations.value.length,
      color: 'text-purple-600',
    },
    {
      label: 'Familjegrupper',
      value: familyGroups.value.length,
      color: 'text-orange-600',
    },
  ];
});

// Paginated relations
const paginatedRelations = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return enhancedRelations.value.slice(start, end);
});

// Pagination handlers
const handlePageUpdate = (page: number) => {
  currentPage.value = page;
};

const handleItemsPerPageUpdate = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage;
  currentPage.value = 1;
};

// Handle adding new family connection
const handleAddConnection = () => {
  // TODO: Implement add family connection functionality
  // This would likely open a modal or navigate to a form
  console.log('Add family connection');
};

// Handle removing family connection
const handleRemoveConnection = (relation: any) => {
  // TODO: Implement remove family connection API call
  console.log('Remove family connection:', relation);
};
</script>

<template>
  <div>
    <!-- Header with title, breadcrumbs, and stats -->
    <StandardHeader
      title="Familjerelationer"
      description="Hantera familjerelationer mellan deltagare"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    >
      <template #actions>
        <Button class="gap-2" @click="handleAddConnection">
          <Plus class="h-4 w-4" />
          Lägg till relation
        </Button>
      </template>
    </StandardHeader>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar familjerelationer...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <AlertCircle class="h-12 w-12 mx-auto mb-2" />
        <p class="text-lg font-semibold">Kunde inte ladda familjerelationer</p>
        <p class="text-sm text-muted-foreground mt-1">
          {{ participantsError?.message }}
        </p>
      </div>
      <Button variant="outline" @click="handleRefresh">Försök igen</Button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <Tabs default-value="relations" class="space-y-6">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="relations">Alla relationer</TabsTrigger>
          <TabsTrigger value="families">Familjegrupper</TabsTrigger>
          <TabsTrigger value="orphans">Enstaka personer</TabsTrigger>
        </TabsList>

        <!-- All Relations Tab -->
        <TabsContent value="relations" class="space-y-4">
          <DataTable
            :data="paginatedRelations"
            :columns="columns"
            :search-fields="['participantName', 'relatedParticipantName', 'RelationType']"
            placeholder="Sök familjerelationer..."
          >
            <template #actions="{ row }">
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Ta bort relation"
                @click="handleRemoveConnection(row)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            </template>
          </DataTable>

          <!-- Pagination Controls -->
          <PaginationControls
            :total-items="enhancedRelations.length"
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            @update:current-page="handlePageUpdate"
            @update:items-per-page="handleItemsPerPageUpdate"
          />
        </TabsContent>

        <!-- Family Groups Tab -->
        <TabsContent value="families" class="space-y-4">
          <div v-if="familyGroups.length === 0" class="text-center py-12">
            <Network class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p class="text-lg font-semibold">Inga familjegrupper</p>
            <p class="text-sm text-muted-foreground">
              Det finns inga identifierade familjegrupper ännu.
            </p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              v-for="family in familyGroups"
              :key="family.guardian.ParticipantID"
              class="relative"
            >
              <CardHeader class="pb-3">
                <CardTitle class="text-lg flex items-center gap-2">
                  <UserCheck class="h-5 w-5 text-green-600" />
                  {{ family.guardian.Fornamn }} {{ family.guardian.Efternamn }}
                  <Badge variant="outline" class="text-xs ml-auto">Målsman</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-3">
                <!-- Children -->
                <div v-if="family.children.length > 0">
                  <h4 class="text-sm font-medium text-muted-foreground mb-2">Barn</h4>
                  <div class="space-y-1">
                    <div
                      v-for="child in family.children"
                      :key="child.ParticipantID"
                      class="flex items-center gap-2 text-sm"
                    >
                      <Users class="h-4 w-4 text-blue-600" />
                      {{ child.Fornamn }} {{ child.Efternamn }}
                      <Badge variant="secondary" class="text-xs">
                        {{ calculateAge(child.Personnummer) }} år
                      </Badge>
                    </div>
                  </div>
                </div>

                <!-- Siblings -->
                <div v-if="family.siblings.length > 0">
                  <h4 class="text-sm font-medium text-muted-foreground mb-2">Syskonrelationer</h4>
                  <div class="space-y-1">
                    <div
                      v-for="sibling in family.siblings"
                      :key="`${sibling.person1.ParticipantID}-${sibling.person2.ParticipantID}`"
                      class="text-xs text-muted-foreground"
                    >
                      {{ sibling.person1.Fornamn }} ↔ {{ sibling.person2.Fornamn }}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- Orphans Tab -->
        <TabsContent value="orphans" class="space-y-4">
          <div class="text-center py-12">
            <Users class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p class="text-lg font-semibold">Enstaka personer</p>
            <p class="text-sm text-muted-foreground">
              Personer utan registrerade familjerelationer visas här när funktionen är
              implementerad.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
