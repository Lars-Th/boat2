<script setup lang="ts">
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-vue-next';

interface AssignedEmployee {
  name: string;
  initials: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  weeklyCapacity: number;
  skills?: string[];
}

interface WorkOrder {
  AssignedTo?: string;
}

interface Props {
  assignedEmployee?: AssignedEmployee;
  workOrder?: WorkOrder;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="bg-card rounded-lg border border-border p-6">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <Users class="h-5 w-5" />
        Tilldelad person
      </h3>
    </div>
    <div v-if="assignedEmployee" class="border border-border rounded-lg p-4">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <span class="text-primary font-semibold">{{ assignedEmployee.initials }}</span>
        </div>
        <div class="flex-1">
          <h4 class="font-medium text-lg">{{ assignedEmployee.name }}</h4>
          <p class="text-sm text-muted-foreground">{{ assignedEmployee.role }}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground block mb-1">E-post:</span>
          <a :href="`mailto:${assignedEmployee.email}`" class="text-primary hover:underline">
            {{ assignedEmployee.email }}
          </a>
        </div>
        <div>
          <span class="text-muted-foreground block mb-1">Telefon:</span>
          <a :href="`tel:${assignedEmployee.phone}`" class="text-primary hover:underline">
            {{ assignedEmployee.phone }}
          </a>
        </div>
        <div>
          <span class="text-muted-foreground block mb-1">Avdelning:</span>
          <span>{{ assignedEmployee.department }}</span>
        </div>
        <div>
          <span class="text-muted-foreground block mb-1">Kapacitet:</span>
          <span>{{ assignedEmployee.weeklyCapacity }}h/vecka</span>
        </div>
      </div>
      <div v-if="assignedEmployee.skills && assignedEmployee.skills.length > 0" class="mt-4">
        <span class="text-muted-foreground block mb-2">Kompetenser:</span>
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="skill in assignedEmployee.skills"
            :key="skill"
            variant="secondary"
            class="text-xs"
          >
            {{ skill }}
          </Badge>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-8 text-muted-foreground">
      <Users class="h-12 w-12 mx-auto mb-2" />
      <p>Ingen person tilldelad</p>
      <p class="text-sm mt-1">{{ workOrder?.AssignedTo ?? 'Ej specificerat' }}</p>
    </div>
  </div>
</template>
