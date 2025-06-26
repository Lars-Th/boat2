<script setup lang="ts">
import { computed } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, BarChart3, Calendar, TrendingUp, Users } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import api from '@/api';

// API Data with optimized relational calls
const {
  data: participantsWithActivities,
  loading: participantsLoading,
  error: participantsError,
  refetch: refetchParticipants,
} = useApi(
  () =>
    api.participants?.getAll({ include: ['activities', 'attendances'] }) ||
    Promise.resolve({ data: [], success: true }),
  { immediate: true }
);

const {
  data: activitiesWithTypes,
  loading: activitiesLoading,
  error: activitiesError,
  refetch: refetchActivities,
} = useApi(
  () =>
    api.activities?.getAll({ include: ['types', 'attendances'] }) ||
    Promise.resolve({ data: [], success: true }),
  { immediate: true }
);

const {
  data: attendances,
  loading: attendancesLoading,
  error: attendancesError,
  refetch: refetchAttendances,
} = useApi(() => api.attendances?.getAll() || Promise.resolve({ data: [], success: true }), {
  immediate: true,
});

// Extract data from relational responses
const participants = computed(() => participantsWithActivities.value ?? []);
const activities = computed(() => activitiesWithTypes.value ?? []);
const activityTypes = computed(() => {
  // Extract unique activity types from activities
  if (!activitiesWithTypes.value) return [];
  const types = activitiesWithTypes.value
    .map(a => a.activityType)
    .filter(
      (type, index, arr) =>
        type && arr.findIndex(t => t?.ActivityTypeID === type?.ActivityTypeID) === index
    );
  return types.filter(Boolean);
});

// Loading and error states
const isLoading = computed(
  () =>
    Boolean(participantsLoading.value) ||
    Boolean(activitiesLoading.value) ||
    Boolean(attendancesLoading.value)
);

const hasError = computed(
  () =>
    participantsError.value !== null ||
    activitiesError.value !== null ||
    attendancesError.value !== null
);

// Event handlers
const handleRetry = async () => {
  await Promise.all([refetchParticipants(), refetchActivities(), refetchAttendances()]);
};

// Calculate statistics from API data
const totalParticipants = computed(() => participants.value?.length ?? 0);
const totalActivities = computed(() => activities.value?.length ?? 0);
const totalAttendances = computed(() => attendances.value?.length ?? 0);
const attendanceRate = computed(() => {
  if (!attendances.value || attendances.value.length === 0) return 0;
  const present = attendances.value.filter(a => a.Närvaro).length;
  return Math.round((present / attendances.value.length) * 100);
});

// Age distribution
const ageDistribution = computed(() => {
  if (!participants.value) return { children: 0, adults: 0 };

  const currentYear = new Date().getFullYear();
  const ages = participants.value.map(p => {
    const year = parseInt(p.Personnummer.substring(0, 4));
    return currentYear - year;
  });

  return {
    children: ages.filter(age => age < 18).length,
    adults: ages.filter(age => age >= 18).length,
  };
});

// Activity type statistics
const activityTypeStats = computed(() => {
  if (!activityTypes.value || !activities.value || !attendances.value) return [];

  return activityTypes.value.map(type => {
    const typeActivities = activities.value.filter(
      a => Number(a.ActivityTypeID) === Number(type.ActivityTypeID)
    );
    const typeAttendances = attendances.value.filter(att => {
      const activity = activities.value.find(a => a.ActivityID === att.ActivityID);
      return Number(activity?.ActivityTypeID) === Number(type.ActivityTypeID);
    });

    return {
      name: type.Typnamn,
      activities: typeActivities.length,
      attendances: typeAttendances.length,
      attendanceRate:
        typeAttendances.length > 0
          ? Math.round(
              (typeAttendances.filter(a => a.Närvaro).length / typeAttendances.length) * 100
            )
          : 0,
    };
  });
});

// Monthly activity trend (simplified)
const monthlyTrend = computed(() => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Maj',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dec',
  ];
  return months.map(month => ({
    month,
    activities: Math.floor(Math.random() * 10) + 5, // Mock data
    participants: Math.floor(Math.random() * 50) + 20, // Mock data
  }));
});

// Main statistics
const stats = computed(() => [
  {
    title: 'Totalt deltagare',
    value: totalParticipants.value,
    icon: Users,
    color: 'blue',
    change: '+12%',
  },
  {
    title: 'Aktiviteter',
    value: totalActivities.value,
    icon: Calendar,
    color: 'green',
    change: '+8%',
  },
  {
    title: 'Närvarograd',
    value: `${attendanceRate.value}%`,
    icon: TrendingUp,
    color: 'purple',
    change: '+5%',
  },
  {
    title: 'Registreringar',
    value: totalAttendances.value,
    icon: Activity,
    color: 'orange',
    change: '+15%',
  },
]);
</script>

<template>
  <PageLayout
    title="Statistik & Rapporter"
    breadcrumbs="Dashboard / Rapporter / Statistik"
    description="Översikt av statistik och trender för aktiviteter och deltagare"
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Laddar statistik...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <AlertCircle class="h-12 w-12 mx-auto mb-2" />
        <p class="text-lg font-semibold">Kunde inte ladda statistik</p>
        <p class="text-sm text-muted-foreground mt-1">
          {{
            participantsError?.message ||
            activitiesError?.message ||
            attendancesError?.message ||
            activityTypesError?.message
          }}
        </p>
      </div>
      <Button variant="outline" @click="handleRetry">Försök igen</Button>
    </div>

    <!-- Content with padding -->
    <div v-else class="space-y-6">
      <!-- Age Distribution -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Users class="h-5 w-5" />
              Åldersfördelning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span>Barn (under 18 år)</span>
                <Badge variant="default">
                  {{ ageDistribution.children }}
                </Badge>
              </div>
              <div class="flex justify-between items-center">
                <span>Vuxna (18+ år)</span>
                <Badge variant="secondary">
                  {{ ageDistribution.adults }}
                </Badge>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full"
                  :style="{
                    width: `${totalParticipants.value > 0 ? (ageDistribution.children / totalParticipants.value) * 100 : 0}%`,
                  }"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <BarChart3 class="h-5 w-5" />
              Närvarostatistik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span>Närvarande</span>
                <Badge variant="default">
                  {{ (attendances || []).filter(a => a.Närvaro).length }}
                </Badge>
              </div>
              <div class="flex justify-between items-center">
                <span>Frånvarande</span>
                <Badge variant="destructive">
                  {{ (attendances || []).filter(a => !a.Närvaro).length }}
                </Badge>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">{{ attendanceRate }}%</div>
                <div class="text-sm text-muted-foreground">Genomsnittlig närvaro</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Activity Type Statistics -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Activity class="h-5 w-5" />
            Aktivitetstypsstatistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div
              v-for="stat in activityTypeStats"
              :key="stat.name"
              class="flex items-center justify-between p-3 border rounded"
            >
              <span class="font-medium">{{ stat.name }}</span>
              <div class="flex gap-2">
                <Badge variant="outline">{{ stat.activities }} aktiviteter</Badge>
                <Badge variant="secondary">{{ stat.attendanceRate }}% närvaro</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Monthly Trend -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="h-5 w-5" />
            Månatlig trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
            <div
              v-for="month in monthlyTrend"
              :key="month.month"
              class="text-center p-2 border rounded"
            >
              <div class="text-xs font-medium">{{ month.month }}</div>
              <div class="text-sm text-muted-foreground">
                {{ month.activities }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
