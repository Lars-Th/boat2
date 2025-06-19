<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useApiList } from '@/composables/useApi';
import { useToast } from '@/composables/useToast';
import api from '@/api';
import type { ContactWithRelations } from '@/types/relationships';
import type { TableColumn } from '@/types';

// Components
import ListPage from '@/components/shared/ListPage.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Mail, Phone, Plus, Trash2 } from 'lucide-vue-next';

const router = useRouter();
const { success, error } = useToast();

// Filter state
const contactTypeFilter = ref('all');
const searchQuery = ref('');

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(25);

// Reset pagination when filters change
watch([searchQuery, contactTypeFilter], () => {
  currentPage.value = 1;
});

// Fetch contacts with relations
const {
  data: contacts,
  loading: contactsLoading,
  error: contactsError,
  refresh: refreshContacts,
} = useApiList(() => api.contacts.getAll({ include: ['customer'] }), {
  cacheKey: 'contacts-with-customer',
});

// Table columns
const columns: TableColumn<Record<string, unknown>>[] = [
  { key: 'FullName', label: 'Namn', sortable: true, type: 'custom' },
  { key: 'Title', label: 'Titel', sortable: true },
  { key: 'CustomerName', label: 'Företag', sortable: true, type: 'custom' },
  { key: 'Email', label: 'E-post', sortable: true },
  { key: 'Phone', label: 'Telefon', sortable: false },
  { key: 'Department', label: 'Avdelning', sortable: true },
  { key: 'IsPrimary', label: 'Typ', sortable: true, type: 'custom' },
  { key: 'actions', label: 'Åtgärder', sortable: false, type: 'actions' },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Dashboard', to: '/' },
  { label: 'Kontaktpersoner', to: '', isCurrentPage: true },
]);

// Statistics
const stats = computed(() => {
  if (!contacts.value) {
    return [
      { label: 'Totalt', value: '---', color: 'text-blue-600' },
      { label: 'Huvudkontakter', value: '---', color: 'text-green-600' },
      { label: 'Sekundära', value: '---', color: 'text-purple-600' },
      { label: 'Företag', value: '---', color: 'text-orange-600' },
    ];
  }

  const primaryContacts = contacts.value.filter((c: any) => c.IsPrimary === true).length;
  const secondaryContacts = contacts.value.filter((c: any) => c.IsPrimary === false).length;
  const uniqueCustomers = new Set(contacts.value.map((c: any) => c.CustomerID)).size;

  return [
    {
      label: 'Totalt',
      value: contacts.value.length,
      color: 'text-blue-600',
    },
    {
      label: 'Huvudkontakter',
      value: primaryContacts,
      color: 'text-green-600',
    },
    {
      label: 'Sekundära',
      value: secondaryContacts,
      color: 'text-purple-600',
    },
    {
      label: 'Företag',
      value: uniqueCustomers,
      color: 'text-orange-600',
    },
  ];
});

// Filtered contacts based on type and search
const filteredContacts = computed(() => {
  if (!contacts.value) return [];

  let filtered = contacts.value;

  // Apply type filter
  if (contactTypeFilter.value !== 'all') {
    filtered = filtered.filter((contact: any) => {
      if (contactTypeFilter.value === 'primary') return contact.IsPrimary === true;
      if (contactTypeFilter.value === 'secondary') return contact.IsPrimary === false;
      return true;
    });
  }

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((contact: any) => {
      const fullName = `${contact.FirstName ?? ''} ${contact.LastName ?? ''}`.toLowerCase();
      const title = (contact.Title ?? '').toLowerCase();
      const email = (contact.Email ?? '').toLowerCase();
      const phone = (contact.Phone ?? '').toLowerCase();
      const department = (contact.Department ?? '').toLowerCase();
      const customerName = (contact.customer?.CompanyName ?? '').toLowerCase();

      return (
        fullName.includes(query) ||
        title.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        department.includes(query) ||
        customerName.includes(query)
      );
    });
  }

  return filtered;
});

// Paginated contacts
const paginatedContacts = computed(() => {
  const filtered = filteredContacts.value;
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filtered.slice(start, end);
});

// Action buttons for ListPage
const addActions = computed(() => [
  {
    label: 'Ny kontaktperson',
    icon: Plus,
    onClick: handleNewContact,
    variant: 'default' as const,
  },
]);

// Filters for ListPage
const filters = computed(() => [
  {
    modelValue: contactTypeFilter.value,
    placeholder: 'Alla typer',
    options: [
      { key: 'all', label: 'Alla typer', value: 'all' },
      { key: 'primary', label: 'Huvudkontakter', value: 'primary' },
      { key: 'secondary', label: 'Sekundära', value: 'secondary' },
    ],
    onChange: (value: string) => {
      contactTypeFilter.value = value;
    },
  },
]);

// Helper functions
const getContactTypeVariant = (isPrimary: boolean) => {
  return isPrimary ? 'default' : 'secondary';
};

const getCustomerName = (contact: ContactWithRelations): string => {
  return contact.customer?.CompanyName ?? 'Okänd kund';
};

const getFullName = (contact: ContactWithRelations): string => {
  if (contact.fullName) {
    return contact.fullName;
  }
  return `${contact.FirstName} ${contact.LastName}`.trim();
};

// Event handlers
const handleNewContact = () => {
  router.push('/contacts/new');
};

const handleRowClick = (contact: any) => {
  router.push(`/contacts/${contact.ContactID}`);
};

const handleEditContact = (contact: any) => {
  router.push(`/contacts/${contact.ContactID}/edit`);
};

const handleCallContact = (contact: any, event: Event) => {
  event.stopPropagation();
  const phone = contact.Phone ?? contact.Mobile;
  if (phone) {
    const telLink = document.createElement('a');
    telLink.href = `tel:${phone}`;
    telLink.click();
  }
};

const handleSendEmail = (contact: any, event: Event) => {
  event.stopPropagation();
  const emailLink = document.createElement('a');
  emailLink.href = `mailto:${contact.Email}`;
  emailLink.click();
};

const handleDeleteContact = async (contact: any, event: Event) => {
  event.stopPropagation();

  const confirmed = `Är du säker på att du vill ta bort kontaktpersonen "${contact.FirstName} ${contact.LastName}"?`;

  if (confirmed) {
    try {
      const result = await api.contacts.delete(contact.ContactID);
      if (result.success) {
        success('Kontaktperson borttagen', 'Kontaktpersonen har tagits bort framgångsrikt.');
        await refreshContacts();
      } else {
        error(
          'Fel vid borttagning',
          result.error?.message ?? 'Kunde inte ta bort kontaktpersonen.'
        );
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
const isLoading = computed(() => contactsLoading.value);
const hasError = computed(() => contactsError.value !== null);
</script>

<template>
  <div>
    <ListPage
      title="Kontaktpersoner"
      description="Hantera kontaktpersoner och deras information"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
      :search-query="searchQuery"
      search-placeholder="Sök kontaktpersoner..."
      :add-actions="addActions"
      :filters="filters"
      :show-view-switcher="false"
      :data="paginatedContacts ?? []"
      :columns="columns"
      :search-fields="['FirstName', 'LastName', 'Title', 'Email', 'Phone', 'Department']"
      :loading="isLoading"
      :total-items="filteredContacts.length"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :has-error="hasError"
      error-message="Ett fel uppstod vid laddning av kontaktpersoner"
      @update:search-query="searchQuery = $event"
      @update:current-page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
      @row-click="handleRowClick"
      @refresh="refreshContacts"
    >
      <!-- Custom cell templates -->
      <template #cell-FullName="{ row }">
        <div class="font-medium">{{ row['FirstName'] }} {{ row['LastName'] }}</div>
      </template>

      <template #cell-CustomerName="{ row }">
        <span class="text-muted-foreground">{{ getCustomerName(row) }}</span>
      </template>

      <template #cell-IsPrimary="{ row }">
        <Badge :variant="getContactTypeVariant(row['IsPrimary'])">
          {{ row['IsPrimary'] ? 'Huvudkontakt' : 'Sekundär' }}
        </Badge>
      </template>

      <template #row-actions="{ row }">
        <Button
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Redigera"
          @click="handleEditContact(row)"
        >
          <Edit class="h-3.5 w-3.5" />
        </Button>
        <Button
          v-if="row['Phone'] || row['Mobile']"
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          title="Ring"
          @click="handleCallContact(row, $event)"
        >
          <Phone class="h-3.5 w-3.5" />
        </Button>
        <Button
          v-if="row['Email']"
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
          title="E-post"
          @click="handleSendEmail(row, $event)"
        >
          <Mail class="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          class="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          title="Radera"
          @click="handleDeleteContact(row, $event)"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </template>
    </ListPage>
  </div>
</template>
