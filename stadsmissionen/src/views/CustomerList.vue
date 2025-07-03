<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ListPage from '@/components/shared/ListPage.vue';
import { Plus, Users } from 'lucide-vue-next';

const router = useRouter();

// Import customer data
import customersData from '@/assets/data/customers.json';

// State
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const loading = ref(false);
const hasError = ref(false);

// Filtered data based on search
const filteredData = computed(() => {
  if (!searchQuery.value) return customersData;

  const query = searchQuery.value.toLowerCase();
  return customersData.filter(
    customer =>
      customer.customer_no.toLowerCase().includes(query) ||
      customer.display_name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.external_id.toLowerCase().includes(query)
  );
});

// Paginated data
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

// Table columns
const columns = [
  {
    key: 'customer_no',
    label: 'Kundnr',
    sortable: true,
    width: '100px',
  },
  {
    key: 'external_id',
    label: 'Externt ID',
    sortable: true,
  },
  {
    key: 'display_name',
    label: 'Visningsnamn',
    sortable: true,
  },
  {
    key: 'email',
    label: 'E-post',
    sortable: true,
  },
  {
    key: 'phone',
    label: 'Telefon',
    sortable: true,
  },
  {
    key: 'city',
    label: 'Stad',
    sortable: true,
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    type: 'actions',
    width: '120px',
    align: 'right',
  },
];

// Action buttons
const addActions = [
  {
    label: 'Lägg till kund',
    icon: Plus,
    onClick: () => {
      // Navigate to customer detail with isNew flag - CustomerDetail will handle creation
      const newId = Math.max(...customersData.map(c => c.id)) + 1;
      router.push(`/customers/${newId}?isNew=true`);
    },
    variant: 'default' as const,
  },
];

// Breadcrumbs
const breadcrumbs = [
  { label: 'Start', path: '/home' },
  { label: 'Kunder', path: '/customers' },
];

// Stats
const stats = computed(() => [
  {
    label: 'Totalt antal kunder',
    value: customersData.length.toString(),
    icon: Users,
  },
]);

// Event handlers
const handleRowClick = (customer: any) => {
  console.log('Klickade på kund:', customer);
  router.push(`/customers/${customer.id}`);
};

const handleEdit = (customer: any) => {
  console.log('Redigera kund:', customer);
  router.push(`/customers/${customer.id}`);
};

const handleDelete = (customer: any, event: Event) => {
  event.stopPropagation();
  console.log('Radera kund:', customer);
  // Implement delete functionality
  // if (confirm(`Är du säker på att du vill radera kunden ${customer.display_name}?`)) {
  //   // Delete customer
  // }
};

const handleRefresh = () => {
  loading.value = true;
  // Simulate refresh
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};

onMounted(() => {
  // Any initialization logic
});
</script>

<template>
  <ListPage
    title="Kunder"
    description="Hantera dina kunder - både privatpersoner och företag"
    :breadcrumbs="breadcrumbs"
    :show-stats="true"
    :stats="stats"
    :search-query="searchQuery"
    search-placeholder="Sök kunder..."
    :add-actions="addActions"
    :data="paginatedData"
    :columns="columns"
    :search-fields="['customer_no', 'display_name', 'email', 'external_id']"
    :loading="loading"
    :total-items="filteredData.length"
    :current-page="currentPage"
    :items-per-page="itemsPerPage"
    :has-error="hasError"
    @update:search-query="searchQuery = $event"
    @update:current-page="currentPage = $event"
    @update:items-per-page="itemsPerPage = $event"
    @row-click="handleRowClick"
    @edit="handleEdit"
    @delete="handleDelete"
    @refresh="handleRefresh"
  />
</template>
