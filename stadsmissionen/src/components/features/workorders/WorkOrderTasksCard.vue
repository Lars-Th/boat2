<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus } from 'lucide-vue-next';

interface Task {
  TaskID: number;
  Status: string;
  Description: string;
  Hours: number;
  StartTime: string;
  EndTime: string;
  ActivityType: string;
  CreatedDate: string;
  employee?: {
    name: string;
  };
}

interface WorkOrder {
  Status: string;
}

interface Props {
  tasks: Task[];
  workOrder?: WorkOrder;
}

interface Emits {
  (e: 'add-time-entry'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('sv-SE');
};

const getTaskStatusVariant = (status: string) => {
  switch (status) {
    case 'planning':
      return 'secondary';
    case 'active':
      return 'default';
    case 'completed':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getTaskStatusText = (status: string) => {
  switch (status) {
    case 'planning':
      return 'Planering';
    case 'active':
      return 'Aktiv';
    case 'completed':
      return 'Slutförd';
    default:
      return status;
  }
};

const addTimeEntry = () => {
  emit('add-time-entry');
};
</script>

<template>
  <div class="bg-card rounded-lg border border-border p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <Clock class="h-5 w-5" />
        Tidsregistreringar ({{ tasks.length }})
      </h3>
      <Button v-if="workOrder?.Status === 'active'" size="sm" class="gap-2" @click="addTimeEntry">
        <Plus class="h-4 w-4" />
        Registrera tid
      </Button>
    </div>

    <div v-if="tasks.length > 0" class="space-y-3">
      <div
        v-for="task in tasks"
        :key="task.TaskID"
        class="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
      >
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h4 class="font-medium">{{ task.employee?.name || 'Okänd medarbetare' }}</h4>
              <Badge :variant="getTaskStatusVariant(task.Status)">
                {{ getTaskStatusText(task.Status) }}
              </Badge>
              <span class="text-sm text-muted-foreground">{{ formatDate(task.CreatedDate) }}</span>
            </div>
            <p class="text-sm text-muted-foreground">{{ task.Description }}</p>
          </div>
          <div class="text-right">
            <div class="font-medium">{{ task.Hours }}h</div>
            <div class="text-xs text-muted-foreground">
              {{ task.StartTime }} - {{ task.EndTime }}
            </div>
          </div>
        </div>
        <div class="flex justify-between items-center text-sm">
          <span class="text-muted-foreground">{{ task.ActivityType }}</span>
          <span class="text-xs text-muted-foreground">
            Skapad: {{ formatDateTime(task.CreatedDate) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8 text-muted-foreground">
      <Clock class="h-12 w-12 mx-auto mb-2" />
      <p>Inga tidsregistreringar ännu</p>
      <Button v-if="workOrder?.Status === 'active'" class="mt-2" @click="addTimeEntry">
        Registrera första tiden
      </Button>
    </div>
  </div>
</template>
