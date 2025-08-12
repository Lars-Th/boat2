<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ComplexDetailPage from '@/components/shared/ComplexDetailPage.vue';
import { Anchor, Building2, Phone, Users } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Import data
import customersData from '@/assets/data/customers.json';
import customerContactsData from '@/assets/data/customerContacts.json';
import boatsDataImport from '@/assets/data/boats.json';

// Make data reactive for adding new items
const contactsData = ref([...customerContactsData]);
const boatsData = ref([...boatsDataImport]);

const route = useRoute();
const router = useRouter();
const { unsavedChanges, confirm, success } = useToast();

// State
const customer = ref<any>(null);
const hasUnsavedChanges = ref(false);
const isNewCustomer = ref(false);

// Get customer ID from route
const customerId = computed(() => parseInt(route.params['id'] as string));

// Find customer data
const customerData = computed(() => {
  const foundCustomer = customersData.find(c => c.id === customerId.value);
  if (!foundCustomer) return null;

  return {
    ...foundCustomer,
    customer_type: foundCustomer.first_name ? 'individual' : 'company',
    customer_type_text: foundCustomer.first_name ? 'Privatperson' : 'Företag',
  };
});

// Customer contacts sub-table
const customerContacts = computed(() => {
  return contactsData.value
    .filter(contact => contact.customer_id === customerId.value)
    .map(contact => ({
      ...contact,
      full_name: `${contact.first_name} ${contact.last_name}`.trim(),
      contact_info: contact.email || contact.phone || '-',
    }));
});

// Customer boats sub-table
const customerBoats = computed(() => {
  return boatsData.value
    .filter(boat => boat.customer_id === customerId.value)
    .map(boat => ({
      ...boat,
      dimensions: `${boat.length}m × ${boat.width}m`,
      status_text: boat.placement_status === 'placed' ? 'Placerad' : 'Ej placerad',
      pickup_date: boat.planned_pickup_date
        ? new Date(boat.planned_pickup_date).toLocaleDateString('sv-SE')
        : '-',
    }));
});


// Form fields
const mainFields = [
  {
    key: 'customer_type',
    label: 'Kundtyp',
    type: 'select' as const,
    options: [
      { value: 'individual', label: 'Privatperson' },
      { value: 'company', label: 'Företag' },
    ],
  },
  {
    key: 'external_id',
    label: 'Externt ID',
    type: 'text' as const,
  },
  { key: 'display_name', label: 'Visningsnamn', type: 'text' as const },
  { key: 'first_name', label: 'Förnamn', type: 'text' as const },
  { key: 'name', label: 'Efternamn/Företagsnamn', type: 'text' as const },
  { key: 'email', label: 'E-post', type: 'text' as const },
  { key: 'phone', label: 'Telefon', type: 'text' as const },
  { key: 'street', label: 'Gatuadress', type: 'text' as const },
  { key: 'postal_code', label: 'Postnummer', type: 'text' as const },
  { key: 'city', label: 'Ort', type: 'text' as const },
];

const sidebarFields = [
  {
    key: 'customer_no',
    label: 'Kundnummer',
    type: 'text' as const,
    readonly: true,
    tooltip: 'Automatiskt genererat löpnummer för intern användning',
  },
  { key: 'customer_type_text', label: 'Kundtyp', type: 'text' as const },
  { key: 'country', label: 'Land', type: 'text' as const },
  { key: 'created_at', label: 'Skapad', type: 'date' as const },
  { key: 'updated_at', label: 'Uppdaterad', type: 'date' as const },
];

// Sub-tables configuration
const subTables = computed(() => [
  {
    key: 'contacts',
    title: 'Kontaktpersoner',
    icon: Phone,
    data: customerContacts.value,
    columns: [
      { key: 'full_name', label: 'Namn', sortable: true },
      { key: 'title', label: 'Titel', sortable: true },
      { key: 'email', label: 'E-post', sortable: true },
      { key: 'phone', label: 'Telefon', sortable: true },
      { key: 'is_primary', label: 'Primär', sortable: true, type: 'boolean' },
    ],
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
  },
  {
    key: 'boats',
    title: 'Båtar',
    icon: Anchor,
    data: customerBoats.value,
    columns: [
      { key: 'name', label: 'Båtnamn', sortable: true },
      { key: 'dimensions', label: 'Dimensioner', sortable: true },
      { key: 'status_text', label: 'Status', sortable: true },
      { key: 'pickup_date', label: 'Planerad hämtning', sortable: true },
    ],
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
  },
]);

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Start', to: '/home' },
  { label: 'Kunder', to: '/customers' },
  {
    label: isNewCustomer.value ? 'Ny kund' : customerData.value?.display_name || 'Okänd kund',
    to: '',
    isCurrentPage: true,
  },
]);

// Stats
const stats = computed(() => [
  {
    label: 'Totalt antal kontakter',
    value: customerContacts.value.length.toString(),
    icon: Phone,
  },
  {
    label: 'Totalt antal båtar',
    value: customerBoats.value.length.toString(),
    icon: Anchor,
  },
  {
    label: 'Primära kontakter',
    value: '0', // Since is_primary doesn't exist in the data structure
    icon: Users,
  },
  {
    label: 'Placerade båtar',
    value: customerBoats.value.filter(b => b.placement_status === 'placed').length.toString(),
    icon: Building2,
  },
]);

// Helper function to generate next customer number
const generateNextCustomerNumber = (): string => {
  // Get all existing customer numbers and find the highest
  const existingNumbers = customersData
    .map(c => parseInt(c.customer_no || '1000'))
    .filter(n => !isNaN(n));

  const maxNumber = Math.max(...existingNumbers);
  return (maxNumber + 1).toString();
};

// Initialize customer data
onMounted(() => {
  // Check if this is a new customer
  isNewCustomer.value = route.query['isNew'] === 'true';

  if (customerData.value) {
    customer.value = { ...customerData.value };

    // If it's a new customer, mark as having unsaved changes
    if (isNewCustomer.value) {
      hasUnsavedChanges.value = true;
    }
  } else if (isNewCustomer.value) {
    // Create new customer with auto-generated customer number
    customer.value = {
      id: Math.max(...customersData.map(c => c.id)) + 1,
      customer_no: generateNextCustomerNumber(),

      name: '',
      first_name: '',
      external_id: '',
      display_name: '',
      street: '',
      postal_code: '',
      city: '',
      country: 'Sweden',
      phone: '',
      email: '',
      customer_type: 'individual',
      customer_type_text: 'Privatperson',

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    hasUnsavedChanges.value = true;
  } else {
    // Customer not found, redirect back
    if (window.history.length > 1) {
      router.go(-1);
    } else {
      router.push('/customers');
    }
  }
});

// Event handlers
const handleSave = () => {
  console.log('Spara kund:', customer.value);
  hasUnsavedChanges.value = false;

  // Show success toast notification
  success('Kund sparad!', `Kunden "${customer.value?.display_name}" har sparats framgångsrikt.`);

  // Här skulle vi spara till API
};

const handleDelete = () => {
  confirm(
    'Radera kund',
    `Är du säker på att du vill radera kunden ${customer.value?.display_name}?`,
    () => {
      console.log('Radera kund:', customer.value);
      // After deletion, go back or to customers list
      if (window.history.length > 1) {
        router.go(-1);
      } else {
        router.push('/customers');
      }
    }
  );
};

const handleBack = () => {
  const navigateBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      router.go(-1);
    } else {
      router.push('/customers');
    }
  };

  if (hasUnsavedChanges.value) {
    unsavedChanges(
      () => {
        // Spara först, sedan navigera
        handleSave();
        navigateBack();
      },
      () => {
        // Ignorera ändringar och navigera
        navigateBack();
      }
    );
  } else {
    navigateBack();
  }
};

const handleDiscardChanges = () => {
  if (customerData.value) {
    customer.value = { ...customerData.value };
    hasUnsavedChanges.value = false;
  }
};

const handleFieldChange = (key: string, value: unknown) => {
  if (customer.value) {
    customer.value[key] = value;

    // Update customer_type_text when customer_type changes
    if (key === 'customer_type') {
      customer.value.customer_type_text = value === 'individual' ? 'Privatperson' : 'Företag';

      // Clear first_name if changing to company
      if (value === 'company') {
        customer.value.first_name = '';
      }
    }

    hasUnsavedChanges.value = true;
  }
};

// Sub-table event handlers
const handleAddSubItem = (tableKey: string) => {
  console.log('Lägg till objekt i tabell:', tableKey);
  if (tableKey === 'contacts') {
    // Create a new contact directly linked to this customer
    const newContact = {
      id: Math.max(...contactsData.value.map(c => c.id)) + 1,
      customer_id: customerId.value,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      note: '', // Use 'note' instead of 'notes' to match the data structure
    };

    // Add to data and navigate directly to contact detail
    contactsData.value.push(newContact);
    router.push(`/contacts/${newContact.id}?isNew=true&fromCustomer=${customerId.value}`);
  } else if (tableKey === 'boats') {
    // Create a new boat directly linked to this customer
    const newBoat = {
      id: Math.max(...boatsData.value.map(b => b.id)) + 1,
      customer_id: customerId.value,
      name: '',
      length: 0,
      width: 0,
      konva_shape_json: '',
      placement_status: 'unplaced',
      location_status: 'warehouse',
      current_placement_id: null,
      planned_pickup_date: null,
      planned_dropoff_date: '',
      created_at: new Date().toISOString(),
    };

    // Add to data and navigate directly to boat detail
    boatsData.value.push(newBoat);
    router.push(`/boats/${newBoat.id}?isNew=true&fromCustomer=${customerId.value}`);
  }
};

const handleEditSubItem = (tableKey: string, item: any) => {
  console.log('Redigera objekt:', tableKey, item);
  if (tableKey === 'contacts') {
    router.push(`/contacts/${item.id}`);
  } else if (tableKey === 'boats') {
    router.push(`/boats/${item.id}`);
  }
};

const handleDeleteSubItem = (tableKey: string, item: any) => {
  const itemName = tableKey === 'contacts' ? `${item.first_name} ${item.last_name}` : item.name;

  confirm(
    `Radera ${tableKey === 'contacts' ? 'kontakt' : 'båt'}`,
    `Är du säker på att du vill radera ${itemName}?`,
    () => {
      console.log('Radera objekt:', tableKey, item);
      // Här skulle vi radera från API
    }
  );
};

const handleSubItemClick = (tableKey: string, item: any) => {
  console.log('Klicka på objekt:', tableKey, item);
  if (tableKey === 'contacts') {
    router.push(`/contacts/${item.id}`);
  } else if (tableKey === 'boats') {
    router.push(`/boats/${item.id}`);
  }
};
</script>

<template>
  <div v-if="customer">
    <ComplexDetailPage
      :title="`Kund: ${customer.display_name}`"
      :data="customer"
      :readonly="false"
      :has-unsaved-changes="hasUnsavedChanges"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
      :main-fields="mainFields"
      :sidebar-fields="sidebarFields"
      :sub-tables="subTables"
      @save="handleSave"
      @delete="handleDelete"
      @back="handleBack"
      @discard-changes="handleDiscardChanges"
      @field-change="handleFieldChange"
      @add-sub-item="handleAddSubItem"
      @edit-sub-item="handleEditSubItem"
      @delete-sub-item="handleDeleteSubItem"
      @sub-item-click="handleSubItemClick"
    />
  </div>
  <div v-else class="flex items-center justify-center h-64">
    <p class="text-gray-500">Kund hittades inte</p>
  </div>


</template>
