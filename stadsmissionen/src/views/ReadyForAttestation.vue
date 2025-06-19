<template>
  <PageLayout
    title="Klara för attestering"
    :breadcrumbs="[
      { label: 'Hem', to: '/' },
      { label: 'Arbetsordrar', to: '/work-orders' },
      { label: 'Klara för attestering', isCurrentPage: true },
    ]"
    description="Arbetsordrar som väntar på attestering"
    :stats="attestationStats"
  >
    <template #actions>
      <Button :disabled="selectedOrders.length === 0" class="gap-2" @click="handleBulkAttestation">
        <CheckCircle class="h-4 w-4" />
        Attestera valda ({{ selectedOrders.length }})
      </Button>
    </template>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Laddar arbetsordrar för attestering...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <AlertCircle class="h-12 w-12 mx-auto mb-2" />
        <p class="text-lg font-semibold">Kunde inte ladda arbetsordrar</p>
        <p class="text-sm text-muted-foreground mt-1">
          {{ workOrdersError?.message || employeesError?.message }}
        </p>
      </div>
      <Button variant="outline" @click="refreshWorkOrders">Försök igen</Button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <DataTable
        v-model:selected="selectedOrders"
        :data="pendingAttestationOrders"
        :columns="columns"
        :search-fields="['WorkOrderNumber', 'Title', 'CustomerName', 'AssignedTo']"
        :items-per-page="20"
        :show-selection="true"
        @row-click="handleViewOrder"
      >
        <template #cell-WorkOrderNumber="{ value }">
          <span class="font-mono text-sm">{{ value }}</span>
        </template>

        <template #cell-Type="{ value }">
          <Badge :variant="getTypeVariant(value)">
            {{ getTypeText(value) }}
          </Badge>
        </template>

        <template #cell-CompletedDate="{ value }">
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
            <div>{{ row.RegisteredHours }}h registrerat</div>
            <div class="text-muted-foreground text-xs">Faktisk: {{ row.ActualHours }}h</div>
            <div class="text-muted-foreground text-xs">
              {{ (row.RegisteredHours * row.HourlyRate).toLocaleString() }} kr
            </div>
          </div>
        </template>

        <template #cell-AttestationStatus="{ value }">
          <Badge variant="secondary">
            <Clock class="h-3 w-3 mr-1" />
            Väntar
          </Badge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              title="Visa detaljer"
              class="h-8 w-8 p-0"
              @click.stop="handleViewOrder(row)"
            >
              <Eye class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Attestera"
              class="h-8 w-8 p-0"
              @click.stop="handleApproveAttestation(row)"
            >
              <CheckCircle class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Avslå"
              class="h-8 w-8 p-0"
              @click.stop="handleRejectAttestation(row)"
            >
              <XCircle class="h-4 w-4" />
            </Button>
          </div>
        </template>
      </DataTable>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  FileCheck,
  Users,
  XCircle,
} from 'lucide-vue-next';
import { useApiList } from '@/composables/useApi';
import api from '@/api';

const router = useRouter();
const selectedOrders = ref([]);

// Fetch work orders with complete relationship data using enhanced API
const {
  data: workOrdersWithRelations,
  loading: workOrdersLoading,
  error: workOrdersError,
  refresh: refreshWorkOrders,
} = useApiList(
  () =>
    api.workOrders.getAll({
      include: ['customer', 'tasks', 'assignedUsers'],
    }),
  {
    cacheKey: 'attestation-workOrders',
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

// Update loading and error states to include employees
const isLoading = computed(() => workOrdersLoading.value || employeesLoading.value);
const hasError = computed(() => workOrdersError.value !== null || employeesError.value !== null);

// Helper function to get employee name by ID
const getEmployeeName = (employeeId: number | string) => {
  if (!employees.value) return 'Laddar...';
  if (typeof employeeId === 'string') return employeeId;

  const employee = employees.value.find((emp: any) => emp.id === employeeId);
  return employee?.name || 'Okänd användare';
};

// Filter work orders that are attestable with related data already included
const pendingAttestationOrders = computed(() => {
  if (!workOrdersWithRelations.value) return [];

  return workOrdersWithRelations.value
    .filter((wo: any) => wo.Status === 'attestable')
    .map((workOrder: any) => {
      // Calculate registered hours from included tasks
      const registeredHours = (workOrder.tasks || [])
        .filter((task: any) => task.Status === 'approved')
        .reduce((total: number, task: any) => total + (task.Hours || 0), 0);

      return {
        ...workOrder,
        CustomerName: workOrder.customer?.CompanyName ?? 'Okänd kund',
        RegisteredHours: registeredHours,
      };
    });
});

// Statistics with icons
const attestationStats = computed(() => {
  if (!workOrdersWithRelations.value) {
    return [
      { title: 'Väntar attestering', value: 0, icon: Clock, color: 'yellow' },
      { title: 'Totalt värde', value: '0 kr', icon: DollarSign, color: 'green' },
      { title: 'Urgenta', value: 0, icon: AlertCircle, color: 'red' },
      { title: 'Denna vecka', value: 0, icon: Calendar, color: 'blue' },
    ];
  }

  const pendingOrders = pendingAttestationOrders.value;
  const totalValue = pendingOrders.reduce(
    (sum: number, order: any) => sum + order.ActualHours * order.HourlyRate,
    0
  );
  const urgentCount = pendingOrders.filter((order: any) => order.Priority === 'urgent').length;
  const thisWeekCount = pendingOrders.filter((order: any) => {
    if (!order.CompletedDate) return false;
    const completedDate = new Date(order.CompletedDate);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return completedDate >= weekAgo;
  }).length;

  return [
    {
      title: 'Väntar attestering',
      value: pendingOrders.length,
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Totalt värde',
      value: `${totalValue.toLocaleString()} kr`,
      icon: DollarSign,
      color: 'green',
    },
    {
      title: 'Urgenta',
      value: urgentCount,
      icon: AlertCircle,
      color: 'red',
    },
    {
      title: 'Denna vecka',
      value: thisWeekCount,
      icon: Calendar,
      color: 'blue',
    },
  ];
});

// Table columns
const columns = [
  { key: 'WorkOrderNumber', label: 'Ordernummer', sortable: true, width: '140px' },
  { key: 'Type', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'Title', label: 'Titel', sortable: true },
  { key: 'CustomerName', label: 'Kund', sortable: true },
  { key: 'AssignedTo', label: 'Ansvarig', sortable: true },
  { key: 'CompletedDate', label: 'Slutförd', sortable: true, type: 'custom' },
  { key: 'Priority', label: 'Prioritet', sortable: true, type: 'custom' },
  { key: 'Hours', label: 'Timmar (Reg/Faktisk)', sortable: false, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, width: '120px', type: 'custom' },
];

// Event handlers

const handleViewOrder = (order: any) => {
  router.push(`/work-orders/${order.WorkOrderID}`);
};

const handleApproveAttestation = async (order: any) => {
  try {
    // Get current user ID from App.vue (hardcoded as "1")
    const currentUserId = '1';

    // Update work order status to invoicable and set AttestedBy
    await api.workOrders.update(order.WorkOrderID.toString(), {
      Status: 'invoicable',
      AttestedBy: currentUserId,
    });

    // Refresh the work orders list to reflect changes
    await refreshWorkOrders();

    console.log('Successfully attested order:', order.WorkOrderNumber);
  } catch (error) {
    console.error('Failed to attest order:', error);
    // TODO: Add proper error handling/toast notification
  }
};

const handleRejectAttestation = (order: any) => {
  console.log('Reject attestation for order:', order.WorkOrderNumber);
  // TODO: Implement API call to reject attestation
};

const handleBulkAttestation = async () => {
  try {
    // Get current user ID from App.vue (hardcoded as "1")
    const currentUserId = '1';

    // Update all selected orders
    const updatePromises = selectedOrders.value.map((order: any) =>
      api.workOrders.update(order.WorkOrderID.toString(), {
        Status: 'invoicable',
        AttestedBy: currentUserId,
      })
    );

    await Promise.all(updatePromises);

    // Clear selection and refresh the list
    selectedOrders.value = [];
    await refreshWorkOrders();

    console.log('Successfully attested', updatePromises.length, 'orders');
  } catch (error) {
    console.error('Failed to bulk attest orders:', error);
    // TODO: Add proper error handling/toast notification
  }
};

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const getTypeVariant = (type: string) => {
  const variants: Record<string, string> = {
    standard: 'default',
    quick_field: 'destructive',
    service_non_billable: 'secondary',
  };
  return variants[type] || 'default';
};

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    standard: 'Standard',
    quick_field: 'Snabborder',
    service_non_billable: 'Service (ej fakturerabart)',
  };
  return texts[type] || type;
};

const getPriorityVariant = (priority: string) => {
  const variants: Record<string, string> = {
    low: 'secondary',
    medium: 'default',
    high: 'default',
    urgent: 'destructive',
  };
  return variants[priority] || 'default';
};
</script>
