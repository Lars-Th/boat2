<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users } from 'lucide-vue-next';

// Import data
import participantsData from '@/assets/data/participants.json';
import participantGroupsData from '@/assets/data/participantGroups.json';

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

// Use participant groups from JSON file
const participantGroups = computed(() => participantGroupsData);

// Get participants from selected groups
const participantsFromGroups = computed(() => {
  const groupParticipants = props.selectedGroups.flatMap(groupId => {
    const group = participantGroups.value.find(g => g.id === groupId);
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
  const participant = participantsData.find(p => p.ParticipantID === Number(participantId));
  return participant ? `${participant.Fornamn} ${participant.Efternamn}` : 'Okänd deltagare';
};
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
      <Tabs default-value="groups" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="groups">Deltagargrupper</TabsTrigger>
          <TabsTrigger value="individual">Individuella deltagare</TabsTrigger>
        </TabsList>

        <TabsContent value="groups" class="space-y-4">
          <div class="space-y-3">
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
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="participant in participantsData.slice(0, 12)"
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
          <span class="font-medium">Valda deltagare ({{ totalSelectedParticipants.length }})</span>
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
    </CardContent>
  </Card>
</template>
