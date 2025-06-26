<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiItem, useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Contact, Customer } from '@/types';
import type { ContactWithRelations } from '@/types/relationships';

// Components
import DetailPage from '@/components/shared/DetailPage.vue';

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();

const contactId = route.params.id as string;
const isNew = computed(() => contactId === 'new');

// API calls
const {
  data: contact,
  loading: contactLoading,
  error: contactError,
  refresh: refreshContact,
} = useApiItem<ContactWithRelations | null>(
  () => {
    if (isNew.value) return Promise.resolve(null);
    return api.contacts.getById(contactId, {
      include: ['customer', 'workOrders'],
    });
  },
  {
    cacheKey: `contact-${contactId}`,
  }
);

// Fetch customers for dropdown
const {
  data: customers,
  loading: customersLoading,
  error: customersError,
} = useApiList<Customer[]>(() => api.customers.getAll(), {
  cacheKey: 'customers-for-contact',
});

// Form state - matches Contact interface structure
const form = ref<Partial<Contact> & { ContactID: number | null }>({
  ContactID: null,
  CustomerID: 0,
  FirstName: '',
  LastName: '',
  Title: '',
  Phone: '',
  Mobile: '',
  Email: '',
  Department: '',
  IsPrimary: false,
  Notes: '',
});

const hasUnsavedChanges = ref(false);

// Watch for contact data and populate form
watch(
  contact,
  newContact => {
    if (newContact) {
      form.value = {
        ContactID: newContact.ContactID,
        CustomerID: newContact.CustomerID,
        FirstName: newContact.FirstName ?? '',
        LastName: newContact.LastName ?? '',
        Title: newContact.Title ?? '',
        Phone: newContact.Phone ?? '',
        Mobile: newContact.Mobile ?? '',
        Email: newContact.Email ?? '',
        Department: newContact.Department ?? '',
        IsPrimary: newContact.IsPrimary ? 'true' : 'false',
        Notes: newContact.Notes ?? '',
      };
      hasUnsavedChanges.value = false;
    }
  },
  { immediate: true }
);

// Initialize form for new contact
if (isNew.value) {
  hasUnsavedChanges.value = false;
}

// Customer options for dropdown
const customerOptions = computed(() => {
  if (!customers.value) return [];
  return customers.value.map((customer: any) => ({
    value: customer.CustomerID.toString(),
    label: customer.CompanyName ?? 'Okänt företag',
  }));
});

// Field definitions for DetailPage
const mainFields = computed(() => [
  {
    key: 'CustomerID',
    label: 'Företag',
    type: 'select' as const,
    options: customerOptions.value,
  },
  { key: 'FirstName', label: 'Förnamn', type: 'text' as const },
  { key: 'LastName', label: 'Efternamn', type: 'text' as const },
  { key: 'Title', label: 'Titel', type: 'text' as const },
  { key: 'Email', label: 'E-post', type: 'text' as const },
  { key: 'Phone', label: 'Telefon', type: 'text' as const },
  { key: 'Mobile', label: 'Mobil', type: 'text' as const },
  { key: 'Department', label: 'Avdelning', type: 'text' as const },
  {
    key: 'IsPrimary',
    label: 'Primärkontakt',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Ja' },
      { value: 'false', label: 'Nej' },
    ],
  },
  { key: 'Notes', label: 'Anteckningar', type: 'textarea' as const },
]);

const sidebarFields = computed(() => [
  { key: 'ContactID', label: 'Kontakt-ID', type: 'number' as const, readonly: true },
]);

// Statistics
const stats = computed(() => {
  if (!contact.value) return [];

  const workOrders = contact.value.workOrders ?? [];
  const { customer } = contact.value;

  return [
    {
      label: 'Arbetsordrar',
      value: workOrders.length,
    },
    {
      label: 'Aktiva ordrar',
      value: workOrders.filter((wo: any) => wo.Status === 'in_progress').length,
    },
    {
      label: 'Slutförda ordrar',
      value: workOrders.filter((wo: any) => wo.Status === 'completed').length,
    },
    {
      label: 'Kundföretag',
      value: customer?.CompanyName ?? 'Ingen',
      variant: 'secondary' as const,
    },
  ];
});

// Breadcrumbs
const breadcrumbs = computed(() => {
  if (isNew.value) {
    return [
      { label: 'Dashboard', to: '/' },
      { label: 'Kontaktpersoner', to: '/contacts' },
      { label: 'Ny kontaktperson', to: '', isCurrentPage: true },
    ];
  }
  return [
    { label: 'Dashboard', to: '/' },
    { label: 'Kontaktpersoner', to: '/contacts' },
    {
      label:
        contact.value?.FirstName && contact.value?.LastName
          ? `${contact.value.FirstName} ${contact.value.LastName}`
          : 'Kontaktperson',
      to: '',
      isCurrentPage: true,
    },
  ];
});

// Page title
const pageTitle = computed(() => {
  if (isNew.value) return 'Lägg till ny kontaktperson';
  return contact.value?.FirstName && contact.value?.LastName
    ? `${contact.value.FirstName} ${contact.value.LastName}`
    : 'Kontaktperson';
});

// Event handlers
const handleFieldChange = (key: string, value: any) => {
  // Handle boolean conversion for IsPrimary
  if (key === 'IsPrimary') {
    value = value === 'true' || value === true;
  }

  // Handle number conversion for CustomerID
  if (key === 'CustomerID') {
    value = value ? parseInt(value, 10) : null;
  }

  (form.value as any)[key] = value;
  hasUnsavedChanges.value = true;
};

const handleSave = async () => {
  try {
    if (isNew.value) {
      await api.contacts.create(form.value);
      success('Kontaktperson skapad');
      router.push('/contacts');
    } else {
      await api.contacts.update(contactId, form.value);
      success('Kontaktperson uppdaterad');
      hasUnsavedChanges.value = false;
      await refreshContact();
    }
  } catch (err) {
    error('Ett fel uppstod vid sparandet');
    console.error('Save error:', err);
  }
};

const handleDelete = async () => {
  if (isNew.value) return;

  try {
    await api.contacts.delete(contactId);
    success('Kontaktperson borttagen');
    router.push('/contacts');
  } catch (err) {
    error('Ett fel uppstod vid borttagningen');
    console.error('Delete error:', err);
  }
};

const handleBack = () => {
  router.push('/contacts');
};

const handleDiscardChanges = () => {
  if (contact.value) {
    // Reset form to original values
    form.value = {
      ContactID: contact.value.ContactID,
      CustomerID: contact.value.CustomerID,
      FirstName: contact.value.FirstName ?? '',
      LastName: contact.value.LastName ?? '',
      Title: contact.value.Title ?? '',
      Phone: contact.value.Phone ?? '',
      Mobile: contact.value.Mobile ?? '',
      Email: contact.value.Email ?? '',
      Department: contact.value.Department ?? '',
      IsPrimary: contact.value.IsPrimary ? 'true' : 'false',
      Notes: contact.value.Notes ?? '',
    };
  }
  hasUnsavedChanges.value = false;
};

// Loading and error states
const isLoading = computed(() => Boolean(contactLoading.value) || Boolean(customersLoading.value));
const hasError = computed(() => contactError.value !== null || customersError.value !== null);
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"
        ></div>
        <p class="text-muted-foreground">Laddar kontaktuppgifter...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError && !isNew" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="h-8 w-8 text-destructive mx-auto mb-4">⚠️</div>
        <p class="text-destructive mb-4">Ett fel uppstod vid laddning av kontaktuppgifter</p>
        <button
          class="px-4 py-2 bg-primary text-primary-foreground rounded"
          @click="refreshContact"
        >
          Försök igen
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <DetailPage
        :data="form"
        :main-fields="mainFields"
        :sidebar-fields="sidebarFields"
        :has-unsaved-changes="hasUnsavedChanges"
        :title="pageTitle"
        :breadcrumbs="breadcrumbs"
        :show-stats="!isNew"
        :stats="stats"
        @field-change="handleFieldChange"
        @save="handleSave"
        @back="handleBack"
        @discard-changes="handleDiscardChanges"
      />
    </div>
  </div>
</template>
