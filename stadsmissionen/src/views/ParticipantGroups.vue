<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import SearchAndFilter from '@/components/shared/SearchAndFilter.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  Edit,
  Eye,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Zap,
} from 'lucide-vue-next';
import type { Participant, ParticipantGroup, TableColumn } from '@/types';
import { useToast } from '@/composables/useToast';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';

const router = useRouter();
const { success, warning } = useToast();
const searchTerm = ref('');
const showNewGroupDialog = ref(false);

// Fetch data using API services
const {
  data: participantGroups,
  loading: groupsLoading,
  error: groupsError,
  refresh: refreshGroups,
} = useApiList<ParticipantGroup>(() => api.participantGroups.getAll(), {
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

// Enhanced groups with calculated data
const enhancedGroups = computed(() => {
  if (!participantGroups.value || !participants.value) return [];

  return participantGroups.value.map((group: ParticipantGroup) => {
    const participantNames = group.deltagare.map((id: string) => {
      const participant = participants.value?.find(
        (p: Participant) => String(p.ParticipantID) === String(id)
      );
      return participant ? `${participant.Fornamn} ${participant.Efternamn}` : 'Okänd deltagare';
    });

    return {
      ...group,
      participantNames,
      participantCount: group.deltagare.length,
      isAutomatic: !!group.automatiskregel,
      enheterText: group.enheter.join(', '),
    };
  });
});

// Filter groups based on search
const filteredGroups = computed(() => {
  if (!searchTerm.value) return enhancedGroups.value;

  const search = searchTerm.value.toLowerCase();
  return enhancedGroups.value.filter(
    group =>
      group.namn.toLowerCase().includes(search) ||
      group.beskrivning.toLowerCase().includes(search) ||
      group.enheter.some(enhet => enhet.toLowerCase().includes(search)) ||
      group.participantNames.some(name => name.toLowerCase().includes(search))
  );
});

// Table columns
const columns: TableColumn[] = [
  {
    key: 'namn',
    label: 'Gruppnamn',
    sortable: true,
  },
  {
    key: 'beskrivning',
    label: 'Beskrivning',
    sortable: false,
    type: 'custom' as const,
  },
  {
    key: 'enheter',
    label: 'Enheter',
    sortable: false,
    type: 'custom' as const,
  },
  {
    key: 'participantCount',
    label: 'Deltagare',
    sortable: true,
  },
  {
    key: 'isAutomatic',
    label: 'Typ',
    sortable: true,
    type: 'custom' as const,
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    type: 'actions' as const,
  },
];

// Statistics
const stats = computed(() => [
  {
    title: 'Totalt grupper',
    value: participantGroups.value?.length ?? 0,
    icon: Users,
    color: 'blue',
  },
  {
    title: 'Manuella grupper',
    value: participantGroups.value?.filter((g: ParticipantGroup) => !g.automatiskregel).length ?? 0,
    icon: UserPlus,
    color: 'green',
  },
  {
    title: 'Automatiska grupper',
    value: participantGroups.value?.filter((g: ParticipantGroup) => g.automatiskregel).length ?? 0,
    icon: Zap,
    color: 'purple',
  },
  {
    title: 'Totalt deltagare',
    value: participantGroups.value
      ? [...new Set(participantGroups.value.flatMap((g: ParticipantGroup) => g.deltagare))].length
      : 0,
    icon: Users,
    color: 'orange',
  },
]);

// Filters
const filters = [
  {
    key: 'typ',
    label: 'Typ',
    options: [
      { value: 'manual', label: 'Manuella' },
      { value: 'automatic', label: 'Automatiska' },
    ],
  },
  {
    key: 'enhet',
    label: 'Enhet',
    options: enheter.map(enhet => ({ value: enhet, label: enhet })),
  },
];

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

// Get participant name
const getParticipantName = (participantId: string) => {
  const participant = participants.value?.find(
    (p: Participant) => String(p.ParticipantID) === participantId
  );
  return participant ? `${participant.Fornamn} ${participant.Efternamn}` : 'Okänd deltagare';
};

// Reset form
const resetForm = () => {
  newGroupForm.value = {
    namn: '',
    beskrivning: '',
    enheter: [],
    deltagare: [],
    automatiskregel: '',
    isAutomatic: false,
  };
};

// Create new group
const createGroup = () => {
  if (!isFormValid.value) {
    warning('Validering misslyckades', 'Vänligen fyll i alla obligatoriska fält');
    return;
  }

  const newGroup = {
    id: `group-${Date.now()}`,
    namn: newGroupForm.value.namn,
    beskrivning: newGroupForm.value.beskrivning,
    enheter: newGroupForm.value.enheter,
    deltagare: newGroupForm.value.deltagare,
    skapadDatum: new Date().toISOString(),
    skapadAv: 'current-user', // TODO: Get from auth
    aktiv: true,
  };

  console.log('Saving new group:', newGroup);
  success('Grupp skapad', 'Deltagargruppen har skapats framgångsrikt');
  showNewGroupDialog.value = false;
  resetForm();
};

// Actions
function handleRowClick(item: Record<string, unknown>) {
  const group = item as unknown as ParticipantGroup;
  router.push(`/participant-groups/${group.id}`);
}

function handleViewGroup(item: Record<string, unknown>, event: Event) {
  event.stopPropagation();
  const group = item as unknown as ParticipantGroup;
  router.push(`/participant-groups/${group.id}`);
}

function handleEditGroup(item: Record<string, unknown>, event: Event) {
  event.stopPropagation();
  const group = item as unknown as ParticipantGroup;
  router.push(`/participant-groups/${group.id}/edit`);
}

function handleDeleteGroup(item: Record<string, unknown>, event: Event) {
  event.stopPropagation();
  const group = item as unknown as ParticipantGroup;

  if (confirm(`Är du säker på att du vill ta bort gruppen "${group.namn}"?`)) {
    console.log('Deleting group:', group.id);
    success('Behörighetsgrupp borttagen', 'Behörighetsgruppen har tagits bort framgångsrikt');
  }
}

// Validation
const isFormValid = computed(() => {
  return (
    newGroupForm.value.namn.trim() !== '' &&
    newGroupForm.value.beskrivning.trim() !== '' &&
    newGroupForm.value.enheter.length > 0 &&
    (!newGroupForm.value.isAutomatic ||
      (newGroupForm.value.isAutomatic && newGroupForm.value.automatiskregel.trim() !== ''))
  );
});
</script>

<template>
  <PageLayout
    title="Deltagargrupper"
    breadcrumbs="Dashboard / Administration / Deltagargrupper"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <Loader2 class="h-6 w-6 animate-spin" />
        <span class="text-lg">Laddar deltagargrupper...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex flex-col items-center justify-center py-12">
      <div class="flex items-center gap-3 mb-4">
        <AlertCircle class="h-6 w-6 text-red-500" />
        <span class="text-lg text-red-600">Kunde inte ladda deltagargrupper</span>
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
          placeholder="Sök deltagargrupper..."
        >
          <template #actions>
            <Dialog v-model:open="showNewGroupDialog">
              <DialogTrigger as-child>
                <Button class="gap-2">
                  <Plus class="h-4 w-4" />
                  Ny grupp
                </Button>
              </DialogTrigger>
              <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle class="flex items-center gap-2">
                    <Users class="h-5 w-5" />
                    Skapa ny deltagargrupp
                  </DialogTitle>
                </DialogHeader>

                <div class="space-y-6">
                  <!-- Basic Information -->
                  <div class="space-y-4">
                    <div class="space-y-2">
                      <Label for="gruppnamn">Gruppnamn *</Label>
                      <Input
                        id="gruppnamn"
                        v-model="newGroupForm.namn"
                        placeholder="T.ex. Läxläsning tisdagar"
                        required
                      />
                    </div>

                    <div class="space-y-2">
                      <Label for="beskrivning">Beskrivning *</Label>
                      <Textarea
                        id="beskrivning"
                        v-model="newGroupForm.beskrivning"
                        placeholder="Beskriv vad denna grupp är för..."
                        rows="3"
                        required
                      />
                    </div>
                  </div>

                  <!-- Units -->
                  <div class="space-y-2">
                    <Label>Enheter *</Label>
                    <div class="grid grid-cols-2 gap-2">
                      <div
                        v-for="enhet in enheter"
                        :key="enhet"
                        class="flex items-center space-x-2"
                      >
                        <Checkbox
                          :id="enhet"
                          :checked="newGroupForm.enheter.includes(enhet)"
                          @update:checked="(checked: boolean) => handleUnitChange(enhet, checked)"
                        />
                        <Label :for="enhet" class="text-sm cursor-pointer">
                          {{ enhet }}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <!-- Automatic Group Toggle -->
                  <div class="space-y-4">
                    <div class="flex items-center space-x-2">
                      <Switch id="isAutomatic" v-model:checked="newGroupForm.isAutomatic" />
                      <Label for="isAutomatic" class="flex items-center gap-2">
                        <Zap class="h-4 w-4" />
                        Automatisk grupp (baserad på regler)
                      </Label>
                    </div>

                    <div v-if="newGroupForm.isAutomatic" class="space-y-2">
                      <Label for="automatiskregel">Automatisk regel *</Label>
                      <Textarea
                        id="automatiskregel"
                        v-model="newGroupForm.automatiskregel"
                        placeholder="T.ex. Ålder mellan 13-16 år OCH enhet innehåller 'Barn och unga'"
                        rows="2"
                      />
                      <p class="text-xs text-muted-foreground">
                        Ange kriterier för automatisk gruppmedlemskap. Gruppen uppdateras
                        automatiskt när deltagare uppfyller kriterierna.
                      </p>
                    </div>
                  </div>

                  <!-- Manual Participants (only if not automatic) -->
                  <div v-if="!newGroupForm.isAutomatic" class="space-y-2">
                    <Label>Deltagare</Label>
                    <div class="max-h-48 overflow-y-auto border rounded-lg p-3">
                      <div class="grid grid-cols-1 gap-2">
                        <div
                          v-for="participant in participants?.slice(0, 20) || []"
                          :key="participant.ParticipantID"
                          class="flex items-center space-x-2"
                        >
                          <Checkbox
                            :id="`participant-${participant.ParticipantID}`"
                            :checked="
                              newGroupForm.deltagare.includes(String(participant.ParticipantID))
                            "
                            @update:checked="
                              (checked: boolean) =>
                                handleParticipantChange(String(participant.ParticipantID), checked)
                            "
                          />
                          <Label
                            :for="`participant-${participant.ParticipantID}`"
                            class="text-sm cursor-pointer"
                          >
                            {{ participant.Fornamn }} {{ participant.Efternamn }}
                          </Label>
                          <div class="flex gap-1">
                            <Badge
                              v-for="enhet in participant.Enheter?.slice(0, 2)"
                              :key="enhet"
                              variant="outline"
                              class="text-xs"
                            >
                              {{ enhet }}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Selected participants summary -->
                    <div
                      v-if="newGroupForm.deltagare.length > 0"
                      class="p-3 bg-muted/50 rounded-lg"
                    >
                      <div class="flex items-center gap-2 mb-2">
                        <Users class="h-4 w-4" />
                        <span class="font-medium">
                          Valda deltagare ({{ newGroupForm.deltagare.length }})
                        </span>
                      </div>
                      <div class="flex flex-wrap gap-1">
                        <Badge
                          v-for="participantId in newGroupForm.deltagare.slice(0, 8)"
                          :key="participantId"
                          variant="secondary"
                          class="text-xs"
                        >
                          {{ getParticipantName(participantId) }}
                        </Badge>
                        <Badge
                          v-if="newGroupForm.deltagare.length > 8"
                          variant="outline"
                          class="text-xs"
                        >
                          +{{ newGroupForm.deltagare.length - 8 }} till
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-4 justify-end pt-4">
                    <Button
                      variant="outline"
                      @click="
                        showNewGroupDialog = false;
                        resetForm();
                      "
                    >
                      Avbryt
                    </Button>
                    <Button :disabled="!isFormValid" class="gap-2" @click="createGroup">
                      <Plus class="h-4 w-4" />
                      Skapa grupp
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </template>
        </SearchAndFilter>
      </div>

      <!-- DataTable full width -->
      <DataTable
        :data="filteredGroups"
        :columns="columns"
        class="cursor-pointer"
        @row-click="handleRowClick"
      >
        <!-- Custom column renderers -->
        <template #beskrivning="{ row }">
          <div class="max-w-xs">
            <p class="text-sm truncate" :title="row.beskrivning">
              {{ row.beskrivning }}
            </p>
          </div>
        </template>

        <template #enheter="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="enhet in row.enheter.slice(0, 2)"
              :key="enhet"
              variant="outline"
              class="text-xs"
            >
              {{ enhet }}
            </Badge>
            <Badge v-if="row.enheter.length > 2" variant="outline" class="text-xs">
              +{{ row.enheter.length - 2 }}
            </Badge>
          </div>
        </template>

        <template #isAutomatic="{ row }">
          <div class="flex items-center gap-2">
            <component
              :is="row.isAutomatic ? Zap : UserPlus"
              class="h-4 w-4"
              :class="row.isAutomatic ? 'text-purple-600' : 'text-green-600'"
            />
            <Badge :variant="row.isAutomatic ? 'default' : 'secondary'" class="text-xs">
              {{ row.isAutomatic ? 'Automatisk' : 'Manuell' }}
            </Badge>
          </div>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Visa grupp"
              @click="handleViewGroup(row, $event)"
            >
              <Eye class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Redigera grupp"
              @click="handleEditGroup(row, $event)"
            >
              <Edit class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              title="Ta bort grupp"
              @click="handleDeleteGroup(row, $event)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </template>
      </DataTable>

      <!-- Info Cards -->
      <div class="px-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium flex items-center gap-2">
                <UserPlus class="h-4 w-4 text-green-600" />
                Manuella grupper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-xs text-muted-foreground">
                Grupper där deltagare läggs till manuellt. Perfekt för specifika aktiviteter eller
                projektgrupper.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium flex items-center gap-2">
                <Zap class="h-4 w-4 text-purple-600" />
                Automatiska grupper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-xs text-muted-foreground">
                Grupper som uppdateras automatiskt baserat på regler som ålder, enhet eller andra
                kriterier.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </template>
  </PageLayout>
</template>
