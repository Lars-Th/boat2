<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
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
import { ArrowLeft, Save } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';
import { useAuth } from '@/composables/useAuth';

// Import decomposed components
import ActivityTemplateSelector from '@/components/features/activity/ActivityTemplateSelector.vue';
import ActivityDetailsForm from '@/components/features/activity/ActivityDetailsForm.vue';
import ActivitySeriesSettings from '@/components/features/activity/ActivitySeriesSettings.vue';
import ActivityParticipantSelector from '@/components/features/activity/ActivityParticipantSelector.vue';

// Import data
import activityTemplatesData from '@/assets/data/activityTemplates.json';

const router = useRouter();
const { success, warning } = useToast();
const { getCurrentUserId } = useAuth();

// Form data
const form = ref({
  // Template selection
  templateId: '',

  // Basic info (auto-populated from template)
  namn: '',
  beskrivning: '',
  plats: '',

  // Scheduling
  startDatum: '',
  startTid: '',
  varaktighet: 60, // minutes

  // Series settings
  arSerie: false,
  serieInställningar: {
    veckodag: '',
    antalVeckor: 1,
    slutDatum: '',
  },

  // Participants
  deltagare: [] as string[],
  deltagargrupper: [] as string[],
  maxDeltagare: null as number | null,

  // Additional settings
  enhet: '',
  anteckningar: '',
});

// Available units
const enheter = [
  'Barn och unga',
  'Familjecentral',
  'Ekonomisk rådgivning',
  'Boendestöd',
  'Arbetsträning',
];

// Get selected template
const selectedTemplate = computed(() => {
  if (!form.value.templateId) return null;
  return activityTemplatesData.find(t => t.id === form.value.templateId);
});

// Get template type info
const getTemplateTypeInfo = (malltyp: string) => {
  switch (malltyp) {
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
        label: malltyp,
        description: '',
        allowsParticipants: true,
        allowsSeries: true,
      };
  }
};

// Template type info for selected template
const templateTypeInfo = computed(() => {
  if (!selectedTemplate.value) return null;
  return getTemplateTypeInfo(selectedTemplate.value.malltyp);
});

// Watch template selection and auto-populate fields
watch(
  () => form.value.templateId,
  newTemplateId => {
    if (newTemplateId && selectedTemplate.value) {
      const template = selectedTemplate.value;
      form.value.namn = template.namn;
      form.value.beskrivning = template.beskrivning;
      form.value.plats = template.standardPlats || '';
      form.value.varaktighet = template.standardVaraktighet;

      // Reset series if template doesn't support it
      if (!templateTypeInfo.value?.allowsSeries) {
        form.value.arSerie = false;
      }

      // Reset participants if template doesn't support them
      if (!templateTypeInfo.value?.allowsParticipants) {
        form.value.deltagare = [];
        form.value.deltagargrupper = [];
      }
    }
  }
);

// Validation
const isFormValid = computed(() => {
  const hasTemplate = form.value.templateId !== '';
  const hasName = form.value.namn.trim() !== '';
  const hasDate = form.value.startDatum !== '';
  const hasTime = form.value.startTid !== '';

  // Series validation
  const seriesValid =
    !form.value.arSerie ||
    (form.value.serieInställningar.veckodag !== '' &&
      form.value.serieInställningar.antalVeckor > 1);

  return hasTemplate && hasName && hasDate && hasTime && seriesValid;
});

// Handle form updates from child components
const handleTemplateUpdate = (templateId: string) => {
  form.value.templateId = templateId;
};

const handleDetailsUpdate = (updates: Partial<typeof form.value>) => {
  Object.assign(form.value, updates);
};

const handleSeriesUpdate = (arSerie: boolean) => {
  form.value.arSerie = arSerie;
};

const handleSeriesSettingsUpdate = (updates: Partial<typeof form.value.serieInställningar>) => {
  Object.assign(form.value.serieInställningar, updates);
};

const handleParticipantsUpdate = (participants: string[]) => {
  form.value.deltagare = participants;
};

const handleGroupsUpdate = (groups: string[]) => {
  form.value.deltagargrupper = groups;
};

// Save activity
const handleSave = () => {
  if (!isFormValid.value) {
    warning('Validering misslyckades', 'Vänligen fyll i alla obligatoriska fält');
    return;
  }

  if (form.value.arSerie) {
    // Create series of activities
    const activities = [];
    const startDate = new Date(form.value.startDatum);

    for (let i = 0; i < form.value.serieInställningar.antalVeckor; i++) {
      const activityDate = new Date(startDate);
      activityDate.setDate(startDate.getDate() + i * 7); // Add weeks

      const activity = {
        id: `activity-${Date.now()}-${i}`,
        templateId: form.value.templateId,
        namn: `${form.value.namn} - Vecka ${i + 1}`,
        beskrivning: form.value.beskrivning,
        plats: form.value.plats,
        datum: activityDate.toISOString().split('T')[0],
        tid: form.value.startTid,
        varaktighet: form.value.varaktighet,
        maxDeltagare: form.value.maxDeltagare,
        deltagargrupper: form.value.deltagargrupper,
        deltagare: form.value.deltagare,
        enhet: form.value.enhet,
        anteckningar: form.value.anteckningar,
        skapadDatum: new Date().toISOString(),
        skapadAv: getCurrentUserId(),
      };

      activities.push(activity);
    }

    console.log('Creating activity series:', activities);
    success('Serie skapad', `Skapade ${activities.length} aktiviteter i serien framgångsrikt`);
  } else {
    // Create single activity
    const activity = {
      id: `activity-${Date.now()}`,
      templateId: form.value.templateId,
      namn: form.value.namn,
      beskrivning: form.value.beskrivning,
      plats: form.value.plats,
      datum: form.value.startDatum,
      tid: form.value.startTid,
      varaktighet: form.value.varaktighet,
      maxDeltagare: form.value.maxDeltagare,
      deltagargrupper: form.value.deltagargrupper,
      deltagare: form.value.deltagare,
      enhet: form.value.enhet,
      anteckningar: form.value.anteckningar,
      skapadDatum: new Date().toISOString(),
      skapadAv: getCurrentUserId(),
    };

    console.log('Creating single activity:', activity);
    success('Aktivitet skapad', 'Din nya aktivitet har skapats framgångsrikt');
  }

  router.push('/activities');
};

const handleCancel = () => {
  router.push('/activities');
};
</script>

<template>
  <PageLayout title="Ny aktivitet" breadcrumbs="Dashboard / Aktiviteter / Ny aktivitet">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Template Selection Component -->
      <ActivityTemplateSelector
        :selected-template-id="form.templateId"
        @update:selected-template-id="handleTemplateUpdate"
      />

      <!-- Activity Details Component -->
      <ActivityDetailsForm
        v-if="selectedTemplate"
        :form-data="{
          namn: form.namn,
          beskrivning: form.beskrivning,
          plats: form.plats,
          startDatum: form.startDatum,
          startTid: form.startTid,
          varaktighet: form.varaktighet,
        }"
        @update:form-data="handleDetailsUpdate"
      />

      <!-- Series Settings Component -->
      <Card v-if="selectedTemplate">
        <CardContent class="pt-6">
          <ActivitySeriesSettings
            :ar-serie="form.arSerie"
            :serie-inställningar="form.serieInställningar"
            :start-datum="form.startDatum"
            :allows-series="templateTypeInfo?.allowsSeries ?? false"
            @update:ar-serie="handleSeriesUpdate"
            @update:serie-inställningar="handleSeriesSettingsUpdate"
          />
        </CardContent>
      </Card>

      <!-- Participants Component -->
      <ActivityParticipantSelector
        v-if="selectedTemplate"
        :selected-participants="form.deltagare"
        :selected-groups="form.deltagargrupper"
        :allows-participants="templateTypeInfo?.allowsParticipants ?? false"
        @update:selected-participants="handleParticipantsUpdate"
        @update:selected-groups="handleGroupsUpdate"
      />

      <!-- Additional Settings -->
      <Card v-if="selectedTemplate">
        <CardHeader>
          <CardTitle>Ytterligare inställningar</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="enhet">Enhet</Label>
              <Select v-model="form.enhet">
                <SelectTrigger>
                  <SelectValue placeholder="Välj enhet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="enhet in enheter" :key="enhet" :value="enhet">
                    {{ enhet }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="templateTypeInfo?.allowsParticipants" class="space-y-2">
              <Label for="maxDeltagare">Max antal deltagare</Label>
              <Input
                id="maxDeltagare"
                type="number"
                min="1"
                placeholder="Ingen begränsning"
                :value="form.maxDeltagare?.toString() || ''"
                @input="
                  (event: Event) => {
                    const target = event.target as HTMLInputElement;
                    form.maxDeltagare = target.value ? Number(target.value) : null;
                  }
                "
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="anteckningar">Anteckningar</Label>
            <Textarea
              id="anteckningar"
              v-model="form.anteckningar"
              placeholder="Ytterligare information eller instruktioner..."
              rows="3"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Action Buttons -->
      <div class="flex gap-4 justify-end">
        <Button variant="outline" class="gap-2" @click="handleCancel">
          <ArrowLeft class="h-4 w-4" />
          Avbryt
        </Button>
        <Button :disabled="!isFormValid" class="gap-2" @click="handleSave">
          <Save class="h-4 w-4" />
          {{
            form.arSerie
              ? `Skapa ${form.serieInställningar.antalVeckor} aktiviteter`
              : 'Skapa aktivitet'
          }}
        </Button>
      </div>
    </div>
  </PageLayout>
</template>
