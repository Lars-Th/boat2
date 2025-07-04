<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import DetailPage from '@/components/shared/DetailPage.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, Send, Calendar, Ship, User, MapPin } from 'lucide-vue-next';

// Import data
import boatsData from '@/assets/data/boats.json';
import customersData from '@/assets/data/customers.json';
import placementsData from '@/assets/data/placements.json';
import storageUnitsData from '@/assets/data/storageUnits.json';

interface ExtendedBoat {
  id: number;
  customer_id: number;
  name: string;
  registreringsnummer: string;
  length: number;
  width: number;
  safety_margin: number;
  weight: number;
  konva_shape_json: string;
  current_status: string;
  location_status: string;
  current_placement_id: number | null;
  move_to_storage_date: string | null;
  move_from_storage_date: string | null;
  move_to_brygga_date: string | null;
  move_from_brygga_date: string | null;
  service_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  sms_notifications: boolean;
  email_notifications: boolean;
  // Computed fields
  customer_name?: string;
  customer_type?: string;
  storage_location?: string;
  dimensions?: string;
  area?: string;
  weight_display?: string;
  current_status_text?: string;
  location_status_text?: string;
  // Index signature for dynamic field access
  [key: string]: any;
}

const route = useRoute();
const router = useRouter();
const { addToast } = useToast();

// State
const boat = ref<ExtendedBoat | null>(null);
const originalBoat = ref<ExtendedBoat | null>(null);
const hasUnsavedChanges = ref(false);
const isNewBoat = ref(false);
const fromCustomerId = ref<number | null>(null);
const isInitialLoad = ref(true);

// Computed properties
const boatId = computed(() => {
  return parseInt(route.params['id'] as string);
});

const boatData = computed(() => {
  const foundBoat = boatsData.find(b => b.id === boatId.value);
  if (!foundBoat) return null;

  // Get customer info
  const customer = customersData.find(c => c.id === foundBoat.customer_id);

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
    dimensions: `${foundBoat.length} × ${foundBoat.width} m`,
    area: `${(foundBoat.length * foundBoat.width).toFixed(1)} m²`,
    weight_display: foundBoat.weight ? `${foundBoat.weight} kg` : '-',
    current_status_text: getStatusText(foundBoat.current_status),
    location_status_text: getLocationStatusText(foundBoat.location_status),
  };
});

// Customer options for dropdown
const customerOptions = computed(() => {
  return customersData.map(customer => ({
    value: customer.id.toString(),
    label: customer.display_name,
  }));
});

// Status options
const statusOptions = [
  { value: 'oplacerad', label: 'Oplacerad' },
  { value: 'i_lager', label: 'I lager' },
  { value: 'vid_brygga', label: 'Vid brygga' },
];

const locationStatusOptions = [
  { value: 'lager', label: 'Lager' },
  { value: 'brygga', label: 'Brygga' },
  { value: 'lager_brygga', label: 'Lager & Brygga' },
];

// Form fields configuration
const mainFields = [
  { key: 'name', label: 'Båtnamn', type: 'text' as const },
  { key: 'registreringsnummer', label: 'Registreringsnummer', type: 'text' as const },
  {
    key: 'customer_id',
    label: 'Ägare',
    type: 'select' as const,
    options: customerOptions.value
  },
  { key: 'length', label: 'Längd (m)', type: 'number' as const },
  { key: 'width', label: 'Bredd (m)', type: 'number' as const },
  { key: 'safety_margin', label: 'Säkerhetsmarginal (m)', type: 'number' as const },
  { key: 'weight', label: 'Vikt (kg)', type: 'number' as const },
  {
    key: 'current_status',
    label: 'Aktuell status',
    type: 'select' as const,
    options: statusOptions
  },
  {
    key: 'location_status',
    label: 'Platstyp',
    type: 'select' as const,
    options: locationStatusOptions
  },
  { key: 'move_to_storage_date', label: 'Flytta till lager', type: 'date' as const },
  { key: 'move_from_storage_date', label: 'Flytta från lager', type: 'date' as const },
  { key: 'move_to_brygga_date', label: 'Flytta till brygga', type: 'date' as const },
  { key: 'move_from_brygga_date', label: 'Flytta från brygga', type: 'date' as const },
  { key: 'service_date', label: 'Servicedatum', type: 'date' as const },
  { key: 'notes', label: 'Anteckningar', type: 'textarea' as const },
];

const sidebarFields = [
  { key: 'customer_name', label: 'Ägare', type: 'text' as const },
  { key: 'dimensions', label: 'Dimensioner', type: 'text' as const },
  { key: 'area', label: 'Area', type: 'text' as const },
  { key: 'weight_display', label: 'Vikt', type: 'text' as const },
  { key: 'storage_location', label: 'Lagerplats', type: 'text' as const },
  { key: 'current_status_text', label: 'Status', type: 'text' as const },
  { key: 'location_status_text', label: 'Platstyp', type: 'text' as const },
  { key: 'created_at', label: 'Skapad', type: 'date' as const },
  { key: 'updated_at', label: 'Uppdaterad', type: 'date' as const },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Start', to: '/dashboard' },
  { label: 'Båtar', to: '/boats' },
  {
    label: isNewBoat.value ? 'Ny båt' : boat.value?.name || 'Okänd båt',
    to: '',
    isCurrentPage: true
  },
]);

// Stats
const stats = computed(() => {
  if (!boat.value) return [];

  return [
    {
      label: 'Status',
      value: boat.value.current_status_text || '-',
      color: getStatusColor(boat.value.current_status),
    },
    {
      label: 'Platstyp',
      value: boat.value.location_status_text || '-',
      color: getLocationColor(boat.value.location_status),
    },
    {
      label: 'SMS',
      value: boat.value.sms_notifications ? 'Aktivt' : 'Inaktivt',
      color: boat.value.sms_notifications ? 'green' : 'gray',
    },
    {
      label: 'E-post',
      value: boat.value.email_notifications ? 'Aktivt' : 'Inaktivt',
      color: boat.value.email_notifications ? 'green' : 'gray',
    },
  ];
});

// Helper functions
const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    oplacerad: 'Oplacerad',
    i_lager: 'I lager',
    vid_brygga: 'Vid brygga',
  };
  return statusMap[status] || status;
};

const getLocationStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    lager: 'Lager',
    brygga: 'Brygga',
    lager_brygga: 'Lager & Brygga',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string) => {
  const colorMap: { [key: string]: string } = {
    oplacerad: 'gray',
    i_lager: 'blue',
    vid_brygga: 'green',
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

// Notification functions
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

// Event handlers
const handleSave = async () => {
  if (!boat.value) return;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update timestamps
    boat.value.updated_at = new Date().toISOString();
    hasUnsavedChanges.value = false;
    originalBoat.value = { ...boat.value };

    addToast({
      title: 'Båt sparad',
      message: `Båten "${boat.value.name}" har sparats`,
      type: 'success',
    });

    // If new boat, navigate to detail page
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

const navigateBack = () => {
  if (fromCustomerId.value) {
    router.push(`/customers/${fromCustomerId.value}`);
  } else {
    router.push('/boats');
  }
};

const handleDiscardChanges = () => {
  if (originalBoat.value) {
    boat.value = { ...originalBoat.value };
    hasUnsavedChanges.value = false;

    addToast({
      title: 'Ändringar ångrade',
      message: 'Alla ändringar har ångrade',
      type: 'info',
    });
  }
};

const handleFieldChange = (key: string, value: any) => {
  if (!boat.value) return;

  if (key === 'customer_id') {
    boat.value.customer_id = parseInt(value);

    // Update customer info
    const customer = customersData.find(c => c.id === boat.value!.customer_id);
    if (customer) {
      boat.value.customer_name = customer.display_name;
      boat.value.customer_type = customer.first_name ? 'individual' : 'company';
    }
  } else if (key === 'sms_notifications' || key === 'email_notifications') {
    (boat.value as any)[key] = value === 'true';
  } else {
    (boat.value as any)[key] = value;

    // Update computed fields
    if (key === 'length' || key === 'width') {
      boat.value.dimensions = `${boat.value.length} × ${boat.value.width} m`;
      boat.value.area = `${(boat.value.length * boat.value.width).toFixed(1)} m²`;
    } else if (key === 'weight') {
      boat.value.weight_display = boat.value.weight ? `${boat.value.weight} kg` : '-';
    } else if (key === 'current_status') {
      boat.value.current_status_text = getStatusText(value);
    } else if (key === 'location_status') {
      boat.value.location_status_text = getLocationStatusText(value);
    }
  }

  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true;
  }
};

// Initialize data
onMounted(() => {
  isNewBoat.value = route.query['isNew'] === 'true';

  if (route.query['fromCustomer']) {
    fromCustomerId.value = parseInt(route.query['fromCustomer'] as string);
  }

  if (boatData.value) {
    boat.value = { ...boatData.value };
    originalBoat.value = { ...boatData.value };

    if (isNewBoat.value) {
      hasUnsavedChanges.value = true;
    }
  } else if (isNewBoat.value) {
    // Create new boat
    const defaultCustomerId = fromCustomerId.value || 1;
    const customer = customersData.find(c => c.id === defaultCustomerId);

    boat.value = {
      id: boatId.value,
      customer_id: defaultCustomerId,
      name: '',
      registreringsnummer: '',
      length: 0,
      width: 0,
      safety_margin: 0.5,
      weight: 0,
      konva_shape_json: '',
      current_status: 'oplacerad',
      location_status: 'lager',
      current_placement_id: null,
      move_to_storage_date: null,
      move_from_storage_date: null,
      move_to_brygga_date: null,
      move_from_brygga_date: null,
      service_date: null,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sms_notifications: true,
      email_notifications: true,
      // Computed fields
      customer_name: customer?.display_name || 'Okänd kund',
      customer_type: customer?.first_name ? 'individual' : 'company',
      storage_location: 'Ej placerad',
      dimensions: '0 × 0 m',
      area: '0.0 m²',
      weight_display: '-',
      current_status_text: 'Oplacerad',
      location_status_text: 'Lager',
    };

    hasUnsavedChanges.value = true;
  }

  // Mark initial load as complete
  setTimeout(() => {
    isInitialLoad.value = false;
  }, 100);
});

// Watch for route changes
watch(
  () => route.params['id'],
  (newId) => {
    if (newId) {
      isInitialLoad.value = true;
      boat.value = null;
      hasUnsavedChanges.value = false;
      isNewBoat.value = route.query['isNew'] === 'true';

      if (boatData.value) {
        boat.value = { ...boatData.value };
        originalBoat.value = { ...boatData.value };
      }

      setTimeout(() => {
        isInitialLoad.value = false;
      }, 100);
    }
  }
);
</script>

<template>
  <DetailPage
    v-if="boat"
    :title="isNewBoat ? 'Ny båt' : boat.name || 'Okänd båt'"
    :breadcrumbs="breadcrumbs"
    :show-stats="true"
    :stats="stats"
    :data="boat"
    :main-fields="mainFields"
    :sidebar-fields="sidebarFields"
    :has-unsaved-changes="hasUnsavedChanges"
    @save="handleSave"
    @back="handleCancel"
    @discard-changes="handleDiscardChanges"
    @field-change="handleFieldChange"
  >
    <template #header-actions>
      <!-- Action buttons -->
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!boat.sms_notifications"
          @click="sendNotification('sms')"
        >
          <MessageSquare class="h-3 w-3 mr-1" />
          SMS
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!boat.email_notifications"
          @click="sendNotification('email')"
        >
          <Send class="h-3 w-3 mr-1" />
          E-post
        </Button>
        <Button
          variant="default"
          size="sm"
          :disabled="!boat.sms_notifications && !boat.email_notifications"
          @click="sendNotification('both')"
        >
          <Bell class="h-3 w-3 mr-1" />
          Båda
        </Button>
      </div>
    </template>

    <template #sidebar-content>
      <!-- Enhanced sidebar with additional info -->
      <div class="space-y-4">
        <!-- Basic Information -->
        <div class="bg-white rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
            <Ship class="h-4 w-4" />
            Båtinformation
          </h3>
          <div class="space-y-2">
            <div v-for="field in sidebarFields.slice(0, 7)" :key="field.key" class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">{{ field.label }}</label>
              <div class="text-xs text-gray-700">
                {{ field.type === 'date' && boat[field.key] ?
                    new Date(boat[field.key]).toLocaleDateString('sv-SE') :
                    boat[field.key] || '-' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-white rounded-lg border p-4" v-if="boat.customer_id">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
            <User class="h-4 w-4" />
            Kontaktinformation
          </h3>
          <div class="space-y-2">
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">Ägare</label>
              <div class="text-xs text-gray-700">{{ boat.customer_name }}</div>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">Typ</label>
              <div class="text-xs text-gray-700">
                <Badge :variant="boat.customer_type === 'individual' ? 'default' : 'secondary'">
                  {{ boat.customer_type === 'individual' ? 'Privatperson' : 'Företag' }}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Placement Information -->
        <div class="bg-white rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
            <MapPin class="h-4 w-4" />
            Placeringsinformation
          </h3>
          <div class="space-y-2">
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">Aktuell plats</label>
              <div class="text-xs text-gray-700">{{ boat.storage_location }}</div>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">Status</label>
              <div class="text-xs">
                <Badge :variant="getStatusColor(boat.current_status) === 'green' ? 'default' : 'secondary'">
                  {{ boat.current_status_text }}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="bg-white rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
            <Bell class="h-4 w-4" />
            Notifieringar
          </h3>
          <div class="space-y-2">
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">SMS</label>
              <div class="text-xs">
                <Badge :variant="boat.sms_notifications ? 'default' : 'secondary'">
                  {{ boat.sms_notifications ? 'Aktiverat' : 'Inaktiverat' }}
                </Badge>
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">E-post</label>
              <div class="text-xs">
                <Badge :variant="boat.email_notifications ? 'default' : 'secondary'">
                  {{ boat.email_notifications ? 'Aktiverat' : 'Inaktiverat' }}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Timestamps -->
        <div class="bg-white rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-600">
            <Calendar class="h-4 w-4" />
            Tidsstämplar
          </h3>
          <div class="space-y-2">
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">Skapad</label>
              <div class="text-xs text-gray-700">
                {{ new Date(boat.created_at).toLocaleDateString('sv-SE') }}
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-gray-500">Uppdaterad</label>
              <div class="text-xs text-gray-700">
                {{ new Date(boat.updated_at).toLocaleDateString('sv-SE') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </DetailPage>

  <!-- Loading/Error states -->
  <div v-else class="flex flex-col items-center justify-center h-64 space-y-4">
    <p class="text-gray-500">
      {{ isNewBoat ? 'Förbereder ny båt...' : 'Laddar båtinformation...' }}
    </p>
    <div v-if="!isNewBoat && !boatData" class="text-center">
      <p class="text-red-500 mb-2">Båten kunde inte hittas (ID: {{ boatId }})</p>
      <Button @click="navigateBack">
        Tillbaka till båtlistan
      </Button>
    </div>
  </div>
</template>
