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
  Download,
  Eye,
  FileText,
  Loader2,
  Users,
} from 'lucide-vue-next';
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { WorkOrder } from '@/types';

const router = useRouter();
const selectedOrders = ref([]);

// Fetch work orders with enhanced relational data
const {
  data: workOrders,
  loading: workOrdersLoading,
  error: workOrdersError,
  refresh: refreshWorkOrders,
} = useApiList<WorkOrder>(
  () =>
    api.workOrders.getAll({
      include: ['customer', 'tasks', 'assignedUsers', 'attestedBy'],
    }),
  {
    cacheKey: 'workOrdersReadyForInvoicing',
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

// Loading and error states
const isLoading = computed(() => workOrdersLoading.value || employeesLoading.value);
const hasError = computed(() => workOrdersError.value !== null || employeesError.value !== null);

// Refresh function for error recovery
const handleRetry = async () => {
  await refreshWorkOrders();
};

// Helper function to get employee name by ID
const getEmployeeName = (employeeId: number | string) => {
  if (!employees.value) return 'Laddar...';
  if (typeof employeeId === 'string') return employeeId;

  const employee = employees.value.find((emp: any) => emp.id === employeeId);
  return employee?.name ?? 'Okänd användare';
};

// Filter work orders ready for invoicing from relational data
const approvedForInvoicingOrders = computed(() => {
  if (!workOrders.value) return [];

  // Filter orders that are invoicable
  return workOrders.value
    .filter(order => order.Status === 'invoicable')
    .map(order => ({
      ...order,
      CustomerName: order.customer?.CompanyName ?? 'Okänd kund',
    }));
});

// Statistics with icons calculated from relational data
const invoicingStats = computed(() => {
  if (!approvedForInvoicingOrders.value) {
    return [
      { title: 'Klar för fakturering', value: 0, icon: FileText, color: 'green' },
      { title: 'Totalt värde', value: '0 kr', icon: DollarSign, color: 'blue' },
      { title: 'Denna månaden', value: 0, icon: Calendar, color: 'purple' },
      { title: 'Kunder', value: 0, icon: Users, color: 'orange' },
    ];
  }

  const readyOrders = approvedForInvoicingOrders.value;

  // Calculate total value from tasks and hourly rates
  const totalValue = readyOrders.reduce((sum: number, order: any) => {
    const registeredHours = order.tasks
      ? order.tasks.reduce((hourSum: number, task: any) => hourSum + (task.Hours ?? 0), 0)
      : (order.ActualHours ?? 0);
    return sum + registeredHours * (order.HourlyRate || 0);
  }, 0);

  const thisMonthCount = readyOrders.filter((order: any) => {
    if (!order.CompletedDate) return false;
    const completedDate = new Date(order.CompletedDate);
    const now = new Date();
    return (
      completedDate.getMonth() === now.getMonth() &&
      completedDate.getFullYear() === now.getFullYear()
    );
  }).length;

  // Count unique customers from relational data
  const uniqueCustomers = new Set(
    readyOrders.map((order: any) => (order.customer ? order.customer.CustomerID : order.CustomerID))
  ).size;

  return [
    {
      title: 'Klar för fakturering',
      value: readyOrders.length,
      icon: FileText,
      color: 'green',
    },
    {
      title: 'Totalt värde',
      value: `${totalValue.toLocaleString('sv-SE')} kr`,
      icon: DollarSign,
      color: 'blue',
    },
    {
      title: 'Denna månaden',
      value: thisMonthCount,
      icon: Calendar,
      color: 'purple',
    },
    {
      title: 'Kunder',
      value: uniqueCustomers,
      icon: Users,
      color: 'orange',
    },
  ];
});

// Enhanced table columns with better data access
const columns = [
  { key: 'WorkOrderNumber', label: 'Ordernummer', sortable: true, width: '140px' },
  { key: 'Type', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'Title', label: 'Titel', sortable: true },
  { key: 'CustomerName', label: 'Kund', sortable: true, type: 'custom' },
  { key: 'AssignedTo', label: 'Ansvarig', sortable: true, type: 'custom' },
  { key: 'CompletedDate', label: 'Slutförd', sortable: true, type: 'custom' },
  { key: 'Priority', label: 'Prioritet', sortable: true, type: 'custom' },
  { key: 'AttestedBy', label: 'Attesterad av', sortable: true, type: 'custom' },
  { key: 'Hours', label: 'Timmar (Reg/Faktisk)', sortable: false, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, width: '140px', type: 'custom' },
];

// Event handlers
const handleViewOrder = (order: any) => {
  router.push(`/work-orders/${order.WorkOrderID}`);
};

const handleCreateInvoice = (order: any) => {
  console.log('Create invoice for order:', order.WorkOrderNumber);
  // TODO: Implement API call to create invoice
};

const handleDownloadReport = (order: any) => {
  console.log('Download report for order:', order.WorkOrderNumber);
  // TODO: Implement report download
};

const handleBulkInvoicing = () => {
  console.log('Create invoices for selected orders:', selectedOrders.value.length);
  // TODO: Implement bulk invoicing
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
<template>
  <PageLayout
    title="Klara för fakturering"
    :breadcrumbs="[
      { label: 'Hem', to: '/' },
      { label: 'Arbetsordrar', to: '/work-orders' },
      { label: 'Klara för fakturering', isCurrentPage: true },
    ]"
    description="Attesterade arbetsordrar klara för fakturering"
    :stats="invoicingStats"
  >
    <template #actions>
      <Button :disabled="selectedOrders.length === 0" class="gap-2" @click="handleBulkInvoicing">
        <FileText class="h-4 w-4" />
        Fakturera valda ({{ selectedOrders.length }})
      </Button>
    </template>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar arbetsordrar för fakturering...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <AlertCircle class="h-12 w-12 mx-auto mb-2" />
        <p class="text-lg font-semibold">Kunde inte ladda arbetsordrar</p>
        <p class="text-sm text-muted-foreground mt-1">{{ workOrdersError?.message }}</p>
      </div>
      <Button variant="outline" @click="handleRetry">Försök igen</Button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <DataTable
        v-model:selected="selectedOrders"
        :data="approvedForInvoicingOrders"
        :columns="columns"
        :search-fields="['WorkOrderNumber', 'Title', 'CustomerName', 'AssignedTo']"
        :items-per-page="20"
        :show-selection="true"
        @row-click="handleViewOrder"
      >
        <template #cell-WorkOrderNumber="{ value }">
          <span class="font-mono text-sm">{{ value }}</span>
        </template>

        <template #cell-Type="{ row }">
          <Badge :variant="getTypeVariant(row.Type)" class="text-xs">
            {{ getTypeText(row.Type) }}
          </Badge>
        </template>

        <template #cell-CustomerName="{ row }">
          <span>
            {{ row.customer ? row.customer.CompanyName : row.CustomerName || 'Okänd kund' }}
          </span>
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

        <template #cell-CompletedDate="{ row }">
          <span v-if="row.CompletedDate" class="text-sm">
            {{ formatDate(row.CompletedDate) }}
          </span>
          <span v-else class="text-muted-foreground text-xs">Ej slutförd</span>
        </template>

        <template #cell-Priority="{ row }">
          <Badge :variant="getPriorityVariant(row.Priority)" class="text-xs capitalize">
            {{ row.Priority || 'Medium' }}
          </Badge>
        </template>

        <template #cell-AttestedBy="{ row }">
          <span v-if="row.attestedBy" class="text-sm">
            {{ row.attestedBy.namn }}
          </span>
          <span v-else class="text-muted-foreground text-xs">-</span>
        </template>

        <template #cell-Hours="{ row }">
          <div class="text-sm">
            <div class="font-medium">
              {{
                row.timeEntries
                  ? row.timeEntries.reduce((sum, entry) => sum + (entry.Hours || 0), 0)
                  : row.ActualHours || 0
              }}h
            </div>
            <div class="text-xs text-muted-foreground">av {{ row.EstimatedHours || 0 }}h</div>
          </div>
        </template>

        <template #cell-InvoiceStatus="{ row }">
          <Badge variant="secondary" class="text-xs">
            {{
              row.InvoiceStatus === 'ready_for_invoicing' ? 'Klar för fakturering' : 'Attesterad'
            }}
          </Badge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Visa order"
              @click="handleViewOrder(row)"
            >
              <Eye class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Skapa faktura"
              @click="handleCreateInvoice(row)"
            >
              <FileText class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Ladda ner rapport"
              @click="handleDownloadReport(row)"
            >
              <Download class="h-4 w-4" />
            </Button>
          </div>
        </template>
      </DataTable>
    </div>
  </PageLayout>
</template>
