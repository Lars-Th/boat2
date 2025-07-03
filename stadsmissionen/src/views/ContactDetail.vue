<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DetailPage from '@/components/shared/DetailPage.vue';
import { useToast } from '@/composables/useToast';

// Import data
import contactsData from '@/assets/data/customerContacts.json';
import customersData from '@/assets/data/customers.json';

const route = useRoute();
const router = useRouter();
const { unsavedChanges, success } = useToast();

// State
const contact = ref<any>(null);
const hasUnsavedChanges = ref(false);
const isNewContact = ref(false);
const fromCustomerId = ref<number | null>(null);

// Get contact ID from route
const contactId = computed(() => parseInt(route.params['id'] as string));

// Find contact data
const contactData = computed(() => {
  const foundContact = contactsData.find(c => c.id === contactId.value);
  if (!foundContact) return null;

  // Get customer info
  const customer = customersData.find(cust => cust.id === foundContact.customer_id);

  return {
    ...foundContact,
    customer_name: customer?.display_name || 'Okänd kund',
    customer_type: customer?.first_name ? 'Privatperson' : 'Företag',
    full_name: `${foundContact.first_name} ${foundContact.last_name}`.trim(),
    primary_text: 'Nej',
  };
});

// Customer options for dropdown
const customerOptions = computed(() => {
  return customersData.map(customer => ({
    value: customer.id.toString(),
    label: customer.display_name,
  }));
});

// Form fields
const mainFields = [
  {
    key: 'customer_id',
    label: 'Tillhör kund',
    type: 'select' as const,
    options: customerOptions.value,
  },
  { key: 'first_name', label: 'Förnamn', type: 'text' as const },
  { key: 'last_name', label: 'Efternamn', type: 'text' as const },
  { key: 'title', label: 'Titel', type: 'text' as const },
  { key: 'email', label: 'E-post', type: 'text' as const },
  { key: 'phone', label: 'Telefon', type: 'text' as const },
  { key: 'mobile', label: 'Mobil', type: 'text' as const },
  {
    key: 'is_primary',
    label: 'Primär kontakt',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Ja' },
      { value: 'false', label: 'Nej' },
    ],
  },
  { key: 'notes', label: 'Anteckningar', type: 'textarea' as const },
];

const sidebarFields = [
  { key: 'customer_name', label: 'Kund', type: 'text' as const },
  { key: 'customer_type', label: 'Kundtyp', type: 'text' as const },
  { key: 'primary_text', label: 'Primär kontakt', type: 'text' as const },
  { key: 'created_at', label: 'Skapad', type: 'date' as const },
  { key: 'updated_at', label: 'Uppdaterad', type: 'date' as const },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Start', to: '/home' },
  { label: 'Kontaktpersoner', to: '/contacts' },
  {
    label: isNewContact.value ? 'Ny kontakt' : contactData.value?.full_name || 'Okänd kontakt',
    to: '',
    isCurrentPage: true,
  },
]);

// Stats
const stats = computed(() => {
  if (!contactData.value) return [];

  return [
    {
      label: 'Kontakttyp',
      value: 'Sekundär',
      color: 'blue',
    },
    {
      label: 'Kund',
      value: contactData.value.customer_name,
    },
    {
      label: 'E-post status',
      value: contactData.value.email ? 'Tillgänglig' : 'Saknas',
      color: contactData.value.email ? 'green' : 'red',
    },
    {
      label: 'Telefon status',
      value: contactData.value.phone ? 'Tillgänglig' : 'Saknas',
      color: contactData.value.phone ? 'green' : 'red',
    },
  ];
});

// Initialize contact data
onMounted(() => {
  // Check if this is a new contact
  isNewContact.value = route.query['isNew'] === 'true';

  // Check if we came from a customer detail page
  if (route.query['fromCustomer']) {
    fromCustomerId.value = parseInt(route.query['fromCustomer'] as string);
  }

  if (contactData.value) {
    contact.value = { ...contactData.value };

    // If it's a new contact, mark as having unsaved changes
    if (isNewContact.value) {
      hasUnsavedChanges.value = true;
    }
  } else if (isNewContact.value && fromCustomerId.value) {
    // This is a new contact that was just created, create the contact object
    const customer = customersData.find(c => c.id === fromCustomerId.value);

    contact.value = {
      id: contactId.value,
      customer_id: fromCustomerId.value,
      first_name: '',
      last_name: '',
      title: '',
      email: '',
      phone: '',
      mobile: '',
      is_primary: false,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Computed fields for display
      customer_name: customer?.display_name || 'Okänd kund',
      customer_type: customer?.first_name ? 'Privatperson' : 'Företag',
      full_name: '',
      primary_text: 'Nej',
    };

    hasUnsavedChanges.value = true;
  } else {
    // Contact not found, redirect back
    if (window.history.length > 1) {
      router.go(-1);
    } else {
      router.push('/contacts');
    }
  }
});

// Event handlers
const handleSave = () => {
  console.log('Spara kontakt:', contact.value);
  hasUnsavedChanges.value = false;

  // Show success toast notification
  success(
    'Kontakt sparad!',
    `Kontakten "${contact.value?.full_name || 'Ny kontakt'}" har sparats framgångsrikt.`
  );

  // After saving, navigate back to customer if we came from there
  if (fromCustomerId.value && isNewContact.value) {
    router.push(`/customers/${fromCustomerId.value}`);
  }

  // Här skulle vi spara till API
};

const handleDelete = () => {
  const { confirm } = useToast();

  confirm(
    'Radera kontakt',
    `Är du säker på att du vill radera kontakten ${contact.value?.full_name}?`,
    () => {
      console.log('Radera kontakt:', contact.value);

      // Navigate back to customer if we came from there, otherwise to contacts list
      if (fromCustomerId.value) {
        router.push(`/customers/${fromCustomerId.value}`);
      } else {
        router.push('/contacts');
      }
    }
  );
};

const handleBack = () => {
  const navigateBack = () => {
    // If we came from a customer detail page, go back there
    if (fromCustomerId.value) {
      router.push(`/customers/${fromCustomerId.value}`);
    } else if (window.history.length > 1) {
      router.go(-1);
    } else {
      router.push('/contacts');
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
  if (contactData.value) {
    contact.value = { ...contactData.value };
    hasUnsavedChanges.value = false;
  }
};

const handleFieldChange = (key: string, value: unknown) => {
  if (contact.value) {
    // Handle boolean conversion for is_primary
    if (key === 'is_primary') {
      contact.value[key] = value === 'true';
      contact.value.primary_text = value === 'true' ? 'Ja' : 'Nej';
    } else if (key === 'customer_id') {
      // Convert customer_id to number
      contact.value[key] = parseInt(value as string);

      // Update customer info when customer changes
      const customer = customersData.find(c => c.id === contact.value.customer_id);
      if (customer) {
        contact.value.customer_name = customer.display_name;
        contact.value.customer_type = customer.first_name ? 'Privatperson' : 'Företag';
      }
    } else {
      contact.value[key] = value;

      // Update full_name when first_name or last_name changes
      if (key === 'first_name' || key === 'last_name') {
        contact.value.full_name = `${contact.value.first_name} ${contact.value.last_name}`.trim();
      }
    }
    hasUnsavedChanges.value = true;
  }
};
</script>

<template>
  <div v-if="contact">
    <DetailPage
      :title="`Kontakt: ${contact.full_name || 'Ny kontakt'}`"
      :data="contact"
      :readonly="false"
      :has-unsaved-changes="hasUnsavedChanges"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
      :main-fields="mainFields"
      :sidebar-fields="sidebarFields"
      @save="handleSave"
      @delete="handleDelete"
      @back="handleBack"
      @discard-changes="handleDiscardChanges"
      @field-change="handleFieldChange"
    />
  </div>
  <div v-else class="flex items-center justify-center h-64">
    <p class="text-gray-500">Kontakt hittades inte</p>
  </div>
</template>
