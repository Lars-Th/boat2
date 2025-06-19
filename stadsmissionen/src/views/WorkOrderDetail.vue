<template>
  <PageLayout
    :title="workOrder?.Title || 'Arbetsorder'"
    :breadcrumbs="[
      { label: 'Hem', to: '/' },
      { label: 'Arbetsordrar', to: '/work-orders' },
      { label: workOrder?.WorkOrderNumber || 'Detaljer', isCurrentPage: true },
    ]"
    :description="getWorkOrderTypeDescription()"
    :stats="workOrderStats"
  >
    <template #actions>
      <Button variant="outline" class="gap-2" @click="editWorkOrder">
        <Edit class="h-4 w-4" />
        Redigera
      </Button>
      <Button v-if="workOrder?.IsBillable" class="gap-2" @click="generateReport">
        <FileText class="h-4 w-4" />
        Generera rapport
      </Button>
      <Button v-if="workOrder?.Status === 'active'" class="gap-2" @click="addTimeEntry">
        <Clock class="h-4 w-4" />
        Registrera tid
      </Button>
    </template>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Laddar arbetsorder...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <AlertCircle class="h-12 w-12 mx-auto mb-2" />
        <p class="text-lg font-semibold">Kunde inte ladda arbetsorder</p>
        <p class="text-sm text-muted-foreground mt-1">{{ error }}</p>
      </div>
      <Button variant="outline" @click="loadData">Försök igen</Button>
    </div>

    <!-- Main Content -->
    <div v-else-if="workOrder" class="space-y-6">
      <!-- Basic Information Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <WorkOrderInformationCard :work-order="workOrder" :assigned-employee="assignedEmployee" />

        <WorkOrderCustomerContactCard
          :customer-info="customerInfo"
          :contact-info="contactInfo"
          :customer-contacts="customerContacts"
          :main-contact="mainContact"
          :other-contacts="otherContacts"
        />

        <WorkOrderTimeProgressCard
          :work-order="workOrder"
          :created-by-user="createdByUser"
          :registered-hours="registeredHours"
        />
      </div>

      <!-- Description Card -->
      <WorkOrderDescriptionCard :work-order="workOrder" />

      <!-- Location & Map Card -->
      <WorkOrderLocationCard
        :work-order="workOrder"
        @open-in-maps="openInMaps"
        @plan-route="planRoute"
      />

      <!-- Assigned Persons Section -->
      <WorkOrderAssignedPersonCard :assigned-employee="assignedEmployee" :work-order="workOrder" />

      <!-- Tasks Section -->
      <WorkOrderTasksCard :tasks="tasks" :work-order="workOrder" @add-time-entry="addTimeEntry" />
    </div>

    <!-- Add Person Dialog -->
    <div
      v-if="showAddPersonDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showAddPersonDialog = false"
    >
      <div class="bg-card rounded-lg border border-border p-6 w-full max-w-md mx-4" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Tilldela person</h3>
          <Button variant="ghost" size="sm" @click="showAddPersonDialog = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">Välj anställd</label>
            <select
              v-model="selectedEmployeeId"
              class="w-full p-2 border border-border rounded-md bg-background"
            >
              <option value="">Välj en anställd...</option>
              <option
                v-for="employee in availableEmployees"
                :key="employee.EmployeeID"
                :value="employee.EmployeeID"
              >
                {{ employee.FirstName }} {{ employee.LastName }} - {{ employee.Position }}
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showAddPersonDialog = false">Avbryt</Button>
            <Button :disabled="!selectedEmployeeId" @click="addAssignedPerson">Tilldela</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Task Dialog -->
    <div
      v-if="showAddTaskDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="showAddTaskDialog = false"
    >
      <div class="bg-card rounded-lg border border-border p-6 w-full max-w-lg mx-4" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Lägg till uppgift</h3>
          <Button variant="ghost" size="sm" @click="showAddTaskDialog = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-2 block">Titel</label>
            <input
              v-model="newTask.title"
              type="text"
              class="w-full p-2 border border-border rounded-md bg-background"
              placeholder="Ange uppgiftens titel"
            />
          </div>

          <div>
            <label class="text-sm font-medium mb-2 block">Beskrivning</label>
            <textarea
              v-model="newTask.description"
              class="w-full p-2 border border-border rounded-md bg-background h-20"
              placeholder="Beskriv uppgiften"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Typ</label>
              <select
                v-model="newTask.type"
                class="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="standard">Standard</option>
                <option value="pause">Paus</option>
                <option value="other">Övrigt</option>
              </select>
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">Status</label>
              <select
                v-model="newTask.status"
                class="w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="planning">Planering</option>
                <option value="active">Aktiv</option>
                <option value="completed">Slutförd</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium mb-2 block">Kvantitet</label>
              <input
                v-model.number="newTask.quantity"
                type="number"
                min="0"
                step="0.1"
                class="w-full p-2 border border-border rounded-md bg-background"
              />
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">Enhet</label>
              <input
                v-model="newTask.unit"
                type="text"
                class="w-full p-2 border border-border rounded-md bg-background"
                placeholder="st, m, kg..."
              />
            </div>

            <div>
              <label class="text-sm font-medium mb-2 block">Estimerat (h)</label>
              <input
                v-model.number="newTask.estimatedHours"
                type="number"
                min="0"
                step="0.5"
                class="w-full p-2 border border-border rounded-md bg-background"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showAddTaskDialog = false">Avbryt</Button>
            <Button :disabled="!newTask.title" @click="addTask">Lägg till</Button>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Global type declarations
declare global {
  interface Window {
    open(url: string, target: string): void;
    confirm(message: string): boolean;
  }
}

// Global functions
const { parseInt, Math, encodeURIComponent, window, confirm } = globalThis;
import PageLayout from '@/components/layout/PageLayout.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Building,
  CheckSquare,
  Clock,
  Edit,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  Navigation,
  Plus,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-vue-next';

// Feature Components
import {
  WorkOrderAssignedPersonCard,
  WorkOrderCustomerContactCard,
  WorkOrderDescriptionCard,
  WorkOrderInformationCard,
  WorkOrderLocationCard,
  WorkOrderTasksCard,
  WorkOrderTimeProgressCard,
} from '@/components/features/workorders';
import { useApiItem, useApiList } from '@/composables/useApi';
import api from '@/api';

const route = useRoute();
const router = useRouter();
const workOrderId = route.params.id as string;

// Fetch work order with complete relationship data using enhanced API
const {
  data: workOrderWithRelations,
  loading: isLoading,
  error: hasError,
  refresh: loadData,
} = useApiItem(
  () =>
    api.workOrders.getById(workOrderId, {
      include: ['customer', 'createdBy', 'contact', 'tasks', 'assignedEmployee'],
    }),
  {
    cacheKey: `workOrder-${workOrderId}`,
  }
);

// Get customer with contacts separately to ensure we have all contact information
const {
  data: customerWithContacts,
  loading: customerLoading,
  error: customerError,
} = useApiItem(
  () =>
    workOrderWithRelations.value?.CustomerID
      ? api.customers.getById(workOrderWithRelations.value.CustomerID.toString(), {
          include: ['contacts'],
        })
      : null,
  {
    cacheKey: `customer-${workOrderWithRelations.value?.CustomerID}-with-contacts`,
    enabled: computed(() => !!workOrderWithRelations.value?.CustomerID),
  }
);

// Computed data from relations
const workOrder = computed(() => workOrderWithRelations.value);
const customerInfo = computed(() => workOrder.value?.customer);
const contactInfo = computed(() => workOrder.value?.contact);
const createdByUser = computed(() => workOrder.value?.createdByUser);
const assignedEmployee = computed(() => workOrder.value?.assignedEmployee);
const tasks = computed(() => workOrder.value?.tasks || []);

// Get customer contacts from the separate API call
const customerContacts = computed(() => {
  return customerWithContacts.value?.contacts || [];
});

// Find the main contact (IsPrimary = true)
const mainContact = computed(() => {
  return customerContacts.value.find((contact: any) => contact.IsPrimary) || null;
});

// Get other contacts (not main contact)
const otherContacts = computed(() => {
  return customerContacts.value.filter((contact: any) => !contact.IsPrimary);
});

// Computed statistics from related data
const registeredHours = computed(() => {
  return tasks.value
    .filter((task: any) => task.Status === 'approved')
    .reduce((total: number, task: any) => total + (task.Hours || 0), 0);
});

const pendingHours = computed(() => {
  return tasks.value
    .filter((task: any) => task.Status === 'pending')
    .reduce((total: number, task: any) => total + (task.Hours || 0), 0);
});

const progress = computed(() => {
  if (!workOrder.value?.EstimatedHours) return 0;
  return Math.round((registeredHours.value / workOrder.value.EstimatedHours) * 100);
});

const error = computed(() => (hasError.value ? 'Failed to load work order' : ''));

// Dialog states
const showAddPersonDialog = ref(false);
const showAddTaskDialog = ref(false);
const selectedEmployeeId = ref('');

// New task form
const newTask = ref({
  title: '',
  description: '',
  type: 'standard',
  status: 'planning',
  quantity: 1,
  unit: 'st',
  estimatedHours: 0,
});

// Fetch additional reference data for dropdowns
const {
  data: employees,
  loading: employeesLoading,
  error: employeesError,
} = useApiList(() => api.employees.getAll(), {
  cacheKey: 'employees',
});

const {
  data: machines,
  loading: machinesLoading,
  error: machinesError,
} = useApiList(() => api.machines.getAll(), {
  cacheKey: 'machines',
});

const {
  data: tools,
  loading: toolsLoading,
  error: toolsError,
} = useApiList(() => api.tools.getAll(), {
  cacheKey: 'tools',
});

const workOrderStats = computed(() => {
  if (!workOrder.value) return [];

  const stats = [
    {
      title: 'Uppgifter',
      value: tasks.value?.length || 0,
      icon: CheckSquare,
      color: 'blue',
    },
    {
      title: 'Timmar',
      value: `${workOrder.value.ActualHours}/${workOrder.value.EstimatedHours}h`,
      icon: Clock,
      color: 'purple',
    },
    { title: 'Registrerat', value: `${registeredHours.value}h`, icon: Clock, color: 'green' },
    {
      title: 'Ansvarig',
      value: assignedEmployee.value?.name || 'Ej tilldelad',
      icon: Users,
      color: 'orange',
    },
  ];

  const totalValue = (workOrder.value.ActualHours || 0) * (workOrder.value.HourlyRate || 0);
  stats.push({
    title: 'Värde',
    value: `${totalValue.toString()} kr`,
    icon: FileText,
    color: 'green',
  });

  return stats;
});

const availableEmployees = computed(() => {
  if (!employees.value || !workOrder.value) return [];

  // Filter out employees that are already assigned
  const assignedIds = workOrder.value.AssignedUserIDs || [];
  return employees.value.filter((emp: any) => !assignedIds.includes(emp.EmployeeID));
});

// Helper functions
const getWorkOrderTypeDescription = () => {
  if (!workOrder.value) return '';

  switch (workOrder.value.Type) {
    case 'standard':
      return 'Standardarbetsorder skapad i systemet';
    case 'quick_field':
      return 'Snabborder utförd på fältet';
    case 'service_non_billable':
      return 'Service eller icke fakturerabart arbete';
    default:
      return 'Arbetsorder';
  }
};

const getMachineName = (machineId: number) => {
  const machine = machines.value.find((m: any) => m.MachineID === machineId);
  return machine?.Name || 'Okänd maskin';
};

const getToolNames = (toolIds: number[]) => {
  return toolIds.map(id => {
    const tool = tools.value.find((t: any) => t.ToolID === id);
    return tool?.Name || 'Okänt verktyg';
  });
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('sv-SE');
};

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

const getAttestationVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    case 'not_applicable':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getAttestationText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Väntar';
    case 'approved':
      return 'Godkänd';
    case 'rejected':
      return 'Avvisad';
    case 'not_applicable':
      return 'Ej tillämplig';
    default:
      return status;
  }
};

const getInvoiceVariant = (status: string) => {
  switch (status) {
    case 'not_ready':
      return 'secondary';
    case 'ready':
      return 'default';
    case 'invoiced':
      return 'outline';
    case 'not_applicable':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getInvoiceText = (status: string) => {
  switch (status) {
    case 'not_ready':
      return 'Ej klar';
    case 'ready':
      return 'Klar';
    case 'invoiced':
      return 'Fakturerad';
    case 'not_applicable':
      return 'Ej tillämplig';
    default:
      return status;
  }
};

const getTaskTypeVariant = (type: string) => {
  switch (type) {
    case 'standard':
      return 'default';
    case 'pause':
      return 'secondary';
    case 'other':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getTaskTypeText = (type: string) => {
  switch (type) {
    case 'standard':
      return 'Standard';
    case 'pause':
      return 'Paus';
    case 'other':
      return 'Övrigt';
    default:
      return type;
  }
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

const getTimeEntryStatusVariant = (status: string) => {
  switch (status) {
    case 'pending':
      return 'secondary';
    case 'approved':
      return 'default';
    case 'rejected':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getTimeEntryStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Väntar';
    case 'approved':
      return 'Godkänd';
    case 'rejected':
      return 'Avvisad';
    default:
      return status;
  }
};

// Actions
const editWorkOrder = () => {
  router.push(`/work-orders/${workOrder.value.WorkOrderID}/edit`);
};

const generateReport = () => {
  // TODO: Implement report generation
};

// Person management - removed as we now use AssignedTo field directly

// Task management
const addTask = () => {
  if (!newTask.value.title || !workOrder.value) return;

  // Generate new task ID (in real app, this would come from the API)
  const newTaskId = Math.max(...(workOrder.value.Tasks?.map((t: any) => t.TaskID) || [0])) + 1;

  const task = {
    TaskID: newTaskId,
    WorkOrderID: workOrder.value.WorkOrderID,
    Title: newTask.value.title,
    Description: newTask.value.description,
    Type: newTask.value.type,
    Status: newTask.value.status,
    Quantity: newTask.value.quantity,
    Unit: newTask.value.unit,
    EstimatedHours: newTask.value.estimatedHours,
    ActualHours: 0,
    MachineID: null,
    ToolIDs: [],
  };

  // Add to work order tasks
  if (!workOrder.value.Tasks) {
    workOrder.value.Tasks = [];
  }
  workOrder.value.Tasks.push(task);

  // Reset form and close dialog
  newTask.value = {
    title: '',
    description: '',
    type: 'standard',
    status: 'planning',
    quantity: 1,
    unit: 'st',
    estimatedHours: 0,
  };
  showAddTaskDialog.value = false;

  // Task added successfully
};

const editTask = (taskId: number) => {
  // TODO: Implement task editing
};

const deleteTask = (taskId: number) => {
  if (!workOrder.value) return;

  if (window.confirm('Är du säker på att du vill ta bort denna uppgift?')) {
    workOrder.value.Tasks =
      workOrder.value.Tasks?.filter((task: any) => task.TaskID !== taskId) || [];
    // Task deleted successfully
  }
};

const addTimeEntry = () => {
  router.push(`/time-reporting?workOrder=${workOrder.value.WorkOrderID}`);
};

const openInMaps = () => {
  if (workOrder.value?.Location?.Coordinates) {
    const { lat, lng } = workOrder.value.Location.Coordinates;
    window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  }
};

const planRoute = () => {
  if (workOrder.value?.Location?.Address) {
    const address = encodeURIComponent(
      `${workOrder.value.Location.Address}, ${workOrder.value.Location.City}`
    );
    window.open(`https://maps.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
  }
};
</script>
