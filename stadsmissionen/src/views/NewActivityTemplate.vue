<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  HelpCircle,
  Loader2,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { ActivityTemplate, ActivityType } from '@/types';

const router = useRouter();
const route = useRoute();
const { success, error, warning } = useToast();

// Fetch data using API service
const {
  data: activityTypes,
  loading: typesLoading,
  error: typesError,
  refresh: refreshTypes,
} = useApiList<ActivityType>(() => api.activityTypes.getAll(), {
  cacheKey: 'activityTypes',
});

const {
  data: activityTemplates,
  loading: templatesLoading,
  error: templatesError,
  refresh: refreshTemplates,
} = useApiList<ActivityTemplate>(() => api.activityTemplates.getAll(), {
  cacheKey: 'activityTemplates',
});

// Loading and error states
const isLoading = computed(() => typesLoading.value || templatesLoading.value);
const hasError = computed(() => typesError.value !== null || templatesError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshTypes(), refreshTemplates()]);
};

// Check if we're in edit mode
const isEditMode = computed(() => route.name === 'edit-activity-template');
const templateId = computed(() => route.params['id'] as string);

// Question interface
interface Question {
  id: string;
  fraga: string;
  typ: string;
  obligatorisk: boolean;
  skalaMin?: number;
  skalaMax?: number;
  skalaKommentar?: boolean;
  harKommentar?: boolean;
}

// Form data with proper typing
const form = ref({
  namn: '',
  beskrivning: '',
  malltyp: '',
  aktivitetstyper: [] as string[],
  standardPlats: '',
  standardVaraktighet: 60,
  resultatformular: [] as Question[],
});

// Template type options
const templateTypes = [
  {
    value: 'Standard',
    label: 'Standard',
    icon: Users,
    description: 'Aktiviteter med specifika deltagare som bjuds in',
  },
  {
    value: 'Samtal',
    label: 'Samtal',
    icon: MessageSquare,
    description: 'Individuella eller gruppsamtal med fokus på dokumentation',
  },
  {
    value: 'OppetHus',
    label: 'Öppet hus',
    icon: FileText,
    description: 'Öppna aktiviteter utan förhandsanmälan',
  },
];

// Question types
const questionTypes = [
  {
    value: 'Skala',
    label: 'Skala-fråga',
    description: 'Betygsättning från 1 till X',
  },
  {
    value: 'JaNej',
    label: 'Ja/Nej-fråga',
    description: 'Enkel ja/nej-fråga med valfri kommentar',
  },
  {
    value: 'Kommentar',
    label: 'Kommentar-fråga',
    description: 'Öppen textfråga',
  },
];

// Get selected activity types details
const selectedActivityTypes = computed(() => {
  if (!activityTypes.value) return [];
  return form.value.aktivitetstyper
    .map(id => {
      return activityTypes.value?.find(type => type.ActivityTypeID === parseInt(id));
    })
    .filter((type): type is NonNullable<typeof type> => Boolean(type));
});

// Auto-generate purpose from selected activity types
const autoPurpose = computed(() => {
  if (selectedActivityTypes.value.length === 0) return '';
  if (selectedActivityTypes.value.length === 1 && selectedActivityTypes.value[0])
    return selectedActivityTypes.value[0].Syfte;
  return `Kombinerad aktivitet: ${selectedActivityTypes.value.map(t => t.Syfte).join(', ')}`;
});

// Validation
const isFormValid = computed(() => {
  return (
    form.value.namn.trim() !== '' &&
    form.value.beskrivning.trim() !== '' &&
    form.value.malltyp !== '' &&
    form.value.aktivitetstyper.length > 0
  );
});

// Handle activity type selection
const handleActivityTypeChange = (typeId: string, checked: boolean) => {
  if (checked) {
    form.value.aktivitetstyper.push(typeId);
  } else {
    const index = form.value.aktivitetstyper.indexOf(typeId);
    if (index > -1) {
      form.value.aktivitetstyper.splice(index, 1);
    }
  }
};

// Question management
const addQuestion = () => {
  const newQuestion: Question = {
    id: `q${Date.now()}`,
    fraga: '',
    typ: 'Kommentar',
    obligatorisk: false,
  };

  // Add type-specific properties based on question type
  if (newQuestion.typ === 'Skala') {
    newQuestion.skalaMin = 1;
    newQuestion.skalaMax = 5;
    newQuestion.skalaKommentar = false;
  } else if (newQuestion.typ === 'JaNej') {
    newQuestion.harKommentar = false;
  }

  form.value.resultatformular.push(newQuestion);
};

const removeQuestion = (index: number) => {
  form.value.resultatformular.splice(index, 1);
};

const moveQuestion = (index: number, direction: 'up' | 'down') => {
  const newIndex = direction === 'up' ? index - 1 : index + 1;
  if (newIndex >= 0 && newIndex < form.value.resultatformular.length) {
    const questions = [...form.value.resultatformular];
    const temp = questions[index];
    const newItem = questions[newIndex];
    if (temp && newItem) {
      questions[index] = newItem;
      questions[newIndex] = temp;
      form.value.resultatformular = questions;
    }
  }
};

// Load existing template if in edit mode
const loadTemplate = () => {
  if (isEditMode.value && templateId.value && activityTemplates.value) {
    const existingTemplate = activityTemplates.value.find(t => t.id === templateId.value);
    if (existingTemplate) {
      form.value = {
        namn: existingTemplate.namn,
        beskrivning: existingTemplate.beskrivning,
        malltyp: existingTemplate.malltyp,
        aktivitetstyper: [...existingTemplate.aktivitetstyper],
        standardPlats: existingTemplate.standardPlats || '',
        standardVaraktighet: existingTemplate.standardVaraktighet || 60,
        resultatformular: [...existingTemplate.resultatformular],
      };
    }
  }
};

// Save template
const handleSave = () => {
  if (!isFormValid.value) {
    warning('Validering misslyckades', 'Vänligen fyll i alla obligatoriska fält');
    return;
  }

  try {
    if (isEditMode.value && templateId.value && activityTemplates.value) {
      // Update existing template
      const index = activityTemplates.value.findIndex(t => t.id === templateId.value);
      if (index > -1) {
        const existingTemplate = activityTemplates.value[index];
        (activityTemplates.value as unknown as Record<string, unknown>[])[index] = {
          ...existingTemplate,
          namn: form.value.namn,
          beskrivning: form.value.beskrivning,
          malltyp: form.value.malltyp,
          aktivitetstyper: form.value.aktivitetstyper,
          standardPlats: form.value.standardPlats,
          standardVaraktighet: form.value.standardVaraktighet,
          resultatformular: form.value.resultatformular.map(q => {
            // Ensure proper structure for each question type
            const baseQuestion = {
              id: q.id,
              fraga: q.fraga,
              typ: q.typ,
              obligatorisk: q.obligatorisk,
            };

            if (q.typ === 'Skala') {
              return {
                ...baseQuestion,
                skalaMin: q.skalaMin ?? 1,
                skalaMax: q.skalaMax ?? 5,
                skalaKommentar: q.skalaKommentar ?? false,
              };
            } else if (q.typ === 'JaNej') {
              return {
                ...baseQuestion,
                harKommentar: q.harKommentar ?? false,
              };
            } else {
              return baseQuestion;
            }
          }),
        } as Record<string, unknown>;
        console.log('Updating template:', activityTemplates.value[index]);
        success('Mall uppdaterad', 'Aktivitetsmallen har uppdaterats framgångsrikt');
      }
    } else {
      // Create new template
      const template = {
        id: `template-${Date.now()}`,
        namn: form.value.namn,
        beskrivning: form.value.beskrivning,
        malltyp: form.value.malltyp,
        aktivitetstyper: form.value.aktivitetstyper,
        standardPlats: form.value.standardPlats,
        standardVaraktighet: form.value.standardVaraktighet,
        resultatformular: form.value.resultatformular.map(q => {
          // Ensure proper structure for each question type
          const baseQuestion = {
            id: q.id,
            fraga: q.fraga,
            typ: q.typ,
            obligatorisk: q.obligatorisk,
          };

          if (q.typ === 'Skala') {
            return {
              ...baseQuestion,
              skalaMin: q.skalaMin ?? 1,
              skalaMax: q.skalaMax ?? 5,
              skalaKommentar: q.skalaKommentar ?? false,
            };
          } else if (q.typ === 'JaNej') {
            return {
              ...baseQuestion,
              harKommentar: q.harKommentar ?? false,
            };
          } else {
            return baseQuestion;
          }
        }) as unknown as Record<string, unknown>[],
        skapadDatum: new Date().toISOString(),
        skapadAv: 'current-user', // TODO: Get from auth
      };

      // Add to templates array (in a real app, this would be an API call)
      if (activityTemplates.value) {
        (activityTemplates.value as unknown as Record<string, unknown>[]).push(
          template as Record<string, unknown>
        );
      }
      console.log('Saving template:', template);
      success('Mall sparad', 'Aktivitetsmallen har skapats framgångsrikt');
    }

    router.push('/activity-templates');
  } catch (err) {
    console.error('Error saving template:', err);
    error('Sparning misslyckades', 'Ett fel uppstod när mallen skulle sparas. Försök igen.');
  }
};

const handleCancel = () => {
  router.push('/activity-templates');
};

// Add initial question
if (!isEditMode.value) {
  addQuestion();
}

// Load existing template if in edit mode
onMounted(() => {
  loadTemplate();
});

// Computed properties for dynamic content
const pageTitle = computed(() =>
  isEditMode.value ? 'Redigera aktivitetsmall' : 'Ny aktivitetsmall'
);
const pageBreadcrumbs = computed(() => {
  if (isEditMode.value && activityTemplates.value) {
    const template = activityTemplates.value.find(t => t.id === templateId.value);
    return `Dashboard / Administration / Aktivitetsmallar / ${template?.namn ?? 'Redigera'}`;
  }
  return 'Dashboard / Administration / Aktivitetsmallar / Ny mall';
});
</script>

<template>
  <PageLayout :title="pageTitle" :breadcrumbs="pageBreadcrumbs">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar aktivitetsdata...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <AlertCircle class="h-8 w-8 text-destructive mx-auto mb-4" />
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av aktivitetsdata</p>
        <Button variant="outline" @click="handleRefresh">Försök igen</Button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-6xl mx-auto space-y-6">
      <!-- Basic Information -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="h-5 w-5" />
            Grundläggande information
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="namn">Mallnamn *</Label>
              <Input id="namn" v-model="form.namn" placeholder="T.ex. Läxhjälp för barn" required />
            </div>

            <div class="space-y-2">
              <Label for="standardPlats">Standardplats</Label>
              <Input
                id="standardPlats"
                v-model="form.standardPlats"
                placeholder="T.ex. Studierum A"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="beskrivning">Beskrivning *</Label>
              <Textarea
                id="beskrivning"
                v-model="form.beskrivning"
                placeholder="Beskriv vad denna mall används för..."
                rows="3"
                required
              />
            </div>

            <div class="space-y-2">
              <Label for="standardVaraktighet">Standardvaraktighet (minuter)</Label>
              <Input
                id="standardVaraktighet"
                v-model.number="form.standardVaraktighet"
                type="number"
                min="15"
                max="480"
                placeholder="60"
              />
              <p class="text-xs text-muted-foreground">
                {{
                  Math.floor(form.standardVaraktighet / 60) > 0
                    ? `${Math.floor(form.standardVaraktighet / 60)}h `
                    : ''
                }}{{
                  form.standardVaraktighet % 60 > 0 ? `${form.standardVaraktighet % 60}min` : ''
                }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Template Type -->
      <Card>
        <CardHeader>
          <CardTitle>Malltyp *</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="type in templateTypes" :key="type.value" class="relative">
              <input
                :id="type.value"
                v-model="form.malltyp"
                :value="type.value"
                type="radio"
                class="peer sr-only"
              />
              <label
                :for="type.value"
                class="flex flex-col items-center justify-center p-4 border-2 border-muted rounded-lg cursor-pointer hover:bg-muted/50 peer-checked:border-primary peer-checked:bg-primary/5"
              >
                <component
                  :is="type.icon"
                  class="h-8 w-8 mb-2 text-muted-foreground peer-checked:text-primary"
                />
                <span class="font-medium">{{ type.label }}</span>
                <span class="text-xs text-muted-foreground text-center mt-1">
                  {{ type.description }}
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Activity Types -->
      <Card>
        <CardHeader>
          <CardTitle>Aktivitetstyper *</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="!activityTypes || activityTypes.length === 0" class="text-center py-8">
            <p class="text-muted-foreground">Inga aktivitetstyper tillgängliga</p>
          </div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="type in activityTypes"
              :key="type.ActivityTypeID"
              class="flex items-start space-x-3 p-3 border rounded-lg"
            >
              <Checkbox
                :id="type.ActivityTypeID.toString()"
                :checked="form.aktivitetstyper.includes(type.ActivityTypeID.toString())"
                @update:checked="
                  (checked: boolean) =>
                    handleActivityTypeChange(type.ActivityTypeID.toString(), checked)
                "
              />
              <div class="flex-1 min-w-0">
                <Label :for="type.ActivityTypeID.toString()" class="font-medium">
                  {{ type.Typnamn }}
                </Label>
                <p class="text-sm text-muted-foreground">
                  {{ type.Syfte }}
                </p>
                <details class="mt-1">
                  <summary class="text-xs text-blue-600 cursor-pointer">Mer info</summary>
                  <p class="text-xs text-muted-foreground mt-1">
                    {{ type.Beskrivning }}
                  </p>
                </details>
              </div>
            </div>
          </div>

          <!-- Selected types preview -->
          <div v-if="selectedActivityTypes.length > 0" class="space-y-2">
            <Label>Valda aktivitetstyper:</Label>
            <div class="flex flex-wrap gap-2">
              <Badge
                v-for="type in selectedActivityTypes"
                :key="type.ActivityTypeID"
                variant="secondary"
              >
                {{ type.Typnamn }}
              </Badge>
            </div>
            <div class="p-3 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-800">
                <strong>Automatiskt syfte:</strong>
                {{ autoPurpose }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Result Form Builder -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center justify-between">
            <span>Resultatformulär</span>
            <Button variant="outline" size="sm" class="gap-2" @click="addQuestion">
              <Plus class="h-4 w-4" />
              Lägg till fråga
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            v-if="form.resultatformular.length === 0"
            class="text-center py-8 text-muted-foreground"
          >
            <HelpCircle class="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Inga frågor har lagts till än</p>
            <p class="text-sm">Klicka på "Lägg till fråga" för att börja</p>
          </div>

          <div
            v-for="(question, index) in form.resultatformular"
            :key="question.id"
            class="border rounded-lg p-4 space-y-4"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium">Fråga {{ index + 1 }}</span>
              <div class="flex gap-2">
                <Button
                  :disabled="index === 0"
                  variant="ghost"
                  size="sm"
                  @click="moveQuestion(index, 'up')"
                >
                  ↑
                </Button>
                <Button
                  :disabled="index === form.resultatformular.length - 1"
                  variant="ghost"
                  size="sm"
                  @click="moveQuestion(index, 'down')"
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-red-600 hover:text-red-700"
                  @click="removeQuestion(index)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>Frågetext *</Label>
                <Input v-model="question.fraga" placeholder="Skriv din fråga här..." required />
              </div>

              <div class="space-y-2">
                <Label>Frågetyp</Label>
                <Select v-model="question.typ">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="type in questionTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- Scale question options -->
            <div v-if="question.typ === 'Skala'" class="space-y-4 p-3 bg-muted/50 rounded">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-2">
                  <Label>Minimum (dåligt)</Label>
                  <Input
                    :model-value="question.skalaMin?.toString() ?? ''"
                    type="number"
                    min="1"
                    max="10"
                    @update:model-value="
                      (value: string | number) => {
                        const numValue = value ? Number(value) : 1;
                        question.skalaMin = numValue;
                      }
                    "
                  />
                </div>
                <div class="space-y-2">
                  <Label>Maximum (bra)</Label>
                  <Input
                    :model-value="question.skalaMax?.toString() ?? ''"
                    type="number"
                    :min="(question.skalaMin || 1) + 1"
                    max="10"
                    @update:model-value="
                      (value: string | number) => {
                        const numValue = value ? Number(value) : (question.skalaMin || 1) + 1;
                        question.skalaMax = numValue;
                      }
                    "
                  />
                </div>
                <div class="flex items-center space-x-2 pt-6">
                  <Switch v-model:checked="question.skalaKommentar" />
                  <Label>Kommentarsfält</Label>
                </div>
              </div>
            </div>

            <!-- Yes/No question options -->
            <div v-if="question.typ === 'JaNej'" class="space-y-4 p-3 bg-muted/50 rounded">
              <div class="flex items-center space-x-2">
                <Switch v-model:checked="question.harKommentar" />
                <Label>Inkludera kommentarsfält</Label>
              </div>
            </div>

            <!-- Required toggle -->
            <div class="flex items-center space-x-2">
              <Switch v-model:checked="question.obligatorisk" />
              <Label>Obligatorisk fråga</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div class="flex gap-4 justify-end">
        <Button variant="outline" class="gap-2" @click="handleCancel">
          <ArrowLeft class="h-4 w-4" />
          Avbryt
        </Button>
        <Button :disabled="!isFormValid" class="gap-2" @click="handleSave">
          <Save class="h-4 w-4" />
          Spara mall
        </Button>
      </div>
    </div>
  </PageLayout>
</template>
