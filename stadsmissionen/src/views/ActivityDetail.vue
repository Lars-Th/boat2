<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiItem, useApiList } from '@/composables/useApi';
import api from '@/api';
import type { ActivityType } from '@/types';

// Components
import ExtendedDetailPage from '@/components/shared/ExtendedDetailPage.vue';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
} from 'lucide-vue-next';

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

interface JunctionData {
  JunctionID: number;
  OfficeID: number;
  ParticipantID: number;
  ParticipantGroupID: string | null;
}

interface OfficeData {
  OfficeID: number;
  Name: string;
  Address: string;
  PostalCode: string;
  City: string;
  Phone: string;
  Email: string;
}

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();

const activityId = route.params['id'] as string;
const isNew = computed(() => activityId === 'new');

// API calls
const {
  data: activityWithRelations,
  loading: activityLoading,
  error: activityError,
  refresh: refreshActivity,
} = useApiItem(
  () => {
    if (isNew.value) return Promise.resolve({ success: true, data: null });
    return api.activities.getById(activityId, {
      include: ['types', 'participants'],
    });
  },
  {
    cacheKey: `activity-with-relations-${activityId}`,
  }
);

// Fetch attendances separately
const {
  data: _attendancesData,
  loading: attendancesLoading,
  error: attendancesError,
  refresh: refreshAttendances,
} = useApiList(
  () => {
    if (isNew.value) return Promise.resolve({ success: true, data: [] });
    return api.attendances.getByActivityId(activityId);
  },
  {
    cacheKey: `attendances-${activityId}`,
  }
);

// Fetch offices data
const {
  data: officesData,
  loading: officesLoading,
  error: officesError,
} = useApiList(() => api.offices.getAll(), {
  cacheKey: 'offices',
});

// Fetch junction table data
const {
  data: junctionData,
  loading: junctionLoading,
  error: junctionError,
} = useApiList(() => api.enheterParticipantsGroups.getAll(), {
  cacheKey: 'enheterParticipantsGroups',
});

// Fetch activity types for editing dropdown
const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Extract data from the combined response
const activity = computed(() => activityWithRelations.value);
const _activityType = computed(() => activityWithRelations.value?.activityType);
const attendances = computed(() => _attendancesData.value ?? []);
const activityParticipants = computed(() => activityWithRelations.value?.participants ?? []);

// Form state
const form = ref({
  ActivityID: undefined as number | undefined,
  Namn: '',
  Beskrivning: '',
  Plats: '',
  DatumTid: '',
  ActivityTypeID: 0,
});

const hasUnsavedChanges = ref(false);

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

// Watch for activity data and populate form
watch(
  activity,
  newActivity => {
    if (newActivity) {
      form.value = {
        ActivityID: newActivity.ActivityID,
        Namn: newActivity.Namn || '',
        Beskrivning: newActivity.Beskrivning || '',
        Plats: newActivity.Plats || '',
        DatumTid: formatDateForInput(newActivity.DatumTid),
        ActivityTypeID: newActivity.ActivityTypeID || 0,
      };
      hasUnsavedChanges.value = false;
    }
  },
  { immediate: true }
);

// Initialize form for new activity
if (isNew.value) {
  hasUnsavedChanges.value = false;
}

// Field definitions for ComplexDetailPage
const mainFields = computed(() => [
  { key: 'Namn', label: 'Aktivitetsnamn', type: 'text' as const },
  { key: 'Beskrivning', label: 'Beskrivning', type: 'textarea' as const },
  { key: 'Plats', label: 'Plats', type: 'text' as const },
  { key: 'DatumTid', label: 'Datum och tid', type: 'text' as const },
  {
    key: 'ActivityTypeID',
    label: 'Aktivitetstyp',
    type: 'select' as const,
    options:
      activityTypes.value?.map(type => ({
        value: type.ActivityTypeID.toString(),
        label: type.Typnamn,
      })) || [],
  },
]);

const sidebarFields = computed(() => [
  { key: 'ActivityID', label: 'Aktivitets-ID', type: 'text' as const },
  { key: 'CreatedDate', label: 'Skapad', type: 'date' as const },
]);

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

// Format time only (unused but keeping for potential future use)
const _formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Tabs configuration for ExtendedDetailPage
const tabs = computed(() => [
  {
    key: 'attendances',
    title: 'Närvaroregistreringar',
    icon: UserCheck,
  },
  {
    key: 'participants',
    title: 'Deltagare',
    icon: Users,
  },
  {
    key: 'statistik',
    title: 'Statistik',
    icon: BarChart3,
  },
]);

// Data for tabs
const attendanceTableData = computed(() => {
  return attendances.value.map((attendance: Attendance) => {
    const participant = activityParticipants.value?.find(
      (p: ParticipantData) => p.ParticipantID === attendance.ParticipantID
    );

    // Find participant's offices through junction table
    const participantJunctions =
      junctionData.value?.filter(
        (j: JunctionData) => j.ParticipantID === attendance.ParticipantID
      ) || [];

    // Get office names for this participant
    const participantOffices = participantJunctions
      .map((junction: JunctionData) => {
        const office = officesData.value?.find((o: OfficeData) => o.OfficeID === junction.OfficeID);
        return office?.Name;
      })
      .filter(Boolean) // Remove undefined values
      .filter((name, index, arr) => arr.indexOf(name) === index); // Remove duplicates

    return {
      id: attendance.AttendanceID,
      participant: participant
        ? `${participant.Fornamn} ${participant.Efternamn}`
        : 'Okänd deltagare',
      phone: participant?.Telefon || '-',
      offices: participantOffices,
      attendance: attendance.Närvaro,
      datetime: attendance.DatumTid,
      notes: attendance.Anteckningar ?? '-',
    };
  });
});

const participantTableData = computed(() => {
  return (
    activityParticipants.value?.map((participant: ParticipantData) => {
      const participantAttendances = attendances.value.filter(
        (a: Attendance) => a.ParticipantID === participant.ParticipantID
      );
      return {
        id: participant.ParticipantID,
        name: `${participant.Fornamn} ${participant.Efternamn}`,
        phone: participant.Telefon,
        email: participant['E-post'],
        attendanceCount: participantAttendances.length,
        presentCount: participantAttendances.filter((a: Attendance) => a.Närvaro).length,
      };
    }) ?? []
  );
});

// Column definitions (unused but keeping for potential future use)
const _attendanceColumns = [
  { key: 'participant', label: 'Deltagare', sortable: true },
  { key: 'phone', label: 'Telefon', sortable: false },
  { key: 'offices', label: 'Enheter', sortable: false, type: 'custom' as const },
  { key: 'attendance', label: 'Närvaro', sortable: true, type: 'custom' as const },
  { key: 'datetime', label: 'Registrerad', sortable: true, type: 'custom' as const },
  { key: 'notes', label: 'Anteckningar', sortable: false },
  { key: 'actions', label: 'Åtgärder', type: 'actions' as const, width: '100px' },
];

const _participantColumns = [
  { key: 'name', label: 'Namn', sortable: true },
  { key: 'phone', label: 'Telefon', sortable: false },
  { key: 'email', label: 'E-post', sortable: false },
  { key: 'attendanceCount', label: 'Registreringar', sortable: true, type: 'custom' as const },
  { key: 'presentCount', label: 'Närvarande', sortable: true, type: 'custom' as const },
  { key: 'actions', label: 'Åtgärder', type: 'actions' as const, width: '100px' },
];

// Statistics
const stats = computed(() => {
  if (!activity.value) return [];

  const totalAttendances = attendances.value.length;
  const presentCount = attendances.value.filter((a: Attendance) => a.Närvaro).length;
  const absentCount = totalAttendances - presentCount;
  const attendanceRate =
    totalAttendances > 0 ? Math.round((presentCount / totalAttendances) * 100) : 0;

  return [
    {
      label: 'Totala registreringar',
      value: totalAttendances,
    },
    {
      label: 'Närvarande',
      value: presentCount,
      color: 'text-green-600',
    },
    {
      label: 'Frånvarande',
      value: absentCount,
      color: 'text-red-600',
    },
    {
      label: 'Närvarograd',
      value: `${attendanceRate}%`,
      color: 'text-blue-600',
    },
  ];
});

// Breadcrumbs
const breadcrumbs = computed(() => {
  if (isNew.value) {
    return [
      { label: 'Dashboard', to: '/' },
      { label: 'Aktiviteter', to: '/activities' },
      { label: 'Ny aktivitet', to: '', isCurrentPage: true },
    ];
  }
  return [
    { label: 'Dashboard', to: '/' },
    { label: 'Aktiviteter', to: '/activities' },
    { label: activity.value?.Namn || 'Aktivitetsdetaljer', to: '', isCurrentPage: true },
  ];
});

// Page title
const pageTitle = computed(() => {
  if (isNew.value) return 'Lägg till ny aktivitet';
  return activity.value?.Namn || 'Aktivitetsdetaljer';
});

// Event handlers
const handleFieldChange = (key: string, value: unknown) => {
  (form.value as any)[key] = value;
  hasUnsavedChanges.value = true;
};

const handleSave = async () => {
  try {
    if (isNew.value) {
      // Create new activity
      const result = await api.activities.create(form.value);
      if (result.success) {
        success('Aktivitet skapad', 'Den nya aktiviteten har skapats framgångsrikt.');
        router.push(`/activities/${result.data.ActivityID}`);
      } else {
        error('Fel vid skapande', result.error?.message || 'Kunde inte skapa aktiviteten.');
      }
    } else {
      // Update existing activity
      const result = await api.activities.update(activityId, form.value);
      if (result.success) {
        success('Aktivitet uppdaterad', 'Aktiviteten har uppdaterats framgångsrikt.');
        hasUnsavedChanges.value = false;
        await refreshActivity();
        await refreshAttendances();
      } else {
        error('Fel vid uppdatering', result.error?.message || 'Kunde inte uppdatera aktiviteten.');
      }
    }
  } catch (_err) {
    error('Fel vid sparande', 'Ett oväntat fel inträffade. Försök igen.');
  }
};

const handleDelete = async () => {
  if (isNew.value) return;

  try {
    const result = await api.activities.delete(activityId);
    if (result.success) {
      success('Aktivitet borttagen', 'Aktiviteten har tagits bort framgångsrikt.');
      router.push('/activities');
    } else {
      error('Fel vid borttagning', result.error?.message || 'Kunde inte ta bort aktiviteten.');
    }
  } catch (_err) {
    error('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.');
  }
};

const handleBack = () => {
  router.push('/activities');
};

const handleDiscardChanges = () => {
  if (activity.value) {
    // Reset form to original data
    form.value = {
      ActivityID: activity.value.ActivityID,
      Namn: activity.value.Namn || '',
      Beskrivning: activity.value.Beskrivning || '',
      Plats: activity.value.Plats || '',
      DatumTid: formatDateForInput(activity.value.DatumTid),
      ActivityTypeID: activity.value.ActivityTypeID || 0,
    };
  }
  hasUnsavedChanges.value = false;
};

// Tab event handlers
const handleAddTabItem = (tabKey: string) => {
  switch (tabKey) {
    case 'attendances':
      router.push(`/attendance?activityId=${activityId}`);
      break;
    case 'participants':
      router.push(`/participants/new?activityId=${activityId}`);
      break;
  }
};

const handleEditTabItem = (_tabKey: string, item: any) => {
  switch (_tabKey) {
    case 'attendances':
      // Could navigate to edit attendance or show inline edit
      break;
    case 'participants':
      router.push(`/participants/${item.id}`);
      break;
  }
};

const handleDeleteTabItem = (_tabKey: string, _item: any) => {
  // Handle delete confirmation and API call
  // TODO: Implement delete confirmation dialog and API call
};

const handleTabItemClick = (tabKey: string, item: any) => {
  // Same as edit for now
  handleEditTabItem(tabKey, item);
};

const handleTogglePresence = async (item: any) => {
  try {
    const newPresenceStatus = !item.attendance;

    const result = await api.attendances.update(item.id.toString(), {
      Närvaro: newPresenceStatus,
      DatumTid: new Date().toISOString(),
    });

    if (result.success) {
      success(
        `Närvaro ${newPresenceStatus ? 'markerad' : 'borttagen'}`,
        `Deltagaren har markerats som ${newPresenceStatus ? 'närvarande' : 'frånvarande'}.`
      );

      // Refresh attendance data
      await refreshAttendances();
    } else {
      error('Fel vid uppdatering', result.error?.message || 'Kunde inte uppdatera närvarostatus.');
    }
  } catch (_err) {
    error('Fel vid uppdatering', 'Ett oväntat fel inträffade. Försök igen.');
  }
};

// Loading and error states
const isLoading = computed(
  () =>
    activityLoading.value ||
    activityTypesLoading.value ||
    attendancesLoading.value ||
    officesLoading.value ||
    junctionLoading.value
);
const hasError = computed(
  () =>
    activityError.value !== null ||
    activityTypesError.value !== null ||
    attendancesError.value !== null ||
    officesError.value !== null ||
    junctionError.value !== null
);
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-muted-foreground">Laddar aktivitetsuppgifter...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError && !isNew" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="h-8 w-8 text-destructive mx-auto mb-4">⚠️</div>
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av aktivitetsuppgifter</p>
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded"
          @click="
            () => {
              refreshActivity();
              refreshAttendances();
            }
          "
        >
          Försök igen
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <ExtendedDetailPage
        :title="pageTitle"
        :data="form"
        :breadcrumbs="breadcrumbs"
        :show-stats="!isNew && !!activity"
        :stats="stats"
        :main-fields="mainFields"
        :sidebar-fields="sidebarFields"
        :tabs="tabs"
        :has-unsaved-changes="hasUnsavedChanges"
        default-tab="attendances"
        @field-change="handleFieldChange"
        @save="handleSave"
        @delete="handleDelete"
        @back="handleBack"
        @discard-changes="handleDiscardChanges"
      >
        <!-- Attendance Tab Content -->
        <template #tab-attendances>
          <div class="bg-white rounded-lg border">
            <div class="flex items-center justify-between p-4 border-b">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <UserCheck class="h-5 w-5" />
                Närvaroregistreringar
              </h3>
              <button
                class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                @click="handleAddTabItem('attendances')"
              >
                + Lägg till
              </button>
            </div>
            <div class="p-4">
              <div v-if="attendanceTableData.length === 0" class="text-center py-8 text-gray-500">
                Inga närvaroregistreringar att visa
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left p-2 font-medium">Deltagare</th>
                      <th class="text-left p-2 font-medium">Telefon</th>
                      <th class="text-left p-2 font-medium">Enheter</th>
                      <th class="text-left p-2 font-medium">Närvaro</th>
                      <th class="text-left p-2 font-medium">Registrerad</th>
                      <th class="text-left p-2 font-medium">Anteckningar</th>
                      <th class="text-left p-2 font-medium w-24">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in attendanceTableData"
                      :key="item.id"
                      class="border-b hover:bg-gray-50 cursor-pointer"
                      @click="handleTabItemClick('attendances', item)"
                    >
                      <td class="p-2">{{ item.participant }}</td>
                      <td class="p-2">{{ item.phone }}</td>
                      <td class="p-2">
                        <div class="flex flex-wrap gap-1">
                          <Badge
                            v-for="office in item.offices"
                            :key="office"
                            variant="outline"
                            class="text-xs"
                          >
                            {{ office }}
                          </Badge>
                          <span
                            v-if="!item.offices || item.offices.length === 0"
                            class="text-gray-500 text-sm"
                          >
                            Ingen enhet
                          </span>
                        </div>
                      </td>
                      <td class="p-2">
                        <Badge :variant="item.attendance ? 'default' : 'destructive'">
                          <UserCheck v-if="item.attendance" class="mr-1 h-3 w-3" />
                          <UserX v-else class="mr-1 h-3 w-3" />
                          {{ item.attendance ? 'Närvarande' : 'Frånvarande' }}
                        </Badge>
                      </td>
                      <td class="p-2">{{ formatDate(item.datetime) }}</td>
                      <td class="p-2">{{ item.notes }}</td>
                      <td class="p-2">
                        <div class="flex gap-1">
                          <button
                            v-if="!item.attendance"
                            class="p-1 text-green-600 hover:bg-green-50 rounded flex items-center"
                            title="Markera som närvarande"
                            @click.stop="handleTogglePresence(item)"
                          >
                            <UserPlus class="h-4 w-4" />
                          </button>
                          <button
                            v-if="item.attendance"
                            class="p-1 text-orange-600 hover:bg-orange-50 rounded flex items-center"
                            title="Markera som frånvarande"
                            @click.stop="handleTogglePresence(item)"
                          >
                            <UserMinus class="h-4 w-4" />
                          </button>
                          <button
                            class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Redigera"
                            @click.stop="handleEditTabItem('attendances', item)"
                          >
                            ✏️
                          </button>
                          <button
                            class="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Ta bort"
                            @click.stop="handleDeleteTabItem('attendances', item)"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

        <!-- Participants Tab Content -->
        <template #tab-participants>
          <div class="bg-white rounded-lg border">
            <div class="flex items-center justify-between p-4 border-b">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <Users class="h-5 w-5" />
                Deltagare
              </h3>
              <button
                class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                @click="handleAddTabItem('participants')"
              >
                + Lägg till
              </button>
            </div>
            <div class="p-4">
              <div v-if="participantTableData.length === 0" class="text-center py-8 text-gray-500">
                Inga deltagare att visa
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full border-collapse">
                  <thead>
                    <tr class="border-b">
                      <th class="text-left p-2 font-medium">Namn</th>
                      <th class="text-left p-2 font-medium">Telefon</th>
                      <th class="text-left p-2 font-medium">E-post</th>
                      <th class="text-left p-2 font-medium">Registreringar</th>
                      <th class="text-left p-2 font-medium">Närvarande</th>
                      <th class="text-left p-2 font-medium w-24">Åtgärder</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in participantTableData"
                      :key="item.id"
                      class="border-b hover:bg-gray-50 cursor-pointer"
                      @click="handleTabItemClick('participants', item)"
                    >
                      <td class="p-2">{{ item.name }}</td>
                      <td class="p-2">{{ item.phone }}</td>
                      <td class="p-2">{{ item.email }}</td>
                      <td class="p-2">
                        <Badge variant="outline">{{ item.attendanceCount }} registreringar</Badge>
                      </td>
                      <td class="p-2">
                        <Badge variant="default">{{ item.presentCount }} närvarande</Badge>
                      </td>
                      <td class="p-2">
                        <div class="flex gap-1">
                          <button
                            class="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            @click.stop="handleEditTabItem('participants', item)"
                          >
                            ✏️
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>

        <!-- Statistics Tab Content -->
        <template #tab-statistik>
          <div class="bg-white rounded-lg border">
            <div class="p-4 border-b">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <BarChart3 class="h-5 w-5" />
                Statistik
              </h3>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  v-for="stat in stats"
                  :key="stat.label"
                  class="text-center p-4 bg-gray-50 rounded-lg"
                >
                  <div class="text-2xl font-bold" :class="stat.color">{{ stat.value }}</div>
                  <div class="text-sm text-gray-600">{{ stat.label }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ExtendedDetailPage>
    </div>
  </div>
</template>
