<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import DetailPage from '@/components/shared/DetailPage.vue';
import { MapPin, Warehouse, Save, Navigation } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Import combined storage data
import combinedStorageData from '@/assets/data/combinedStorage.json';

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();

// State
const loading = ref(false);
const originalData = ref<any>(null);
const editableData = ref<any>(null);
const hasUnsavedChanges = ref(false);

// Helper functions (same as in StorageLocationList.vue)
const getStatusFromComment = (comment: string): string => {
  if (comment.includes('reparation') || comment.includes('Service')) return 'maintenance';
  if (comment.includes('Vinter')) return 'seasonal';
  if (comment.includes('Full') || comment.includes('full')) return 'full';
  return 'available';
};

const getStatusDisplayFromComment = (comment: string): string => {
  const status = getStatusFromComment(comment);
  switch (status) {
    case 'maintenance': return 'Underhåll';
    case 'seasonal': return 'Säsong';
    case 'full': return 'Full';
    case 'available': return 'Tillgänglig';
    default: return 'Okänd';
  }
};

const extractCapacityFromComment = (comment: string): string => {
  const capacityMatch = comment.match(/(\d+)\s+(båtar|platser)/);
  if (capacityMatch) {
    return `${capacityMatch[1]} ${capacityMatch[2]}`;
  }
  return 'Okänd kapacitet';
};

// Load storage location data
const loadStorageLocation = () => {
  const locationId = parseInt(route.params.id as string);
  const rawLocation = combinedStorageData.find((l: any) => l['id'] === locationId);

  if (!rawLocation) {
    error('Lagringsplats hittades inte', 'Den begärda lagringsplatsen kunde inte hittas.');
    router.push('/storage/locations');
    return;
  }

  // Process the raw data same as in the list
  const processedLocation = {
    id: rawLocation['id'],
    name: rawLocation['name'],
    category: rawLocation['Type'] === 'Brygga' ? 'dock' : 'warehouse',
    type: rawLocation['Type'],
    displayType: rawLocation['Type'],
    latitude: rawLocation['Lat'],
    longitude: rawLocation['Long'],
    status: getStatusFromComment(rawLocation['Comment']),
    displayStatus: getStatusDisplayFromComment(rawLocation['Comment']),
    capacity: extractCapacityFromComment(rawLocation['Comment']),
    details: `H: ${rawLocation['Height']}m, B: ${rawLocation['width']}m`,
    location: `${rawLocation['Lat'].toFixed(4)}, ${rawLocation['Long'].toFixed(4)}`,
    height: rawLocation['Height'],
    width: rawLocation['width'],
    comment: rawLocation['Comment'],
  };

  originalData.value = { ...processedLocation };
  editableData.value = { ...processedLocation };
};

// Field definitions for the form
const mainFields = [
  {
    key: 'name',
    label: 'Namn',
    type: 'text' as const,
  },
  {
    key: 'type',
    label: 'Typ',
    type: 'select' as const,
    options: [
      { value: 'Brygga', label: 'Brygga' },
      { value: 'Lager', label: 'Lager' },
    ],
  },
  {
    key: 'latitude',
    label: 'Latitud',
    type: 'number' as const,
  },
  {
    key: 'longitude',
    label: 'Longitud',
    type: 'number' as const,
  },
  {
    key: 'height',
    label: 'Höjd (m)',
    type: 'number' as const,
  },
  {
    key: 'width',
    label: 'Bredd (m)',
    type: 'number' as const,
  },
  {
    key: 'comment',
    label: 'Kommentar',
    type: 'textarea' as const,
  },
];

const sidebarFields = [
  {
    key: 'id',
    label: 'ID',
    type: 'text' as const,
  },
  {
    key: 'displayStatus',
    label: 'Status',
    type: 'text' as const,
  },
  {
    key: 'capacity',
    label: 'Kapacitet',
    type: 'text' as const,
  },
  {
    key: 'location',
    label: 'Position',
    type: 'text' as const,
  },
  {
    key: 'details',
    label: 'Dimensioner',
    type: 'text' as const,
  },
];

// Computed properties
const title = computed(() => {
  return editableData.value?.name || 'Lagringsplats';
});

const breadcrumbs = computed(() => [
  { label: 'Start', to: '/dashboard' },
  { label: 'Båtlagring', to: '/storage' },
  { label: 'Lagringsplatser', to: '/storage/locations' },
  { label: title.value, to: '', isCurrentPage: true },
]);

const stats = computed(() => {
  if (!editableData.value) return [];

  return [
    {
      label: 'Typ',
      value: editableData.value.displayType,
      color: editableData.value.type === 'Brygga' ? 'text-green-600' : 'text-red-600',
    },
    {
      label: 'Status',
      value: editableData.value.displayStatus,
      color: editableData.value.status === 'available' ? 'text-green-600' : 'text-yellow-600',
    },
    {
      label: 'Kapacitet',
      value: editableData.value.capacity,
      color: 'text-blue-600',
    },
  ];
});

// Event handlers
const handleFieldChange = (key: string, value: any) => {
  if (editableData.value) {
    editableData.value[key] = value;

    // Update computed fields when base data changes
    if (key === 'latitude' || key === 'longitude') {
      editableData.value.location = `${Number(editableData.value.latitude).toFixed(4)}, ${Number(editableData.value.longitude).toFixed(4)}`;
    }

    if (key === 'height' || key === 'width') {
      editableData.value.details = `H: ${editableData.value.height}m, B: ${editableData.value.width}m`;
    }

    if (key === 'comment') {
      editableData.value.status = getStatusFromComment(value);
      editableData.value.displayStatus = getStatusDisplayFromComment(value);
      editableData.value.capacity = extractCapacityFromComment(value);
    }

    if (key === 'type') {
      editableData.value.category = value === 'Brygga' ? 'dock' : 'warehouse';
      editableData.value.displayType = value;
    }

    checkForChanges();
  }
};

const checkForChanges = () => {
  if (!originalData.value || !editableData.value) {
    hasUnsavedChanges.value = false;
    return;
  }

  hasUnsavedChanges.value = JSON.stringify(originalData.value) !== JSON.stringify(editableData.value);
};

const handleSave = async () => {
  if (!editableData.value) return;

  loading.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update original data
    originalData.value = { ...editableData.value };
    hasUnsavedChanges.value = false;

    success('Lagringsplats sparad', 'Ändringarna har sparats framgångsrikt.');
  } catch (err) {
    error('Kunde inte spara', 'Ett fel uppstod när ändringarna skulle sparas.');
  } finally {
    loading.value = false;
  }
};

const handleBack = () => {
  if (hasUnsavedChanges.value) {
    if (confirm('Du har osparade ändringar. Är du säker på att du vill lämna sidan?')) {
      router.push('/storage/locations');
    }
  } else {
    router.push('/storage/locations');
  }
};

const handleDiscardChanges = () => {
  if (originalData.value) {
    editableData.value = { ...originalData.value };
    hasUnsavedChanges.value = false;
  }
};

const handleShowOnMap = () => {
  if (editableData.value) {
    router.push({
      path: '/dashboard',
      query: {
        lat: editableData.value.latitude,
        lng: editableData.value.longitude,
        zoom: '17',
        focus: editableData.value.id,
        name: editableData.value.name
      }
    });
  }
};

// Lifecycle
onMounted(() => {
  loadStorageLocation();
});
</script>

<template>
    <DetailPage
    v-if="editableData"
    :data="editableData"
    :readonly="false"
    :has-unsaved-changes="hasUnsavedChanges"
    :main-fields="mainFields"
    :sidebar-fields="sidebarFields"
    :title="title"
    :breadcrumbs="breadcrumbs"
    :show-stats="true"
    :stats="stats"
    @save="handleSave"
    @back="handleBack"
    @discard-changes="handleDiscardChanges"
    @field-change="handleFieldChange"
  >
    <!-- Custom header actions -->
    <template #header-actions>
      <div class="flex items-center gap-2">
        <!-- Show on Map Button -->
        <button
          class="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
          @click="handleShowOnMap"
        >
          <Navigation class="h-3.5 w-3.5" />
          Visa på karta
        </button>
      </div>
    </template>

        <!-- Custom main content -->
    <template #main-content="{ data }">
      <div class="space-y-4">
        <!-- Basic Information -->
        <div class="bg-background rounded-lg border p-4">
          <h3 class="text-sm font-semibold flex items-center text-foreground/80 mb-3 gap-2">
            <component :is="data['type'] === 'Brygga' ? MapPin : Warehouse" class="h-4 w-4" />
            Grundläggande information
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="field in mainFields.slice(0, 4)" :key="field.key" class="space-y-1">
              <label class="text-xs font-medium text-foreground/80">{{ field.label }}</label>
              <input
                v-if="field.type === 'text'"
                :value="data[field.key]"
                class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="handleFieldChange(field.key, ($event.target as HTMLInputElement).value)"
              />
              <input
                v-else-if="field.type === 'number'"
                :value="data[field.key]"
                type="number"
                step="0.0001"
                class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="handleFieldChange(field.key, parseFloat(($event.target as HTMLInputElement).value))"
              />
              <select
                v-else-if="field.type === 'select'"
                :value="data[field.key]"
                class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @change="handleFieldChange(field.key, ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="option in field.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Dimensions -->
        <div class="bg-background rounded-lg border p-4">
          <h3 class="text-sm font-semibold flex items-center text-foreground/80 mb-3 gap-2">
            <Warehouse class="h-4 w-4" />
            Dimensioner
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="field in mainFields.slice(4, 6)" :key="field.key" class="space-y-1">
              <label class="text-xs font-medium text-foreground/80">{{ field.label }}</label>
              <input
                :value="data[field.key]"
                type="number"
                step="0.1"
                class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                @input="handleFieldChange(field.key, parseFloat(($event.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </div>

        <!-- Comment -->
        <div class="bg-background rounded-lg border p-4">
          <h3 class="text-sm font-semibold flex items-center text-foreground/80 mb-3 gap-2">
            <Save class="h-4 w-4" />
            Kommentar och detaljer
          </h3>

          <div class="space-y-1">
            <label class="text-xs font-medium text-foreground/80">Kommentar</label>
            <textarea
              :value="String(data['comment'] || '')"
              rows="4"
              class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Ange kommentar om lagringsplatsen..."
              @input="handleFieldChange('comment', ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
      </div>
    </template>

    <!-- Custom sidebar content -->
    <template #sidebar-content="{ data }">
      <div class="space-y-4">
                 <!-- Status Overview -->
         <div class="bg-background rounded-lg border p-4">
           <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-foreground">
             <component :is="data['type'] === 'Brygga' ? MapPin : Warehouse" class="h-4 w-4" />
             Status översikt
           </h3>

           <div class="space-y-3">
             <div class="flex justify-between items-center">
               <span class="text-xs text-secondary-foreground">Status</span>
               <span
                 class="text-xs font-medium px-2 py-1 rounded-full"
                 :class="{
                   'bg-green-100 text-green-800': data['status'] === 'available',
                   'bg-yellow-100 text-yellow-800': data['status'] === 'maintenance',
                   'bg-blue-100 text-blue-800': data['status'] === 'seasonal',
                   'bg-red-100 text-red-800': data['status'] === 'full'
                 }"
               >
                 {{ data['displayStatus'] }}
               </span>
             </div>

             <div class="flex justify-between items-center">
               <span class="text-xs text-secondary-foreground">Kapacitet</span>
               <span class="text-xs font-medium">{{ data['capacity'] }}</span>
             </div>

             <div class="flex justify-between items-center">
               <span class="text-xs text-secondary-foreground">Dimensioner</span>
               <span class="text-xs font-medium">{{ data['details'] }}</span>
             </div>
           </div>
         </div>

        <!-- Location Information -->
        <div class="bg-background rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-foreground">
            <MapPin class="h-4 w-4" />
            Position
          </h3>

                     <div class="space-y-2">
             <div>
               <span class="text-xs text-secondary-foreground">Koordinater</span>
               <div class="text-xs font-mono">{{ data['location'] }}</div>
             </div>

             <div>
               <span class="text-xs text-secondary-foreground">Kategori</span>
               <div class="text-xs font-medium capitalize">
                 {{ data['category'] === 'dock' ? 'Brygga' : 'Lager' }}
               </div>
             </div>
           </div>
        </div>

        <!-- System Information -->
        <div class="bg-background rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-foreground">
            <Save class="h-4 w-4" />
            System information
          </h3>

                     <div class="space-y-2">
             <div class="flex justify-between items-center">
               <span class="text-xs text-secondary-foreground">ID</span>
               <span class="text-xs font-mono">{{ data['id'] }}</span>
             </div>
           </div>
        </div>
      </div>
    </template>
  </DetailPage>

  <!-- Loading state -->
  <div v-else class="flex items-center justify-center h-64">
    <div class="text-sm text-gray-500">Laddar lagringsplats...</div>
  </div>
</template>
