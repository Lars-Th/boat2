<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, Navigation } from 'lucide-vue-next';

interface Location {
  Address: string;
  PostalCode: string;
  City: string;
  Country: string;
  Coordinates?: {
    lat: number;
    lng: number;
  };
}

interface WorkOrder {
  Location: Location;
}

interface Props {
  workOrder?: WorkOrder;
}

interface Emits {
  (e: 'open-in-maps'): void;
  (e: 'plan-route'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const openInMaps = () => {
  emit('open-in-maps');
};

const planRoute = () => {
  emit('plan-route');
};
</script>

<template>
  <div class="bg-card rounded-lg border border-border p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <MapPin class="h-5 w-5" />
      Plats & Karta
    </h3>
    <div v-if="workOrder?.Location" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-3">
        <div>
          <span class="text-muted-foreground block">Adress:</span>
          <span class="font-medium">{{ workOrder.Location.Address }}</span>
        </div>
        <div>
          <span class="text-muted-foreground block">Postnummer & Ort:</span>
          <span>{{ workOrder.Location.PostalCode }} {{ workOrder.Location.City }}</span>
        </div>
        <div>
          <span class="text-muted-foreground block">Land:</span>
          <span>{{ workOrder.Location.Country }}</span>
        </div>
        <div v-if="workOrder.Location.Coordinates">
          <span class="text-muted-foreground block">Koordinater:</span>
          <span class="font-mono text-sm">
            {{ workOrder.Location.Coordinates.lat }}, {{ workOrder.Location.Coordinates.lng }}
          </span>
        </div>
        <div class="flex gap-2 mt-4">
          <Button variant="outline" size="sm" class="gap-2" @click="openInMaps">
            <ExternalLink class="h-4 w-4" />
            Öppna i kartor
          </Button>
          <Button variant="outline" size="sm" class="gap-2" @click="planRoute">
            <Navigation class="h-4 w-4" />
            Planera rutt
          </Button>
        </div>
      </div>
      <div class="bg-muted rounded-lg p-4 flex items-center justify-center min-h-[200px]">
        <div class="text-center text-muted-foreground">
          <MapPin class="h-12 w-12 mx-auto mb-2" />
          <p>Kartvy kommer här</p>
          <p class="text-sm">Integration med kartleverantör</p>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-8 text-muted-foreground">
      <MapPin class="h-12 w-12 mx-auto mb-2" />
      <p>Ingen platsinformation tillgänglig</p>
    </div>
  </div>
</template>
