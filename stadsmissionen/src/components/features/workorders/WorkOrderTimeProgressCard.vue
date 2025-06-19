<script setup lang="ts">
import { Clock } from 'lucide-vue-next';

interface WorkOrder {
  CreatedDate: string;
  StartDate: string;
  DueDate: string;
  CompletedDate?: string;
  EstimatedHours: number;
  ActualHours: number;
  IsBillable?: boolean;
  HourlyRate?: number;
}

interface User {
  namn: string;
}

interface Props {
  workOrder?: WorkOrder;
  createdByUser?: User;
  registeredHours: number;
}

const props = defineProps<Props>();

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sv-SE');
};
</script>

<template>
  <div class="bg-card rounded-lg border border-border p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <Clock class="h-5 w-5" />
      Tid & Framsteg
    </h3>
    <div v-if="workOrder" class="space-y-3">
      <div class="flex justify-between">
        <span class="text-muted-foreground">Skapad:</span>
        <span>{{ formatDate(workOrder.CreatedDate) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Skapad av:</span>
        <span>{{ createdByUser?.namn || 'Okänd användare' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Startdatum:</span>
        <span>{{ formatDate(workOrder.StartDate) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Förfallodatum:</span>
        <span>{{ formatDate(workOrder.DueDate) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Slutförd:</span>
        <span>
          {{ workOrder.CompletedDate ? formatDate(workOrder.CompletedDate) : 'Ej slutförd' }}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Estimerade timmar:</span>
        <span>{{ workOrder.EstimatedHours }}h</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Faktiska timmar:</span>
        <span class="font-medium">{{ workOrder.ActualHours }}h</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Registrerat:</span>
        <span class="font-medium text-blue-600">{{ registeredHours }}h</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Framsteg:</span>
        <span class="font-medium">
          {{ Math.round((workOrder.ActualHours / workOrder.EstimatedHours) * 100) }}%
        </span>
      </div>
      <div v-if="workOrder.IsBillable" class="flex justify-between">
        <span class="text-muted-foreground">Timtaxa:</span>
        <span class="font-medium">{{ workOrder.HourlyRate }} kr/h</span>
      </div>
      <div v-if="workOrder.IsBillable" class="flex justify-between">
        <span class="text-muted-foreground">Totalt värde:</span>
        <span class="font-medium text-green-600">
          {{ ((workOrder.ActualHours || 0) * (workOrder.HourlyRate || 0)).toLocaleString('sv-SE') }}
          kr
        </span>
      </div>
    </div>
    <div v-else class="text-center py-4 text-muted-foreground">
      <Clock class="h-8 w-8 mx-auto mb-2" />
      <p>Ingen tidsinformation tillgänglig</p>
    </div>
  </div>
</template>
