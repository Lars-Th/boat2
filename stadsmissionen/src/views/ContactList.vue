<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import ListPage from '@/components/shared/ListPage.vue';
import { Phone, Plus } from 'lucide-vue-next';

const router = useRouter();

// Import contact data
import contactsData from '@/assets/data/customerContacts.json';
import customersData from '@/assets/data/customers.json';

// State
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const loading = ref(false);
const hasError = ref(false);

// Combine contact data with customer names
const enrichedContacts = computed(() => {
  return contactsData.map(contact => {
    const customer = customersData.find(c => c.id === contact.customer_id);
    return {
      ...contact,
      customer_name: customer
        ? `${customer.first_name} ${customer.name}`.trim() || customer.name
        : 'Okänd kund',
      customer_display_name: customer?.display_name || 'Okänd kund',
    };
  });
});

// Filtered data based on search
const filteredData = computed(() => {
  if (!searchQuery.value) return enrichedContacts.value;

  const query = searchQuery.value.toLowerCase();
  return enrichedContacts.value.filter(
    contact =>
      contact.first_name.toLowerCase().includes(query) ||
      contact.last_name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.phone.toLowerCase().includes(query) ||
      contact.note.toLowerCase().includes(query) ||
      contact.customer_name.toLowerCase().includes(query) ||
      contact.customer_display_name.toLowerCase().includes(query)
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
    key: 'first_name',
    label: 'Förnamn',
    sortable: true,
  },
  {
    key: 'last_name',
    label: 'Efternamn',
    sortable: true,
  },
  {
    key: 'phone',
    label: 'Telefon',
    sortable: true,
  },
  {
    key: 'email',
    label: 'E-post',
    sortable: true,
  },
  {
    key: 'customer_display_name',
    label: 'Tillhör kund',
    sortable: true,
  },
  {
    key: 'note',
    label: 'Anteckning',
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
    label: 'Lägg till kontaktperson',
    icon: Plus,
    onClick: () => {
      // Create a new contact with default values
      const newContact = {
        id: Math.max(...contactsData.map(c => c.id)) + 1,
        customer_id: 1, // Default to first customer
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        note: '', // Use 'note' instead of 'notes' to match the data structure
      };

      // Add to data temporarily and navigate to detail
      contactsData.push(newContact);
      router.push(`/contacts/${newContact.id}?isNew=true`);
    },
    variant: 'default' as const,
  },
];

// Breadcrumbs
const breadcrumbs = [
  { label: 'Start', path: '/home' },
  { label: 'Kontaktpersoner', path: '/contacts' },
];

// Stats
const stats = computed(() => [
  {
    label: 'Totalt antal kontaktpersoner',
    value: enrichedContacts.value.length.toString(),
    icon: Phone,
  },
  {
    label: 'Unika kunder',
    value: new Set(enrichedContacts.value.map(c => c.customer_id)).size.toString(),
    icon: Phone,
  },
]);

// Event handlers
const handleRowClick = (contact: any) => {
  console.log('Klickade på kontaktperson:', contact);
  router.push(`/contacts/${contact.id}`);
};

const handleEdit = (contact: any) => {
  console.log('Redigera kontaktperson:', contact);
  router.push(`/contacts/${contact.id}`);
};

const handleDelete = (contact: any, event: Event) => {
  event.stopPropagation();
  console.log('Radera kontaktperson:', contact);
  // Implement delete functionality
  // if (confirm(`Är du säker på att du vill radera kontaktpersonen ${contact.first_name} ${contact.last_name}?`)) {
  //   // Delete contact
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
    title="Kontaktpersoner"
    description="Hantera kontaktpersoner för dina kunder"
    :breadcrumbs="breadcrumbs"
    :show-stats="true"
    :stats="stats"
    :search-query="searchQuery"
    search-placeholder="Sök kontaktpersoner..."
    :add-actions="addActions"
    :data="paginatedData"
    :columns="columns"
    :search-fields="[
      'first_name',
      'last_name',
      'email',
      'phone',
      'note',
      'customer_name',
      'customer_display_name',
    ]"
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
