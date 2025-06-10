<script setup lang="ts">
import { computed } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, Network, Plus, UserCheck, Users } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Participant } from '@/types';

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

// Fetch data using API service
const {
  data: participants,
  loading: participantsLoading,
  error: participantsError,
  refresh: refreshParticipants,
} = useApiList<Participant>(() => api.participants.getAll(), {
  cacheKey: 'participants',
});

// Mock family relations data (TODO: Replace with actual API when available)
const familyRelations = computed<FamilyRelation[]>(() => [
  // Mock data - replace with actual API call when family relations endpoint is available
]);

// Loading and error states
const isLoading = computed(() => participantsLoading.value);
const hasError = computed(() => participantsError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await refreshParticipants();
};

// Calculate age from personnummer
const calculateAge = (personnummer: string) => {
  const year = parseInt(personnummer.substring(0, 4));
  const currentYear = new Date().getFullYear();
  return currentYear - year;
};

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

// Statistics
const stats = computed(() => {
  if (!familyRelations.value) {
    return [
      { title: 'Totalt relationer', value: 0, icon: Users, color: 'blue' },
      { title: 'Målsman-relationer', value: 0, icon: UserCheck, color: 'green' },
      { title: 'Syskon-relationer', value: 0, icon: Users, color: 'purple' },
      { title: 'Familjegrupper', value: 0, icon: Network, color: 'orange' },
    ];
  }

  return [
    {
      title: 'Totalt relationer',
      value: familyRelations.value.length,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Målsman-relationer',
      value: guardianRelations.value.length,
      icon: UserCheck,
      color: 'green',
    },
    {
      title: 'Syskon-relationer',
      value: siblingRelations.value.length,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Familjegrupper',
      value: familyGroups.value.length,
      icon: Network,
      color: 'orange',
    },
  ];
});

const handleAddRelation = () => {
  // TODO: Open add relation dialog
  console.log('Add new family relation');
};

const handleDeleteRelation = (relation: Record<string, unknown>) => {
  // TODO: Delete relation
  console.log('Delete relation:', relation);
};
</script>

<template>
  <PageLayout
    title="Familjekopplingar"
    breadcrumbs="Dashboard / Deltagare / Familjekopplingar"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar familjekopplingar...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <AlertCircle class="h-8 w-8 text-destructive mx-auto mb-4" />
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av familjekopplingar</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-4 space-y-6">
      <!-- Actions -->
      <div class="flex justify-end">
        <Button class="gap-2" @click="handleAddRelation">
          <Plus class="h-4 w-4" />
          Lägg till relation
        </Button>
      </div>

      <!-- Empty State -->
      <div v-if="enhancedRelations.length === 0" class="text-center py-12">
        <Network class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">Inga familjekopplingar</h3>
        <p class="text-muted-foreground mb-4">
          Börja med att lägga till relationer mellan deltagare
        </p>
        <Button class="gap-2" @click="handleAddRelation">
          <Plus class="h-4 w-4" />
          Lägg till första relationen
        </Button>
      </div>

      <!-- Tabs for different views -->
      <Tabs v-else default-value="visual" class="w-full">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="visual">
            <Network class="h-4 w-4 mr-2" />
            Relationsvy
          </TabsTrigger>
          <TabsTrigger value="guardians">
            <UserCheck class="h-4 w-4 mr-2" />
            Målsman ({{ guardianRelations.length }})
          </TabsTrigger>
          <TabsTrigger value="siblings">
            <Users class="h-4 w-4 mr-2" />
            Syskon ({{ siblingRelations.length }})
          </TabsTrigger>
        </TabsList>

        <!-- Visual Relations View -->
        <TabsContent value="visual" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Network class="h-5 w-5" />
                Familjegrupper ({{ familyGroups.length }})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                v-if="familyGroups.length > 0"
                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <div
                  v-for="(group, index) in familyGroups"
                  :key="index"
                  class="border rounded-lg p-4 space-y-4"
                >
                  <!-- Guardian -->
                  <div class="text-center">
                    <div class="bg-blue-100 dark:bg-blue-900 rounded-lg p-3 mb-2">
                      <div class="font-semibold text-blue-800 dark:text-blue-200">
                        {{
                          `${(group as FamilyGroup)['guardian']?.Fornamn} ${(group as FamilyGroup)['guardian']?.Efternamn}` ||
                          'Okänd målsman'
                        }}
                      </div>
                      <div class="text-sm text-blue-600 dark:text-blue-300">
                        {{
                          (group as FamilyGroup)['guardian']
                            ? calculateAge((group as FamilyGroup)['guardian'].Personnummer)
                            : '?'
                        }}
                        år
                      </div>
                      <Badge variant="default" class="mt-1">Målsman</Badge>
                    </div>
                  </div>

                  <!-- Connection line -->
                  <div class="flex justify-center">
                    <div class="w-px h-6 bg-gray-300" />
                  </div>

                  <!-- Children -->
                  <div class="space-y-2">
                    <div
                      v-for="child in (group as FamilyGroup)['children']"
                      :key="child.ParticipantID"
                      class="bg-green-50 dark:bg-green-900 rounded-lg p-2 text-center"
                    >
                      <div class="font-medium text-green-800 dark:text-green-200">
                        {{ `${child.Fornamn} ${child.Efternamn}` }}
                      </div>
                      <div class="text-sm text-green-600 dark:text-green-300">
                        {{ calculateAge(child.Personnummer) }} år
                      </div>
                    </div>
                  </div>

                  <!-- Sibling connections -->
                  <div
                    v-if="(group as FamilyGroup)['siblings'].length > 0"
                    class="mt-4 pt-4 border-t"
                  >
                    <div class="text-xs text-muted-foreground text-center mb-2">
                      Syskonrelationer
                    </div>
                    <div class="space-y-1">
                      <div
                        v-for="sibling in (group as FamilyGroup)['siblings']"
                        :key="`${sibling.person1.ParticipantID}-${sibling.person2.ParticipantID}`"
                        class="text-xs text-center bg-purple-50 dark:bg-purple-900 rounded p-1"
                      >
                        <span class="text-purple-700 dark:text-purple-300">
                          {{ `${sibling.person1.Fornamn} ${sibling.person1.Efternamn}` }}
                          ↔
                          {{ `${sibling.person2.Fornamn} ${sibling.person2.Efternamn}` }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                Inga familjegrupper hittades
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Guardian Relations Tab -->
        <TabsContent value="guardians" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <UserCheck class="h-5 w-5" />
                Målsman-relationer ({{ guardianRelations.length }})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="guardianRelations.length === 0" class="text-center py-8">
                <UserCheck class="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p class="text-muted-foreground">Inga målsman-relationer registrerade</p>
              </div>
              <DataTable v-else :data="guardianRelations" :columns="columns">
                <template #cell-RelationType="{ value }">
                  <Badge variant="default">
                    {{ value }}
                  </Badge>
                </template>

                <template #cell-actions="{ row }">
                  <Button size="sm" variant="destructive" @click="handleDeleteRelation(row)">
                    Ta bort
                  </Button>
                </template>
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Sibling Relations Tab -->
        <TabsContent value="siblings" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Users class="h-5 w-5" />
                Syskon-relationer ({{ siblingRelations.length }})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="siblingRelations.length === 0" class="text-center py-8">
                <Users class="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <p class="text-muted-foreground">Inga syskon-relationer registrerade</p>
              </div>
              <DataTable v-else :data="siblingRelations" :columns="columns">
                <template #cell-RelationType="{ value }">
                  <Badge variant="secondary">
                    {{ value }}
                  </Badge>
                </template>

                <template #cell-actions="{ row }">
                  <Button size="sm" variant="destructive" @click="handleDeleteRelation(row)">
                    Ta bort
                  </Button>
                </template>
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </PageLayout>
</template>
