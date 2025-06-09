<script setup lang="ts">
import { watch } from 'vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Repeat } from 'lucide-vue-next';

interface SerieSettings {
  veckodag: string;
  antalVeckor: number;
  slutDatum: string;
}

interface Props {
  arSerie: boolean;
  serieInställningar: SerieSettings;
  startDatum: string;
  allowsSeries: boolean;
}

interface Emits {
  (e: 'update:arSerie', value: boolean): void;
  (e: 'update:serieInställningar', value: Partial<SerieSettings>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Available weekdays for series
const weekdays = [
  { value: 'måndag', label: 'Måndag' },
  { value: 'tisdag', label: 'Tisdag' },
  { value: 'onsdag', label: 'Onsdag' },
  { value: 'torsdag', label: 'Torsdag' },
  { value: 'fredag', label: 'Fredag' },
  { value: 'lördag', label: 'Lördag' },
  { value: 'söndag', label: 'Söndag' },
];

// Calculate series end date
watch([() => props.startDatum, () => props.serieInställningar.antalVeckor], () => {
  if (props.startDatum && props.serieInställningar.antalVeckor > 1) {
    const startDate = new Date(props.startDatum);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + (props.serieInställningar.antalVeckor - 1) * 7);
    const endDateString = endDate.toISOString().split('T')[0];
    if (endDateString) {
      emit('update:serieInställningar', { slutDatum: endDateString });
    }
  }
});

const updateSerieField = (field: keyof SerieSettings, value: string | number) => {
  emit('update:serieInställningar', { [field]: value });
};

const handleSerieToggle = (checked: boolean) => {
  emit('update:arSerie', checked);
};
</script>

<template>
  <div v-if="allowsSeries" class="space-y-4">
    <Separator />
    <div class="flex items-center space-x-2">
      <Switch id="arSerie" :checked="arSerie" @update:checked="handleSerieToggle" />
      <Label for="arSerie" class="flex items-center gap-2">
        <Repeat class="h-4 w-4" />
        Skapa som serie (återkommande aktivitet)
      </Label>
    </div>

    <div v-if="arSerie" class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
      <div class="space-y-2">
        <Label for="veckodag">Veckodag *</Label>
        <Select
          :model-value="serieInställningar.veckodag"
          @update:model-value="value => updateSerieField('veckodag', value as string)"
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
        <Label for="antalVeckor">Antal veckor *</Label>
        <Input
          id="antalVeckor"
          :model-value="serieInställningar.antalVeckor.toString()"
          type="number"
          min="2"
          max="52"
          placeholder="T.ex. 8"
          @update:model-value="value => updateSerieField('antalVeckor', Number(value))"
        />
      </div>

      <div class="space-y-2">
        <Label for="slutDatum">Slutdatum</Label>
        <Input
          id="slutDatum"
          :model-value="serieInställningar.slutDatum"
          type="date"
          readonly
          class="bg-muted"
        />
      </div>

      <div class="col-span-full">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle class="h-4 w-4" />
          <span>
            Detta kommer skapa
            {{ serieInställningar.antalVeckor }} aktiviteter, en per
            {{ serieInställningar.veckodag || 'vecka' }} från
            {{ startDatum || 'startdatum' }}
            {{ serieInställningar.slutDatum ? ` till ${serieInställningar.slutDatum}` : '' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
