<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, MapPin } from 'lucide-vue-next';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';

interface Props {
  selectedTemplateId: string;
}

interface Emits {
  (e: 'update:selectedTemplateId', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Fetch data using API service
const {
  data: activityTemplates,
  loading: templatesLoading,
  error: templatesError,
} = useApiList(() => api.activityTemplates.getAll(), {
  cacheKey: 'activityTemplates',
});

// Loading and error states
const isLoading = computed(() => Boolean(templatesLoading.value));
const hasError = computed(() => templatesError.value !== null);

// Get selected template
const selectedTemplate = computed(() => {
  if (!props.selectedTemplateId || !activityTemplates.value) return null;
  return activityTemplates.value.find(t => t.id === props.selectedTemplateId);
});

// Get template type info
const getTemplateTypeInfo = (templateType: string) => {
  switch (templateType) {
    case 'Standard':
      return {
        label: 'Standard',
        description: 'Aktivitet med specifika deltagare som bjuds in',
        allowsParticipants: true,
        allowsSeries: true,
      };
    case 'Samtal':
      return {
        label: 'Samtal',
        description: 'Individuellt eller gruppsamtal med dokumentation',
        allowsParticipants: true,
        allowsSeries: false,
      };
    case 'OppetHus':
      return {
        label: 'Öppet hus',
        description: 'Öppen aktivitet utan förhandsanmälan',
        allowsParticipants: false,
        allowsSeries: true,
      };
    default:
      return {
        label: templateType,
        description: '',
        allowsParticipants: true,
        allowsSeries: true,
      };
  }
};

const handleTemplateChange = (templateId: string | null) => {
  if (templateId) {
    emit('update:selectedTemplateId', templateId);
  }
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <FileText class="h-5 w-5" />
        Välj aktivitetsmall
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-8">
        <div class="text-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
          <p class="text-sm text-muted-foreground">Laddar aktivitetsmallar...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="flex items-center justify-center py-8">
        <div class="text-center">
          <p class="text-sm text-destructive">Ett fel uppstod vid laddning av aktivitetsmallar</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else>
        <div class="space-y-2">
          <Label for="template">Aktivitetsmall *</Label>
          <Select
            :model-value="selectedTemplateId"
            @update:model-value="value => handleTemplateChange(value as string)"
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj en aktivitetsmall..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-if="!activityTemplates ?? activityTemplates.length === 0"
                value=""
                disabled
              >
                Inga aktivitetsmallar tillgängliga
              </SelectItem>
              <SelectItem
                v-for="template in activityTemplates"
                v-else
                :key="template.id"
                :value="template.id"
              >
                <div class="flex items-center gap-2">
                  <Badge
                    :variant="
                      template.templateType === 'Standard'
                        ? 'default'
                        : template.templateType === 'Samtal'
                          ? 'secondary'
                          : 'outline'
                    "
                    class="text-xs"
                  >
                    {{ getTemplateTypeInfo(template.templateType).label }}
                  </Badge>
                  <span>{{ template.name }}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Template info -->
        <div v-if="selectedTemplate" class="p-4 bg-muted/50 rounded-lg">
          <div class="flex items-start gap-3">
            <div class="flex-1">
              <h4 class="font-medium">
                {{ selectedTemplate.name }}
              </h4>
              <p class="text-sm text-muted-foreground mt-1">
                {{ selectedTemplate.description }}
              </p>
              <div class="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span class="flex items-center gap-1">
                  <Clock class="h-3 w-3" />
                  {{ Math.floor(selectedTemplate.standardDuration / 60) }}h
                  {{ selectedTemplate.standardDuration % 60 }}min
                </span>
                <span v-if="selectedTemplate.standardLocation" class="flex items-center gap-1">
                  <MapPin class="h-3 w-3" />
                  {{ selectedTemplate.standardLocation }}
                </span>
                <span class="flex items-center gap-1">
                  <FileText class="h-3 w-3" />
                  {{ selectedTemplate.resultForm.length }} frågor
                </span>
              </div>
            </div>
            <Badge
              :variant="
                selectedTemplate.templateType === 'Standard'
                  ? 'default'
                  : selectedTemplate.templateType === 'Samtal'
                    ? 'secondary'
                    : 'outline'
              "
            >
              {{ getTemplateTypeInfo(selectedTemplate.templateType).label }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
