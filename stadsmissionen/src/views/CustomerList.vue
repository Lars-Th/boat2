<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import api from '@/api';
import type { CustomerWithRelations } from '@/types/relationships';
import type { TableColumn } from '@/types';

// Components
import ListPage from '@/components/shared/ListPage.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Mail, Phone, Plus, Trash2, User, UserPlus, Users } from 'lucide-vue-next';

const router = useRouter();
const { success, error } = useToast();

// Filter state
const statusFilter = ref('all');
const searchQuery = ref('');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Reset pagination when filters change
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
});

// Fetch customers with relations using enhanced API service
const {
  data: customers,
  loading: customersLoading,
  error: customersError,
  refresh: refreshCustomers,
} = useApiList(() => api.customers.getAll({ include: ['contacts', 'workOrders'] }), {
  cacheKey: 'customers-with-relations',
});

// Table columns
const columns: TableColumn<Record<string, unknown>>[] = [
  { key: 'CustomerNumber', label: 'Kundnummer', sortable: true, width: '120px' },
  { key: 'CompanyName', label: 'Företag', sortable: true, type: 'custom' },
  { key: 'PrimaryContact', label: 'Huvudkontakt', sortable: false, type: 'custom' },
  { key: 'ContactCount', label: 'Kontaktpersoner', sortable: false, type: 'custom' },
  { key: 'ContactPhone', label: 'Telefon', sortable: false, type: 'custom' },
  { key: 'ContactEmail', label: 'E-post', sortable: false, type: 'custom' },
  { key: 'City', label: 'Ort', sortable: true },
  { key: 'Status', label: 'Status', sortable: true, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, type: 'actions' },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Kunder', to: '', isCurrentPage: true },
]);

// Statistics
const stats = computed(() => {
  if (!customers.value) {
    return [
      { label: 'Totalt', value: '---', color: 'text-blue-600' },
      { label: 'Aktiva', value: '---', color: 'text-green-600' },
      { label: 'Inaktiva', value: '---', color: 'text-orange-600' },
      { label: 'Kontaktpersoner', value: '---', color: 'text-purple-600' },
    ];
  }

  const activeCustomers = customers.value.filter(
    (c: CustomerWithRelations) => c.Status === 'active'
  ).length;
  const inactiveCustomers = customers.value.filter(
    (c: CustomerWithRelations) => c.Status === 'inactive'
  ).length;
  const totalContacts = customers.value.reduce((total: number, customer: CustomerWithRelations) => {
    return total + (customer.contacts ? customer.contacts.length : 0);
  }, 0);

  return [
    {
      label: 'Totalt',
      value: customers.value.length,
      color: 'text-blue-600',
    },
    {
      label: 'Aktiva',
      value: activeCustomers,
      color: 'text-green-600',
    },
    {
      label: 'Inaktiva',
      value: inactiveCustomers,
      color: 'text-orange-600',
    },
    {
      label: 'Kontaktpersoner',
      value: totalContacts,
      color: 'text-purple-600',
    },
  ];
});

// Filtered customers based on status and search
const filteredCustomers = computed(() => {
  if (!customers.value) return [];

  return customers.value.filter((customer: CustomerWithRelations) => {
    // Status filter
    const matchesStatus = statusFilter.value === 'all' || customer.Status === statusFilter.value;

    // Search filter
    const matchesSearch =
      !searchQuery.value ||
      [
        customer.CompanyName,
        customer.CustomerNumber,
        customer.City,
        getPrimaryContactName(customer),
        getPrimaryContactPhone(customer),
        getPrimaryContactEmail(customer),
      ].some(field => field?.toString().toLowerCase().includes(searchQuery.value.toLowerCase()));

    return matchesStatus && matchesSearch;
  });
});

// Paginated customers
const paginatedCustomers = computed(() => {
  const filtered = filteredCustomers.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filtered.slice(start, end);
});

// Action buttons for ListPage
const addActions = computed(() => [
  {
    label: 'Ny kund',
    icon: Plus,
    onClick: handleNewCustomer,
    variant: 'default' as const,
  },
]);

// Filters for ListPage
const filters = computed(() => [
  {
    modelValue: statusFilter.value,
    placeholder: 'Alla statusar',
    options: [
      { key: 'all', label: 'Alla statusar', value: 'all' },
      { key: 'active', label: 'Aktiva', value: 'active' },
      { key: 'inactive', label: 'Inaktiva', value: 'inactive' },
    ],
    onChange: (value: string) => {
      statusFilter.value = value;
    },
  },
]);

// Helper functions
const getBadgeVariant = (status: string) => {
  return status === 'inactive' ? 'secondary' : 'default';
};

const formatStatus = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const getPrimaryContactName = (customer: CustomerWithRelations): string => {
  if (customer.primaryContact) {
    return (
      customer.primaryContact.fullName ??
      `${customer.primaryContact.FirstName} ${customer.primaryContact.LastName}`
    );
  }

  if (customer.contacts && customer.contacts.length > 0) {
    const primary = customer.contacts.find(c => c.IsPrimary === true);
    if (primary) {
      return primary.fullName ?? `${primary.FirstName} ${primary.LastName}`;
    }
  }

  return '-';
};

const getPrimaryContactPhone = (customer: CustomerWithRelations): string => {
  if (customer.primaryContact?.Phone) {
    return customer.primaryContact.Phone;
  }

  if (customer.contacts && customer.contacts.length > 0) {
    const primary = customer.contacts.find(c => c.IsPrimary === true);
    if (primary?.Phone) {
      return primary.Phone;
    }
  }

  return '-';
};

const getPrimaryContactEmail = (customer: CustomerWithRelations): string => {
  if (customer.primaryContact?.Email) {
    return customer.primaryContact.Email;
  }

  if (customer.contacts && customer.contacts.length > 0) {
    const primary = customer.contacts.find(c => c.IsPrimary === true);
    if (primary?.Email) {
      return primary.Email;
    }
  }

  return '-';
};

const getContactCount = (customer: CustomerWithRelations): number => {
  return customer.contacts?.length ?? 0;
};

const hasPrimaryContact = (customer: CustomerWithRelations): boolean => {
  if (!customer.contacts || customer.contacts.length === 0) return false;
  return customer.contacts.some(contact => contact.IsPrimary === true);
};

// Event handlers
const handleNewCustomer = () => {
  router.push('/customers/new');
};

const handleRowClick = (customer: CustomerWithRelations) => {
  router.push(`/customers/${customer.CustomerID}`);
};

const handleEditCustomer = (customer: CustomerWithRelations) => {
  router.push(`/customers/${customer.CustomerID}/edit`);
};

const handleCallCustomer = (customer: CustomerWithRelations, event: Event) => {
  event.stopPropagation();
  const phone = getPrimaryContactPhone(customer);
  if (phone && phone !== '-') {
    const telLink = document.createElement('a');
    telLink.href = `tel:${phone}`;
    telLink.click();
  }
};

const handleSendEmail = (customer: CustomerWithRelations, event: Event) => {
  event.stopPropagation();
  const email = getPrimaryContactEmail(customer);
  if (email && email !== '-') {
    const emailLink = document.createElement('a');
    emailLink.href = `mailto:${email}`;
    emailLink.click();
  }
};

const handleAddPrimaryContact = (customer: CustomerWithRelations, event: Event) => {
  event.stopPropagation();
  router.push(`/contacts/new?customerId=${customer.CustomerID}`);
};

const handleDeleteCustomer = async (customer: CustomerWithRelations, event: Event) => {
  event.stopPropagation();

  const confirmed = confirm(`Är du säker på att du vill ta bort kunden "${customer.CompanyName}"?`);

  if (confirmed) {
    try {
      const result = await api.customers.delete(customer.CustomerID.toString());
      if (result.success) {
        success('Kund borttagen', 'Kunden har tagits bort framgångsrikt.');
        await refreshCustomers();
      } else {
        error('Fel vid borttagning', result.error?.message ?? 'Kunde inte ta bort kunden.');
      }
    } catch (err) {
      error('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.');
    }
  }
};

// Pagination handlers
const handlePageUpdate = (page: number) => {
  currentPage.value = page;
};

const handleItemsPerPageUpdate = (newItemsPerPage: number) => {
  itemsPerPage.value = newItemsPerPage;
  currentPage.value = 1;
};

// Loading and error states
const isLoading = computed(() => customersLoading.value);
const hasError = computed(() => customersError.value !== null);
</script>

<template>
  <div>
    <ListPage
      title="Kunder"
      description="Hantera kunder och deras information"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
      :search-query="searchQuery"
      search-placeholder="Sök kunder..."
      :add-actions="addActions"
      :filters="filters"
      :show-view-switcher="false"
      :data="paginatedCustomers || []"
      :columns="columns"
      :search-fields="['CompanyName', 'CustomerNumber', 'Email', 'City']"
      :loading="isLoading"
      :total-items="filteredCustomers.length"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :has-error="hasError"
      error-message="Ett fel uppstod vid laddning av kunder"
      @update:search-query="searchQuery = $event"
      @update:current-page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
      @row-click="handleRowClick"
      @refresh="refreshCustomers"
    >
      <!-- Custom cell templates -->
      <template #cell-CompanyName="{ row }">
        <span class="font-bold">{{ row.CompanyName }}</span>
      </template>

      <template #cell-PrimaryContact="{ row }">
        <span class="text-muted-foreground">{{ getPrimaryContactName(row) }}</span>
      </template>

      <template #cell-ContactCount="{ row }">
        <Badge :variant="getBadgeVariant(row.Status)" class="gap-1">
          <User v-if="getContactCount(row) < 2" class="h-3 w-3" />
          <Users v-else class="h-3 w-3" />
          {{ getContactCount(row) }}
        </Badge>
      </template>

      <template #cell-ContactPhone="{ row }">
        <span class="text-muted-foreground">{{ getPrimaryContactPhone(row) }}</span>
      </template>

      <template #cell-ContactEmail="{ row }">
        <span class="text-muted-foreground">{{ getPrimaryContactEmail(row) }}</span>
      </template>

      <template #cell-Status="{ row }">
        <Badge :variant="getBadgeVariant(row.Status)">
          {{ formatStatus(row.Status) }}
        </Badge>
      </template>

      <template #row-actions="{ row }">
        <Button
          v-if="getPrimaryContactPhone(row) !== '-'"
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Ring"
          @click="handleCallCustomer(row, $event)"
        >
          <Phone class="h-3.5 w-3.5" />
        </Button>
        <Button
          v-if="getPrimaryContactEmail(row) !== '-'"
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          title="E-post"
          @click="handleSendEmail(row, $event)"
        >
          <Mail class="h-3.5 w-3.5" />
        </Button>
        <Button
          v-if="!hasPrimaryContact(row)"
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          title="Lägg till primärkontakt"
          @click="handleAddPrimaryContact(row, $event)"
        >
          <UserPlus class="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Redigera"
          @click="handleEditCustomer(row)"
        >
          <Edit class="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Radera"
          @click="handleDeleteCustomer(row, $event)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </template>
    </ListPage>
  </div>
</template>
