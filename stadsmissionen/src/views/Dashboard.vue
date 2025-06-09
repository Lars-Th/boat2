<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import { BarChart3, Calendar, ClipboardList, Plus, UserPlus, Users } from 'lucide-vue-next';
import type { BreadcrumbItem } from '@/types';

// Import JSON data
import participantsData from '@/assets/data/participants.json';
import activitiesData from '@/assets/data/activities.json';
import attendancesData from '@/assets/data/attendances.json';
import activityTypesData from '@/assets/data/activityTypes.json';

const router = useRouter();

// Calculate statistics from JSON data
const totalParticipants = computed(() => participantsData.length);
const totalActivities = computed(() => activitiesData.length);
const totalAttendances = computed(() => attendancesData.length);
const attendanceRate = computed(() => {
  const present = attendancesData.filter(a => a.Närvaro).length;
  return Math.round((present / attendancesData.length) * 100);
});

// Recent activities (this week)
const recentActivities = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return activitiesData
    .filter(a => new Date(a.DatumTid) >= oneWeekAgo)
    .sort((a, b) => new Date(b.DatumTid).getTime() - new Date(a.DatumTid).getTime())
    .slice(0, 5);
});

// Age distribution
const ageStats = computed(() => {
  const currentYear = new Date().getFullYear();
  const ages = participantsData.map(p => {
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

    <!-- Main content -->
    <div class="p-4 space-y-6">
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
            <div class="space-y-3">
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
            <div class="space-y-2">
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
              <Button
                variant="outline"
                size="sm"
                class="w-full mt-2"
                @click="router.push('/activities')"
              >
                Visa alla aktiviteter
              </Button>
            </div>
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
            <div class="space-y-2">
              <div
                v-for="type in activityTypesData.slice(0, 5)"
                :key="type.ActivityTypeID"
                class="flex justify-between items-center text-sm"
              >
                <span>{{ type.Typnamn }}</span>
                <Badge variant="outline">
                  {{
                    activitiesData.filter(
                      a => Number(a.ActivityTypeID) === Number(type.ActivityTypeID)
                    ).length
                  }}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                class="w-full mt-2"
                @click="router.push('/activity-types')"
              >
                Hantera aktivitetstyper
              </Button>
            </div>
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
