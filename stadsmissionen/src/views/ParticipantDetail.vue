<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useApiItem, useApiList } from '@/composables/useApi';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DataTable from '@/components/shared/DataTable.vue';
import PageLayout from '@/components/ui/PageLayout.vue';

// Icons
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-vue-next';

// API and types
import api from '@/api';
import type { Activity, ActivityType, Attendance, Participant, TableColumn } from '@/types';

const route = useRoute();
const router = useRouter();

const participantId = computed(() => parseInt(route.params['id'] as string));

// Fetch participant with related data using relational API
const {
  data: participantWithRelations,
  loading: participantLoading,
  error: participantError,
  refresh: refreshParticipant,
} = useApiItem(
  () =>
    api.participants.getById(participantId.value.toString(), {
      include: ['activities', 'attendances'],
    }),
  {
    cacheKey: `participant-${participantId.value}`,
  }
);

// Fetch activity types for display
const {
  data: activityTypes,
  loading: typesLoading,
  error: typesError,
  refresh: refreshTypes,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Extract data from relational response
const participant = computed(() => participantWithRelations.value);
const activities = computed(() => participantWithRelations.value?.activities ?? []);
const attendances = computed(() => participantWithRelations.value?.attendances ?? []);

// Loading and error states
const isLoading = computed(() => Boolean(participantLoading.value) || Boolean(typesLoading.value));

const hasError = computed(() => participantError.value !== null || typesError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshParticipant(), refreshTypes()]);
};

// Calculate age
const calculateAge = (personnummer: string) => {
  const year = parseInt(personnummer.substring(0, 4));
  const currentYear = new Date().getFullYear();
  return currentYear - year;
};

// Get participant's attendances with activity details
const participantAttendances = computed(() => {
  if (!attendances.value || !activities.value || !activityTypes.value) return [];

  return attendances.value
    .filter(att => att.ParticipantID === participantId.value)
    .map(attendance => {
      const activity = activities.value?.find(a => a.ActivityID === attendance.ActivityID);
      const activityType = activityTypes.value?.find(
        t => Number(t.ActivityTypeID) === Number(activity?.ActivityTypeID)
      );

      return {
        ...attendance,
        activity,
        activityType,
        activityName: activity?.Namn ?? 'Okänd aktivitet',
        activityDate: activity?.DatumTid ?? '',
        activityPlace: activity?.Plats ?? '',
        typeName: activityType?.Typnamn ?? 'Okänd typ',
      };
    })
    .sort((a, b) => new Date(b.activityDate).getTime() - new Date(a.activityDate).getTime());
});

// Statistics
const stats = computed(() => {
  if (!participant.value) return [];

  const totalActivities = participantAttendances.value.length;
  const presentCount = participantAttendances.value.filter(a => a.Närvaro).length;
  const attendanceRate =
    totalActivities > 0 ? Math.round((presentCount / totalActivities) * 100) : 0;

  return [
    {
      title: 'Ålder',
      value: calculateAge(participant.value.Personnummer),
      icon: User,
      color: 'blue',
    },
    {
      title: 'Aktiviteter',
      value: totalActivities,
      icon: Calendar,
      color: 'green',
    },
    {
      title: 'Närvarograd',
      value: `${attendanceRate}%`,
      icon: Calendar,
      color: 'purple',
    },
  ];
});

// Table columns for activities
const activityColumns: TableColumn[] = [
  {
    key: 'activityName',
    label: 'Aktivitet',
    sortable: true,
  },
  {
    key: 'typeName',
    label: 'Typ',
    sortable: true,
  },
  {
    key: 'activityDate',
    label: 'Datum',
    sortable: true,
  },
  {
    key: 'activityPlace',
    label: 'Plats',
    sortable: true,
  },
  {
    key: 'Närvaro',
    label: 'Närvaro',
    sortable: true,
    type: 'custom' as const,
  },
];

const handleBack = () => {
  router.push('/participants');
};

const handleEdit = () => {
  // TODO: Navigate to edit participant
  console.log('Edit participant:', participant.value);
};
</script>

<template>
  <!-- Loading State -->
  <PageLayout
    v-if="isLoading"
    title="Laddar deltagare..."
    breadcrumbs="Dashboard / Deltagare / Laddar..."
  >
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar deltagarinformation...</p>
      </div>
    </div>
  </PageLayout>

  <!-- Error State -->
  <PageLayout
    v-else-if="hasError"
    title="Fel vid laddning"
    breadcrumbs="Dashboard / Deltagare / Fel"
  >
    <div class="flex items-center justify-center py-12">
      <div class="text-center">
        <AlertCircle class="h-8 w-8 text-destructive mx-auto mb-4" />
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av deltagarinformation</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>
  </PageLayout>

  <!-- Main Content -->
  <PageLayout
    v-else-if="participant"
    :title="`${participant.Fornamn} ${participant.Efternamn}`"
    :breadcrumbs="`Dashboard / Deltagare / ${participant.Fornamn} ${participant.Efternamn}`"
    show-stats
    :stats="stats"
  >
    <!-- Content with padding -->
    <div class="px-6 py-4 space-y-6">
      <!-- Header Actions -->
      <div class="flex items-center justify-between">
        <Button variant="outline" class="gap-2" @click="handleBack">
          <ArrowLeft class="h-4 w-4" />
          Tillbaka till deltagare
        </Button>
        <Button class="gap-2" @click="handleEdit">
          <Edit class="h-4 w-4" />
          Redigera deltagare
        </Button>
      </div>

      <!-- Participant Info Card -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <User class="h-5 w-5" />
            Deltagarinformation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-muted-foreground">Namn</label>
                <p class="text-lg font-semibold">
                  {{ participant.Fornamn }} {{ participant.Efternamn }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Personnummer</label>
                <p>{{ participant.Personnummer }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-muted-foreground">Ålder</label>
                <p>{{ calculateAge(participant.Personnummer) }} år</p>
              </div>
            </div>
            <div class="space-y-4">
              <div v-if="participant.Telefon" class="flex items-center gap-2">
                <Phone class="h-4 w-4 text-muted-foreground" />
                <span>{{ participant.Telefon }}</span>
              </div>
              <div v-if="participant['E-post']" class="flex items-center gap-2">
                <Mail class="h-4 w-4 text-muted-foreground" />
                <span>{{ participant['E-post'] }}</span>
              </div>
              <div v-if="participant.Adress" class="flex items-center gap-2">
                <MapPin class="h-4 w-4 text-muted-foreground" />
                <span>{{ participant.Adress }}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Activities Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
            Aktivitetshistorik ({{ participantAttendances.length }})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            v-if="participantAttendances.length > 0"
            :data="participantAttendances"
            :columns="activityColumns"
          >
            <template #cell-typeName="{ value }">
              <Badge variant="secondary">
                {{ value }}
              </Badge>
            </template>

            <template #cell-Närvaro="{ value }">
              <Badge :variant="value ? 'default' : 'destructive'">
                {{ value ? 'Närvarande' : 'Frånvarande' }}
              </Badge>
            </template>
          </DataTable>
          <div v-else class="text-center py-8 text-muted-foreground">
            Inga aktiviteter registrerade än
          </div>
        </CardContent>
      </Card>
    </div>
  </PageLayout>

  <!-- Not Found -->
  <PageLayout v-else title="Deltagare hittades inte" breadcrumbs="Dashboard / Deltagare / Fel">
    <div class="px-6 py-4">
      <Card>
        <CardContent class="text-center py-8">
          <p class="text-muted-foreground mb-4">
            Deltagaren med ID {{ participantId }} kunde inte hittas.
          </p>
          <Button variant="outline" @click="handleBack">Tillbaka till deltagare</Button>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
