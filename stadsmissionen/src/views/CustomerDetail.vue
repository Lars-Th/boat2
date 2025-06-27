<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiItem, useApiMutation } from '@/composables/useApi';
import api from '@/api';
import type { Contact, Customer } from '@/types';
import type { CustomerWithRelations } from '@/types/relationships';

// Components
import ComplexDetailPage from '@/components/shared/ComplexDetailPage.vue';
import { ArrowLeft, Save, Trash2, User } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();

const customerId = route.params.id as string;
const isNew = computed(() => customerId === 'new');

// API calls with proper typing
const {
  data: customer,
  loading: customerLoading,
  error: customerError,
  refresh: refreshCustomer,
} = useApiItem<CustomerWithRelations | null>(
  () => {
    if (isNew.value) return Promise.resolve({ success: true, data: null });
    return api.customers.getById(customerId, {
      include: ['contacts'],
    });
  },
  {
    cacheKey: `customer-${customerId}`,
  }
);

// API mutations with proper error handling
const {
  mutate: createCustomer,
  loading: createLoading,
  error: createError,
} = useApiMutation<Customer, Omit<Customer, 'CustomerID' | 'CreatedDate'>>(data =>
  api.customers.create(data)
);

const {
  mutate: updateCustomer,
  loading: updateLoading,
  error: updateError,
} = useApiMutation<
  Customer,
  { id: string; data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>> }
>(({ id, data }) => api.customers.update(id, data));

const {
  mutate: deleteCustomer,
  loading: deleteLoading,
  error: deleteError,
} = useApiMutation<boolean, string>(id => api.customers.delete(id));

const { mutate: deleteContact, loading: deleteContactLoading } = useApiMutation<boolean, string>(
  contactId => api.contacts.delete(contactId)
);

// Form state with proper Customer type
const defaultForm: Omit<Customer, 'CustomerID' | 'CreatedDate'> = {
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
};

const form = ref<Omit<Customer, 'CustomerID' | 'CreatedDate'>>({ ...defaultForm });
const hasUnsavedChanges = ref(false);

// Form validation
const formErrors = ref<Record<string, string>>({});

const validateForm = (): boolean => {
  const errors: Record<string, string> = {};

  // Required field validation
  if (!form.value.CustomerNumber?.trim()) {
    errors.CustomerNumber = 'Kundnummer är obligatoriskt';
  }

  if (!form.value.CompanyName?.trim()) {
    errors.CompanyName = 'Företagsnamn är obligatoriskt';
  }

  if (!form.value.OrganizationNumber?.trim()) {
    errors.OrganizationNumber = 'Organisationsnummer är obligatoriskt';
  } else if (!/^\d{6}-\d{4}$/.test(form.value.OrganizationNumber)) {
    errors.OrganizationNumber = 'Organisationsnummer måste vara i formatet XXXXXX-XXXX';
  }

  if (!form.value.Phone?.trim()) {
    errors.Phone = 'Telefon är obligatoriskt';
  }

  if (!form.value.Email?.trim()) {
    errors.Email = 'E-post är obligatoriskt';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.Email)) {
    errors.Email = 'E-post måste vara en giltig e-postadress';
  }

  if (!form.value.Address?.trim()) {
    errors.Address = 'Adress är obligatoriskt';
  }

  if (!form.value.PostalCode?.trim()) {
    errors.PostalCode = 'Postnummer är obligatoriskt';
  }

  if (!form.value.City?.trim()) {
    errors.City = 'Ort är obligatoriskt';
  }

  if (!form.value.VATNumber?.trim()) {
    errors.VATNumber = 'Momsnummer är obligatoriskt';
  } else if (!/^SE\d{10}01$/.test(form.value.VATNumber)) {
    errors.VATNumber = 'Momsnummer måste vara i formatet SEXXXXXXXXXX01';
  }

  if (form.value.PaymentTerms < 1 || form.value.PaymentTerms > 365) {
    errors.PaymentTerms = 'Betalningsvillkor måste vara mellan 1 och 365 dagar';
  }

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

// Watch for customer data and populate form
watch(
  customer,
  newCustomer => {
    if (newCustomer) {
      form.value = {
        CustomerNumber: newCustomer.CustomerNumber ?? '',
        CompanyName: newCustomer.CompanyName ?? '',
        OrganizationNumber: newCustomer.OrganizationNumber ?? '',
        ContactPerson: newCustomer.ContactPerson ?? '',
        Phone: newCustomer.Phone ?? '',
        Email: newCustomer.Email ?? '',
        Address: newCustomer.Address ?? '',
        PostalCode: newCustomer.PostalCode ?? '',
        City: newCustomer.City ?? '',
        Country: newCustomer.Country ?? 'Sverige',
        InvoiceAddress: {
          Address: newCustomer.InvoiceAddress?.Address ?? '',
          PostalCode: newCustomer.InvoiceAddress?.PostalCode ?? '',
          City: newCustomer.InvoiceAddress?.City ?? '',
        },
        PaymentTerms: newCustomer.PaymentTerms ?? 30,
        VATNumber: newCustomer.VATNumber ?? '',
        Status: newCustomer.Status ?? 'active',
        Notes: newCustomer.Notes ?? '',
      };
      hasUnsavedChanges.value = false;
      formErrors.value = {};
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
  {
    key: 'CustomerNumber',
    label: 'Kundnummer',
    type: 'text' as const,
    error: formErrors.value.CustomerNumber,
  },
  {
    key: 'CompanyName',
    label: 'Företagsnamn',
    type: 'text' as const,
    error: formErrors.value.CompanyName,
  },
  {
    key: 'OrganizationNumber',
    label: 'Organisationsnummer',
    type: 'text' as const,
    error: formErrors.value.OrganizationNumber,
  },
  {
    key: 'ContactPerson',
    label: 'Kontaktperson',
    type: 'text' as const,
  },
  {
    key: 'Phone',
    label: 'Telefon',
    type: 'text' as const,
    error: formErrors.value.Phone,
  },
  {
    key: 'Email',
    label: 'E-post',
    type: 'text' as const,
    error: formErrors.value.Email,
  },
  {
    key: 'Address',
    label: 'Adress',
    type: 'text' as const,
    error: formErrors.value.Address,
  },
  {
    key: 'PostalCode',
    label: 'Postnummer',
    type: 'text' as const,
    error: formErrors.value.PostalCode,
  },
  {
    key: 'City',
    label: 'Ort',
    type: 'text' as const,
    error: formErrors.value.City,
  },
  {
    key: 'Country',
    label: 'Land',
    type: 'text' as const,
  },
  {
    key: 'VATNumber',
    label: 'Momsnummer',
    type: 'text' as const,
    error: formErrors.value.VATNumber,
  },
  {
    key: 'Status',
    label: 'Status',
    type: 'select' as const,
    options: [
      { value: 'active', label: 'Aktiv' },
      { value: 'inactive', label: 'Inaktiv' },
    ],
  },
  {
    key: 'Notes',
    label: 'Anteckningar',
    type: 'textarea' as const,
  },
]);

const sidebarFields = computed(() => [
  {
    key: 'PaymentTerms',
    label: 'Betalningsvillkor (dagar)',
    type: 'number' as const,
    error: formErrors.value.PaymentTerms,
  },
  { key: 'CreatedDate', label: 'Skapad', type: 'date' as const },
]);

// Sub-tables for related data with proper typing
const subTables = computed(() => {
  if (!customer.value) return [];

  const contacts = customer.value.contacts ?? [];

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
  ];
});

// Statistics
const stats = computed(() => {
  if (!customer.value) return [];

  const contacts = customer.value.contacts ?? [];

  return [
    {
      label: 'Kontaktpersoner',
      value: contacts.length,
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

// Event handlers with improved error handling
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

  // Clear specific field error when user starts typing
  if (formErrors.value[key]) {
    const newErrors = { ...formErrors.value };
    delete newErrors[key];
    formErrors.value = newErrors;
  }
};

const handleSave = async () => {
  // Validate form before saving
  if (!validateForm()) {
    error('Formulärfel', 'Vänligen korrigera felen i formuläret innan du sparar.');
    return;
  }

  try {
    if (isNew.value) {
      // Create new customer
      const result = await createCustomer(form.value);
      if (result) {
        success('Kund skapad', 'Den nya kunden har skapats framgångsrikt.');
        router.push(`/customers/${result.CustomerID}`);
      }
    } else {
      // Update existing customer
      const result = await updateCustomer({ id: customerId, data: form.value });
      if (result) {
        success('Kund uppdaterad', 'Kunduppgifterna har uppdaterats framgångsrikt.');
        hasUnsavedChanges.value = false;
        await refreshCustomer();
      }
    }
  } catch (err) {
    // Error is handled by the mutation hook
    console.error('Save error:', err);
  }
};

const handleDelete = async () => {
  if (isNew.value) return;

  try {
    const result = await deleteCustomer(customerId);
    if (result) {
      success('Kund borttagen', 'Kunden har tagits bort framgångsrikt.');
      router.push('/customers');
    }
  } catch (err) {
    // Error is handled by the mutation hook
    console.error('Delete error:', err);
  }
};

const handleBack = () => {
  router.push('/customers');
};

const handleDiscardChanges = () => {
  if (customer.value) {
    // Reset form to original data
    form.value = {
      CustomerNumber: customer.value.CustomerNumber ?? '',
      CompanyName: customer.value.CompanyName ?? '',
      OrganizationNumber: customer.value.OrganizationNumber ?? '',
      ContactPerson: customer.value.ContactPerson ?? '',
      Phone: customer.value.Phone ?? '',
      Email: customer.value.Email ?? '',
      Address: customer.value.Address ?? '',
      PostalCode: customer.value.PostalCode ?? '',
      City: customer.value.City ?? '',
      Country: customer.value.Country ?? 'Sverige',
      InvoiceAddress: {
        Address: customer.value.InvoiceAddress?.Address ?? '',
        PostalCode: customer.value.InvoiceAddress?.PostalCode ?? '',
        City: customer.value.InvoiceAddress?.City ?? '',
      },
      PaymentTerms: customer.value.PaymentTerms ?? 30,
      VATNumber: customer.value.VATNumber ?? '',
      Status: customer.value.Status ?? 'active',
      Notes: customer.value.Notes ?? '',
    };
  }
  hasUnsavedChanges.value = false;
  formErrors.value = {};
};

// Sub-table event handlers with proper error handling
const handleAddSubItem = (tableKey: string) => {
  switch (tableKey) {
    case 'contacts':
      router.push(`/contacts/new?customerId=${customerId}`);
      break;
  }
};

const handleEditSubItem = (tableKey: string, item: any) => {
  switch (tableKey) {
    case 'contacts':
      router.push(`/contacts/${item.ContactID}`);
      break;
  }
};

const handleDeleteSubItem = async (tableKey: string, item: any) => {
  switch (tableKey) {
    case 'contacts':
      try {
        const result = await deleteContact(item.ContactID);
        if (result) {
          success('Kontakt borttagen', 'Kontaktpersonen har tagits bort framgångsrikt.');
          await refreshCustomer(); // Refresh to update the contacts list
        }
      } catch (err) {
        console.error('Delete contact error:', err);
      }
      break;
  }
};

const handleSubItemClick = (tableKey: string, item: any) => {
  // Same as edit for now
  handleEditSubItem(tableKey, item);
};

// Loading and error states
const isLoading = computed(
  () =>
    !!(customerLoading.value || createLoading.value || updateLoading.value || deleteLoading.value)
);

const hasError = computed(
  () =>
    customerError.value !== null ||
    createError.value !== null ||
    updateError.value !== null ||
    deleteError.value !== null
);

const errorMessage = computed(() => {
  if (customerError.value) return customerError.value.message;
  if (createError.value) return createError.value.message;
  if (updateError.value) return updateError.value.message;
  if (deleteError.value) return deleteError.value.message;
  return null;
});

// Watch for API errors and show them
watch([createError, updateError, deleteError], ([createErr, updateErr, deleteErr]) => {
  if (createErr) {
    error('Fel vid skapande', createErr.message);
  }
  if (updateErr) {
    error('Fel vid uppdatering', updateErr.message);
  }
  if (deleteErr) {
    error('Fel vid borttagning', deleteErr.message);
  }
});
</script>

<template>
  <div>
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
        <p class="text-destructive mb-4">
          {{ errorMessage || 'Ett fel uppstod vid laddning av kunduppgifter' }}
        </p>
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
        :loading="isLoading"
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
