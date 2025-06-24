<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-vue-next';

interface Props {
  workOrder?: {
    WorkOrderNumber: string;
    Type: string;
    Status: string;
    Priority: string;
  };
  assignedEmployee?: {
    name: string;
  };
}

const props = defineProps<Props>();

// Badge variants
const getTypeVariant = (type: string) => {
  switch (type) {
    case 'standard':
      return 'default';
    case 'quick_field':
      return 'destructive';
    case 'service_non_billable':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case 'standard':
      return 'Standard';
    case 'quick_field':
      return 'Snabborder';
    case 'service_non_billable':
      return 'Service/Övrigt';
    default:
      return type;
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'planning':
      return 'secondary';
    case 'active':
      return 'default';
    case 'completed':
      return 'outline';
    case 'on_hold':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'planning':
      return 'Planering';
    case 'active':
      return 'Aktiv';
    case 'completed':
      return 'Slutförd';
    case 'on_hold':
      return 'Pausad';
    default:
      return status;
  }
};

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Akut';
    case 'high':
      return 'Hög';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Låg';
    default:
      return priority;
  }
};
</script>

<template>
  <div class="bg-card rounded-lg border border-border p-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
      <Info class="h-5 w-5" />
      Grundinformation
    </h3>
    <div v-if="workOrder" class="space-y-3">
      <div class="flex justify-between">
        <span class="text-muted-foreground">Ordernummer:</span>
        <span class="font-mono">{{ workOrder.WorkOrderNumber }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Typ:</span>
        <Badge :variant="getTypeVariant(workOrder.Type)">
          {{ getTypeText(workOrder.Type) }}
        </Badge>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Status:</span>
        <Badge :variant="getStatusVariant(workOrder.Status)">
          {{ getStatusText(workOrder.Status) }}
        </Badge>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Prioritet:</span>
        <Badge :variant="getPriorityVariant(workOrder.Priority)">
          {{ getPriorityText(workOrder.Priority) }}
        </Badge>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">Ansvarig:</span>
        <span class="font-medium">{{ assignedEmployee?.name ?? 'Ej tilldelad' }}</span>
      </div>
    </div>
    <div v-else class="text-center py-4 text-muted-foreground">
      <Info class="h-8 w-8 mx-auto mb-2" />
      <p>Ingen information tillgänglig</p>
    </div>
  </div>
</template>
