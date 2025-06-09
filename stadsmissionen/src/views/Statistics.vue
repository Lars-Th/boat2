<script setup lang="ts">
import { computed } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart3, Calendar, TrendingUp, Users } from 'lucide-vue-next';

// Import JSON data
import participantsData from '@/assets/data/participants.json';
import activitiesData from '@/assets/data/activities.json';
import attendancesData from '@/assets/data/attendances.json';
import activityTypesData from '@/assets/data/activityTypes.json';

// Calculate statistics
const totalParticipants = computed(() => participantsData.length);
const totalActivities = computed(() => activitiesData.length);
const totalAttendances = computed(() => attendancesData.length);
const attendanceRate = computed(() => {
  const present = attendancesData.filter(a => a.Närvaro).length;
  return Math.round((present / attendancesData.length) * 100);
});

// Age distribution
const ageDistribution = computed(() => {
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

// Activity type statistics
const activityTypeStats = computed(() => {
  return activityTypesData.map(type => {
    const typeActivities = activitiesData.filter(
      a => Number(a.ActivityTypeID) === Number(type.ActivityTypeID)
    );
    const typeAttendances = attendancesData.filter(att => {
      const activity = activitiesData.find(a => a.ActivityID === att.ActivityID);
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
    show-stats
    :stats="stats"
  >
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
                  {{ attendancesData.filter(a => a.Närvaro).length }}
                </Badge>
              </div>
              <div class="flex justify-between items-center">
                <span>Frånvarande</span>
                <Badge variant="destructive">
                  {{ attendancesData.filter(a => !a.Närvaro).length }}
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
  </PageLayout>
</template>
