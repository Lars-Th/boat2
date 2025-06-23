<script setup lang="ts">
import { computed } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Loader2, QrCode, XCircle } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';

// Fetch activities with participants and attendances using enhanced API
const {
  data: activitiesWithRelations,
  loading: activitiesLoading,
  error: activitiesError,
} = useApiList(() => api.activities.getAll({ include: ['participants', 'attendances'] }), {
  cacheKey: 'activitiesWithAttendances',
});

// Enhanced attendance data - now computed from API data
const enhancedAttendances = computed(() => {
  if (!activitiesWithRelations.value) return [];

  const attendances: any[] = [];
  activitiesWithRelations.value.forEach((activity: any) => {
    if (activity.attendances) {
      activity.attendances.forEach((attendance: any) => {
        attendances.push({
          ...attendance,
          activityName: activity.Namn,
          activityDate: activity.DatumTid,
          activityPlace: activity.Plats,
          participantName: attendance.participantName ?? 'Okänd deltagare',
        });
      });
    }
  });

  return attendances;
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

// Statistics - now computed from API data
const stats = computed(() => [
  {
    title: 'Totalt registreringar',
    value: enhancedAttendances.value.length,
    icon: CheckCircle,
    color: 'blue',
  },
  {
    title: 'Närvarande',
    value: enhancedAttendances.value.filter(a => a.Närvaro).length,
    icon: CheckCircle,
    color: 'green',
  },
  {
    title: 'Frånvarande',
    value: enhancedAttendances.value.filter(a => !a.Närvaro).length,
    icon: XCircle,
    color: 'red',
  },
  {
    title: 'Senaste veckan',
    value: recentAttendances.value.length,
    icon: Clock,
    color: 'purple',
  },
]);

// Today's activities from API data
const todaysActivities = computed(() => {
  if (!activitiesWithRelations.value) return [];

  const today = new Date().toISOString().split('T')[0];
  return activitiesWithRelations.value
    .filter((activity: any) => {
      const activityDate = (activity.DatumTid ?? '').split('T')[0];
      return activityDate === today;
    })
    .slice(0, 3);
});
</script>

<template>
  <PageLayout
    title="Närvaroregistrering"
    breadcrumbs="Dashboard / Aktiviteter / Närvaroregistrering"
    show-stats
    :stats="stats"
  >
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
          <div class="space-y-2">
            <div v-if="activitiesLoading" class="text-center py-4">
              <Loader2 class="h-4 w-4 animate-spin mx-auto" />
              <p class="text-sm text-muted-foreground">Laddar aktiviteter...</p>
            </div>
            <div v-else-if="activitiesError" class="text-center py-4">
              <p class="text-sm text-destructive">Kunde inte ladda aktiviteter</p>
            </div>
            <div
              v-for="activity in todaysActivities"
              v-else
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
        <DataTable :data="recentAttendances" :columns="columns">
          <template #cell-Närvaro="{ value }">
            <Badge :variant="value ? 'default' : 'destructive'">
              <CheckCircle v-if="value" class="h-3 w-3 mr-1" />
              <XCircle v-else class="h-3 w-3 mr-1" />
              {{ value ? 'Närvarande' : 'Frånvarande' }}
            </Badge>
          </template>

          <template #cell-Anteckningar="{ value }">
            <span class="text-sm text-muted-foreground">
              {{ value ?? 'Inga anteckningar' }}
            </span>
          </template>
        </DataTable>
      </CardContent>
    </Card>
  </PageLayout>
</template>
