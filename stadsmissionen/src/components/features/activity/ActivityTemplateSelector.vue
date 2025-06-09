<script setup lang="ts">
import { computed } from "vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, MapPin } from "lucide-vue-next";

// Import data
import activityTemplatesData from "@/assets/data/activityTemplates.json";

interface Props {
  selectedTemplateId: string;
}

interface Emits {
  (e: 'update:selectedTemplateId', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Get selected template
const selectedTemplate = computed(() => {
  if (!props.selectedTemplateId) return null;
  return activityTemplatesData.find((t) => t.id === props.selectedTemplateId);
});

// Get template type info
const getTemplateTypeInfo = (malltyp: string) => {
  switch (malltyp) {
    case "Standard":
      return {
        label: "Standard",
        description: "Aktivitet med specifika deltagare som bjuds in",
        allowsParticipants: true,
        allowsSeries: true,
      };
    case "Samtal":
      return {
        label: "Samtal",
        description: "Individuellt eller gruppsamtal med dokumentation",
        allowsParticipants: true,
        allowsSeries: false,
      };
    case "OppetHus":
      return {
        label: "Öppet hus",
        description: "Öppen aktivitet utan förhandsanmälan",
        allowsParticipants: false,
        allowsSeries: true,
      };
    default:
      return {
        label: malltyp,
        description: "",
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
      <div class="space-y-2">
        <Label for="template">Aktivitetsmall *</Label>
        <Select 
          :model-value="selectedTemplateId" 
          @update:model-value="(value) => handleTemplateChange(value as string)"
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj en aktivitetsmall..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="template in activityTemplatesData"
              :key="template.id"
              :value="template.id"
            >
              <div class="flex items-center gap-2">
                <Badge
                  :variant="
                    template.malltyp === 'Standard'
                      ? 'default'
                      : template.malltyp === 'Samtal'
                        ? 'secondary'
                        : 'outline'
                  "
                  class="text-xs"
                >
                  {{ getTemplateTypeInfo(template.malltyp).label }}
                </Badge>
                <span>{{ template.namn }}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Template info -->
      <div
        v-if="selectedTemplate"
        class="p-4 bg-muted/50 rounded-lg"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1">
            <h4 class="font-medium">
              {{ selectedTemplate.namn }}
            </h4>
            <p class="text-sm text-muted-foreground mt-1">
              {{ selectedTemplate.beskrivning }}
            </p>
            <div
              class="flex items-center gap-4 mt-2 text-xs text-muted-foreground"
            >
              <span class="flex items-center gap-1">
                <Clock class="h-3 w-3" />
                {{ Math.floor(selectedTemplate.standardVaraktighet / 60) }}h
                {{ selectedTemplate.standardVaraktighet % 60 }}min
              </span>
              <span
                v-if="selectedTemplate.standardPlats"
                class="flex items-center gap-1"
              >
                <MapPin class="h-3 w-3" />
                {{ selectedTemplate.standardPlats }}
              </span>
              <span class="flex items-center gap-1">
                <FileText class="h-3 w-3" />
                {{ selectedTemplate.resultatformular.length }} frågor
              </span>
            </div>
          </div>
          <Badge
            :variant="
              selectedTemplate.malltyp === 'Standard'
                ? 'default'
                : selectedTemplate.malltyp === 'Samtal'
                  ? 'secondary'
                  : 'outline'
            "
          >
            {{ getTemplateTypeInfo(selectedTemplate.malltyp).label }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template> 