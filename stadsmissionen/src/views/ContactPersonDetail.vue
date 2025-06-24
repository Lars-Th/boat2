<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiItem, useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Contact, Customer } from '@/types';
import type { ContactWithRelations } from '@/types/relationships';

// Components
import StandardHeader from '@/components/layout/StandardHeader.vue';
import DetailPage from '@/components/shared/DetailPage.vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { ArrowLeft, FileText, Save, Trash2 } from 'lucide-vue-next';

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
        FirstName: newContact.FirstName || '',
        LastName: newContact.LastName || '',
        Title: newContact.Title || '',
        Phone: newContact.Phone || '',
        Mobile: newContact.Mobile || '',
        Email: newContact.Email || '',
        Department: newContact.Department || '',
        IsPrimary: newContact.IsPrimary ? 'true' : 'false',
        Notes: newContact.Notes || '',
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
    label: customer.CompanyName || 'Okänt företag',
  }));
});

// Get selected customer name
const getSelectedCustomerName = (customerId: string | number | null) => {
  if (!customerId) return '';
  const customer = customerOptions.value.find(opt => opt.value === customerId.toString());
  return customer ? customer.label || '' : '';
};

// Field definitions for DetailPage (excluding CustomerID which will be custom)
const mainFields = computed(() => [
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

  const workOrders = contact.value.workOrders || [];
  const { customer } = contact.value;

  return [
    {
      label: 'Arbetsordrar',
      value: workOrders.length,
      color: 'text-blue-600',
    },
    {
      label: 'Aktiva ordrar',
      value: workOrders.filter((wo: any) => wo.Status === 'in_progress').length,
      color: 'text-green-600',
    },
    {
      label: 'Slutförda ordrar',
      value: workOrders.filter((wo: any) => wo.Status === 'completed').length,
      color: 'text-orange-600',
    },
    {
      label: 'Kundföretag',
      value: customer?.CompanyName || 'Ingen',
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
      FirstName: contact.value.FirstName || '',
      LastName: contact.value.LastName || '',
      Title: contact.value.Title || '',
      Phone: contact.value.Phone || '',
      Mobile: contact.value.Mobile || '',
      Email: contact.value.Email || '',
      Department: contact.value.Department || '',
      IsPrimary: contact.value.IsPrimary ? 'true' : 'false',
      Notes: contact.value.Notes || '',
    };
  }
  hasUnsavedChanges.value = false;
};
</script>

<template>
  <div>
    <!-- Header -->
    <StandardHeader
      :title="pageTitle"
      :breadcrumbs="breadcrumbs"
      :stats="stats"
      :show-stats="!isNew && !!contact"
    >
      <template #actions>
        <Button v-if="!isNew" variant="destructive" size="sm" class="gap-2" @click="handleDelete">
          <Trash2 class="h-4 w-4" />
          Ta bort
        </Button>
        <Button size="sm" class="gap-2" @click="handleSave">
          <Save class="h-4 w-4" />
          {{ isNew ? 'Skapa' : 'Spara' }}
        </Button>
      </template>
    </StandardHeader>

    <!-- Detail Form -->
    <DetailPage
      :data="form"
      :main-fields="mainFields"
      :sidebar-fields="sidebarFields"
      :has-unsaved-changes="hasUnsavedChanges"
      @field-change="handleFieldChange"
      @save="handleSave"
      @back="handleBack"
      @discard-changes="handleDiscardChanges"
    >
      <template #main-content="{ data, readonly }">
        <!-- Default form fields -->
        <div class="bg-white rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
            <FileText class="h-4 w-4" />
            Grundläggande information
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Custom Customer Selection Field -->
            <div class="space-y-1">
              <Label class="text-[10px] font-medium text-gray-500">Företag</Label>
              <Select
                :model-value="data.CustomerID?.toString() || ''"
                :disabled="readonly"
                @update:model-value="value => handleFieldChange('CustomerID', value)"
              >
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue placeholder="Välj företag..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in customerOptions"
                    :key="option.value"
                    :value="option.value"
                    class="text-xs"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Regular form fields -->
            <div v-for="field in mainFields" :key="field.key" class="space-y-1">
              <Label class="text-[10px] font-medium text-gray-500">{{ field.label }}</Label>
              <Input
                v-if="field.type === 'text'"
                :model-value="data[field.key]"
                :readonly="readonly"
                class="h-8 text-xs"
                @update:model-value="value => handleFieldChange(field.key, value)"
              />
              <Input
                v-else-if="field.type === 'number'"
                :model-value="data[field.key]"
                :readonly="readonly"
                type="number"
                class="h-8 text-xs"
                @update:model-value="value => handleFieldChange(field.key, value)"
              />
              <Input
                v-else-if="field.type === 'date'"
                :model-value="data[field.key]"
                :readonly="readonly"
                type="date"
                class="h-8 text-xs"
                @update:model-value="value => handleFieldChange(field.key, value)"
              />
              <Textarea
                v-else-if="field.type === 'textarea'"
                :model-value="data[field.key]"
                :readonly="readonly"
                rows="3"
                class="text-xs resize-none"
                @update:model-value="value => handleFieldChange(field.key, value)"
              />
              <Select
                v-else-if="field.type === 'select'"
                :model-value="data[field.key]"
                :disabled="readonly"
                @update:model-value="value => handleFieldChange(field.key, value)"
              >
                <SelectTrigger size="sm" class="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in field.options"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </template>
    </DetailPage>
  </div>
</template>
