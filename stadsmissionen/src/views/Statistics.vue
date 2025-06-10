<script setup lang="ts">
import { computed } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  Loader2,
  TrendingUp,
  Users,
} from 'lucide-vue-next';
import type {
  Activity as ActivityType,
  ActivityType as ActivityTypeInterface,
  Attendance,
  Participant,
} from '@/types';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';

// Fetch data using API services
const {
  data: participants,
  loading: participantsLoading,
  error: participantsError,
  refresh: refreshParticipants,
} = useApiList<Participant>(() => api.participants.getAll(), {
  cacheKey: 'participants',
});

const {
  data: activities,
  loading: activitiesLoading,
  error: activitiesError,
  refresh: refreshActivities,
} = useApiList<ActivityType>(() => api.activities.getAll(), {
  cacheKey: 'activities',
});

const {
  data: attendances,
  loading: attendancesLoading,
  error: attendancesError,
  refresh: refreshAttendances,
} = useApiList<Attendance>(() => api.attendances.getAll(), {
  cacheKey: 'attendances',
});

const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
  refresh: refreshActivityTypes,
} = useApiList<ActivityTypeInterface>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Loading and error states
const isLoading = computed(
  () =>
    participantsLoading.value ||
    activitiesLoading.value ||
    attendancesLoading.value ||
    activityTypesLoading.value
);

const hasError = computed(
  () =>
    participantsError.value !== null ||
    activitiesError.value !== null ||
    attendancesError.value !== null ||
    activityTypesError.value !== null
);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([
    refreshParticipants(),
    refreshActivities(),
    refreshAttendances(),
    refreshActivityTypes(),
  ]);
};

// Calculate statistics
const totalParticipants = computed(() => participants.value?.length ?? 0);
const totalActivities = computed(() => activities.value?.length ?? 0);
const totalAttendances = computed(() => attendances.value?.length ?? 0);
const attendanceRate = computed(() => {
  if (!attendances.value || attendances.value.length === 0) return 0;
  const present = attendances.value.filter((a: Attendance) => a.Närvaro).length;
  return Math.round((present / attendances.value.length) * 100);
});

// Age distribution
const ageDistribution = computed(() => {
  if (!participants.value) return { children: 0, adults: 0 };

  const currentYear = new Date().getFullYear();
  const ages = participants.value.map((p: Participant) => {
    const year = parseInt(p.Personnummer.substring(0, 4));
    return currentYear - year;
  });

  return {
    children: ages.filter((age: number) => age < 18).length,
    adults: ages.filter((age: number) => age >= 18).length,
  };
});

// Activity type statistics
const activityTypeStats = computed(() => {
  if (!activityTypes.value || !activities.value || !attendances.value) return [];

  return activityTypes.value.map((type: ActivityTypeInterface) => {
    const typeActivities =
      activities.value?.filter(
        (a: ActivityType) => Number(a.ActivityTypeID) === Number(type.ActivityTypeID)
      ) ?? [];
    const typeAttendances =
      attendances.value?.filter((att: Attendance) => {
        const activity = activities.value?.find(
          (a: ActivityType) => a.ActivityID === att.ActivityID
        );
        return Number(activity?.ActivityTypeID) === Number(type.ActivityTypeID);
      }) ?? [];

    return {
      name: type.Typnamn,
      activities: typeActivities.length,
      attendances: typeAttendances.length,
      attendanceRate:
        typeAttendances.length > 0
          ? Math.round(
              (typeAttendances.filter((a: Attendance) => a.Närvaro).length /
                typeAttendances.length) *
                100
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
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="flex items-center gap-3">
        <Loader2 class="h-6 w-6 animate-spin" />
        <span class="text-lg">Laddar statistik...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex flex-col items-center justify-center py-12">
      <div class="flex items-center gap-3 mb-4">
        <AlertCircle class="h-6 w-6 text-red-500" />
        <span class="text-lg text-red-600">Kunde inte ladda statistik</span>
      </div>
      <Button variant="outline" @click="handleRefresh">Försök igen</Button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Content with padding -->
      <div class="px-6 py-4 space-y-6">
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
                      width: `${(ageDistribution.children / totalParticipants) * 100}%`,
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
                    {{ attendances?.filter((a: Attendance) => a.Närvaro).length ?? 0 }}
                  </Badge>
                </div>
                <div class="flex justify-between items-center">
                  <span>Frånvarande</span>
                  <Badge variant="destructive">
                    {{ attendances?.filter((a: Attendance) => !a.Närvaro).length ?? 0 }}
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
              <Calendar class="h-5 w-5" />
              Aktivitetstyper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b">
                    <th class="text-left p-2">Aktivitetstyp</th>
                    <th class="text-center p-2">Antal aktiviteter</th>
                    <th class="text-center p-2">Registreringar</th>
                    <th class="text-center p-2">Närvarograd</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="stat in activityTypeStats" :key="stat.name" class="border-b">
                    <td class="p-2 font-medium">
                      {{ stat.name }}
                    </td>
                    <td class="text-center p-2">
                      <Badge variant="outline">
                        {{ stat.activities }}
                      </Badge>
                    </td>
                    <td class="text-center p-2">
                      <Badge variant="secondary">
                        {{ stat.attendances }}
                      </Badge>
                    </td>
                    <td class="text-center p-2">
                      <Badge
                        :variant="
                          stat.attendanceRate >= 80
                            ? 'default'
                            : stat.attendanceRate >= 60
                              ? 'secondary'
                              : 'destructive'
                        "
                      >
                        {{ stat.attendanceRate }}%
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <!-- Monthly Trend (Mock Chart) -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <TrendingUp class="h-5 w-5" />
              Månatlig utveckling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-12 gap-2 h-40">
              <div
                v-for="month in monthlyTrend"
                :key="month.month"
                class="flex flex-col items-center"
              >
                <div class="flex-1 flex flex-col justify-end">
                  <div
                    class="bg-blue-500 w-full rounded-t"
                    :style="{ height: `${(month.activities / 15) * 100}%` }"
                  />
                </div>
                <div class="text-xs mt-1">
                  {{ month.month }}
                </div>
              </div>
            </div>
            <div class="text-center text-sm text-muted-foreground mt-4">
              Aktiviteter per månad (simulerad data)
            </div>
          </CardContent>
        </Card>
      </div>
    </template>
  </PageLayout>
</template>
