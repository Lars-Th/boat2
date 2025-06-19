<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Clock,
  Edit,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  MessageSquare,
  Trash2,
  Users,
} from 'lucide-vue-next';

// Use API service and composables
import { useApiItem } from '@/composables/useApi';
import api from '@/api';
import type { ActivityTemplate, ActivityType } from '@/types';

const router = useRouter();
const route = useRoute();

// Get template ID from route
const templateId = computed(() => route.params.id as string);

// Fetch template with enhanced relational data
const {
  data: template,
  loading: templateLoading,
  error: templateError,
  refresh: refreshTemplate,
} = useApiItem<ActivityTemplate>(
  () => api.activityTemplates.getById(templateId.value, { include: ['type', 'activities'] }),
  {
    cacheKey: `activityTemplateWithRelations-${templateId.value}`,
  }
);

// Loading and error states
const isLoading = computed(() => templateLoading.value);
const hasError = computed(() => templateError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await refreshTemplate();
};

// Get activity type details from relational data
const templateActivityTypes = computed(() => {
  if (!template.value?.type) return [];
  return Array.isArray(template.value.type) ? template.value.type : [template.value.type];
});

// Get usage statistics from included activities
const usageStatistics = computed(() => {
  if (!template.value?.activities) {
    return {
      totalActivities: 0,
      recentActivities: 0,
      averageParticipants: 0,
      lastUsed: null,
      successRate: 0,
    };
  }

  const { activities } = template.value;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentActivities = activities.filter(
    activity => new Date(activity.CreatedDate || activity.Datum) >= thirtyDaysAgo
  );

  const totalParticipants = activities.reduce(
    (sum, activity) => sum + (activity.participants ? activity.participants.length : 0),
    0
  );

  const completedActivities = activities.filter(
    activity => activity.Status === 'completed' || activity.Status === 'slutförd'
  );

  const lastActivity =
    activities.length > 0
      ? activities.sort(
          (a, b) =>
            new Date(b.CreatedDate || b.Datum).getTime() -
            new Date(a.CreatedDate || a.Datum).getTime()
        )[0]
      : null;

  return {
    totalActivities: activities.length,
    recentActivities: recentActivities.length,
    averageParticipants:
      activities.length > 0 ? Math.round(totalParticipants / activities.length) : 0,
    lastUsed: lastActivity ? new Date(lastActivity.CreatedDate || lastActivity.Datum) : null,
    successRate:
      activities.length > 0
        ? Math.round((completedActivities.length / activities.length) * 100)
        : 0,
  };
});

// Template statistics
const templateStats = computed(() => {
  if (!template.value) {
    return [
      { title: 'Totalt aktiviteter', value: 0, icon: BarChart3, color: 'blue' },
      { title: 'Senaste 30 dagarna', value: 0, icon: Calendar, color: 'green' },
      { title: 'Genomsnitt deltagare', value: 0, icon: Users, color: 'purple' },
      { title: 'Framgångsgrad', value: '0%', icon: FileText, color: 'orange' },
    ];
  }

  const stats = usageStatistics.value;

  return [
    {
      title: 'Totalt aktiviteter',
      value: stats.totalActivities,
      icon: BarChart3,
      color: 'blue',
    },
    {
      title: 'Senaste 30 dagarna',
      value: stats.recentActivities,
      icon: Calendar,
      color: 'green',
    },
    {
      title: 'Genomsnitt deltagare',
      value: stats.averageParticipants,
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Framgångsgrad',
      value: `${stats.successRate}%`,
      icon: FileText,
      color: 'orange',
    },
  ];
});

// Get template type info
const getTemplateTypeInfo = (malltyp: string) => {
  switch (malltyp) {
    case 'Standard':
      return {
        icon: Users,
        color: 'blue',
        label: 'Standard',
        description: 'Aktiviteter med specifika deltagare som bjuds in',
      };
    case 'Samtal':
      return {
        icon: MessageSquare,
        color: 'green',
        label: 'Samtal',
        description: 'Individuella eller gruppsamtal med fokus på dokumentation',
      };
    case 'OppetHus':
      return {
        icon: FileText,
        color: 'purple',
        label: 'Öppet hus',
        description: 'Öppna aktiviteter utan förhandsanmälan',
      };
    default:
      return { icon: FileText, color: 'gray', label: malltyp, description: '' };
  }
};

// Duration formatting
const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}min`;
  if (hours > 0) return `${hours}h`;
  return `${mins}min`;
};

// Question type labels
const getQuestionTypeLabel = (typ: string) => {
  switch (typ) {
    case 'Skala':
      return 'Skala-fråga';
    case 'JaNej':
      return 'Ja/Nej-fråga';
    case 'Kommentar':
      return 'Kommentar-fråga';
    default:
      return typ;
  }
};

// Format date helper
const formatDate = (date: Date) => {
  return date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Actions
const handleEdit = () => {
  router.push(`/activity-templates/${template.value?.id}/edit`);
};

const handleDelete = () => {
  if (!template.value) return;

  if (confirm(`Är du säker på att du vill ta bort mallen "${template.value.namn}"?`)) {
    // TODO: Implement actual delete API call
    router.push('/activity-templates');
  }
};

const handleGoBack = () => {
  router.push('/activity-templates');
};

const handleCreateActivity = () => {
  router.push(`/activities/new?template=${template.value?.id}`);
};
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <div class="text-center">
      <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
      <p class="text-muted-foreground">Laddar aktivitetsmall...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="hasError" class="text-center py-12">
    <div class="text-red-500 mb-4">
      <AlertCircle class="h-12 w-12 mx-auto mb-2" />
      <p class="text-lg font-semibold">Kunde inte ladda aktivitetsmallen</p>
      <p class="text-sm text-muted-foreground mt-1">
        {{ templateError?.message }}
      </p>
    </div>
    <div class="flex gap-2 justify-center">
      <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      <Button variant="secondary" @click="handleGoBack">Tillbaka till mallar</Button>
    </div>
  </div>

  <!-- Not Found State -->
  <div v-else-if="!template" class="text-center py-12">
    <AlertCircle class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
    <p class="text-lg font-semibold">Aktivitetsmallen kunde inte hittas</p>
    <p class="text-sm text-muted-foreground mt-1">
      Mallen kanske har tagits bort eller så finns det ett fel i länken.
    </p>
    <Button variant="outline" class="mt-4" @click="handleGoBack">
      Tillbaka till aktivitetsmallar
    </Button>
  </div>

  <!-- Template Content -->
  <PageLayout
    v-else
    :title="template.namn"
    :breadcrumbs="[
      { label: 'Hem', to: '/' },
      { label: 'Aktivitetsmallar', to: '/activity-templates' },
      { label: template.namn, isCurrentPage: true },
    ]"
    :stats="templateStats"
    show-stats
  >
    <template #actions>
      <Button class="gap-2" @click="handleCreateActivity">
        <Plus class="h-4 w-4" />
        Skapa aktivitet
      </Button>
      <Button variant="outline" class="gap-2" @click="handleEdit">
        <Edit class="h-4 w-4" />
        Redigera
      </Button>
      <Button variant="destructive" class="gap-2" @click="handleDelete">
        <Trash2 class="h-4 w-4" />
        Ta bort
      </Button>
    </template>

    <div class="space-y-6">
      <!-- Template Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Basic Information -->
        <div class="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <component
                  :is="getTemplateTypeInfo(template.malltyp).icon"
                  class="h-5 w-5"
                  :class="`text-${getTemplateTypeInfo(template.malltyp).color}-600`"
                />
                Mallinformation
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-muted-foreground">Malltyp</label>
                  <div class="flex items-center gap-2 mt-1">
                    <Badge
                      :variant="
                        template.malltyp === 'Standard'
                          ? 'default'
                          : template.malltyp === 'Samtal'
                            ? 'secondary'
                            : 'outline'
                      "
                    >
                      {{ getTemplateTypeInfo(template.malltyp).label }}
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ getTemplateTypeInfo(template.malltyp).description }}
                  </p>
                </div>

                <div>
                  <label class="text-sm font-medium text-muted-foreground">Varaktighet</label>
                  <div class="flex items-center gap-2 mt-1">
                    <Clock class="h-4 w-4 text-muted-foreground" />
                    <span>{{ formatDuration(template.standardVaraktighet) }}</span>
                  </div>
                </div>

                <div v-if="template.standardPlats" class="md:col-span-2">
                  <label class="text-sm font-medium text-muted-foreground">Standardplats</label>
                  <div class="flex items-center gap-2 mt-1">
                    <MapPin class="h-4 w-4 text-muted-foreground" />
                    <span>{{ template.standardPlats }}</span>
                  </div>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-muted-foreground">Beskrivning</label>
                <p class="mt-1">{{ template.beskrivning }}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Usage Statistics -->
        <div>
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <BarChart3 class="h-5 w-5" />
                Användningsstatistik
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-if="usageStatistics.lastUsed">
                <label class="text-sm font-medium text-muted-foreground">Senast använd</label>
                <p class="text-sm">{{ formatDate(usageStatistics.lastUsed) }}</p>
              </div>

              <div v-if="usageStatistics.totalActivities > 0">
                <label class="text-sm font-medium text-muted-foreground">Effektivitet</label>
                <div class="mt-2 space-y-2">
                  <div class="flex justify-between text-sm">
                    <span>Framgångsgrad</span>
                    <span>{{ usageStatistics.successRate }}%</span>
                  </div>
                  <div class="w-full bg-muted rounded-full h-2">
                    <div
                      class="bg-green-600 h-2 rounded-full transition-all"
                      :style="`width: ${usageStatistics.successRate}%`"
                    ></div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center py-4">
                <FileText class="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p class="text-sm text-muted-foreground">Ingen användningsdata ännu</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Activity Types -->
      <Card v-if="templateActivityTypes.length > 0">
        <CardHeader>
          <CardTitle>Aktivitetstyper</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="activityType in templateActivityTypes"
              :key="activityType.ActivityTypeID"
              class="border rounded-lg p-4"
            >
              <h4 class="font-medium">{{ activityType.Typnamn }}</h4>
              <p class="text-sm text-muted-foreground mt-1">{{ activityType.Syfte }}</p>
              <p class="text-xs text-muted-foreground mt-2">{{ activityType.Beskrivning }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Result Form Questions -->
      <Card v-if="template.resultatformular && template.resultatformular.length > 0">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <HelpCircle class="h-5 w-5" />
            Resultatformulär ({{ template.resultatformular.length }} frågor)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div
              v-for="(question, index) in template.resultatformular"
              :key="question.id || index"
              class="border rounded-lg p-4"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <Badge variant="outline" class="text-xs">
                      {{ getQuestionTypeLabel(question.typ) }}
                    </Badge>
                    <Badge v-if="question.obligatorisk" variant="secondary" class="text-xs">
                      Obligatorisk
                    </Badge>
                  </div>
                  <p class="font-medium">{{ question.fraga }}</p>

                  <!-- Question-specific details -->
                  <div v-if="question.typ === 'Skala'" class="mt-2 text-sm text-muted-foreground">
                    Skala: {{ question.skalaMin || 1 }} - {{ question.skalaMax || 5 }}
                    <span v-if="question.skalaKommentar">(med kommentarsfält)</span>
                  </div>
                  <div
                    v-else-if="question.typ === 'JaNej' && question.harKommentar"
                    class="mt-2 text-sm text-muted-foreground"
                  >
                    Med kommentarsfält
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activities (if any) -->
      <Card v-if="template.activities && template.activities.length > 0">
        <CardHeader>
          <CardTitle>Senaste aktiviteter ({{ template.activities.length }})</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div
              v-for="activity in template.activities.slice(0, 5)"
              :key="activity.id || activity.ActivityID"
              class="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 cursor-pointer transition-colors"
              @click="$router.push(`/activities/${activity.id || activity.ActivityID}`)"
            >
              <div>
                <p class="font-medium">
                  {{ activity.title || activity.Titel || 'Unnamed Activity' }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ formatDate(new Date(activity.CreatedDate || activity.Datum)) }}
                </p>
              </div>
              <Badge
                :variant="
                  activity.Status === 'completed' || activity.Status === 'slutförd'
                    ? 'default'
                    : 'secondary'
                "
                class="text-xs"
              >
                {{ activity.Status || 'Planerad' }}
              </Badge>
            </div>

            <div v-if="template.activities.length > 5" class="text-center pt-2">
              <Button variant="outline" size="sm">
                Visa alla {{ template.activities.length }} aktiviteter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
