<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import api from '@/api';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import ViewControls from '@/components/shared/ViewControls.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building, Download, Mail, MapPin, Plus, Upload, Users } from 'lucide-vue-next';

const router = useRouter();
const { promise } = useToast();

// Filter state
const statusFilter = ref('all');
const typeFilter = ref('all');
const searchQuery = ref('');

// Fetch customers with relations using enhanced API service
const {
  data: customers,
  loading: customersLoading,
  error: customersError,
} = useApiList(() => api.customers.getAll({ include: ['contacts', 'workOrders'] }), {
  cacheKey: 'boat-customers',
});

// Filtered customers based on filters
const filteredCustomers = computed(() => {
  if (!customers.value) return [];

  return customers.value.filter((customer: any) => {
    const matchesStatus = statusFilter.value === 'all' || customer.Status === statusFilter.value;
    const matchesType =
      typeFilter.value === 'all' ||
      (typeFilter.value === 'company' && customer.CompanyName) ||
      (typeFilter.value === 'individual' && !customer.CompanyName);

    // Search functionality - check multiple fields
    const matchesSearch =
      searchQuery.value === '' ||
      [
        customer.CompanyName,
        customer.FirstName,
        customer.LastName,
        customer.Email,
        customer.Phone,
        customer.Address,
        customer.City,
      ].some(field => field?.toString().toLowerCase().includes(searchQuery.value.toLowerCase()));

    return matchesStatus && matchesType && matchesSearch;
  });
});

// Loading state
const isLoading = computed(() => customersLoading.value);

// Error state
const hasError = computed(() => customersError.value !== null);

// Table columns
const columns = [
  { key: 'CustomerNumber', label: 'Kundnummer', sortable: true, width: '120px' },
  { key: 'CompanyName', label: 'Företag', sortable: true },
  { key: 'ContactPerson', label: 'Kontaktperson', sortable: true },
  { key: 'Phone', label: 'Telefon', sortable: false },
  { key: 'Email', label: 'E-post', sortable: true },
  { key: 'City', label: 'Ort', sortable: true },
  { key: 'Status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Åtgärder', sortable: false },
];

// Statistics
const stats = computed(() => {
  if (!customers.value) {
    return [
      { title: 'Totalt', value: 0, icon: Users, color: 'blue' },
      { title: 'Aktiva', value: 0, icon: Building, color: 'green' },
      { title: 'Inaktiva', value: 0, icon: MapPin, color: 'orange' },
      { title: 'Med e-post', value: 0, icon: Mail, color: 'purple' },
    ];
  }

  const activeCustomers = customers.value.filter((c: any) => c.Status === 'active').length;
  const inactiveCustomers = customers.value.filter((c: any) => c.Status === 'inactive').length;
  const customersWithEmail = customers.value.filter((c: any) => c.Email).length;

  return [
    {
      title: 'Totalt',
      value: customers.value.length,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Aktiva',
      value: activeCustomers,
      icon: Building,
      color: 'green',
    },
    {
      title: 'Inaktiva',
      value: inactiveCustomers,
      icon: MapPin,
      color: 'orange',
    },
    {
      title: 'Med e-post',
      value: customersWithEmail,
      icon: Mail,
      color: 'purple',
    },
  ];
});

// Helper functions
const getStatusVariant = (status: string) => {
  return status === 'active' ? 'default' : 'secondary';
};

// Event handlers
const handleNewCustomer = () => {
  router.push('/boats/customers/new');
};

const handleRowClick = (customer: any) => {
  router.push(`/boats/customers/${customer.CustomerID}`);
};

const handleViewCustomer = (customer: any) => {
  router.push(`/boats/customers/${customer.CustomerID}`);
};

const handleEditCustomer = (customer: any) => {
  router.push(`/boats/customers/${customer.CustomerID}/edit`);
};

const handleSendEmail = (customer: any, event: Event) => {
  event.stopPropagation();
  window.open(`mailto:${customer.Email}`);
};

// Additional action handlers
const importCustomers = async () => {
  try {
    await promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Importerar kunddata...',
      success: 'Kunddata har importerats framgångsrikt!',
      error: 'Ett fel uppstod vid import av kunddata.',
    });
  } catch (err) {
    console.error('Import failed:', err);
  }
};

const exportCustomers = async () => {
  try {
    await promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'Exporterar kunddata...',
      success: 'Kunddata har exporterats framgångsrikt!',
      error: 'Ett fel uppstod vid export av kunddata.',
    });
  } catch (err) {
    console.error('Export failed:', err);
  }
};

// ViewControls configuration
const addActions = [
  {
    label: 'Ny båtkund',
    icon: Plus,
    onClick: handleNewCustomer,
  },
  {
    label: 'Importera',
    icon: Upload,
    onClick: importCustomers,
    class: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
];

const additionalActions = [
  {
    label: 'Exportera',
    icon: Download,
    onClick: exportCustomers,
  },
  {
    label: 'Skicka e-post',
    icon: Mail,
    onClick: () => {
      const customersWithEmail = filteredCustomers.value.filter((c: any) => c.Email);
      if (customersWithEmail.length > 0) {
        const emails = customersWithEmail.map((c: any) => c.Email).join(',');
        window.open(`mailto:${emails}`);
      }
    },
  },
];

const filters = computed(() => [
  {
    modelValue: statusFilter.value,
    placeholder: 'Status',
    options: [
      { key: 'all', label: 'Alla status', value: 'all' },
      { key: 'active', label: 'Aktiva', value: 'active' },
      { key: 'inactive', label: 'Inaktiva', value: 'inactive' },
    ],
    onChange: (value: string) => {
      statusFilter.value = value;
    },
  },
  {
    modelValue: typeFilter.value,
    placeholder: 'Typ',
    options: [
      { key: 'all', label: 'Alla typer', value: 'all' },
      { key: 'company', label: 'Företag', value: 'company' },
      { key: 'individual', label: 'Privatperson', value: 'individual' },
    ],
    onChange: (value: string) => {
      typeFilter.value = value;
    },
  },
]);
</script>

<template>
  <PageLayout title="Båtkunder" breadcrumbs="Dashboard / Båtar / Kunder" show-stats :stats="stats">
    <!-- ViewControls -->
    <ViewControls
      v-model:search-query="searchQuery"
      :add-actions="addActions"
      :additional-actions="additionalActions"
      :filters="filters"
      search-placeholder="Sök kunder..."
    />

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar båtkunder...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av båtkunder</p>
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
      :data="filteredCustomers"
      :columns="columns"
      :search-fields="['CompanyName', 'ContactPerson', 'CustomerNumber', 'Email', 'City']"
      @row-click="handleRowClick"
    >
      <template #cell-Status="{ value }">
        <Badge :variant="getStatusVariant(value)">
          {{ value === 'active' ? 'Aktiv' : 'Inaktiv' }}
        </Badge>
      </template>

      <template #cell-actions="{ row }">
        <div class="flex gap-2">
          <Button size="sm" variant="outline" @click="handleViewCustomer(row)">Visa</Button>
          <Button size="sm" variant="outline" @click="handleEditCustomer(row)">Redigera</Button>
          <Button
            v-if="row.Email"
            size="sm"
            variant="outline"
            @click="handleSendEmail(row, $event)"
          >
            E-post
          </Button>
        </div>
      </template>
    </DataTable>
  </PageLayout>
</template>
