<template>
  <PageLayout
    title="Slutförda arbetsordrar"
    :breadcrumbs="[
      { label: 'Hem', to: '/' },
      { label: 'Rapporter', to: '/reports' },
      { label: 'Slutförda arbetsordrar', isCurrentPage: true },
    ]"
    description="Översikt över alla slutförda arbetsordrar"
    :stats="completedOrderStats"
  >
    <template #actions>
      <Button class="gap-2" @click="handleExportReport">
        <Download class="h-4 w-4" />
        Exportera rapport
      </Button>
    </template>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <Loader2 class="h-8 w-8 animate-spin mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar slutförda arbetsordrar...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <AlertCircle class="h-12 w-12 mx-auto mb-2" />
        <p class="text-lg font-semibold">Kunde inte ladda arbetsordrar</p>
        <p class="text-sm text-muted-foreground mt-1">{{ workOrdersError?.message }}</p>
      </div>
      <Button variant="outline" @click="handleRefresh">Försök igen</Button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <DataTable
        v-model:selected="selectedOrders"
        :data="completedWorkOrders"
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

        <template #cell-Value="{ row }">
          <div class="text-sm">
            <div class="font-medium">{{ calculateOrderValue(row).toLocaleString('sv-SE') }} kr</div>
            <div class="text-xs text-muted-foreground">{{ row.HourlyRate || 0 }} kr/h</div>
          </div>
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
              title="Ladda ner rapport"
              @click.stop="handleDownloadReport(row)"
            >
              <Download class="h-4 w-4" />
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
  Building,
  Calendar,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileText,
  Loader2,
  Users,
} from 'lucide-vue-next';

// Use API service and composables
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
      include: ['customer', 'tasks', 'assignedUsers', 'timeEntries', 'attestedBy'],
    }),
  {
    cacheKey: 'workOrdersCompletedForReports',
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
const handleRefresh = async () => {
  await refreshWorkOrders();
};

// Filter work orders to show only completed ones
const completedWorkOrders = computed(() => {
  if (!workOrders.value) return [];

  return workOrders.value
    .filter(order => order.Status === 'completed')
    .map(order => ({
      ...order,
      CustomerName: order.customer?.CompanyName || 'Okänd kund',
    }));
});

// Statistics calculated from completed orders
const completedOrderStats = computed(() => {
  if (!completedWorkOrders.value.length) {
    return [
      { title: 'Slutförda ordrar', value: 0, icon: FileText, color: 'green' },
      { title: 'Totalt värde', value: '0 kr', icon: DollarSign, color: 'blue' },
      { title: 'Totala timmar', value: '0h', icon: Clock, color: 'purple' },
      { title: 'Aktiva kunder', value: 0, icon: Building, color: 'orange' },
    ];
  }

  const orders = completedWorkOrders.value;

  // Calculate total value
  const totalValue = orders.reduce((sum, order) => {
    return sum + calculateOrderValue(order);
  }, 0);

  // Calculate total hours
  const totalHours = orders.reduce((sum, order) => {
    return (
      sum +
      (order.timeEntries
        ? order.timeEntries.reduce((hourSum, entry) => hourSum + (entry.Hours || 0), 0)
        : order.ActualHours || 0)
    );
  }, 0);

  // Count unique customers
  const uniqueCustomers = new Set(
    orders.map(order => (order.customer ? order.customer.CustomerID : order.CustomerID))
  ).size;

  return [
    {
      title: 'Slutförda ordrar',
      value: orders.length,
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
      title: 'Totala timmar',
      value: `${Math.round(totalHours)}h`,
      icon: Clock,
      color: 'purple',
    },
    {
      title: 'Aktiva kunder',
      value: uniqueCustomers,
      icon: Building,
      color: 'orange',
    },
  ];
});

// Table columns
const columns = [
  { key: 'WorkOrderNumber', label: 'Ordernummer', sortable: true, width: '140px' },
  { key: 'Type', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'Title', label: 'Titel', sortable: true },
  { key: 'CustomerName', label: 'Kund', sortable: true, type: 'custom' },
  { key: 'AssignedTo', label: 'Ansvarig', sortable: true, type: 'custom' },
  { key: 'CompletedDate', label: 'Slutförd', sortable: true, type: 'custom' },
  { key: 'Priority', label: 'Prioritet', sortable: true, type: 'custom' },
  { key: 'AttestedBy', label: 'Attesterad av', sortable: true, type: 'custom' },
  { key: 'Hours', label: 'Timmar (Reg/Uppskattad)', sortable: false, type: 'custom' },
  { key: 'Value', label: 'Värde', sortable: false, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, width: '120px', type: 'custom' },
];

// Event handlers
const handleViewOrder = (order: any) => {
  router.push(`/work-orders/${order.WorkOrderID}`);
};

const handleDownloadReport = (order: any) => {
  // Generate PDF content as HTML
  const pdfContent = generateWorkOrderPDF(order);

  // Create a blob with the HTML content
  const blob = new Blob([pdfContent], { type: 'text/html' });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${order.WorkOrderNumber}-rapport.html`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('Downloaded report for order:', order.WorkOrderNumber);
};

// Generate PDF content for work order
const generateWorkOrderPDF = (order: any) => {
  const assignedUser =
    order.assignedUsers && order.assignedUsers.length > 0
      ? `${order.assignedUsers[0].FirstName} ${order.assignedUsers[0].LastName}`
      : getEmployeeName(order.AssignedTo);

  const attestedBy = order.attestedBy ? order.attestedBy.namn : '-';
  const orderValue = calculateOrderValue(order);
  const registeredHours = order.timeEntries
    ? order.timeEntries.reduce((sum, entry) => sum + (entry.Hours || 0), 0)
    : order.ActualHours || 0;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Arbetsorderrapport - ${order.WorkOrderNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; color: #333; }
        .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-item { margin-bottom: 8px; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-completed { background-color: #d4edda; color: #155724; }
        .priority-high { background-color: #f8d7da; color: #721c24; }
        .priority-medium { background-color: #fff3cd; color: #856404; }
        .priority-low { background-color: #d1ecf1; color: #0c5460; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Arbetsorderrapport</div>
        <div class="subtitle">Genererad: ${new Date().toLocaleDateString('sv-SE')} ${new Date().toLocaleTimeString('sv-SE')}</div>
    </div>

    <div class="section">
        <div class="section-title">Orderinformation</div>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="label">Ordernummer:</span>
                    <span class="value">${order.WorkOrderNumber}</span>
                </div>
                <div class="info-item">
                    <span class="label">Titel:</span>
                    <span class="value">${order.Title}</span>
                </div>
                <div class="info-item">
                    <span class="label">Beskrivning:</span>
                    <span class="value">${order.Description || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Typ:</span>
                    <span class="value">${getTypeText(order.Type)}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="label">Status:</span>
                    <span class="value status-badge status-completed">Slutförd</span>
                </div>
                <div class="info-item">
                    <span class="label">Prioritet:</span>
                    <span class="value status-badge priority-${order.Priority || 'medium'}">${order.Priority || 'Medium'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Kund:</span>
                    <span class="value">${order.CustomerName}</span>
                </div>
                <div class="info-item">
                    <span class="label">Ansvarig:</span>
                    <span class="value">${assignedUser}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Datum och tid</div>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="label">Skapad:</span>
                    <span class="value">${formatDate(order.CreatedDate)}</span>
                </div>
                <div class="info-item">
                    <span class="label">Startdatum:</span>
                    <span class="value">${order.StartDate ? formatDate(order.StartDate) : '-'}</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="label">Förfallodatum:</span>
                    <span class="value">${order.DueDate ? formatDate(order.DueDate) : '-'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Slutförd:</span>
                    <span class="value">${order.CompletedDate ? formatDate(order.CompletedDate) : '-'}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Timmar och ekonomi</div>
        <div class="info-grid">
            <div>
                <div class="info-item">
                    <span class="label">Uppskattade timmar:</span>
                    <span class="value">${order.EstimatedHours || 0}h</span>
                </div>
                <div class="info-item">
                    <span class="label">Registrerade timmar:</span>
                    <span class="value">${registeredHours}h</span>
                </div>
            </div>
            <div>
                <div class="info-item">
                    <span class="label">Timtaxa:</span>
                    <span class="value">${order.HourlyRate || 0} kr/h</span>
                </div>
                <div class="info-item">
                    <span class="label">Totalt värde:</span>
                    <span class="value">${orderValue.toLocaleString('sv-SE')} kr</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Attestering</div>
        <div class="info-item">
            <span class="label">Attesterad av:</span>
            <span class="value">${attestedBy}</span>
        </div>
    </div>

    ${
      order.Notes
        ? `
    <div class="section">
        <div class="section-title">Anteckningar</div>
        <div class="value">${order.Notes}</div>
    </div>
    `
        : ''
    }

    <div class="footer">
        <p>Detta dokument genererades automatiskt från arbetsordersystemet.</p>
        <p>Ordernummer: ${order.WorkOrderNumber} | Genererad: ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
};

const handleExportReport = () => {
  const reportData = {
    totalOrders: completedWorkOrders.value.length,
    stats: completedOrderStats.value,
    exportDate: new Date().toISOString(),
  };

  console.log('Exporting completed orders report:', reportData);
  // TODO: Implement actual export functionality
};

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const calculateOrderValue = (order: any) => {
  const hours = order.timeEntries
    ? order.timeEntries.reduce((sum, entry) => sum + (entry.Hours || 0), 0)
    : order.ActualHours || 0;
  return hours * (order.HourlyRate || 0);
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

// Helper function to get employee name by ID
const getEmployeeName = (employeeId: number | string) => {
  if (!employees.value) return 'Laddar...';
  if (typeof employeeId === 'string') return employeeId;

  const employee = employees.value.find((emp: any) => emp.id === employeeId);
  return employee?.name || 'Okänd användare';
};
</script>
