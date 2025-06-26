<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Participant } from '@/types';

interface Props {
  selectedParticipants: string[];
  selectedGroups: string[];
  allowsParticipants: boolean;
}

interface Emits {
  (e: 'update:selectedParticipants', value: string[]): void;
  (e: 'update:selectedGroups', value: string[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Fetch data using enhanced API service with relational parameters
const {
  data: participants,
  loading: participantsLoading,
  error: participantsError,
} = useApiList<Participant>(() => api.participants.getAll({ include: ['activities'] }), {
  cacheKey: 'participants',
});

const {
  data: participantGroups,
  loading: participantGroupsLoading,
  error: participantGroupsError,
} = useApiList(() => api.participantGroups.getAll(), {
  cacheKey: 'participantGroups',
});

// Loading states
const isLoading = computed(
  () => Boolean(participantsLoading.value) || Boolean(participantGroupsLoading.value)
);

// Error states
const hasError = computed(
  () => participantsError.value !== null || participantGroupsError.value !== null
);

// Get participants from selected groups
const participantsFromGroups = computed(() => {
  if (!participantGroups.value) return [];

  const groupParticipants = props.selectedGroups.flatMap(groupId => {
    const group = participantGroups.value?.find(g => g.id === groupId);
    return group ? group.deltagare : [];
  });
  return [...new Set(groupParticipants)]; // Remove duplicates
});

// Total selected participants
const totalSelectedParticipants = computed(() => {
  const individual = props.selectedParticipants;
  const fromGroups = participantsFromGroups.value;
  return [...new Set([...individual, ...fromGroups])];
});

// Handle participant selection
const handleParticipantChange = (participantId: string, checked: boolean) => {
  const newSelection = checked
    ? [...props.selectedParticipants, participantId]
    : props.selectedParticipants.filter(id => id !== participantId);

  emit('update:selectedParticipants', newSelection);
};

// Handle group selection
const handleGroupChange = (groupId: string, checked: boolean) => {
  const newSelection = checked
    ? [...props.selectedGroups, groupId]
    : props.selectedGroups.filter(id => id !== groupId);

  emit('update:selectedGroups', newSelection);
};

// Get participant name
const getParticipantName = (participantId: string | number) => {
  if (!participants.value) return 'Okänd deltagare';

  const participant = participants.value.find(p => p.ParticipantID === Number(participantId));
  return participant ? `${participant.Fornamn} ${participant.Efternamn}` : 'Okänd deltagare';
};

// Get limited participants for display (first 12)
const displayParticipants = computed(() => {
  if (!participants.value) return [];
  return participants.value.slice(0, 12);
});
</script>

<template>
  <Card v-if="allowsParticipants">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Users class="h-5 w-5" />
        Deltagare
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div class="text-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">Laddar deltagare...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="flex items-center justify-center py-8">
        <div class="text-center">
          <p class="text-sm text-destructive">Ett fel uppstod vid laddning av deltagare</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else>
        <Tabs default-value="groups" class="w-full">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="groups">Deltagargrupper</TabsTrigger>
            <TabsTrigger value="individual">Individuella deltagare</TabsTrigger>
          </TabsList>

          <TabsContent value="groups" class="space-y-4">
            <div
              v-if="!participantGroups ?? participantGroups.length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              <p class="text-sm">Inga deltagargrupper tillgängliga</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="group in participantGroups"
                :key="group.id"
                class="flex items-start space-x-3"
              >
                <Checkbox
                  :id="group.id"
                  :checked="selectedGroups.includes(group.id)"
                  @update:checked="(checked: boolean) => handleGroupChange(group.id, checked)"
                />
                <div class="flex-1">
                  <Label :for="group.id" class="font-medium cursor-pointer">
                    {{ group.namn }}
                  </Label>
                  <p class="text-sm text-muted-foreground">
                    {{ group.beskrivning }}
                  </p>
                  <div class="flex items-center gap-2 mt-1">
                    <Badge variant="outline" class="text-xs">
                      {{ group.deltagare.length }} deltagare
                    </Badge>
                    <Badge
                      v-for="enhet in group.enheter"
                      :key="enhet"
                      variant="secondary"
                      class="text-xs"
                    >
                      {{ enhet }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="individual" class="space-y-4">
            <div
              v-if="!participants ?? participants.length === 0"
              class="text-center py-8 text-muted-foreground"
            >
              <p class="text-sm">Inga deltagare tillgängliga</p>
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="participant in displayParticipants"
                :key="participant.ParticipantID"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="String(participant.ParticipantID)"
                  :checked="selectedParticipants.includes(String(participant.ParticipantID))"
                  @update:checked="
                    (checked: boolean) =>
                      handleParticipantChange(String(participant.ParticipantID), checked)
                  "
                />
                <Label :for="String(participant.ParticipantID)" class="text-sm cursor-pointer">
                  {{ participant.Fornamn }} {{ participant.Efternamn }}
                </Label>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <!-- Selected participants summary -->
        <div v-if="totalSelectedParticipants.length > 0" class="mt-4 p-3 bg-muted/50 rounded-lg">
          <div class="flex items-center gap-2 mb-2">
            <Users class="h-4 w-4" />
            <span class="font-medium">
              Valda deltagare ({{ totalSelectedParticipants.length }})
            </span>
          </div>
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="participantId in totalSelectedParticipants.slice(0, 10)"
              :key="participantId"
              variant="secondary"
              class="text-xs"
            >
              {{ getParticipantName(participantId) }}
            </Badge>
            <Badge v-if="totalSelectedParticipants.length > 10" variant="outline" class="text-xs">
              +{{ totalSelectedParticipants.length - 10 }} till
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
