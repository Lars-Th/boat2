<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Clock, Edit, Plus, Trash2 } from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import api from '@/api';

const route = useRoute();

// API Data with composables
const {
  data: tasks,
  loading: tasksLoading,
  error: tasksError,
  refetch: refetchTasks,
} = useApi(() => api.tasks.getAll(), { immediate: true });

const {
  data: workOrders,
  loading: workOrdersLoading,
  error: workOrdersError,
  refetch: refetchWorkOrders,
} = useApi(() => api.workOrders.getAll(), { immediate: true });

const {
  data: customers,
  loading: customersLoading,
  error: customersError,
  refetch: refetchCustomers,
} = useApi(() => api.customers.getAll(), { immediate: true });

// Add time entries API call
const {
  data: timeEntries,
  loading: timeEntriesLoading,
  error: timeEntriesError,
  refetch: refetchTimeEntries,
} = useApi(() => Promise.resolve({ data: [], success: true }), { immediate: true });

// Loading and error states
const isLoading = computed(
  () =>
    tasksLoading.value ||
    workOrdersLoading.value ||
    customersLoading.value ||
    timeEntriesLoading.value
);

const hasError = computed(
  () =>
    tasksError.value !== null ||
    workOrdersError.value !== null ||
    customersError.value !== null ||
    timeEntriesError.value !== null
);

// Event handlers
const handleAddTimeEntry = () => {
  console.log('Add time entry');
};

const handleRetry = async () => {
  await Promise.all([
    refetchTimeEntries(),
    refetchWorkOrders(),
    refetchCustomers(),
    refetchTasks(),
  ]);
};

// Filters
const dateFilter = ref('');
const workOrderFilter = ref('');

// Form data for new time entry
const newEntry = ref({
  date: new Date().toISOString().split('T')[0],
  workOrderId: '',
  startTime: '',
  endTime: '',
  activityType: '',
  description: '',
});

// Initialize form when data loads
onMounted(() => {
  if (route.query.workOrder) {
    newEntry.value.workOrderId = route.query.workOrder.toString();
  }
});

// Define table columns
const columns = [
  { key: 'Date', label: 'Datum', sortable: true, type: 'custom' },
  { key: 'WorkOrderNumber', label: 'Arbetsorder', sortable: true, type: 'custom' },
  { key: 'CustomerName', label: 'Kund', sortable: true, type: 'custom' },
  { key: 'UserName', label: 'Användare', sortable: true },
  { key: 'StartTime', label: 'Starttid', sortable: false },
  { key: 'EndTime', label: 'Sluttid', sortable: false },
  { key: 'Hours', label: 'Timmar', sortable: true, type: 'custom' },
  { key: 'ActivityType', label: 'Aktivitet', sortable: true },
  { key: 'Description', label: 'Beskrivning', sortable: false, type: 'custom' },
  {
    key: 'Status',
    label: 'Status',
    sortable: true,
    type: 'badge',
    badgeVariant: (value: string) => (value === 'approved' ? 'default' : 'secondary'),
  },
  { key: 'actions', label: 'Åtgärder', type: 'actions', width: '120px', align: 'right' },
];

const calculatedHours = computed(() => {
  return calculateHours(newEntry.value.startTime, newEntry.value.endTime);
});

// Filter time entries by date and work order
const filteredTimeEntries = computed(() => {
  if (!timeEntries.value) return [];

  let filtered = timeEntries.value;

  // Filter by date
  if (dateFilter.value) {
    filtered = filtered.filter(entry => entry.Date === dateFilter.value);
  }

  // Filter by work order
  if (workOrderFilter.value) {
    filtered = filtered.filter(entry => entry.WorkOrderID === parseInt(workOrderFilter.value));
  }

  return filtered.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
});

// Watch for filter changes and update the data table
watch(
  filteredTimeEntries,
  newEntries => {
    // The DataTable component will handle the filtering internally
  },
  { immediate: true }
);

// Statistics
const timeReportingStats = computed(() => {
  if (!timeEntries.value) {
    return [
      { title: 'Totalt registreringar', value: 0, icon: Clock, color: 'blue' },
      { title: 'Väntande godkännande', value: 0, icon: AlertCircle, color: 'orange' },
      { title: 'Godkända', value: 0, icon: CheckCircle, color: 'green' },
      { title: 'Denna vecka', value: 0, icon: Plus, color: 'purple' },
    ];
  }

  const pendingCount = timeEntries.value.filter(te => te.Status === 'pending').length;
  const approvedCount = timeEntries.value.filter(te => te.Status === 'approved').length;
  const thisWeekCount = timeEntries.value.filter(te => {
    const entryDate = new Date(te.Date);
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return entryDate >= weekStart && entryDate <= weekEnd;
  }).length;

  return [
    {
      title: 'Totalt registreringar',
      value: timeEntries.value.length,
      icon: Clock,
      color: 'blue',
    },
    {
      title: 'Väntande godkännande',
      value: pendingCount,
      icon: AlertCircle,
      color: 'orange',
    },
    {
      title: 'Godkända',
      value: approvedCount,
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Denna vecka',
      value: thisWeekCount,
      icon: Plus,
      color: 'purple',
    },
  ];
});

const getCustomerName = (customerID: number) => {
  if (!customers.value) return 'Okänd kund';
  const customer = customers.value.find(c => c.CustomerID === customerID);
  return customer ? customer.CompanyName : 'Okänd kund';
};

const getWorkOrderNumber = (workOrderID: number) => {
  if (!workOrders.value) return 'Okänd';
  const workOrder = workOrders.value.find(wo => wo.WorkOrderID === workOrderID);
  return workOrder ? workOrder.WorkOrderNumber : 'Okänd';
};

const getWorkOrderCustomer = (workOrderID: number) => {
  if (!workOrders.value) return 'Okänd kund';
  const workOrder = workOrders.value.find(wo => wo.WorkOrderID === workOrderID);
  if (workOrder) {
    return getCustomerName(workOrder.CustomerID);
  }
  return 'Okänd kund';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const calculateHours = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0;

  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);

  const diffMs = end.getTime() - start.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

const saveTimeEntry = () => {
  if (
    !newEntry.value.workOrderId ||
    !newEntry.value.startTime ||
    !newEntry.value.endTime ||
    !newEntry.value.activityType
  ) {
    alert('Vänligen fyll i alla obligatoriska fält');
    return;
  }

  const hours = calculateHours(newEntry.value.startTime, newEntry.value.endTime);

  const entry = {
    TimeEntryID: timeEntries.value ? timeEntries.value.length + 1 : 1,
    WorkOrderID: parseInt(newEntry.value.workOrderId),
    UserID: 1, // Current user ID
    UserName: 'Aktuell användare', // Current user name
    Date: newEntry.value.date,
    StartTime: newEntry.value.startTime,
    EndTime: newEntry.value.endTime,
    Hours: hours,
    Description: newEntry.value.description,
    ActivityType: newEntry.value.activityType,
    Status: 'pending',
    CreatedDate: new Date().toISOString(),
  };

  if (timeEntries.value) {
    timeEntries.value.unshift(entry);
  }
  resetForm();
  alert('Tidsregistrering sparad!');
};

const resetForm = () => {
  newEntry.value = {
    date: new Date().toISOString().split('T')[0],
    workOrderId: route.query.workOrder ? route.query.workOrder.toString() : '',
    startTime: '',
    endTime: '',
    activityType: '',
    description: '',
  };
};

const viewEntry = (entry: any) => {
  console.log('View entry', entry.TimeEntryID);
};

const editEntry = (id: number) => {
  console.log('Edit entry', id);
};

const deleteEntry = (id: number) => {
  if (confirm('Är du säker på att du vill ta bort denna tidsregistrering?')) {
    if (timeEntries.value) {
      const index = timeEntries.value.findIndex(entry => entry.TimeEntryID === id);
      if (index > -1) {
        timeEntries.value.splice(index, 1);
      }
    }
  }
};
</script>

<template>
  <div>
    <PageLayout
      title="Tidredovisning"
      :breadcrumbs="[
        { label: 'Hem', to: '/' },
        { label: 'Tid', to: '/time-reporting' },
        { label: 'Tidredovisning', isCurrentPage: true },
      ]"
      description="Registrera och hantera arbetstid"
      :stats="timeReportingStats"
    >
      <template #actions>
        <Button class="gap-2" @click="handleAddTimeEntry">
          <Plus class="h-4 w-4" />
          Ny tidsregistrering
        </Button>
      </template>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
          ></div>
          <p class="text-muted-foreground">Laddar tidredovisning...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="text-center py-12">
        <div class="text-red-500 mb-4">
          <AlertCircle class="h-12 w-12 mx-auto mb-2" />
          <p class="text-lg font-semibold">Kunde inte ladda tidredovisning</p>
          <p class="text-sm text-muted-foreground mt-1">
            {{ timeEntriesError?.message || workOrdersError?.message || customersError?.message }}
          </p>
        </div>
        <Button variant="outline" @click="handleRetry">Försök igen</Button>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Time Entry Form -->
        <div class="bg-card rounded-lg border border-border p-6">
          <h2 class="text-lg font-semibold mb-4">Registrera tid</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Datum</label>
              <Input v-model="newEntry.date" type="date" />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">Arbetsorder</label>
              <select
                v-model="newEntry.workOrderId"
                class="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="">Välj arbetsorder</option>
                <option
                  v-for="order in workOrders"
                  :key="order.WorkOrderID"
                  :value="order.WorkOrderID"
                >
                  {{ order.WorkOrderNumber }} - {{ getCustomerName(order.CustomerID) }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">Starttid</label>
              <Input v-model="newEntry.startTime" type="time" />
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">Sluttid</label>
              <Input v-model="newEntry.endTime" type="time" />
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Aktivitetstyp</label>
              <select
                v-model="newEntry.activityType"
                class="w-full px-3 py-2 border border-border rounded-md bg-background"
              >
                <option value="">Välj aktivitetstyp</option>
                <option value="Installation">Installation</option>
                <option value="Underhåll">Underhåll</option>
                <option value="Reparation">Reparation</option>
                <option value="Inspektion">Inspektion</option>
                <option value="Planering">Planering</option>
                <option value="Administration">Administration</option>
                <option value="Felsökning">Felsökning</option>
                <option value="Test">Test</option>
                <option value="Kontroll">Kontroll</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium mb-2 block">Beräknade timmar</label>
              <Input type="number" step="0.5" :value="calculatedHours" readonly class="bg-muted" />
            </div>
          </div>
          <div class="mt-4">
            <label class="text-sm font-medium mb-2 block">Beskrivning</label>
            <Input v-model="newEntry.description" placeholder="Beskriv utfört arbete..." />
          </div>
          <div class="flex justify-end mt-4 gap-2">
            <Button variant="outline" @click="resetForm">Rensa</Button>
            <Button @click="saveTimeEntry">Spara</Button>
          </div>
        </div>

        <!-- Time Entries List -->
        <DataTable
          :data="timeEntries || []"
          :columns="columns"
          :search-fields="['Description', 'UserName', 'ActivityType']"
          filter-field="Status"
          :filter-options="[
            { value: 'pending', label: 'Väntande' },
            { value: 'approved', label: 'Godkända' },
          ]"
          :on-row-click="viewEntry"
          :items-per-page="20"
        >
          <template
            #filters="{
              searchQuery,
              statusFilter,
              filterOptions,
              updateSearchQuery,
              updateStatusFilter,
            }"
          >
            <div class="flex gap-4">
              <div class="flex-1">
                <Input
                  :value="searchQuery"
                  placeholder="Sök tidsregistreringar..."
                  class="max-w-sm"
                  @input="updateSearchQuery($event.target.value)"
                />
              </div>
              <div class="flex gap-2">
                <Input v-model="dateFilter" type="date" class="w-48" />
                <select
                  :value="statusFilter"
                  class="px-3 py-2 border border-border rounded-md bg-background text-sm"
                  @change="updateStatusFilter($event.target.value)"
                >
                  <option value="">Alla status</option>
                  <option v-for="option in filterOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <select
                  v-model="workOrderFilter"
                  class="px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="">Alla arbetsordrar</option>
                  <option
                    v-for="order in workOrders"
                    :key="order.WorkOrderID"
                    :value="order.WorkOrderID"
                  >
                    {{ order.WorkOrderNumber }}
                  </option>
                </select>
              </div>
            </div>
          </template>

          <template #cell-Date="{ value, row }">
            {{ formatDate(row.Date) }}
          </template>

          <template #cell-WorkOrderNumber="{ value, row }">
            <span class="font-mono">{{ getWorkOrderNumber(row.WorkOrderID) }}</span>
          </template>

          <template #cell-CustomerName="{ value, row }">
            {{ getWorkOrderCustomer(row.WorkOrderID) }}
          </template>

          <template #cell-Hours="{ value, row }">
            <span class="font-medium">{{ row.Hours }}h</span>
          </template>

          <template #cell-Description="{ value, row }">
            <span class="max-w-xs truncate block" :title="row.Description">
              {{ row.Description }}
            </span>
          </template>

          <template #actions="{ row }">
            <Button variant="ghost" size="sm" title="Redigera" @click="editEntry(row.TimeEntryID)">
              <Edit class="h-4 w-4" />
            </Button>
            <Button
              v-if="row.Status === 'pending'"
              variant="ghost"
              size="sm"
              title="Radera"
              class="text-red-600 hover:text-red-800"
              @click="deleteEntry(row.TimeEntryID)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </template>
        </DataTable>
      </div>
    </PageLayout>
  </div>
</template>
