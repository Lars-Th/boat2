<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, MapPin, Plus, Users } from 'lucide-vue-next';

const router = useRouter();

// Fetch work orders with all relations using enhanced API service
const {
  data: workOrdersWithRelations,
  loading: workOrdersLoading,
  error: workOrdersError,
} = useApiList(
  () =>
    api.workOrders.getAll({
      include: ['customer', 'createdBy', 'contact', 'tasks', 'assignedUsers'],
    }),
  {
    cacheKey: 'workOrders',
  }
);

// Fetch employees data to resolve AssignedTo IDs
const {
  data: employees,
  loading: employeesLoading,
  error: employeesError,
} = useApiList(() => api.employees.getAll(), {
  cacheKey: 'employees',
});

// Enhanced work orders with calculated data from relations - filtered for active orders only
const workOrdersWithCustomers = computed(() => {
  if (!workOrdersWithRelations.value) return [];

  return workOrdersWithRelations.value
    .filter((workOrder: any) => workOrder.Status === 'active')
    .map((workOrder: any) => {
      // Calculate registered hours from included tasks
      const registeredHours = workOrder.tasks
        ? workOrder.tasks
            .filter((task: any) => task.Status === 'approved')
            .reduce((total: number, task: any) => total + (task.Hours || 0), 0)
        : 0;

      return {
        ...workOrder,
        CustomerName:
          workOrder.customer?.CompanyName ?? workOrder.customer?.companyName ?? 'Okänd kund',
        RegisteredHours: registeredHours,
        CreatedByName: workOrder.createdByUser?.namn ?? 'Okänd användare',
      };
    });
});

// Loading state
const isLoading = computed(() => workOrdersLoading.value || employeesLoading.value);

// Error state
const hasError = computed(() => workOrdersError.value !== null || employeesError.value !== null);

// Table columns
const columns = [
  { key: 'WorkOrderNumber', label: 'Ordernummer', sortable: true, width: '140px' },
  { key: 'Type', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'Title', label: 'Titel', sortable: true },
  { key: 'CustomerName', label: 'Kund', sortable: true },
  { key: 'AssignedTo', label: 'Ansvarig', sortable: true },
  { key: 'StartDate', label: 'Startdatum', sortable: true, type: 'custom' },
  { key: 'DueDate', label: 'Förfallodatum', sortable: true, type: 'custom' },
  { key: 'Hours', label: 'Timmar (Reg/Est)', sortable: false, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, type: 'custom' },
];

// Statistics computed from enhanced work order data
const stats = computed(() => {
  if (!workOrdersWithRelations.value) {
    return [
      { title: 'Totalt', value: 0, icon: Calendar, color: 'blue' },
      { title: 'Aktiva', value: 0, icon: Users, color: 'green' },
      { title: 'Slutförda', value: 0, icon: MapPin, color: 'purple' },
      { title: 'Attesterbara', value: 0, icon: DollarSign, color: 'orange' },
    ];
  }

  const activeOrders = workOrdersWithRelations.value.filter(
    (wo: any) => wo.Status === 'active'
  ).length;
  const completedOrders = workOrdersWithRelations.value.filter(
    (wo: any) => wo.Status === 'completed'
  ).length;
  const attestableOrders = workOrdersWithRelations.value.filter(
    (wo: any) => wo.Status === 'attestable'
  ).length;

  return [
    {
      title: 'Totalt',
      value: workOrdersWithRelations.value.length,
      icon: Calendar,
      color: 'blue',
    },
    {
      title: 'Aktiva',
      value: activeOrders,
      icon: Users,
      color: 'green',
    },
    {
      title: 'Slutförda',
      value: completedOrders,
      icon: MapPin,
      color: 'purple',
    },
    {
      title: 'Attesterbara',
      value: attestableOrders,
      icon: DollarSign,
      color: 'orange',
    },
  ];
});

// Helper functions
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const getTypeVariant = (type: string) => {
  switch (type) {
    case 'standard':
      return 'default';
    case 'QuickField':
      return 'destructive';
    case 'GoodWill':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case 'standard':
      return 'Standard';
    case 'QuickField':
      return 'Snabborder';
    case 'GoodWill':
      return 'Goodwill';
    default:
      return type;
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

// Helper function to get employee name by ID
const getEmployeeName = (employeeId: number | string) => {
  if (!employees.value) return 'Laddar...';
  if (typeof employeeId === 'string') return employeeId;

  const employee = employees.value.find((emp: any) => emp.id === employeeId);
  return employee?.name || 'Okänd användare';
};

// Event handlers
const handleNewWorkOrder = () => {
  router.push('/work-orders/new');
};

const handleRowClick = (workOrder: any) => {
  router.push(`/work-orders/${workOrder.WorkOrderID}`);
};

const handleViewOrder = (workOrder: any) => {
  router.push(`/work-orders/${workOrder.WorkOrderID}`);
};

const handleEditOrder = (workOrder: any) => {
  router.push(`/work-orders/${workOrder.WorkOrderID}/edit`);
};

const handleAddTime = (workOrder: any) => {
  router.push(`/time-reporting?workOrder=${workOrder.WorkOrderID}`);
};
</script>

<template>
  <PageLayout title="Arbetsordrar" breadcrumbs="Dashboard / Arbetsordrar" show-stats :stats="stats">
    <!-- Actions with padding -->
    <div class="px-6 py-4 flex justify-end">
      <Button class="gap-2" @click="handleNewWorkOrder">
        <Plus class="h-4 w-4" />
        Ny arbetsorder
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar arbetsordrar...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av arbetsordrar</p>
        <Button
          variant="outline"
          @click="
            () => {
              /* Add refresh logic */
            }
          "
        >
          Försök igen
        </Button>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      v-else
      :data="workOrdersWithCustomers"
      :columns="columns"
      :search-fields="['WorkOrderNumber', 'Title', 'Description', 'AssignedTo', 'CustomerName']"
      @row-click="handleRowClick"
    >
      <template #cell-Type="{ value }">
        <Badge :variant="getTypeVariant(value)">
          {{ getTypeText(value) }}
        </Badge>
      </template>

      <template #cell-StartDate="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #cell-DueDate="{ value }">
        {{ value ? formatDate(value) : '-' }}
      </template>

      <template #cell-Priority="{ value }">
        <Badge :variant="getPriorityVariant(value)">
          {{ value }}
        </Badge>
      </template>

      <template #cell-AssignedTo="{ row }">
        <span v-if="row.assignedUsers && row.assignedUsers.length > 0">
          {{ row.assignedUsers[0].FirstName }} {{ row.assignedUsers[0].LastName }}
        </span>
        <span v-else-if="row.AssignedTo">
          {{ getEmployeeName(row.AssignedTo) }}
        </span>
        <span v-else class="text-muted-foreground text-xs">Ej tilldelad</span>
      </template>

      <template #cell-Hours="{ row }">
        <div class="text-sm">
          <div>{{ row.RegisteredHours || 0 }}h / {{ row.EstimatedHours }}h</div>
          <div class="text-muted-foreground text-xs">
            {{ Math.round(((row.RegisteredHours || 0) / row.EstimatedHours) * 100) }}% registrerat
          </div>
          <div class="text-muted-foreground text-xs">Faktisk: {{ row.ActualHours }}h</div>
        </div>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex">
          <Button size="sm" variant="outline" @click="handleViewOrder(row)">Visa</Button>
          <Button size="sm" variant="outline" @click="handleEditOrder(row)">Redigera</Button>
          <Button size="sm" variant="outline" @click="handleAddTime(row)">Tid</Button>
        </div>
      </template>
    </DataTable>
  </PageLayout>
</template>
