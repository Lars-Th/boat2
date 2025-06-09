<script setup lang="ts">
import { computed } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-vue-next";

interface ActivityFormData {
  namn: string;
  beskrivning: string;
  plats: string;
  startDatum: string;
  startTid: string;
  varaktighet: number;
}

interface Props {
  formData: ActivityFormData;
}

interface Emits {
  (e: 'update:formData', value: Partial<ActivityFormData>): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Duration helpers
const durationHours = computed({
  get: () => Math.floor(props.formData.varaktighet / 60),
  set: (value) => {
    const newDuration = value * 60 + (props.formData.varaktighet % 60);
    emit('update:formData', { varaktighet: newDuration });
  },
});

const durationMinutes = computed({
  get: () => props.formData.varaktighet % 60,
  set: (value) => {
    const newDuration = Math.floor(props.formData.varaktighet / 60) * 60 + value;
    emit('update:formData', { varaktighet: newDuration });
  },
});

const updateField = (field: keyof ActivityFormData, value: string | number) => {
  emit('update:formData', { [field]: value });
};
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Calendar class="h-5 w-5" />
        Aktivitetsdetaljer
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="namn">Aktivitetsnamn *</Label>
          <Input
            id="namn"
            :model-value="formData.namn"
            placeholder="T.ex. Läxhjälp för barn"
            required
            @update:model-value="(value) => updateField('namn', value)"
          />
        </div>

        <div class="space-y-2">
          <Label for="plats">Plats</Label>
          <Input
            id="plats"
            :model-value="formData.plats"
            placeholder="T.ex. Studierum A"
            @update:model-value="(value) => updateField('plats', value)"
          />
        </div>
      </div>

      <div class="space-y-2">
        <Label for="beskrivning">Beskrivning</Label>
        <Textarea
          id="beskrivning"
          :model-value="formData.beskrivning"
          placeholder="Beskriv aktiviteten..."
          rows="3"
          @update:model-value="(value) => updateField('beskrivning', value)"
        />
      </div>

      <!-- Date and Time -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="space-y-2">
          <Label for="startDatum">Datum *</Label>
          <Input
            id="startDatum"
            :model-value="formData.startDatum"
            type="date"
            required
            @update:model-value="(value) => updateField('startDatum', value)"
          />
        </div>

        <div class="space-y-2">
          <Label for="startTid">Tid *</Label>
          <Input
            id="startTid"
            :model-value="formData.startTid"
            type="time"
            required
            @update:model-value="(value) => updateField('startTid', value)"
          />
        </div>

        <div class="space-y-2">
          <Label>Varaktighet</Label>
          <div class="flex gap-2 items-center">
            <div class="flex items-center gap-1">
              <Input
                v-model.number="durationHours"
                type="number"
                min="0"
                max="23"
                class="w-16"
              />
              <span class="text-sm text-muted-foreground">h</span>
            </div>
            <div class="flex items-center gap-1">
              <Input
                v-model.number="durationMinutes"
                type="number"
                min="0"
                max="59"
                step="15"
                class="w-16"
              />
              <span class="text-sm text-muted-foreground">min</span>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template> 