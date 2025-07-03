<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from 'lucide-vue-next';
import ListPage from '@/components/shared/ListPage.vue';

// Import data
import boatsData from '@/assets/data/boats.json';
import customersData from '@/assets/data/customers.json';
import placementsData from '@/assets/data/placements.json';
import storageUnitsData from '@/assets/data/storageUnits.json';

const router = useRouter();

// State
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(20);
const loading = ref(false);
const hasError = ref(false);

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
    lager_brygga: 'Båda',
  };
  return statusMap[status] || status;
};

const getNotificationStatus = (sms: boolean, email: boolean) => {
  if (sms && email) return 'SMS + E-post';
  if (sms) return 'SMS';
  if (email) return 'E-post';
  return 'Inga';
};

// Enrich boats with customer and storage information
const enrichedBoats = computed(() => {
  return boatsData.map(boat => {
    const customer = customersData.find(cust => cust.id === boat.customer_id);
    const placement = boat.current_placement_id
      ? placementsData.find(p => p.id === boat.current_placement_id)
      : null;
    const storageUnit = placement
      ? storageUnitsData.find(s => s.id === placement.storage_unit_id)
      : null;

    return {
      ...boat,
      customer_name: customer
        ? `${customer.first_name} ${customer.name}`.trim() || customer.name
        : 'Okänd kund',
      customer_display_name: customer?.display_name || 'Okänd kund',
      storage_location: storageUnit?.name || 'Ej placerad',
      current_status_text: getStatusText(boat.current_status),
      location_status_text: getLocationStatusText(boat.location_status),
      move_to_storage_formatted: boat.move_to_storage_date
        ? new Date(boat.move_to_storage_date).toLocaleDateString('sv-SE')
        : '-',
      move_from_storage_formatted: boat.move_from_storage_date
        ? new Date(boat.move_from_storage_date).toLocaleDateString('sv-SE')
        : '-',
      move_to_brygga_formatted: boat.move_to_brygga_date
        ? new Date(boat.move_to_brygga_date).toLocaleDateString('sv-SE')
        : '-',
      move_from_brygga_formatted: boat.move_from_brygga_date
        ? new Date(boat.move_from_brygga_date).toLocaleDateString('sv-SE')
        : '-',
      service_date_formatted: boat.service_date
        ? new Date(boat.service_date).toLocaleDateString('sv-SE')
        : '-',
      notifications_status: getNotificationStatus(boat.sms_notifications, boat.email_notifications),
    };
  });
});

// Filtered data based on search
const filteredData = computed(() => {
  if (!searchQuery.value) return enrichedBoats.value;

  const query = searchQuery.value.toLowerCase();
  return enrichedBoats.value.filter(
    boat =>
      boat.name.toLowerCase().includes(query) ||
      boat.customer_name.toLowerCase().includes(query) ||
      boat.customer_display_name.toLowerCase().includes(query) ||
      boat.storage_location.toLowerCase().includes(query) ||
      boat.current_status_text.toLowerCase().includes(query) ||
      boat.location_status_text.toLowerCase().includes(query)
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
    key: 'name',
    label: 'Båtnamn',
    sortable: true,
  },
  {
    key: 'customer_display_name',
    label: 'Ägare',
    sortable: true,
  },
  {
    key: 'length',
    label: 'Längd (m)',
    sortable: true,
  },
  {
    key: 'width',
    label: 'Bredd (m)',
    sortable: true,
  },
  {
    key: 'current_status_text',
    label: 'Status',
    sortable: true,
  },
  {
    key: 'location_status_text',
    label: 'Platstyp',
    sortable: true,
  },
  {
    key: 'storage_location',
    label: 'Lagringsplats',
    sortable: true,
  },
  {
    key: 'service_date_formatted',
    label: 'Servicedatum',
    sortable: true,
  },
  {
    key: 'notifications_status',
    label: 'Notiser',
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
    label: 'Lägg till båt',
    icon: Plus,
    onClick: () => {
      // Create a new boat with default values
      const newBoat = {
        id: Math.max(...boatsData.map(b => b.id)) + 1,
        customer_id: 1, // Default to first customer
        name: '',
        length: 0,
        width: 0,
        safety_margin: 0,
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
      };

      // Add to data temporarily and navigate to detail
      boatsData.push(newBoat);
      router.push(`/boats/${newBoat.id}?isNew=true`);
    },
    variant: 'default' as const,
  },
];

// Breadcrumbs
const breadcrumbs = [
  { label: 'Start', path: '/home' },
  { label: 'Båtar', path: '/boats' },
];

// Stats
const stats = computed(() => [
  {
    label: 'Totalt antal båtar',
    value: enrichedBoats.value.length.toString(),
    color: 'blue' as const,
  },
  {
    label: 'I lager',
    value: enrichedBoats.value.filter(b => b.current_status === 'i_lager').length.toString(),
    color: 'blue' as const,
  },
  {
    label: 'Vid brygga',
    value: enrichedBoats.value.filter(b => b.current_status === 'vid_brygga').length.toString(),
    color: 'green' as const,
  },
  {
    label: 'Oplacerade',
    value: enrichedBoats.value.filter(b => b.current_status === 'oplacerad').length.toString(),
    color: 'gray' as const,
  },
]);

// Event handlers
const handleRowClick = (boat: any) => {
  router.push(`/boats/${boat.id}`);
};

const handleEdit = (boat: any) => {
  router.push(`/boats/${boat.id}`);
};

const handleDelete = (boat: any) => {
  console.log('Delete boat:', boat);
  // Implement delete functionality
};

const handleRefresh = () => {
  loading.value = true;
  // Simulate refresh
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};
</script>

<template>
  <ListPage
    title="Båtar"
    description="Hantera alla båtar i lagringssystemet"
    :breadcrumbs="breadcrumbs"
    :show-stats="true"
    :stats="stats"
    :search-query="searchQuery"
    search-placeholder="Sök båtar..."
    :add-actions="addActions"
    :data="paginatedData"
    :columns="columns"
    :search-fields="[
      'name',
      'customer_name',
      'customer_display_name',
      'storage_location',
      'current_status_text',
      'location_status_text',
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
