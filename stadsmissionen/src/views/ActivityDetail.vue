<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  Clock,
  Edit,
  MapPin,
  Save,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-vue-next';

// Use API service and composables
import { useApiItem, useApiList } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import api from '@/api';
import type { Activity, ActivityType } from '@/types';

// Define interfaces locally to ensure proper typing
interface Attendance {
  AttendanceID: number;
  ActivityID: number;
  ParticipantID: number;
  DatumTid: string;
  Närvaro: boolean;
  Anteckningar?: string;
}

interface ParticipantData {
  ParticipantID: number;
  Fornamn: string;
  Efternamn: string;
  Personnummer: string;
  Kon: string;
  Telefon: string;
  'E-post': string;
  Adress: string;
  Postnummer: string;
  Ort: string;
  Kartkoordinater: {
    lat: number;
    lng: number;
  };
  Enheter: string[];
  Kommentar1: string;
  Kommentar2: string;
  Kommentar3: string;
}

const route = useRoute();
const router = useRouter();
const { success, error: showError } = useToast();

// Get activity ID from route
const activityId = computed(() => route.params['id'] as string);

// Fetch activity with all related data using relational API
const {
  data: activityWithRelations,
  loading: isLoading,
  error: activityError,
  refresh: refreshActivity,
} = useApiItem(
  () =>
    api.activities.getById(activityId.value, { include: ['types', 'participants', 'attendances'] }),
  {
    cacheKey: `activity-with-relations-${activityId.value}`,
  }
);

// Extract data from the combined response
const activity = computed(() => activityWithRelations.value);
const activityType = computed(() => activityWithRelations.value?.activityType);
const attendances = computed(() => activityWithRelations.value?.attendances || []);
const activityParticipants = computed(() => activityWithRelations.value?.participants || []);

// Fetch activity types for editing dropdown
const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Error states
const hasError = computed(() => activityError.value !== null || activityTypesError.value !== null);

// Statistics
const stats = computed(() => {
  if (!attendances.value) {
    return [
      { title: 'Totala registreringar', value: 0, color: 'blue' },
      { title: 'Närvarande', value: 0, color: 'green' },
      { title: 'Frånvarande', value: 0, color: 'red' },
      { title: 'Närvarograd', value: '0%', color: 'purple' },
    ];
  }

  const totalAttendances = attendances.value.length;
  const presentCount = attendances.value.filter((a: Attendance) => a.Närvaro).length;
  const absentCount = totalAttendances - presentCount;
  const attendanceRate =
    totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0;

  return [
    {
      title: 'Totala registreringar',
      value: totalAttendances,
      color: 'blue',
    },
    {
      title: 'Närvarande',
      value: presentCount,
      color: 'green',
    },
    {
      title: 'Frånvarande',
      value: absentCount,
      color: 'red',
    },
    {
      title: 'Närvarograd',
      value: `${attendanceRate}%`,
      color: 'purple',
    },
  ];
});

// Edit mode
const isEditing = ref(false);
const isSaving = ref(false);
const editForm = ref({
  Namn: '',
  Beskrivning: '',
  Plats: '',
  DatumTid: '',
  ActivityTypeID: 0,
});

// Delete mode
const isDeleting = ref(false);
const showDeleteDialog = ref(false);

// Helper function to format date for datetime-local input
const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Initialize edit form
const initEditForm = () => {
  if (activity.value) {
    editForm.value = {
      Namn: activity.value.Namn,
      Beskrivning: activity.value.Beskrivning ?? '',
      Plats: activity.value.Plats ?? '',
      DatumTid: formatDateForInput(activity.value.DatumTid),
      ActivityTypeID: activity.value.ActivityTypeID,
    };
  }
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format time only
const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Attendance table columns
const attendanceColumns = [
  { key: 'participant', label: 'Deltagare' },
  { key: 'attendance', label: 'Närvaro' },
  { key: 'datetime', label: 'Registrerad' },
  { key: 'notes', label: 'Anteckningar' },
];

// Attendance table data
const attendanceTableData = computed(() => {
  if (!attendances.value || !activityParticipants.value) return [];

  return attendances.value.map((attendance: Attendance) => {
    const participant = activityParticipants.value?.find(
      (p: ParticipantData) => p.ParticipantID === attendance.ParticipantID
    );
    return {
      id: attendance.AttendanceID,
      participant: participant
        ? `${participant.Fornamn} ${participant.Efternamn}`
        : 'Okänd deltagare',
      attendance: attendance.Närvaro,
      datetime: attendance.DatumTid,
      notes: attendance.Anteckningar ?? '-',
    };
  });
});

// Save changes
const saveChanges = () => {
  if (!activity.value) return;

  isSaving.value = true;
  console.log('Saving changes:', editForm.value);

  api.activities
    .update(activityId.value, editForm.value)
    .then(response => {
      console.log('API Update response:', response);
      if (response.success && response.data) {
        console.log('Update successful, updating local data and refreshing cache...');

        // First update local data immediately so user sees the change
        if (activityWithRelations.value) {
          activityWithRelations.value.Namn = response.data.Namn;
          activityWithRelations.value.Beskrivning = response.data.Beskrivning;
          activityWithRelations.value.Plats = response.data.Plats;
          activityWithRelations.value.DatumTid = response.data.DatumTid;
          activityWithRelations.value.ActivityTypeID = response.data.ActivityTypeID;
          console.log('Local data updated:', activityWithRelations.value);
        }

        // Then refresh cache for persistence across navigation
        refreshActivity()
          .then(() => {
            console.log('Cache refreshed successfully');
          })
          .catch(refreshError => {
            console.error('Error refreshing cache:', refreshError);
          });

        // Exit edit mode immediately after local update
        isEditing.value = false;

        // Show success toast
        success('Aktivitet uppdaterad', 'Ändringarna har sparats framgångsrikt');
      } else {
        console.error('Failed to save changes:', response.error);
        showError('Kunde inte spara', response.error?.message || 'Ett fel uppstod vid sparande');
      }
    })
    .catch(error => {
      console.error('Error saving changes:', error);
      showError('Kunde inte spara', 'Ett oväntat fel uppstod vid sparande');
    })
    .finally(() => {
      isSaving.value = false;
    });
};

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false;
  initEditForm();
};

// Start editing mode
const startEdit = () => {
  initEditForm(); // Re-initialize form with current data
  isEditing.value = true;
};

// Computed property for activity type selection
const selectedActivityType = computed({
  get: () => editForm.value.ActivityTypeID.toString(),
  set: (value: string) => {
    editForm.value.ActivityTypeID = +value || 0;
  },
});

// Delete activity
const deleteActivity = () => {
  if (!activity.value) return;

  isDeleting.value = true;

  api.activities
    .delete(activityId.value)
    .then(response => {
      console.log('API Delete response:', response);
      if (response.success) {
        success('Aktivitet borttagen', 'Aktiviteten har tagits bort framgångsrikt');
        // Navigate back to activities list
        router.push('/activities');
      } else {
        console.error('Failed to delete activity:', response.error);
        showError(
          'Kunde inte ta bort',
          response.error?.message || 'Ett fel uppstod vid borttagning'
        );
      }
    })
    .catch(error => {
      console.error('Error deleting activity:', error);
      showError('Kunde inte ta bort', 'Ett oväntat fel uppstod vid borttagning');
    })
    .finally(() => {
      isDeleting.value = false;
      showDeleteDialog.value = false;
    });
};

// Go back to activity list
const goBack = () => {
  router.push('/activities');
};

// Initialize on mount
onMounted(() => {
  initEditForm();
});

// Breadcrumbs
const breadcrumbs = computed(() => {
  if (!activity.value) return 'Aktiviteter / Aktivitet';
  return `Aktiviteter / ${activity.value.Namn}`;
});
</script>

<template>
  <PageLayout
    :title="activity?.Namn || 'Aktivitet'"
    :breadcrumbs="breadcrumbs"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar aktivitet...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av aktivitet</p>
        <Button variant="outline" @click="refreshActivity">Försök igen</Button>
      </div>
    </div>

    <!-- Activity not found -->
    <div v-else-if="!activity" class="flex items-center justify-center h-64">
      <div class="text-center">
        <h3 class="text-lg font-semibold text-muted-foreground">Aktivitet hittades inte</h3>
        <p class="text-sm text-muted-foreground mt-2">Den begärda aktiviteten kunde inte hittas.</p>
        <Button class="mt-4" @click="goBack">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Tillbaka till aktiviteter
        </Button>
      </div>
    </div>

    <div v-else class="space-y-6">
      <!-- Header Actions -->
      <div class="flex items-center justify-between">
        <Button variant="outline" @click="goBack">
          <ArrowLeft class="mr-2 h-4 w-4" />
          Tillbaka
        </Button>

        <div class="flex gap-2">
          <template v-if="!isEditing">
            <Button variant="outline" @click="startEdit">
              <Edit class="mr-2 h-4 w-4" />
              Redigera
            </Button>
            <Dialog v-model:open="showDeleteDialog">
              <DialogTrigger as-child>
                <Button variant="destructive">
                  <Trash2 class="mr-2 h-4 w-4" />
                  Ta bort
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ta bort aktivitet</DialogTitle>
                  <DialogDescription>
                    Är du säker på att du vill ta bort aktiviteten "{{ activity.Namn }}"? Denna
                    åtgärd kan inte ångras och kommer att ta bort all relaterad data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    :disabled="isDeleting"
                    @click="showDeleteDialog = false"
                  >
                    Avbryt
                  </Button>
                  <Button variant="destructive" :disabled="isDeleting" @click="deleteActivity">
                    <Trash2 class="mr-2 h-4 w-4" />
                    {{ isDeleting ? 'Tar bort...' : 'Ta bort' }}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </template>
          <template v-else>
            <Button variant="default" :disabled="isSaving" @click="saveChanges">
              <Save class="mr-2 h-4 w-4" />
              {{ isSaving ? 'Sparar...' : 'Spara' }}
            </Button>
            <Button variant="outline" :disabled="isSaving" @click="cancelEdit">
              <X class="mr-2 h-4 w-4" />
              Avbryt
            </Button>
          </template>
        </div>
      </div>

      <!-- Activity Information -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            Aktivitetsinformation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="!isEditing" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Namn</Label>
                <p class="text-lg font-semibold">
                  {{ activity.Namn }}
                </p>
              </div>

              <div>
                <Label class="text-sm font-medium text-muted-foreground">Typ</Label>
                <Badge variant="secondary" class="mt-1">
                  {{ activityType?.Typnamn || 'Okänd typ' }}
                </Badge>
              </div>

              <div>
                <Label class="text-sm font-medium text-muted-foreground">Plats</Label>
                <p class="flex items-center gap-2 mt-1">
                  <MapPin class="h-4 w-4 text-muted-foreground" />
                  {{ activity.Plats }}
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium text-muted-foreground">Datum och tid</Label>
                <p class="flex items-center gap-2 mt-1">
                  <Clock class="h-4 w-4 text-muted-foreground" />
                  {{ formatDate(activity.DatumTid) }}
                </p>
              </div>

              <div>
                <Label class="text-sm font-medium text-muted-foreground">Beskrivning</Label>
                <p class="mt-1 text-sm">
                  {{ activity.Beskrivning || 'Ingen beskrivning tillgänglig' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Edit Form -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <Label for="name">Namn</Label>
                <Input id="name" v-model="editForm.Namn" />
              </div>

              <div>
                <Label for="type">Typ</Label>
                <Select v-model="selectedActivityType">
                  <SelectTrigger>
                    <SelectValue placeholder="Välj aktivitetstyp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="type in activityTypes"
                      :key="type.ActivityTypeID"
                      :value="type.ActivityTypeID.toString()"
                    >
                      {{ type.Typnamn }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label for="location">Plats</Label>
                <Input id="location" v-model="editForm.Plats" />
              </div>
            </div>

            <div class="space-y-4">
              <div>
                <Label for="datetime">Datum och tid</Label>
                <Input id="datetime" v-model="editForm.DatumTid" type="datetime-local" />
              </div>

              <div>
                <Label for="description">Beskrivning</Label>
                <Textarea id="description" v-model="editForm.Beskrivning" rows="3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Tabs for different views -->
      <Tabs default-value="attendances" class="w-full">
        <TabsList class="grid w-full grid-cols-3">
          <TabsTrigger value="attendances" class="flex items-center gap-2">
            <UserCheck class="h-4 w-4" />
            Närvaroregistreringar
          </TabsTrigger>
          <TabsTrigger value="participants" class="flex items-center gap-2">
            <Users class="h-4 w-4" />
            Deltagare
          </TabsTrigger>
          <TabsTrigger value="statistics" class="flex items-center gap-2">
            <BarChart3 class="h-4 w-4" />
            Statistik
          </TabsTrigger>
        </TabsList>

        <!-- Attendance Registrations -->
        <TabsContent value="attendances" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Närvaroregistreringar</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable :data="attendanceTableData" :columns="attendanceColumns">
                <template #attendance="{ item }">
                  <Badge :variant="item.attendance ? 'default' : 'destructive'">
                    <UserCheck v-if="item.attendance" class="mr-1 h-3 w-3" />
                    <UserX v-else class="mr-1 h-3 w-3" />
                    {{ item.attendance ? 'Närvarande' : 'Frånvarande' }}
                  </Badge>
                </template>
                <template #datetime="{ item }">
                  {{ formatDate(item.datetime) }}
                </template>
                <template #notes="{ item }">
                  <span class="text-sm text-muted-foreground">{{ item.notes }}</span>
                </template>
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Participants -->
        <TabsContent value="participants" class="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deltagare ({{ activityParticipants?.length || 0 }})</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="participant in (activityParticipants as ParticipantData[]) ?? []"
                  :key="participant.ParticipantID"
                  class="p-4 border rounded-lg"
                >
                  <h4 class="font-semibold">
                    {{ participant.Fornamn }} {{ participant.Efternamn }}
                  </h4>
                  <p class="text-sm text-muted-foreground">
                    {{ participant.Telefon }}
                  </p>
                  <p class="text-sm text-muted-foreground">
                    {{ participant['E-post'] }}
                  </p>

                  <!-- Attendance status for this participant -->
                  <div class="mt-2">
                    <Badge
                      v-for="attendance in (attendances as Attendance[])?.filter(
                        (a: Attendance) => a.ParticipantID === participant.ParticipantID
                      ) ?? []"
                      :key="attendance.AttendanceID"
                      :variant="attendance.Närvaro ? 'default' : 'destructive'"
                      class="text-xs"
                    >
                      {{ formatTime(attendance.DatumTid) }} -
                      {{ attendance.Närvaro ? 'Närvarande' : 'Frånvarande' }}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Statistics -->
        <TabsContent value="statistics" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card v-for="stat in stats" :key="stat.title">
              <CardContent class="p-6">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-muted-foreground">
                      {{ stat.title }}
                    </p>
                    <p class="text-2xl font-bold">
                      {{ stat.value }}
                    </p>
                  </div>
                  <div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <BarChart3 class="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- Additional Statistics -->
          <Card>
            <CardHeader>
              <CardTitle>Detaljerad statistik</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 class="font-semibold mb-2">Närvaroöversikt</h4>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-sm">Totala registreringar:</span>
                        <span class="font-medium">{{ attendances?.length || 0 }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Unika deltagare:</span>
                        <span class="font-medium">{{ activityParticipants?.length || 0 }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Genomsnittlig närvaro per deltagare:</span>
                        <span class="font-medium">
                          {{
                            (activityParticipants?.length || 0) > 0
                              ? Number(
                                  (attendances?.length || 0) / (activityParticipants?.length || 1)
                                ).toFixed(1)
                              : 0
                          }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 class="font-semibold mb-2">Aktivitetsinformation</h4>
                    <div class="space-y-2">
                      <div class="flex justify-between">
                        <span class="text-sm">Aktivitetstyp:</span>
                        <span class="font-medium">{{ activityType?.Typnamn || 'Okänd' }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Plats:</span>
                        <span class="font-medium">{{ activity.Plats }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-sm">Datum:</span>
                        <span class="font-medium">{{ formatDate(activity.DatumTid) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </PageLayout>
</template>
