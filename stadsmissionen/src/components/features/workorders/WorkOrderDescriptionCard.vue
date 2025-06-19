<script setup lang="ts">
import { FileText } from 'lucide-vue-next';

interface WorkOrder {
  Description?: string;
  Notes?: string;
}

interface Props {
  workOrder?: WorkOrder;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="bg-card rounded-lg border border-border p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <FileText class="h-5 w-5" />
      Beskrivning
    </h3>
    <div v-if="workOrder">
      <p class="text-muted-foreground">
        {{ workOrder.Description || 'Ingen beskrivning tillgänglig' }}
      </p>
      <div v-if="workOrder.Notes" class="mt-4 pt-4 border-t border-border">
        <h4 class="font-medium mb-2">Anteckningar:</h4>
        <p class="text-muted-foreground">{{ workOrder.Notes }}</p>
      </div>
    </div>
    <div v-else class="text-center py-4 text-muted-foreground">
      <FileText class="h-8 w-8 mx-auto mb-2" />
      <p>Ingen beskrivning tillgänglig</p>
    </div>
  </div>
</template>
