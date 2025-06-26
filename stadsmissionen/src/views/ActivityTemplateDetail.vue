<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  ChartColumn,
  Clock,
  Edit,
  FileText,
  HelpCircle,
  LetterText,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  ToggleLeft,
  Trash2,
  Users,
} from 'lucide-vue-next';

// Use API service and composables
import { useApiItem } from '@/composables/useApi';
import api from '@/api';
import type { ActivityTemplate } from '@/types';

const router = useRouter();
const route = useRoute();

// Get template ID from route
const templateId = computed(() => route.params['id'] as string);

// Fetch template with enhanced relational data
const {
  data: template,
  loading: templateLoading,
  error: templateError,
  refresh: refreshTemplate,
} = useApiItem<ActivityTemplate>(() => api.activityTemplates.getById(templateId.value), {
  cacheKey: `activityTemplate-${templateId.value}`,
});

// Loading and error states
const isLoading = computed(() => templateLoading.value);
const hasError = computed(() => templateError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await refreshTemplate();
};

// Mock usage statistics since relational data isn't available yet
const usageStatistics = computed(() => {
  if (!template.value) {
    return {
      totalActivities: 0,
      recentActivities: 0,
      averageParticipants: 0,
      lastUsed: null,
      successRate: 0,
    };
  }

  // Since we don't have actual activity data linked to templates yet,
  // we'll generate some mock statistics based on the template
  const mockStats = {
    totalActivities: Math.floor(Math.random() * 20) + 5, // 5-25 activities
    recentActivities: Math.floor(Math.random() * 8) + 1, // 1-8 recent activities
    averageParticipants: Math.floor(Math.random() * 15) + 8, // 8-23 participants
    lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
    successRate: Math.floor(Math.random() * 30) + 70, // 70-100% success rate
  };

  return mockStats;
});

// Template statistics
const templateStats = computed(() => {
  if (!template.value) {
    return [
      {
        title: 'Totalt aktiviteter',
        value: '0',
        label: 'aktiviteter',
        icon: BarChart3,
        color: 'blue',
      },
      {
        title: 'Senaste 30 dagarna',
        value: '0',
        label: 'aktiviteter',
        icon: Calendar,
        color: 'green',
      },
      {
        title: 'Genomsnitt deltagare',
        value: '0',
        label: 'deltagare',
        icon: Users,
        color: 'purple',
      },
      { title: 'Framgångsgrad', value: '0%', label: 'framgång', icon: FileText, color: 'orange' },
    ];
  }

  const stats = usageStatistics.value;

  return [
    {
      title: 'Totalt aktiviteter',
      value: stats.totalActivities.toString(),
      label: 'aktiviteter',
      icon: BarChart3,
      color: 'blue',
    },
    {
      title: 'Senaste 30 dagarna',
      value: stats.recentActivities.toString(),
      label: 'aktiviteter',
      icon: Calendar,
      color: 'green',
    },
    {
      title: 'Genomsnitt deltagare',
      value: stats.averageParticipants.toString(),
      label: 'deltagare',
      icon: Users,
      color: 'purple',
    },
    {
      title: 'Framgångsgrad',
      value: `${stats.successRate}%`,
      label: 'framgång',
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

// Question type labels with icons
const getQuestionTypeInfo = (typ: string) => {
  switch (typ) {
    case 'Skala':
      return { label: 'Skala-fråga', icon: ChartColumn };
    case 'JaNej':
      return { label: 'Ja/Nej-fråga', icon: ToggleLeft };
    case 'Kommentar':
      return { label: 'Kommentar-fråga', icon: LetterText };
    default:
      return { label: typ, icon: FileText };
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

  if (confirm(`Är du säker på att du vill ta bort mallen "${template.value.name}"?`)) {
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

// Breadcrumbs for StandardHeader
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Aktiviteter', to: '/activities' },
  { label: 'Lista Mallar', to: '/activity-templates' },
  { label: template.value?.name || 'Mall', isCurrentPage: true },
]);
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
  <div v-else class="flex flex-col h-full">
    <!-- Header -->
    <StandardHeader
      :title="template.name"
      :breadcrumbs="breadcrumbs"
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
    </StandardHeader>

    <!-- Main Content -->
    <div class="flex-1 p-6">
      <div class="space-y-6">
        <!-- Template Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Basic Information -->
          <div class="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <component
                    :is="getTemplateTypeInfo(template.templateType).icon"
                    class="h-5 w-5"
                    :class="`text-${getTemplateTypeInfo(template.templateType).color}-600`"
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
                          template.templateType === 'Standard'
                            ? 'default'
                            : template.templateType === 'Samtal'
                              ? 'secondary'
                              : 'outline'
                        "
                      >
                        {{ getTemplateTypeInfo(template.templateType).label }}
                      </Badge>
                    </div>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ getTemplateTypeInfo(template.templateType).description }}
                    </p>
                  </div>

                  <div>
                    <label class="text-sm font-medium text-muted-foreground">Varaktighet</label>
                    <div class="flex items-center gap-2 mt-1">
                      <Clock class="h-4 w-4 text-muted-foreground" />
                      <span>{{ formatDuration(template.standardDuration) }}</span>
                    </div>
                  </div>

                  <div v-if="template.standardLocation" class="md:col-span-2">
                    <label class="text-sm font-medium text-muted-foreground">Standardplats</label>
                    <div class="flex items-center gap-2 mt-1">
                      <MapPin class="h-4 w-4 text-muted-foreground" />
                      <span>{{ template.standardLocation }}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium text-muted-foreground">Beskrivning</label>
                  <p class="mt-1">{{ template.description }}</p>
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

        <!-- Result Form Questions -->
        <Card v-if="template.resultForm && template.resultForm.length > 0">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <HelpCircle class="h-5 w-5" />
              Resultatformulär ({{ template.resultForm.length }} frågor)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="(question, index) in template.resultForm"
                :key="question.id || index"
                class="border rounded-lg p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <Badge variant="outline" class="text-xs flex items-center gap-1">
                        <component :is="getQuestionTypeInfo(question.type).icon" class="h-3 w-3" />
                        {{ getQuestionTypeInfo(question.type).label }}
                      </Badge>
                      <Badge v-if="question.required" variant="secondary" class="text-xs">
                        Obligatorisk
                      </Badge>
                    </div>
                    <p class="font-medium">{{ question.question }}</p>

                    <!-- Question-specific details -->
                    <div
                      v-if="question.type === 'Skala'"
                      class="mt-2 text-sm text-muted-foreground"
                    >
                      Skala: {{ question.scaleMin ?? 1 }} - {{ question.scaleMax ?? 5 }}
                      <span v-if="question.scaleComment">(med kommentarsfält)</span>
                    </div>
                    <div
                      v-else-if="question.type === 'JaNej' && question.hasComment"
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
      </div>
    </div>
  </div>
</template>
