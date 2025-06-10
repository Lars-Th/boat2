<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  ClipboardList,
  Loader2,
  Plus,
  UserPlus,
  Users,
} from 'lucide-vue-next';
// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Activity, ActivityType, Attendance, BreadcrumbItem, Participant } from '@/types';

const router = useRouter();

// Fetch data using API service
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
} = useApiList<Activity>(() => api.activities.getAll(), {
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
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
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

// Calculate statistics from API data
const totalParticipants = computed(() => participants.value?.length ?? 0);
const totalActivities = computed(() => activities.value?.length ?? 0);
const totalAttendances = computed(() => attendances.value?.length ?? 0);
const attendanceRate = computed(() => {
  if (!attendances.value || attendances.value.length === 0) return 0;
  const present = attendances.value.filter(a => a.Närvaro).length;
  return Math.round((present / attendances.value.length) * 100);
});

// Recent activities (this week)
const recentActivities = computed(() => {
  if (!activities.value) return [];

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return activities.value
    .filter(a => new Date(a.DatumTid) >= oneWeekAgo)
    .sort((a, b) => new Date(b.DatumTid).getTime() - new Date(a.DatumTid).getTime())
    .slice(0, 5);
});

// Age distribution
const ageStats = computed(() => {
  if (!participants.value) {
    return { children: 0, adults: 0 };
  }

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

// Main statistics for header
const stats = computed(() => [
  {
    label: 'Deltagare',
    value: totalParticipants.value,
    color: 'blue',
  },
  {
    label: 'Aktiviteter',
    value: totalActivities.value,
    color: 'green',
  },
  {
    label: 'Närvarograd',
    value: `${attendanceRate.value}%`,
    color: 'purple',
  },
  {
    label: 'Registreringar',
    value: totalAttendances.value,
    color: 'orange',
  },
]);

// Quick actions
const quickActions = [
  {
    label: 'Ny deltagare',
    action: () => router.push('/participants/new'),
    icon: UserPlus,
    variant: 'default' as const,
  },
  {
    label: 'Ny aktivitet',
    action: () => router.push('/activities/new'),
    icon: Plus,
    variant: 'outline' as const,
  },
  {
    label: 'Närvaroregistrering',
    action: () => router.push('/attendance'),
    icon: ClipboardList,
    variant: 'outline' as const,
  },
  {
    label: 'Visa rapporter',
    action: () => router.push('/reports'),
    icon: BarChart3,
    variant: 'outline' as const,
  },
];

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [{ label: 'Stadsmissionen', isCurrentPage: true }];

// Navigation shortcuts
const navigationShortcuts = [
  {
    label: 'Aktiviteter',
    route: '/activities',
    description: 'Hantera aktiviteter och scheman',
  },
  {
    label: 'Deltagare',
    route: '/participants',
    description: 'Hantera deltagare och kontakter',
  },
  {
    label: 'Närvaroregistrering',
    route: '/attendance',
    description: 'Registrera närvaro för aktiviteter',
  },
  {
    label: 'Rapporter',
    route: '/reports',
    description: 'Visa statistik och rapporter',
  },
];

// Activity types with usage count
const activityTypesWithCount = computed(() => {
  if (!activityTypes.value || !activities.value) return [];

  return activityTypes.value.slice(0, 5).map(type => ({
    ...type,
    count:
      activities.value?.filter(a => Number(a.ActivityTypeID) === Number(type.ActivityTypeID))
        .length ?? 0,
  }));
});
</script>

<template>
  <div class="w-full">
    <!-- Header with statistics -->
    <StandardHeader
      title="Dashboard - Stadsmissionen"
      :breadcrumbs="breadcrumbs"
      show-stats
      :stats="stats"
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar dashboard-data...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <AlertCircle class="h-8 w-8 text-destructive mx-auto mb-4" />
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av dashboard-data</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="p-4 space-y-6">
      <!-- Quick Actions -->
      <Card>
        <CardHeader>
          <CardTitle>Snabbåtgärder</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-wrap gap-3">
            <Button
              v-for="action in quickActions"
              :key="action.label"
              :variant="action.variant"
              class="gap-2"
              @click="action.action"
            >
              <component :is="action.icon" class="h-4 w-4" />
              {{ action.label }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Age Distribution -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Users class="h-5 w-5" />
              Åldersfördelning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="totalParticipants === 0" class="text-center py-4">
              <p class="text-muted-foreground">Inga deltagare registrerade</p>
            </div>
            <div v-else class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm">Barn (under 18)</span>
                <Badge variant="default">
                  {{ ageStats.children }}
                </Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm">Vuxna (18+)</span>
                <Badge variant="secondary">
                  {{ ageStats.adults }}
                </Badge>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-blue-600 h-2 rounded-full"
                  :style="{
                    width: `${(ageStats.children / totalParticipants) * 100}%`,
                  }"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Recent Activities -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Calendar class="h-5 w-5" />
              Kommande aktiviteter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="recentActivities.length === 0" class="text-center py-4">
              <p class="text-muted-foreground">Inga kommande aktiviteter</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="activity in recentActivities"
                :key="activity.ActivityID"
                class="p-2 border rounded text-sm"
              >
                <div class="font-medium">
                  {{ activity.Namn }}
                </div>
                <div class="text-muted-foreground text-xs">
                  {{ new Date(activity.DatumTid).toLocaleDateString('sv-SE') }}
                  - {{ activity.Plats }}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="w-full mt-2"
              @click="router.push('/activities')"
            >
              Visa alla aktiviteter
            </Button>
          </CardContent>
        </Card>

        <!-- Activity Types -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <BarChart3 class="h-5 w-5" />
              Aktivitetstyper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="activityTypesWithCount.length === 0" class="text-center py-4">
              <p class="text-muted-foreground">Inga aktivitetstyper registrerade</p>
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="type in activityTypesWithCount"
                :key="type.ActivityTypeID"
                class="flex justify-between items-center text-sm"
              >
                <span>{{ type.Typnamn }}</span>
                <Badge variant="outline">
                  {{ type.count }}
                </Badge>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              class="w-full mt-2"
              @click="router.push('/activity-types')"
            >
              Hantera aktivitetstyper
            </Button>
          </CardContent>
        </Card>
      </div>

      <!-- Navigation Shortcuts -->
      <Card>
        <CardHeader>
          <CardTitle>Snabbnavigering</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="item in navigationShortcuts"
              :key="item.route"
              class="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              @click="router.push(item.route)"
            >
              <h4 class="font-medium mb-1">
                {{ item.label }}
              </h4>
              <p class="text-sm text-muted-foreground">
                {{ item.description }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style>
