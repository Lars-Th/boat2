<script setup lang="ts">
import { computed } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Loader2, QrCode, XCircle } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Activity, Attendance, Participant } from '@/types';

// Fetch data using API service
const {
  data: attendances,
  loading: attendancesLoading,
  error: attendancesError,
  refresh: refreshAttendances,
} = useApiList<Attendance>(() => api.attendances.getAll(), {
  cacheKey: 'attendances',
});

const {
  data: activities,
  loading: activitiesLoading,
  error: activitiesError,
  refresh: refreshActivities,
} = useApiList<Activity>(() => api.activities.getAll(), {
  cacheKey: 'activities',
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
const isLoading = computed(
  () => attendancesLoading.value || activitiesLoading.value || participantsLoading.value
);
const hasError = computed(
  () =>
    attendancesError.value !== null ||
    activitiesError.value !== null ||
    participantsError.value !== null
);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshAttendances(), refreshActivities(), refreshParticipants()]);
};

// Enhanced attendance data
const enhancedAttendances = computed(() => {
  if (!attendances.value || !activities.value || !participants.value) return [];

  return attendances.value.map(attendance => {
    const activity = activities.value?.find(a => a.ActivityID === attendance.ActivityID);
    const participant = participants.value?.find(p => p.ParticipantID === attendance.ParticipantID);

    return {
      ...attendance,
      activityName: activity?.Namn ?? 'Okänd aktivitet',
      participantName: participant
        ? `${participant.Fornamn} ${participant.Efternamn}`
        : 'Okänd deltagare',
      activityDate: activity?.DatumTid ?? '',
      activityPlace: activity?.Plats ?? '',
    };
  });
});

// Recent attendances (last 7 days)
const recentAttendances = computed(() => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return enhancedAttendances.value
    .filter(a => new Date(a.DatumTid) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.DatumTid).getTime() - new Date(a.DatumTid).getTime());
});

// Table columns
const columns = [
  {
    key: 'participantName',
    label: 'Deltagare',
    sortable: true,
  },
  {
    key: 'activityName',
    label: 'Aktivitet',
    sortable: true,
  },
  {
    key: 'DatumTid',
    label: 'Registrerad',
    sortable: true,
    format: (value: string) => new Date(value).toLocaleString('sv-SE'),
  },
  {
    key: 'Närvaro',
    label: 'Status',
    sortable: true,
  },
  {
    key: 'Anteckningar',
    label: 'Anteckningar',
    sortable: false,
  },
];

// Statistics
const stats = computed(() => {
  if (!attendances.value) {
    return [
      { title: 'Totalt registreringar', value: 0, icon: CheckCircle, color: 'blue' },
      { title: 'Närvarande', value: 0, icon: CheckCircle, color: 'green' },
      { title: 'Frånvarande', value: 0, icon: XCircle, color: 'red' },
      { title: 'Senaste veckan', value: 0, icon: Clock, color: 'purple' },
    ];
  }

  return [
    {
      title: 'Totalt registreringar',
      value: attendances.value.length,
      icon: CheckCircle,
      color: 'blue',
    },
    {
      title: 'Närvarande',
      value: attendances.value.filter(a => a.Närvaro).length,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Frånvarande',
      value: attendances.value.filter(a => !a.Närvaro).length,
      icon: XCircle,
      color: 'red',
    },
    {
      title: 'Senaste veckan',
      value: recentAttendances.value.length,
      icon: Clock,
      color: 'purple',
    },
  ];
});

// Today's activities (first 3)
const todaysActivities = computed(() => {
  if (!activities.value) return [];
  return activities.value.slice(0, 3);
});
</script>

<template>
  <PageLayout
    title="Närvaroregistrering"
    breadcrumbs="Dashboard / Aktiviteter / Närvaroregistrering"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar närvarodata...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <AlertCircle class="h-8 w-8 text-destructive mx-auto mb-4" />
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av närvarodata</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- QR Code Scanner -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <QrCode class="h-5 w-5" />
              QR-kod Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col items-center gap-4">
              <div
                class="w-32 h-32 border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center"
              >
                <QrCode class="h-12 w-12 text-muted-foreground" />
              </div>
              <Button class="w-full">Starta Scanner</Button>
            </div>
          </CardContent>
        </Card>

        <!-- Quick Registration -->
        <Card>
          <CardHeader>
            <CardTitle>Snabbregistrering</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <Button variant="outline" class="w-full justify-start gap-2">
                <CheckCircle class="h-4 w-4 text-green-600" />
                Registrera närvaro
              </Button>
              <Button variant="outline" class="w-full justify-start gap-2">
                <XCircle class="h-4 w-4 text-red-600" />
                Registrera frånvaro
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Today's Activities -->
        <Card>
          <CardHeader>
            <CardTitle>Dagens aktiviteter</CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="todaysActivities.length === 0" class="text-center py-4">
              <p class="text-muted-foreground">Inga aktiviteter idag</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="activity in todaysActivities"
                :key="activity.ActivityID"
                class="p-2 border rounded text-sm"
              >
                <div class="font-medium">
                  {{ activity.Namn }}
                </div>
                <div class="text-muted-foreground">
                  {{ activity.Plats }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Senaste registreringar</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="recentAttendances.length === 0" class="text-center py-8">
            <p class="text-muted-foreground">Inga registreringar den senaste veckan</p>
          </div>
          <DataTable v-else :data="recentAttendances" :columns="columns">
            <template #cell-Närvaro="{ value }">
              <Badge :variant="value ? 'default' : 'destructive'">
                <CheckCircle v-if="value" class="h-3 w-3 mr-1" />
                <XCircle v-else class="h-3 w-3 mr-1" />
                {{ value ? 'Närvarande' : 'Frånvarande' }}
              </Badge>
            </template>

            <template #cell-Anteckningar="{ value }">
              <span class="text-sm text-muted-foreground">
                {{ value || 'Inga anteckningar' }}
              </span>
            </template>
          </DataTable>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
