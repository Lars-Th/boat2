<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiItem } from '@/composables/useApi';
import api from '@/api';

// Components
import ComplexDetailPage from '@/components/shared/ComplexDetailPage.vue';
import { ArrowLeft, FileText, Save, Trash2, User } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();

const customerId = route.params.id as string;
const isNew = computed(() => customerId === 'new');

// API calls
const {
  data: customer,
  loading: customerLoading,
  error: customerError,
  refresh: refreshCustomer,
} = useApiItem(
  () => {
    if (isNew.value) return Promise.resolve(null);
    return api.customers.getById(customerId, {
      include: ['contacts', 'workOrders'],
    });
  },
  {
    cacheKey: `customer-${customerId}`,
  }
);

// Form state
const form = ref({
  CustomerID: null as number | null,
  CustomerNumber: '',
  CompanyName: '',
  OrganizationNumber: '',
  ContactPerson: '',
  Phone: '',
  Email: '',
  Address: '',
  PostalCode: '',
  City: '',
  Country: 'Sverige',
  InvoiceAddress: {
    Address: '',
    PostalCode: '',
    City: '',
  },
  PaymentTerms: 30,
  VATNumber: '',
  Status: 'active',
  Notes: '',
});

const hasUnsavedChanges = ref(false);

// Watch for customer data and populate form
watch(
  customer,
  newCustomer => {
    if (newCustomer) {
      form.value = {
        CustomerID: newCustomer.CustomerID,
        CustomerNumber: newCustomer.CustomerNumber || '',
        CompanyName: newCustomer.CompanyName || '',
        OrganizationNumber: newCustomer.OrganizationNumber || '',
        ContactPerson: newCustomer.ContactPerson ?? '',
        Phone: newCustomer.Phone || '',
        Email: newCustomer.Email || '',
        Address: newCustomer.Address || '',
        PostalCode: newCustomer.PostalCode || '',
        City: newCustomer.City || '',
        Country: newCustomer.Country ?? 'Sverige',
        InvoiceAddress: {
          Address: newCustomer.InvoiceAddress?.Address || '',
          PostalCode: newCustomer.InvoiceAddress?.PostalCode || '',
          City: newCustomer.InvoiceAddress?.City || '',
        },
        PaymentTerms: newCustomer.PaymentTerms || 30,
        VATNumber: newCustomer.VATNumber || '',
        Status: newCustomer.Status || 'active',
        Notes: newCustomer.Notes || '',
      };
      hasUnsavedChanges.value = false;
    }
  },
  { immediate: true }
);

// Initialize form for new customer
if (isNew.value) {
  hasUnsavedChanges.value = false;
}

// Field definitions for ComplexDetailPage
const mainFields = computed(() => [
  { key: 'CustomerNumber', label: 'Kundnummer', type: 'text' as const },
  { key: 'CompanyName', label: 'Företagsnamn', type: 'text' as const },
  { key: 'OrganizationNumber', label: 'Organisationsnummer', type: 'text' as const },
  { key: 'ContactPerson', label: 'Kontaktperson', type: 'text' as const },
  { key: 'Phone', label: 'Telefon', type: 'text' as const },
  { key: 'Email', label: 'E-post', type: 'text' as const },
  { key: 'Address', label: 'Adress', type: 'text' as const },
  { key: 'PostalCode', label: 'Postnummer', type: 'text' as const },
  { key: 'City', label: 'Ort', type: 'text' as const },
  { key: 'Country', label: 'Land', type: 'text' as const },
  { key: 'VATNumber', label: 'Momsnummer', type: 'text' as const },
  {
    key: 'Status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'active', label: 'Aktiv' },
      { value: 'inactive', label: 'Inaktiv' },
    ],
  },
  { key: 'Notes', label: 'Anteckningar', type: 'textarea' as const },
]);

const sidebarFields = computed(() => [
  { key: 'PaymentTerms', label: 'Betalningsvillkor (dagar)', type: 'number' as const },
  { key: 'CreatedDate', label: 'Skapad', type: 'date' as const },
]);

// Sub-tables for related data
const subTables = computed(() => {
  if (!customer.value) return [];

  const contacts = customer.value.contacts ?? [];
  const workOrders = customer.value.workOrders ?? [];

  return [
    {
      key: 'contacts',
      title: 'Kontaktpersoner',
      icon: User,
      data: contacts,
      allowAdd: true,
      allowEdit: true,
      allowDelete: true,
      columns: [
        { key: 'FirstName', label: 'Förnamn', sortable: true },
        { key: 'LastName', label: 'Efternamn', sortable: true },
        { key: 'Title', label: 'Titel', sortable: true },
        { key: 'Email', label: 'E-post', sortable: true },
        { key: 'Phone', label: 'Telefon', sortable: false },
        { key: 'IsPrimary', label: 'Primär', sortable: true, type: 'custom' as const },
        { key: 'actions', label: 'Åtgärder', type: 'actions' as const, width: '100px' },
      ],
    },
    {
      key: 'workOrders',
      title: 'Arbetsordrar',
      icon: FileText,
      data: workOrders,
      allowAdd: true,
      allowEdit: true,
      allowDelete: false,
      columns: [
        { key: 'WorkOrderNumber', label: 'Ordernummer', sortable: true },
        { key: 'Title', label: 'Titel', sortable: true },
        { key: 'Type', label: 'Typ', sortable: true, type: 'custom' as const },
        { key: 'Status', label: 'Status', sortable: true, type: 'custom' as const },
        { key: 'CreatedDate', label: 'Skapad', sortable: true, type: 'custom' as const },
        { key: 'actions', label: 'Åtgärder', type: 'actions' as const, width: '100px' },
      ],
    },
  ];
});

// Statistics
const stats = computed(() => {
  if (!customer.value) return [];

  const contacts = customer.value.contacts ?? [];
  const workOrders = customer.value.workOrders ?? [];

  return [
    {
      label: 'Kontaktpersoner',
      value: contacts.length,
      color: 'text-blue-600',
    },
    {
      label: 'Arbetsordrar',
      value: workOrders.length,
      color: 'text-green-600',
    },
    {
      label: 'Aktiva ordrar',
      value: workOrders.filter((wo: any) => wo.Status === 'active').length,
      color: 'text-orange-600',
    },
  ];
});

// Breadcrumbs
const breadcrumbs = computed(() => {
  if (isNew.value) {
    return [
      { label: 'Dashboard', to: '/' },
      { label: 'Kunder', to: '/customers' },
      { label: 'Ny kund', to: '', isCurrentPage: true },
    ];
  }
  return [
    { label: 'Dashboard', to: '/' },
    { label: 'Kunder', to: '/customers' },
    { label: customer.value?.CompanyName ?? 'Kunddetaljer', to: '', isCurrentPage: true },
  ];
});

// Page title
const pageTitle = computed(() => {
  if (isNew.value) return 'Lägg till ny kund';
  return customer.value?.CompanyName ?? 'Kunddetaljer';
});

// Event handlers
const handleFieldChange = (key: string, value: any) => {
  if (key.includes('.')) {
    // Handle nested objects like InvoiceAddress.Address
    const [parent, child] = key.split('.');
    if (parent === 'InvoiceAddress') {
      form.value.InvoiceAddress = {
        ...form.value.InvoiceAddress,
        [child]: value,
      };
    }
  } else {
    (form.value as any)[key] = value;
  }
  hasUnsavedChanges.value = true;
};

const handleSave = async () => {
  try {
    if (isNew.value) {
      // Create new customer
      const result = await api.customers.create(form.value);
      if (result.success) {
        success('Kund skapad', 'Den nya kunden har skapats framgångsrikt.');
        router.push(`/customers/${result.data.CustomerID}`);
      } else {
        error('Fel vid skapande', result.error?.message ?? 'Kunde inte skapa kunden.');
      }
    } else {
      // Update existing customer
      const result = await api.customers.update(customerId, form.value);
      if (result.success) {
        success('Kund uppdaterad', 'Kunduppgifterna har uppdaterats framgångsrikt.');
        hasUnsavedChanges.value = false;
        await refreshCustomer();
      } else {
        error('Fel vid uppdatering', result.error?.message ?? 'Kunde inte uppdatera kunden.');
      }
    }
  } catch (err) {
    error('Fel vid sparande', 'Ett oväntat fel inträffade. Försök igen.');
  }
};

const handleDelete = async () => {
  if (isNew.value) return;

  try {
    const result = await api.customers.delete(customerId);
    if (result.success) {
      success('Kund borttagen', 'Kunden har tagits bort framgångsrikt.');
      router.push('/customers');
    } else {
      error('Fel vid borttagning', result.error?.message ?? 'Kunde inte ta bort kunden.');
    }
  } catch (err) {
    error('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.');
  }
};

const handleBack = () => {
  router.push('/customers');
};

const handleDiscardChanges = () => {
  if (customer.value) {
    // Reset form to original data
    form.value = {
      CustomerID: customer.value.CustomerID,
      CustomerNumber: customer.value.CustomerNumber || '',
      CompanyName: customer.value.CompanyName || '',
      OrganizationNumber: customer.value.OrganizationNumber || '',
      ContactPerson: customer.value.ContactPerson ?? '',
      Phone: customer.value.Phone || '',
      Email: customer.value.Email || '',
      Address: customer.value.Address || '',
      PostalCode: customer.value.PostalCode || '',
      City: customer.value.City || '',
      Country: customer.value.Country || 'Sverige',
      InvoiceAddress: {
        Address: customer.value.InvoiceAddress?.Address || '',
        PostalCode: customer.value.InvoiceAddress?.PostalCode || '',
        City: customer.value.InvoiceAddress?.City || '',
      },
      PaymentTerms: customer.value.PaymentTerms || 30,
      VATNumber: customer.value.VATNumber || '',
      Status: customer.value.Status || 'active',
      Notes: customer.value.Notes || '',
    };
  }
  hasUnsavedChanges.value = false;
};

// Sub-table event handlers
const handleAddSubItem = (tableKey: string) => {
  switch (tableKey) {
    case 'contacts':
      router.push(`/contacts/new?customerId=${customerId}`);
      break;
    case 'workOrders':
      router.push(`/work-orders/new?customerId=${customerId}`);
      break;
  }
};

const handleEditSubItem = (tableKey: string, item: any) => {
  switch (tableKey) {
    case 'contacts':
      router.push(`/contacts/${item.ContactID}`);
      break;
    case 'workOrders':
      router.push(`/work-orders/${item.WorkOrderID}`);
      break;
  }
};

const handleDeleteSubItem = (tableKey: string, item: any) => {
  // Handle delete confirmation and API call
  // TODO: Implement delete confirmation dialog and API call
};

const handleSubItemClick = (tableKey: string, item: any) => {
  // Same as edit for now
  handleEditSubItem(tableKey, item);
};

// Loading and error states
const isLoading = computed(() => customerLoading.value);
const hasError = computed(() => customerError.value !== null);
</script>

<template>
  <div class="space-y-4">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-muted-foreground">Laddar kunduppgifter...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError && !isNew" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="h-8 w-8 text-destructive mx-auto mb-4">⚠️</div>
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av kunduppgifter</p>
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded"
          @click="refreshCustomer"
        >
          Försök igen
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <ComplexDetailPage
        :title="pageTitle"
        :data="form"
        :breadcrumbs="breadcrumbs"
        :show-stats="!isNew && !!customer"
        :stats="stats"
        :main-fields="mainFields"
        :sidebar-fields="sidebarFields"
        :sub-tables="subTables"
        :has-unsaved-changes="hasUnsavedChanges"
        @field-change="handleFieldChange"
        @save="handleSave"
        @delete="handleDelete"
        @back="handleBack"
        @discard-changes="handleDiscardChanges"
        @add-sub-item="handleAddSubItem"
        @edit-sub-item="handleEditSubItem"
        @delete-sub-item="handleDeleteSubItem"
        @sub-item-click="handleSubItemClick"
      />
    </div>
  </div>
</template>
