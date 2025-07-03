<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Boat } from '@/types/entities';
import { useToast } from '@/composables/useToast';
import { Bell, MessageSquare, Send } from 'lucide-vue-next';

// UI Components
import ExtendedDetailPage from '@/components/shared/ExtendedDetailPage.vue';

const route = useRoute();
const router = useRouter();
const { addToast } = useToast();

// Extended Boat type with computed fields
interface ExtendedBoat extends Boat {
  customer_name?: string;
  customer_type?: string;
  storage_location?: string;
  dimensions?: string;
  volume?: string;
  weight_display?: string;
  current_status_text?: string;
  location_status_text?: string;
}

// State
const boat = ref<ExtendedBoat | null>(null);
const hasUnsavedChanges = ref(false);
const isNewBoat = ref(false);
const fromCustomerId = ref<number | null>(null);
const isInitialLoad = ref(true);

// Mock data - in real app would come from API
import boatsData from '@/assets/data/boats.json';
import customersData from '@/assets/data/customers.json';
import placementsData from '@/assets/data/placements.json';
import storageUnitsData from '@/assets/data/storageUnits.json';

const boatId = computed(() => {
  const id = parseInt(route.params['id'] as string);
  console.log('Computed boatId:', id, 'from route param:', route.params['id']);
  return id;
});

const boatData = computed(() => {
  const foundBoat = boatsData.find(b => b.id === boatId.value);
  if (!foundBoat) {
    console.log(
      'Boat not found:',
      boatId.value,
      'Available boats:',
      boatsData.map(b => b.id)
    );
    return null;
  }

  // Get customer info
  const customer = customersData.find(cust => cust.id === foundBoat.customer_id);

  // Get placement info
  const placement = foundBoat.current_placement_id
    ? placementsData.find(p => p.id === foundBoat.current_placement_id)
    : null;

  // Get storage unit info
  const storageUnit = placement
    ? storageUnitsData.find(s => s.id === placement.storage_unit_id)
    : null;

  return {
    ...foundBoat,
    customer_name: customer?.display_name || 'Okänd kund',
    customer_type: customer?.first_name ? 'individual' : 'company',
    storage_location: storageUnit?.name || 'Ej placerad',
    dimensions: `${foundBoat.length}m × ${foundBoat.width}m (marginal: ${foundBoat.safety_margin}m)`,
    volume:
      foundBoat.length && foundBoat.width
        ? `${(foundBoat.length * foundBoat.width).toFixed(1)} m²`
        : '-',
    weight_display: foundBoat.weight ? `${foundBoat.weight} kg` : '-',
    current_status_text: getStatusText(foundBoat.current_status),
    location_status_text: getLocationStatusText(foundBoat.location_status),
  };
});

// Helper functions for status texts
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    i_lager: 'I lager',
    vid_brygga: 'Vid brygga',
    oplacerad: 'Oplacerad',
  };
  return statusMap[status] || status;
};

const getLocationStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    lager: 'Lager',
    brygga: 'Brygga',
    lager_brygga: 'Båda (Lager/Brygga)',
  };
  return statusMap[status] || status;
};

// Customer options for dropdown
const customerOptions = computed(() => {
  return customersData.map(customer => ({
    value: customer.id.toString(),
    label: customer.display_name,
  }));
});

// Form fields - Basic Information
const basicInfoFields = [
  {
    key: 'customer_id',
    label: 'Ägare',
    type: 'select' as const,
    options: customerOptions.value,
  },
  { key: 'name', label: 'Båtnamn', type: 'text' as const },
  { key: 'length', label: 'Längd (m)', type: 'number' as const },
  { key: 'width', label: 'Bredd (m)', type: 'number' as const },
  { key: 'safety_margin', label: 'Säkerhetsmarginal (m)', type: 'number' as const },
  { key: 'weight', label: 'Vikt (kg)', type: 'number' as const },
];

// Form fields - Status
const statusFields = [
  {
    key: 'current_status',
    label: 'Aktuell status',
    type: 'select' as const,
    options: [
      { value: 'i_lager', label: 'I lager' },
      { value: 'vid_brygga', label: 'Vid brygga' },
      { value: 'oplacerad', label: 'Oplacerad' },
    ],
  },
  {
    key: 'location_status',
    label: 'Platstyp',
    type: 'select' as const,
    options: [
      { value: 'lager', label: 'Lager' },
      { value: 'brygga', label: 'Brygga' },
      { value: 'lager_brygga', label: 'Båda (Lager/Brygga)' },
    ],
  },
];

// Form fields - Dates
const dateFields = [
  { key: 'move_to_storage_date', label: 'Flytta till lager', type: 'date' as const },
  { key: 'move_from_storage_date', label: 'Flytta från lager', type: 'date' as const },
  { key: 'move_to_brygga_date', label: 'Flytta till brygga', type: 'date' as const },
  { key: 'move_from_brygga_date', label: 'Flytta från brygga', type: 'date' as const },
  { key: 'service_date', label: 'Servicedatum', type: 'date' as const },
];

// Form fields - Notifications
const notificationFields = [
  {
    key: 'sms_notifications',
    label: 'SMS-notiser',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Aktiverade' },
      { value: 'false', label: 'Inaktiverade' },
    ],
  },
  {
    key: 'email_notifications',
    label: 'E-postnotiser',
    type: 'select' as const,
    options: [
      { value: 'true', label: 'Aktiverade' },
      { value: 'false', label: 'Inaktiverade' },
    ],
  },
  { key: 'notes', label: 'Anteckningar', type: 'textarea' as const },
];

// Combine all main fields
const mainFields = [...basicInfoFields, ...statusFields, ...dateFields, ...notificationFields];

const sidebarFields = [
  { key: 'customer_name', label: 'Ägare', type: 'text' as const },
  { key: 'customer_type', label: 'Kundtyp', type: 'text' as const },
  { key: 'current_status_text', label: 'Aktuell status', type: 'text' as const },
  { key: 'location_status_text', label: 'Plats', type: 'text' as const },
  { key: 'storage_location', label: 'Lagringsplats', type: 'text' as const },
  { key: 'dimensions', label: 'Dimensioner', type: 'text' as const },
  { key: 'volume', label: 'Yta', type: 'text' as const },
  { key: 'weight_display', label: 'Vikt', type: 'text' as const },
  { key: 'created_at', label: 'Skapad', type: 'date' as const },
  { key: 'updated_at', label: 'Uppdaterad', type: 'date' as const },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Start', to: '/home' },
  { label: 'Båtar', to: '/boats' },
  {
    label: isNewBoat.value ? 'Ny båt' : boatData.value?.name || 'Okänd båt',
    to: '',
    isCurrentPage: true,
  },
]);

// Stats
const stats = computed(() => {
  if (!boatData.value) return [];

  return [
    {
      label: 'Status',
      value: boatData.value.current_status_text,
      color: getStatusColor(boatData.value.current_status),
    },
    {
      label: 'Plats',
      value: boatData.value.location_status_text,
      color: getLocationColor(boatData.value.location_status),
    },
    {
      label: 'SMS-notiser',
      value: boatData.value.sms_notifications ? 'Aktiverade' : 'Inaktiverade',
      color: boatData.value.sms_notifications ? 'green' : 'gray',
    },
    {
      label: 'E-post',
      value: boatData.value.email_notifications ? 'Aktiverade' : 'Inaktiverade',
      color: boatData.value.email_notifications ? 'green' : 'gray',
    },
  ];
});

// Helper functions for status colors
const getStatusColor = (status: string) => {
  const colorMap: { [key: string]: string } = {
    i_lager: 'blue',
    vid_brygga: 'green',
    oplacerad: 'gray',
  };
  return colorMap[status] || 'gray';
};

const getLocationColor = (status: string) => {
  const colorMap: { [key: string]: string } = {
    lager: 'blue',
    brygga: 'green',
    lager_brygga: 'purple',
  };
  return colorMap[status] || 'gray';
};

// Action buttons
const actionButtons = computed(() => [
  {
    label: 'Skicka SMS',
    icon: MessageSquare,
    onClick: () => sendNotification('sms'),
    variant: 'outline' as const,
    disabled: !boat.value?.sms_notifications,
  },
  {
    label: 'Skicka E-post',
    icon: Send,
    onClick: () => sendNotification('email'),
    variant: 'outline' as const,
    disabled: !boat.value?.email_notifications,
  },
  {
    label: 'Skicka Båda',
    icon: Bell,
    onClick: () => sendNotification('both'),
    variant: 'default' as const,
    disabled: !boat.value?.sms_notifications && !boat.value?.email_notifications,
  },
]);

// Notification function
const sendNotification = (type: 'sms' | 'email' | 'both') => {
  if (!boat.value) return;

  const customer = customersData.find(c => c.id === boat.value!.customer_id);

  let message = '';
  switch (type) {
    case 'sms':
      message = `SMS skickat till ${customer?.display_name || 'kund'} angående båt ${boat.value.name}`;
      break;
    case 'email':
      message = `E-post skickat till ${customer?.display_name || 'kund'} angående båt ${boat.value.name}`;
      break;
    case 'both':
      message = `SMS och e-post skickat till ${customer?.display_name || 'kund'} angående båt ${boat.value.name}`;
      break;
  }

  addToast({
    title: 'Notifikation skickad',
    message,
    type: 'success',
  });
};

// Initialize boat data
onMounted(() => {
  // Check if this is a new boat
  isNewBoat.value = route.query['isNew'] === 'true';

  // Check if we came from a customer detail page
  if (route.query['fromCustomer']) {
    fromCustomerId.value = parseInt(route.query['fromCustomer'] as string);
  }

  if (boatData.value) {
    boat.value = { ...boatData.value } as ExtendedBoat;

    // If it's a new boat, mark as having unsaved changes
    if (isNewBoat.value) {
      hasUnsavedChanges.value = true;
    }
  } else if (isNewBoat.value && fromCustomerId.value) {
    // This is a new boat that was just created, create the boat object
    const customer = customersData.find(c => c.id === fromCustomerId.value);

    boat.value = {
      id: boatId.value,
      customer_id: fromCustomerId.value,
      name: '',
      length: 0,
      width: 0,
      safety_margin: 0,
      weight: 0,
      konva_shape_json: '',
      current_status: 'oplacerad',
      location_status: 'lager',
      current_placement_id: undefined,
      move_to_storage_date: undefined,
      move_from_storage_date: undefined,
      move_to_brygga_date: undefined,
      move_from_brygga_date: undefined,
      service_date: undefined,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sms_notifications: true,
      email_notifications: true,
      // Computed fields for display
      customer_name: customer?.display_name || 'Okänd kund',
      customer_type: customer?.first_name ? 'individual' : 'company',
      storage_location: '-',
      dimensions: '0m × 0m (marginal: 0m)',
      volume: '0.0 m²',
      weight_display: '-',
      current_status_text: 'Oplacerad',
      location_status_text: 'Lager',
    };

    hasUnsavedChanges.value = true;
  } else if (isNewBoat.value) {
    // Handle case where we have isNew=true but no fromCustomer
    boat.value = {
      id: boatId.value,
      customer_id: 1, // Default to first customer
      name: '',
      length: 0,
      width: 0,
      safety_margin: 0,
      weight: 0,
      konva_shape_json: '',
      current_status: 'oplacerad',
      location_status: 'lager',
      current_placement_id: undefined,
      move_to_storage_date: undefined,
      move_from_storage_date: undefined,
      move_to_brygga_date: undefined,
      move_from_brygga_date: undefined,
      service_date: undefined,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sms_notifications: true,
      email_notifications: true,
      // Computed fields for display
      customer_name: customersData[0]?.display_name || 'Okänd kund',
      customer_type: customersData[0]?.first_name ? 'individual' : 'company',
      storage_location: '-',
      dimensions: '0m × 0m (marginal: 0m)',
      volume: '0.0 m²',
      weight_display: '-',
      current_status_text: 'Oplacerad',
      location_status_text: 'Lager',
    };

    hasUnsavedChanges.value = true;
  }
  // If no boat data found and not a new boat, the template will show error message

  // Mark initial load as complete
  setTimeout(() => {
    isInitialLoad.value = false;
  }, 100);
});

// Watch for unsaved changes (but not during initial load)
watch(
  boat,
  () => {
    if (!isInitialLoad.value) {
      hasUnsavedChanges.value = true;
    }
  },
  { deep: true }
);

// Watch for route changes (when boat ID changes)
watch(
  () => route.params['id'],
  newId => {
    if (newId) {
      // Reset state
      isInitialLoad.value = true;
      boat.value = null;
      hasUnsavedChanges.value = false;
      isNewBoat.value = route.query['isNew'] === 'true';

      // Load new boat data
      if (boatData.value) {
        boat.value = { ...boatData.value } as ExtendedBoat;
      }

      // Mark initial load as complete after a short delay
      setTimeout(() => {
        isInitialLoad.value = false;
      }, 100);
    }
  }
);

// Handle save
const handleSave = async () => {
  if (!boat.value) return;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the data
    boat.value.updated_at = new Date().toISOString();
    hasUnsavedChanges.value = false;

    addToast({
      title: 'Båt sparad',
      message: `Båten "${boat.value.name}" har sparats`,
      type: 'success',
    });

    // If it was a new boat, navigate to the detail page without the query params
    if (isNewBoat.value) {
      isNewBoat.value = false;
      await router.replace(`/boats/${boat.value.id}`);
    }
  } catch (error) {
    addToast({
      title: 'Fel vid sparande',
      message: 'Kunde inte spara båten',
      type: 'error',
    });
  }
};

// Handle cancel
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    addToast({
      title: 'Osparade ändringar',
      message: 'Du har osparade ändringar. Vill du fortsätta utan att spara?',
      type: 'warning',
      actions: [
        {
          label: 'Spara',
          action: handleSave,
        },
        {
          label: 'Fortsätt utan att spara',
          action: navigateBack,
        },
      ],
    });
  } else {
    navigateBack();
  }
};

// Navigate back with fallback
const navigateBack = () => {
  // If we came from a customer page, go back to customer detail
  if (fromCustomerId.value) {
    router.push(`/customers/${fromCustomerId.value}`);
  } else {
    // Check if we have a referrer or previous route in history
    const hasHistory = window.history.length > 1;
    const hasReferrer = document.referrer && document.referrer !== window.location.href;

    if (hasHistory && hasReferrer) {
      // Use router.back() if we have proper history
      router.back();
    } else {
      // Fallback to boats list if no reliable history
      router.push('/boats');
    }
  }
};

// Handle field updates
const handleFieldUpdate = (key: string, value: any) => {
  if (boat.value) {
    if (key === 'customer_id') {
      // Convert customer_id to number
      (boat.value as any)[key] = parseInt(value as string);

      // Update customer info when customer changes
      const customer = customersData.find(c => c.id === boat.value!.customer_id);
      if (customer) {
        boat.value.customer_name = customer.display_name;
        boat.value.customer_type = customer.first_name ? 'individual' : 'company';
      }
    } else if (key === 'sms_notifications' || key === 'email_notifications') {
      // Convert boolean string to boolean
      (boat.value as any)[key] = value === 'true';
    } else {
      (boat.value as any)[key] = value;

      // Update computed fields when relevant values change
      if (key === 'length' || key === 'width' || key === 'safety_margin') {
        boat.value.dimensions = `${boat.value.length}m × ${boat.value.width}m (marginal: ${boat.value.safety_margin}m)`;
        boat.value.volume = `${(boat.value.length * boat.value.width).toFixed(1)} m²`;
      } else if (key === 'weight') {
        boat.value.weight_display = boat.value.weight ? `${boat.value.weight} kg` : '-';
      } else if (key === 'current_status') {
        boat.value.current_status_text = getStatusText(value as string);
      } else if (key === 'location_status') {
        boat.value.location_status_text = getLocationStatusText(value as string);
      }
    }

    // Only mark as unsaved if not during initial load
    if (!isInitialLoad.value) {
      hasUnsavedChanges.value = true;
    }
  }
};
</script>

<template>
  <ExtendedDetailPage
    v-if="boat"
    :title="isNewBoat ? 'Ny båt' : boatData?.name || 'Okänd båt'"
    :description="isNewBoat ? 'Skapa en ny båt' : 'Hantera båtinformation och status'"
    :breadcrumbs="breadcrumbs"
    :show-stats="true"
    :stats="stats"
    :data="boat"
    :main-fields="mainFields"
    :sidebar-fields="sidebarFields"
    :action-buttons="actionButtons"
    :has-unsaved-changes="hasUnsavedChanges"
    @save="handleSave"
    @cancel="handleCancel"
    @field-update="handleFieldUpdate"
  />
  <div v-else class="flex flex-col items-center justify-center h-64 space-y-4">
    <p class="text-gray-500">
      {{ isNewBoat ? 'Förbereder ny båt...' : 'Laddar båtinformation...' }}
    </p>
    <div v-if="!isNewBoat && !boatData" class="text-center">
      <p class="text-red-500 mb-2">Båten kunde inte hittas (ID: {{ boatId }})</p>
      <button
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        @click="navigateBack"
      >
        Tillbaka till båtlistan
      </button>
    </div>
  </div>
</template>
