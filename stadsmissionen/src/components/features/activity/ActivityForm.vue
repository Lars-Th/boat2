<script setup lang="ts">
import { computed, watch } from 'vue';
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
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, FileText, Users } from 'lucide-vue-next';
import { useValidation } from '@/composables/useValidation';
import { activityValidationSchema } from '@/schemas/validationSchemas';

interface ActivityFormData {
  templateId: string;
  namn: string;
  beskrivning: string;
  plats: string;
  startDatum: string;
  startTid: string;
  varaktighet: number;
  arSerie: boolean;
  serieInställningar: {
    veckodag: string;
    antalVeckor: number;
    slutDatum: string;
  };
  deltagare: string[];
  deltagargrupper: string[];
  maxDeltagare: number | null;
  enhet: string;
  anteckningar: string;
}

interface Props {
  modelValue: ActivityFormData;
  templates: Array<{ id: number; name: string; description: string; templateType: string }>;
  enheter: string[];
  participantGroups: Array<{ id: string; namn: string }>;
  participants: Array<{ id: string; namn: string }>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: ActivityFormData];
  'template-change': [templateId: string];
}>();

const { validateWithSchema, hasError, getError, touchField } = useValidation();

const formData = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
});

const weekdays = [
  { value: 'måndag', label: 'Måndag' },
  { value: 'tisdag', label: 'Tisdag' },
  { value: 'onsdag', label: 'Onsdag' },
  { value: 'torsdag', label: 'Torsdag' },
  { value: 'fredag', label: 'Fredag' },
  { value: 'lördag', label: 'Lördag' },
  { value: 'söndag', label: 'Söndag' },
];

const selectedTemplate = computed(() => {
  if (!formData.value.templateId) return null;
  return props.templates.find(t => t.id === formData.value.templateId);
});

const updateField = (field: keyof ActivityFormData, value: unknown) => {
  const updated = { ...formData.value, [field]: value };
  emit('update:modelValue', updated);
  touchField(field);
};

const updateNestedField = (parentField: string, childField: string, value: unknown) => {
  const updated = {
    ...formData.value,
    [parentField]: {
      ...(formData.value[parentField as keyof ActivityFormData] as Record<string, unknown>),
      [childField]: value,
    },
  };
  emit('update:modelValue', updated);
  touchField(`${parentField}.${childField}`);
};

// Watch for template changes
watch(
  () => formData.value.templateId,
  newTemplateId => {
    if (newTemplateId) {
      emit('template-change', newTemplateId);
    }
  }
);

// Calculate series end date
watch(
  [() => formData.value.startDatum, () => formData.value.serieInställningar.antalVeckor],
  () => {
    if (formData.value.startDatum && formData.value.serieInställningar.antalVeckor > 1) {
      const startDate = new Date(formData.value.startDatum);
      const endDate = new Date(startDate);
      endDate.setDate(
        startDate.getDate() + (formData.value.serieInställningar.antalVeckor - 1) * 7
      );
      const endDateString = endDate.toISOString().split('T')[0];
      if (endDateString) {
        updateNestedField('serieInställningar', 'slutDatum', endDateString);
      }
    }
  }
);

const validateForm = (): boolean => {
  try {
    // Use validateWithSchema which returns boolean
    const validationResult = validateWithSchema(
      formData.value as unknown as Record<string, unknown>,
      activityValidationSchema
    );
    return validationResult;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    console.error('Validation error:', errorMessage);
    return false;
  }
};

defineExpose({
  validateForm,
});
</script>

<template>
  <div class="space-y-6">
    <!-- Template Selection -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Calendar class="h-5 w-5" />
          Välj mall
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="space-y-2">
          <Label for="template">Aktivitetsmall</Label>
          <Select
            :model-value="formData.templateId"
            @update:model-value="value => updateField('templateId', value)"
          >
            <SelectTrigger>
              <SelectValue placeholder="Välj en mall..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="template in templates" :key="template.id" :value="template.id">
                {{ template.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="selectedTemplate" class="mt-4 p-3 bg-muted rounded-md">
          <p class="text-sm text-muted-foreground">{{ selectedTemplate.description }}</p>
        </div>
      </CardContent>
    </Card>

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
            <Label for="namn">Aktivitetsnamn *</Label>
            <Input
              id="namn"
              :model-value="formData.namn"
              :class="{ 'border-red-500': hasError('namn') }"
              placeholder="Ange aktivitetsnamn"
              @update:model-value="value => updateField('namn', value)"
            />
            <p v-if="hasError('namn')" class="text-sm text-red-500">
              {{ getError('namn') }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="enhet">Enhet *</Label>
            <Select
              :model-value="formData.enhet"
              @update:model-value="value => updateField('enhet', value)"
            >
              <SelectTrigger :class="{ 'border-red-500': hasError('enhet') }">
                <SelectValue placeholder="Välj enhet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="enhet in enheter" :key="enhet" :value="enhet">
                  {{ enhet }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="hasError('enhet')" class="text-sm text-red-500">
              {{ getError('enhet') }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="beskrivning">Beskrivning</Label>
          <Textarea
            id="beskrivning"
            :model-value="formData.beskrivning"
            placeholder="Beskriv aktiviteten..."
            rows="3"
            @update:model-value="value => updateField('beskrivning', value)"
          />
        </div>

        <div class="space-y-2">
          <Label for="plats">Plats</Label>
          <Input
            id="plats"
            :model-value="formData.plats"
            placeholder="Ange plats"
            @update:model-value="value => updateField('plats', value)"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Scheduling -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Clock class="h-5 w-5" />
          Schemaläggning
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <Label for="startDatum">Startdatum *</Label>
            <Input
              id="startDatum"
              type="date"
              :model-value="formData.startDatum"
              :class="{ 'border-red-500': hasError('startDatum') }"
              @update:model-value="value => updateField('startDatum', value)"
            />
            <p v-if="hasError('startDatum')" class="text-sm text-red-500">
              {{ getError('startDatum') }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="startTid">Starttid *</Label>
            <Input
              id="startTid"
              type="time"
              :model-value="formData.startTid"
              :class="{ 'border-red-500': hasError('startTid') }"
              @update:model-value="value => updateField('startTid', value)"
            />
            <p v-if="hasError('startTid')" class="text-sm text-red-500">
              {{ getError('startTid') }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="varaktighet">Varaktighet (minuter) *</Label>
            <Input
              id="varaktighet"
              type="number"
              :model-value="formData.varaktighet"
              :class="{ 'border-red-500': hasError('varaktighet') }"
              min="1"
              max="1440"
              @update:model-value="value => updateField('varaktighet', Number(value))"
            />
            <p v-if="hasError('varaktighet')" class="text-sm text-red-500">
              {{ getError('varaktighet') }}
            </p>
          </div>
        </div>

        <!-- Series Settings -->
        <div class="space-y-4">
          <div class="flex items-center space-x-2">
            <Switch
              :checked="formData.arSerie"
              @update:checked="(value: boolean) => updateField('arSerie', value)"
            />
            <Label>Skapa som serie</Label>
          </div>

          <div
            v-if="formData.arSerie"
            class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-md"
          >
            <div class="space-y-2">
              <Label for="veckodag">Veckodag</Label>
              <Select
                :model-value="formData.serieInställningar.veckodag"
                @update:model-value="
                  value => updateNestedField('serieInställningar', 'veckodag', value)
                "
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj veckodag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="day in weekdays" :key="day.value" :value="day.value">
                    {{ day.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="antalVeckor">Antal veckor</Label>
              <Input
                id="antalVeckor"
                type="number"
                :model-value="formData.serieInställningar.antalVeckor"
                min="1"
                max="52"
                @update:model-value="
                  value => updateNestedField('serieInställningar', 'antalVeckor', Number(value))
                "
              />
            </div>

            <div class="space-y-2">
              <Label for="slutDatum">Slutdatum</Label>
              <Input
                id="slutDatum"
                type="date"
                :model-value="formData.serieInställningar.slutDatum"
                readonly
                class="bg-muted"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Additional Settings -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Users class="h-5 w-5" />
          Övriga inställningar
        </CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="maxDeltagare">Max antal deltagare</Label>
          <Input
            id="maxDeltagare"
            type="number"
            :model-value="formData.maxDeltagare ?? undefined"
            placeholder="Ingen begränsning"
            min="1"
            @update:model-value="value => updateField('maxDeltagare', value ? Number(value) : null)"
          />
        </div>

        <div class="space-y-2">
          <Label for="anteckningar">Anteckningar</Label>
          <Textarea
            id="anteckningar"
            :model-value="formData.anteckningar"
            placeholder="Övriga anteckningar..."
            rows="3"
            @update:model-value="value => updateField('anteckningar', value)"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
