<script setup lang="ts">
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { useApiList } from '@/composables/useApi';
import api from '@/services/api';
import type { ActivityType } from '@/types';
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Plus, Users } from 'lucide-vue-next';

const router = useRouter();

// Fetch activities and activity types using the API service
const {
  data: activities,
  loading: activitiesLoading,
  error: activitiesError,
} = useApiList(() => api.activities.getAll(), {
  cacheKey: 'activities',
});

const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
} = useApiList(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Combine activities with their types
const activitiesWithTypes = computed(() => {
  if (!activities.value || !activityTypes.value) return [];

  return activities.value.map(activity => {
    const activityType = (activityTypes.value as unknown as ActivityType[])?.find(
      type => type.ActivityTypeID === activity.ActivityTypeID
    );
    return {
      ...activity,
      typeName: activityType?.Typnamn ?? 'Okänd typ',
      typeDescription: activityType?.Beskrivning ?? '',
    };
  });
});

// Loading state
const isLoading = computed(() => activitiesLoading.value || activityTypesLoading.value);

// Error state
const hasError = computed(
  () => activitiesError.value !== null || activityTypesError.value !== null
);

// Remove the filteredActivities since DataTable handles filtering internally

// Table columns
const columns = [
  {
    key: 'Namn',
    label: 'Aktivitet',
    sortable: true,
  },
  {
    key: 'typeName',
    label: 'Typ',
    sortable: true,
  },
  {
    key: 'DatumTid',
    label: 'Datum & Tid',
    sortable: true,
    render: (value: unknown) => new Date(value as string).toLocaleString('sv-SE'),
  },
  {
    key: 'Plats',
    label: 'Plats',
    sortable: true,
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
  },
];

// Statistics
const stats = computed(() => {
  if (!activities.value || !activityTypes.value) {
    return [
      { title: 'Totalt aktiviteter', value: 0, icon: Calendar, color: 'blue' },
      { title: 'Denna vecka', value: 0, icon: Calendar, color: 'green' },
      { title: 'Unika platser', value: 0, icon: MapPin, color: 'purple' },
      { title: 'Aktivitetstyper', value: 0, icon: Users, color: 'orange' },
    ];
  }

  return [
    {
      title: 'Totalt aktiviteter',
      value: activities.value.length,
      icon: Calendar,
      color: 'blue',
    },
    {
      title: 'Denna vecka',
      value: activities.value.filter(activity => {
        const activityDate = new Date(activity.DatumTid);
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return activityDate >= weekStart && activityDate <= weekEnd;
      }).length,
      icon: Calendar,
      color: 'green',
    },
    {
      title: 'Unika platser',
      value: new Set(activities.value.map(activity => activity.Plats)).size,
      icon: MapPin,
      color: 'purple',
    },
    {
      title: 'Aktivitetstyper',
      value: activityTypes.value.length,
      icon: Users,
      color: 'orange',
    },
  ];
});

// Filters removed since DataTable handles filtering internally

const handleNewActivity = () => {
  router.push('/activities/new');
};

const handleRowClick = (activity: Record<string, unknown>) => {
  router.push(`/activities/${activity['ActivityID']}`);
};

const handleViewActivity = (activity: Record<string, unknown>) => {
  router.push(`/activities/${activity['ActivityID']}`);
};

const handleEditActivity = (activity: Record<string, unknown>) => {
  router.push(`/activities/${activity['ActivityID']}`);
};
</script>

<template>
  <PageLayout title="Aktiviteter" breadcrumbs="Dashboard / Aktiviteter" show-stats :stats="stats">
    <!-- Actions with padding -->
    <div class="px-6 py-4 flex justify-end">
      <Button class="gap-2" @click="handleNewActivity">
        <Plus class="h-4 w-4" />
        Ny aktivitet
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar aktiviteter...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av aktiviteter</p>
        <Button
          variant="outline"
          @click="
            () => {
              /* Add refresh logic */
            }
          "
        >
          Försök igen
        </Button>
      </div>
    </div>

    <!-- DataTable full width without padding -->
    <DataTable
      v-else
      :data="activitiesWithTypes"
      :columns="columns"
      :search-fields="['Namn', 'Beskrivning', 'Plats', 'typeName']"
      @row-click="handleRowClick"
    >
      <template #cell-typeName="{ value }">
        <Badge variant="secondary">
          {{ value }}
        </Badge>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex gap-2">
          <Button size="sm" variant="outline" @click="handleViewActivity(row)">Visa</Button>
          <Button size="sm" variant="outline" @click="handleEditActivity(row)">Redigera</Button>
        </div>
      </template>
    </DataTable>
  </PageLayout>
</template>
