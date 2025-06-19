<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Plus, Settings, Wrench } from 'lucide-vue-next';

const router = useRouter();

// Fetch machines with complete customer relationship data using enhanced API
const {
  data: machinesWithRelations,
  loading: isLoading,
  error: hasError,
} = useApiList(() => api.machines.getAll({ include: ['customer'] }), {
  cacheKey: 'machines-with-customers',
});

// Compute enhanced machine data from relations
const machinesWithCustomers = computed(() => {
  if (!machinesWithRelations.value) return [];

  return machinesWithRelations.value.map((machine: any) => ({
    ...machine,
    CustomerName: machine.customer?.CompanyName ?? 'Okänd kund',
    BrandModel: `${machine.Brand} ${machine.Model}`,
  }));
});

// Table columns
const columns = [
  { key: 'MachineNumber', label: 'Maskinnummer', sortable: true, width: '120px' },
  { key: 'Name', label: 'Namn', sortable: true },
  { key: 'Type', label: 'Typ', sortable: true },
  { key: 'BrandModel', label: 'Märke/Modell', sortable: true },
  { key: 'CustomerName', label: 'Kund', sortable: true },
  { key: 'Location', label: 'Plats', sortable: true },
  { key: 'Status', label: 'Status', sortable: true },
  { key: 'LastServiceDate', label: 'Senaste service', sortable: true },
  { key: 'NextServiceDate', label: 'Nästa service', sortable: true },
  { key: 'actions', label: 'Åtgärder', sortable: false },
];

// Statistics computed from enhanced machine data
const stats = computed(() => {
  if (!machinesWithRelations.value) {
    return [
      { title: 'Totalt', value: 0, icon: Settings, color: 'blue' },
      { title: 'Aktiva', value: 0, icon: Settings, color: 'green' },
      { title: 'Under reparation', value: 0, icon: Wrench, color: 'red' },
      { title: 'Service inom 30 dagar', value: 0, icon: AlertTriangle, color: 'orange' },
    ];
  }

  const activeMachines = machinesWithRelations.value.filter(
    (m: any) => m.Status === 'active'
  ).length;
  const repairMachines = machinesWithRelations.value.filter(
    (m: any) => m.Status === 'under_repair'
  ).length;

  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const serviceSoonMachines = machinesWithRelations.value.filter((m: any) => {
    if (!m.NextServiceDate) return false;
    const serviceDate = new Date(m.NextServiceDate);
    return serviceDate <= thirtyDaysFromNow && serviceDate >= today;
  }).length;

  return [
    {
      title: 'Totalt',
      value: machinesWithRelations.value.length,
      icon: Settings,
      color: 'blue',
    },
    {
      title: 'Aktiva',
      value: activeMachines,
      icon: Settings,
      color: 'green',
    },
    {
      title: 'Under reparation',
      value: repairMachines,
      icon: Wrench,
      color: 'red',
    },
    {
      title: 'Service inom 30 dagar',
      value: serviceSoonMachines,
      icon: AlertTriangle,
      color: 'orange',
    },
  ];
});

// Helper functions
const getCustomerName = (customerID: number) => {
  // Get customer name from included relation data
  const machine = machinesWithRelations.value?.find((m: any) => m.CustomerID === customerID);
  return machine?.customer?.CompanyName || 'Okänd kund';
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sv-SE');
};

const getServiceDateClass = (dateString: string) => {
  if (!dateString) return '';

  const serviceDate = new Date(dateString);
  const today = new Date();
  const diffDays = Math.ceil((serviceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-red-600 font-medium'; // Försenad
  if (diffDays <= 30) return 'text-orange-600 font-medium'; // Inom 30 dagar
  return 'text-green-600'; // Mer än 30 dagar
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'under_repair':
      return 'destructive';
    case 'planned':
      return 'secondary';
    case 'inactive':
      return 'outline';
    default:
      return 'secondary';
  }
};

// Event handlers
const handleNewMachine = () => {
  router.push('/machines/new');
};

const handleRowClick = (machine: any) => {
  router.push(`/machines/${machine.MachineID}`);
};

const handleViewMachine = (machine: any) => {
  router.push(`/machines/${machine.MachineID}`);
};

const handleEditMachine = (machine: any) => {
  router.push(`/machines/${machine.MachineID}/edit`);
};

const handleScheduleMaintenance = (machine: any) => {
  router.push(`/maintenance/schedule?machine=${machine.MachineID}`);
};
</script>

<template>
  <PageLayout title="Maskiner" breadcrumbs="Dashboard / Maskiner" show-stats :stats="stats">
    <!-- Actions with padding -->
    <div class="px-6 py-4 flex justify-end">
      <Button class="gap-2" @click="handleNewMachine">
        <Plus class="h-4 w-4" />
        Ny maskin
      </Button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar maskiner...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av maskiner</p>
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
      :data="machinesWithCustomers"
      :columns="columns"
      :search-fields="[
        'Name',
        'MachineNumber',
        'Type',
        'Brand',
        'Model',
        'Location',
        'CustomerName',
      ]"
      @row-click="handleRowClick"
    >
      <template #cell-Location="{ value }">
        <span class="max-w-xs truncate block" :title="value">{{ value }}</span>
      </template>

      <template #cell-Status="{ value }">
        <Badge :variant="getStatusVariant(value)">
          {{
            value === 'active'
              ? 'Aktiv'
              : value === 'under_repair'
                ? 'Under reparation'
                : value === 'planned'
                  ? 'Planerad'
                  : value === 'inactive'
                    ? 'Inaktiv'
                    : value
          }}
        </Badge>
      </template>

      <template #cell-LastServiceDate="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #cell-NextServiceDate="{ value }">
        <span :class="getServiceDateClass(value)">
          {{ formatDate(value) }}
        </span>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex gap-2">
          <Button size="sm" variant="outline" @click="handleViewMachine(row)">Visa</Button>
          <Button size="sm" variant="outline" @click="handleEditMachine(row)">Redigera</Button>
          <Button
            v-if="row.Status === 'active'"
            size="sm"
            variant="outline"
            @click="handleScheduleMaintenance(row)"
          >
            Underhåll
          </Button>
        </div>
      </template>
    </DataTable>
  </PageLayout>
</template>
