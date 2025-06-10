<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Edit,
  FileText,
  HelpCircle,
  MapPin,
  MessageSquare,
  Trash2,
  Users,
} from 'lucide-vue-next';

// Use API service and composables
import { useApiItem, useApiList } from '@/composables/useApi';
import api from '@/api';
import type { ActivityType } from '@/types';

const router = useRouter();
const route = useRoute();

// Get template ID from route
const templateId = computed(() => route.params['id'] as string);

// Fetch data using API service
const {
  data: template,
  loading: templateLoading,
  error: templateError,
} = useApiItem(() => api.activityTemplates.getById(templateId.value), {
  cacheKey: `activity-template-${templateId.value}`,
});

const {
  data: activityTypes,
  loading: activityTypesLoading,
  error: activityTypesError,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

// Get activity type details for the template
const templateActivityTypes = computed(() => {
  if (!template.value || !activityTypes.value) return [];
  return template.value.aktivitetstyper
    .map(id => {
      return activityTypes.value?.find(t => t.ActivityTypeID.toString() === id);
    })
    .filter(Boolean);
});

// Loading states
const isLoading = computed(() => templateLoading.value || activityTypesLoading.value);

// Error states
const hasError = computed(() => templateError.value !== null || activityTypesError.value !== null);

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

// Actions
const handleEdit = () => {
  router.push(`/activity-templates/${template.value?.id}/edit`);
};

const handleDelete = () => {
  if (!template.value) return;

  if (confirm(`Är du säker på att du vill ta bort mallen "${template.value.namn}"?`)) {
    // TODO: Implement actual delete API call
    // For now, just navigate back
    router.push('/activity-templates');
  }
};

// Handle not found case
const handleNotFound = () => {
  router.push('/activity-templates');
};
</script>

<template>
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
      <p class="text-muted-foreground">Laddar aktivitetsmall...</p>
    </div>
  </div>

  <!-- Error State -->
  <div v-else-if="hasError" class="flex items-center justify-center py-12">
    <div class="text-center">
      <p class="text-destructive mb-2">Ett fel uppstod vid laddning av aktivitetsmallen</p>
      <Button variant="outline" @click="handleNotFound">Tillbaka till aktivitetsmallar</Button>
    </div>
  </div>

  <!-- Not Found State -->
  <div v-else-if="!template" class="flex items-center justify-center py-12">
    <div class="text-center">
      <p class="text-muted-foreground mb-2">Aktivitetsmallen kunde inte hittas</p>
      <Button variant="outline" @click="handleNotFound">Tillbaka till aktivitetsmallar</Button>
    </div>
  </div>

  <!-- Template Content -->
  <PageLayout
    v-else
    :title="template.namn"
    :breadcrumbs="`Dashboard / Administration / Aktivitetsmallar / ${template.namn}`"
    show-back-button
  >
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Header Actions -->
      <div class="flex justify-between items-center px-6">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <component
              :is="getTemplateTypeInfo(template.malltyp).icon"
              class="h-6 w-6"
              :class="`text-${getTemplateTypeInfo(template.malltyp).color}-600`"
            />
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
        </div>

        <div class="flex gap-2">
          <Button class="gap-2" @click="handleEdit">
            <Edit class="h-4 w-4" />
            Redigera
          </Button>
          <Button variant="destructive" class="gap-2" @click="handleDelete">
            <Trash2 class="h-4 w-4" />
            Ta bort
          </Button>
        </div>
      </div>

      <!-- Basic Information -->
      <Card class="mx-6">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="h-5 w-5" />
            Grundläggande information
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-sm text-muted-foreground mb-2">Beskrivning</h4>
              <p class="text-sm">
                {{ template.beskrivning }}
              </p>
            </div>

            <div class="space-y-4">
              <div v-if="template.standardPlats">
                <h4 class="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin class="h-4 w-4" />
                  Standardplats
                </h4>
                <p class="text-sm">
                  {{ template.standardPlats }}
                </p>
              </div>

              <div>
                <h4 class="font-medium text-sm text-muted-foreground mb-2 flex items-center gap-1">
                  <Clock class="h-4 w-4" />
                  Standardvaraktighet
                </h4>
                <p class="text-sm">
                  {{ formatDuration(template.standardVaraktighet) }}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-medium text-sm text-muted-foreground mb-2">Malltyp</h4>
            <div class="flex items-center gap-2">
              <component
                :is="getTemplateTypeInfo(template.malltyp).icon"
                class="h-4 w-4"
                :class="`text-${getTemplateTypeInfo(template.malltyp).color}-600`"
              />
              <span class="text-sm">{{ getTemplateTypeInfo(template.malltyp).description }}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Activity Types -->
      <Card class="mx-6">
        <CardHeader>
          <CardTitle>Aktivitetstyper</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            v-if="templateActivityTypes.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            <p>Inga aktivitetstyper tilldelade</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="type in templateActivityTypes"
              :key="type?.ActivityTypeID?.toString() ?? 'unknown'"
              class="p-4 border rounded-lg"
            >
              <h4 class="font-medium text-sm mb-2">
                {{ type?.Typnamn }}
              </h4>
              <p class="text-xs text-muted-foreground mb-2">
                {{ type?.Syfte }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ type?.Beskrivning }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Result Form -->
      <Card class="mx-6">
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Resultatformulär</span>
            <Badge variant="secondary">{{ template.resultatformular.length }} frågor</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            v-if="template.resultatformular.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            <HelpCircle class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Inga frågor har lagts till</p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(question, index) in template.resultatformular"
              :key="question.id"
              class="border rounded-lg p-4"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="font-medium text-sm">Fråga {{ index + 1 }}</span>
                    <Badge variant="outline" class="text-xs">
                      {{ getQuestionTypeLabel(question.typ || 'Text') }}
                    </Badge>
                    <Badge v-if="question.obligatorisk" variant="destructive" class="text-xs">
                      Obligatorisk
                    </Badge>
                  </div>
                  <p class="text-sm">
                    {{ question.fraga }}
                  </p>
                </div>
              </div>

              <!-- Question type specific details -->
              <div
                v-if="question.typ && question.typ === 'Skala'"
                class="mt-3 p-3 bg-muted/50 rounded text-xs"
              >
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <span class="font-medium">Minimum:</span>
                    {{ question.skalaMin }} (dåligt)
                  </div>
                  <div>
                    <span class="font-medium">Maximum:</span>
                    {{ question.skalaMax }} (bra)
                  </div>
                  <div>
                    <span class="font-medium">Kommentar:</span>
                    {{ question.skalaKommentar ? 'Ja' : 'Nej' }}
                  </div>
                </div>
              </div>

              <div
                v-if="question.typ && question.typ === 'JaNej'"
                class="mt-3 p-3 bg-muted/50 rounded text-xs"
              >
                <span class="font-medium">Kommentarsfält:</span>
                {{ question.harKommentar ? 'Ja' : 'Nej' }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Metadata -->
      <Card class="mx-6">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 class="font-medium text-muted-foreground mb-1">Skapad</h4>
              <p>
                {{ new Date(template.skapadDatum).toLocaleDateString('sv-SE') }}
              </p>
            </div>
            <div>
              <h4 class="font-medium text-muted-foreground mb-1">Skapad av</h4>
              <p>{{ template.skapadAv }}</p>
            </div>
            <div>
              <h4 class="font-medium text-muted-foreground mb-1">Mall-ID</h4>
              <p class="font-mono text-xs">
                {{ template.id }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </PageLayout>
</template>
