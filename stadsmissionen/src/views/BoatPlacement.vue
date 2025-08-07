<template>
  <div class="boat-placement-container">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Båtlager</h1>
        <p class="text-sm text-gray-600 mt-1">Placera och hantera båtar i lager och bryggor</p>
      </div>

      <!-- Status Legend -->
      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Placerad</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Reserverad</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-gray-300"></div>
          <span>Oplacerad</span>
        </div>
      </div>
    </div>

        <div class="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
      <!-- Left Panel: Storage List -->
      <div class="col-span-2 bg-white rounded-lg border p-3 overflow-hidden flex flex-col">
        <h2 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <Warehouse class="h-4 w-4" />
          Lager & Bryggor
        </h2>

        <!-- Storage Type Filter -->
        <div class="mb-3">
          <select v-model="storageTypeFilter" class="w-full h-8 px-2 border rounded-md text-xs">
            <option value="all">Alla typer</option>
            <option value="warehouse">Lager</option>
            <option value="dock">Bryggor</option>
          </select>
        </div>

        <!-- Storage List -->
        <div class="flex-1 overflow-y-auto space-y-1">
          <div
            v-for="storage in filteredStorages"
            :key="storage.id"
            @click="selectStorage(storage)"
            :class="[
              'p-2 rounded border cursor-pointer transition-colors',
              selectedStorage?.id === storage.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            ]"
          >
            <div class="space-y-1">
              <div>
                <h3 class="font-medium text-[10px] leading-tight">{{ storage.name }}</h3>
                <p class="text-[9px] text-gray-500">{{ storage.type_display }}</p>
                <p class="text-[9px] text-gray-500">{{ storage.dimensions }}</p>
              </div>
              <div class="flex justify-between items-center">
                <div class="text-[9px] text-gray-500">Båtar: {{ getStorageBoatCount(storage.id) }}</div>
                <div class="flex items-center gap-1">
                  <div v-if="storage.type === 'warehouse'" class="text-[9px] text-gray-500">
                    {{ storage.level_count }}v
                  </div>
                  <!-- Navigation buttons -->
                  <button
                    @click.stop="viewStorageDetail(storage.id)"
                    class="p-1 hover:bg-gray-200 rounded"
                    title="Visa detaljer"
                  >
                    <Eye class="h-3 w-3 text-gray-400" />
                  </button>
                  <button
                    @click.stop="editStorage(storage.id)"
                    class="p-1 hover:bg-gray-200 rounded"
                    title="Editera"
                  >
                    <Edit class="h-3 w-3 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Storage Canvas -->
      <div class="col-span-8 bg-white rounded-lg border overflow-hidden">
        <div v-if="selectedStorage">
          <BoatPlacementCanvas
            ref="placementCanvas"
            :storage="selectedStorage"
            :boats="availableBoats"
            :placements="storagePlacements"
            @boat-placed="handleBoatPlaced"
            @boat-removed="handleBoatRemoved"
            @placement-updated="handlePlacementUpdated"
            @status-updated="handleStatusUpdated"
          />
        </div>
        <div v-else class="flex items-center justify-center h-full text-gray-500">
          <div class="text-center">
            <Warehouse class="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Välj ett lager eller brygga för att börja placera båtar</p>
          </div>
        </div>
      </div>

            <!-- Right Panel: Boat List -->
      <div class="col-span-2 bg-white rounded-lg border p-3 overflow-hidden flex flex-col">
        <h2 class="text-sm font-semibold mb-3 flex items-center gap-2">
          <Anchor class="h-4 w-4" />
          Båtar
        </h2>

        <!-- Boat Filter -->
        <div class="mb-3 space-y-1">
          <select v-model="boatStatusFilter" class="w-full h-8 px-2 border rounded-md text-xs">
            <option value="all">Alla båtar</option>
            <option value="oplacerad">Oplacerade</option>
            <option value="reserverad">Reserverade</option>
            <option value="placerad">Placerade</option>
          </select>

          <select v-model="boatLocationFilter" class="w-full h-8 px-2 border rounded-md text-xs">
            <option value="all">Alla typer</option>
            <option value="lager">Lager</option>
            <option value="brygga">Brygga</option>
            <option value="lager_brygga">Lager & brygga</option>
          </select>
        </div>

        <!-- Search -->
        <div class="mb-3">
          <input
            v-model="boatSearchQuery"
            type="text"
            placeholder="Sök båtar..."
            class="w-full h-8 px-2 border rounded-md text-xs"
          />
        </div>

        <!-- Boat List -->
        <div class="flex-1 overflow-y-auto space-y-1">
          <div
            v-for="boat in filteredBoats"
            :key="boat.id"
            :class="[
              'p-2 rounded border cursor-pointer transition-colors',
              getBoatStatusColor(boat),
              selectedBoat?.id === boat.id
                ? 'ring-1 ring-blue-400'
                : ''
            ]"
            @click="selectBoat(boat)"
            draggable="true"
            @dragstart="handleDragStart(boat, $event)"
          >
            <div class="space-y-1">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-[10px] leading-tight truncate">{{ boat.name }}</h3>
                <p class="text-[9px] text-gray-500 truncate">{{ boat.registreringsnummer }}</p>
                <p class="text-[9px] text-gray-500">{{ boat.length }}m × {{ boat.width }}m</p>
                <p class="text-[9px] font-medium" :class="getBoatLocationTypeColor(boat)">
                  {{ getLocationTypeDisplay(boat.location_status) }}
                </p>
              </div>
              <div class="flex justify-between items-center">
                <div class="flex gap-1">
                  <!-- Navigation buttons -->
                  <button
                    @click.stop="viewBoatDetail(boat.id)"
                    class="p-1 hover:bg-gray-200 rounded"
                    title="Visa detaljer"
                  >
                    <Eye class="h-3 w-3 text-gray-400" />
                  </button>
                  <button
                    @click.stop="editBoat(boat.id)"
                    class="p-1 hover:bg-gray-200 rounded"
                    title="Editera"
                  >
                    <Edit class="h-3 w-3 text-gray-400" />
                  </button>
                </div>
                <div
                  :class="[
                    'text-[8px] px-1 py-0.5 rounded font-medium',
                    getBoatStatusBadgeColor(boat)
                  ]"
                >
                  {{ getBoatStatusDisplay(boat.current_status) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Placement Actions -->
        <div v-if="selectedBoat && selectedStorage" class="mt-3 p-2 bg-gray-50 rounded">
          <h3 class="text-[10px] font-medium mb-2">Placeringsåtgärder</h3>
          <div class="space-y-1">
            <button
              @click="reserveBoatPlacement"
              :disabled="!canReserveBoat"
              class="w-full px-2 py-1 bg-yellow-500 text-white rounded text-[9px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-600"
            >
              Reservera
            </button>
            <button
              @click="confirmBoatPlacement"
              :disabled="!canPlaceBoat"
              class="w-full px-2 py-1 bg-green-500 text-white rounded text-[9px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600"
            >
              Bekräfta
            </button>
            <button
              @click="removeBoatPlacement"
              :disabled="!canRemoveBoat"
              class="w-full px-2 py-1 bg-red-500 text-white rounded text-[9px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600"
            >
              Ta bort
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Warehouse, Anchor, Eye, Edit } from 'lucide-vue-next';
import BoatPlacementCanvas from '@/components/konva/BoatPlacementCanvas.vue';

// Router
const router = useRouter();

// Import data (enligt DataHandlingGuidelines.md)
import storageUnitsData from '@/assets/data/storageUnits.json';
import boatsData from '@/assets/data/boats.json';
import placementsData from '@/assets/data/boatPlacements.json';

// Types
interface StorageUnit {
  id: number;
  name: string;
  type: 'warehouse' | 'dock';
  type_display: string;
  dimensions: string;
  level_count?: number;
  lat: number;
  long: number;
  height: number;
  width: number;
  comment: string;
}

interface Boat {
  id: number;
  customer_id: number;
  name: string;
  registreringsnummer: string;
  length: number;
  width: number;
  safety_margin: number;
  weight: number;
  current_status: 'oplacerad' | 'reserverad' | 'placerad';
  location_status: 'lager' | 'brygga' | 'lager_brygga';
  current_placement_id: number | null;
  notes: string;
}

interface BoatPlacement {
  id: number;
  boat_id: number;
  storage_id: number;
  storage_name: string;
  storage_type: 'warehouse' | 'dock';
  floor_number: number;
  placement_type: 'lager' | 'brygga';
  status: 'reserverad' | 'placerad';
  position: {
    x: number;
    y: number;
    rotation: number;
  };
  placed_by_user_id: number;
  placed_date: string;
  reservation_date: string;
  physical_placement_date: string | null;
  notes: string;
}

// Reactive data
const selectedStorage = ref<StorageUnit | null>(null);
const selectedBoat = ref<Boat | null>(null);
const placementCanvas = ref<InstanceType<typeof BoatPlacementCanvas> | null>(null);
const activeFloor = ref(1);

// Filters
const storageTypeFilter = ref('all');
const boatStatusFilter = ref('all');
const boatLocationFilter = ref('all');
const boatSearchQuery = ref('');

// Data processing
const processedStorages = computed<StorageUnit[]>(() => {
  return storageUnitsData.map((storage: any) => {
    const type = storage.unit_type; // warehouse or dock directly

    return {
      id: storage.id,
      name: storage.name,
      type,
      type_display: storage.unit_type === 'dock' ? 'Brygga' : 'Lager',
      dimensions: `${storage.length}m × ${storage.width}m`,
      level_count: storage.level_count,
      lat: storage.latitude,
      long: storage.longitude,
      height: storage.width,  // Y-dimension
      width: storage.length,  // X-dimension (length)
      comment: `${storage.unit_type === 'dock' ? 'Brygga' : 'Lager'} med ${storage.level_count} våningar`
    };
  });
});

const availableBoats = ref<Boat[]>([...boatsData as Boat[]]);

const allPlacements = ref<BoatPlacement[]>([...placementsData as BoatPlacement[]]);

// Filtered data
const filteredStorages = computed(() => {
  return processedStorages.value.filter(storage => {
    if (storageTypeFilter.value === 'all') return true;
    return storage.type === storageTypeFilter.value;
  });
});

const filteredBoats = computed(() => {
  return availableBoats.value.filter(boat => {
    // Status filter
    if (boatStatusFilter.value !== 'all' && boat.current_status !== boatStatusFilter.value) {
      return false;
    }

    // Location type filter
    if (boatLocationFilter.value !== 'all') {
      if (boatLocationFilter.value === 'lager_brygga') {
        if (boat.location_status !== 'lager_brygga') return false;
      } else {
        if (boat.location_status !== boatLocationFilter.value) return false;
      }
    }

    // Search filter
    if (boatSearchQuery.value) {
      const query = boatSearchQuery.value.toLowerCase();
      return (
        boat.name.toLowerCase().includes(query) ||
        boat.registreringsnummer.toLowerCase().includes(query)
      );
    }

    return true;
  });
});

const storagePlacements = computed(() => {
  if (!selectedStorage.value) return [];
  return allPlacements.value.filter(placement =>
    placement.storage_id === selectedStorage.value!.id
  );
});

// Helper functions
const getStorageBoatCount = (storageId: number): number => {
  return allPlacements.value.filter(placement => placement.storage_id === storageId).length;
};

const getBoatStatusColor = (boat: Boat): string => {
  switch (boat.current_status) {
    case 'placerad': return 'border-green-200 bg-green-50';
    case 'reserverad': return 'border-yellow-200 bg-yellow-50';
    case 'oplacerad': return 'border-gray-200 bg-gray-50';
    default: return 'border-gray-200 bg-white';
  }
};

const getBoatStatusBadgeColor = (boat: Boat): string => {
  switch (boat.current_status) {
    case 'placerad': return 'bg-green-100 text-green-800';
    case 'reserverad': return 'bg-yellow-100 text-yellow-800';
    case 'oplacerad': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getBoatLocationTypeColor = (boat: Boat): string => {
  switch (boat.location_status) {
    case 'lager': return 'text-blue-600';
    case 'brygga': return 'text-cyan-600';
    case 'lager_brygga': return 'text-purple-600';
    default: return 'text-gray-600';
  }
};

const getBoatStatusDisplay = (status: string): string => {
  switch (status) {
    case 'placerad': return 'Placerad';
    case 'reserverad': return 'Reserverad';
    case 'oplacerad': return 'Oplacerad';
    default: return status;
  }
};

const getLocationTypeDisplay = (locationType: string): string => {
  switch (locationType) {
    case 'lager': return 'Lager';
    case 'brygga': return 'Brygga';
    case 'lager_brygga': return 'Lager & Brygga';
    default: return locationType;
  }
};

// Actions
const selectStorage = (storage: StorageUnit) => {
  selectedStorage.value = storage;
  console.log(`🏗️ Selected storage: ${storage.name} (${storage.type})`);
};

const selectBoat = (boat: Boat) => {
  selectedBoat.value = boat;
  console.log(`⛵ Selected boat: ${boat.name} (${boat.current_status})`);
};

// Drag and drop handlers
const handleDragStart = (boat: Boat, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(boat));
    event.dataTransfer.effectAllowed = 'move';
  }
  console.log(`🖱️ Started dragging boat: ${boat.name}`);
};

// Placement actions
const canReserveBoat = computed(() => {
  return selectedBoat.value?.current_status === 'oplacerad' && selectedStorage.value;
});

const canPlaceBoat = computed(() => {
  return selectedBoat.value?.current_status === 'reserverad' && selectedStorage.value;
});

const canRemoveBoat = computed(() => {
  return selectedBoat.value && ['reserverad', 'placerad'].includes(selectedBoat.value.current_status);
});

const reserveBoatPlacement = () => {
  if (!selectedBoat.value || !selectedStorage.value) return;
  console.log(`📝 Reserving boat ${selectedBoat.value.name} in ${selectedStorage.value.name}`);
  // TODO: Implement reservation logic
};

const confirmBoatPlacement = () => {
  if (!selectedBoat.value || !selectedStorage.value) return;
  console.log(`✅ Confirming placement of boat ${selectedBoat.value.name} in ${selectedStorage.value.name}`);
  // TODO: Implement placement confirmation logic
};

const removeBoatPlacement = () => {
  if (!selectedBoat.value) return;
  console.log(`❌ Removing placement of boat ${selectedBoat.value.name}`);
  // TODO: Implement removal logic
};

// Canvas event handlers
const handleBoatPlaced = (event: any) => {
  console.log('🎯 Boat placed:', event);

  if (!selectedStorage.value || !event.boat) {
    console.error('❌ Cannot place boat: missing storage or boat data');
    return;
  }

  // Create new placement
  const newPlacement: BoatPlacement = {
    id: Date.now(), // Simple ID generation
    boat_id: event.boat.id,
    storage_id: selectedStorage.value.id,
    storage_name: selectedStorage.value.name,
    storage_type: selectedStorage.value.type,
    floor_number: activeFloor.value || 1,
    placement_type: selectedStorage.value.type === 'dock' ? 'brygga' : 'lager',
    status: 'reserverad', // Start as reserved
    position: {
      x: event.position.x,
      y: event.position.y,
      rotation: event.position.rotation || 0
    },
    placed_by_user_id: 1, // TODO: Get actual user ID
    placed_date: new Date().toISOString(),
    reservation_date: new Date().toISOString(),
    physical_placement_date: null,
    notes: `Placerad via drag & drop i ${selectedStorage.value.name}`
  };

  // Add to placements (in a real app, this would be API call)
  allPlacements.value.push(newPlacement);

  // Update boat status
  const boat = availableBoats.value.find(b => b.id === event.boat.id);
  if (boat) {
    boat.current_status = 'reserverad';
    boat.current_placement_id = newPlacement.id;
  }

  console.log(`✅ Boat ${event.boat.name} placed in ${selectedStorage.value.name} at (${event.position.x.toFixed(1)}, ${event.position.y.toFixed(1)})`);
};

const handleBoatRemoved = (event: any) => {
  console.log('🗑️ Boat removed:', event);

  if (!event.placement) {
    console.error('❌ Cannot remove boat: missing placement data');
    return;
  }

  // Remove from placements
  const placementIndex = allPlacements.value.findIndex(p => p.id === event.placement.id);
  if (placementIndex !== -1) {
    allPlacements.value.splice(placementIndex, 1);
  }

  // Update boat status
  const boat = availableBoats.value.find(b => b.id === event.boat.id);
  if (boat) {
    boat.current_status = 'oplacerad';
    boat.current_placement_id = null;
  }

  console.log(`✅ Boat ${event.boat.name} removed from placement`);
};

const handlePlacementUpdated = (event: any) => {
  console.log('🔄 Placement updated:', event);

  if (!event.placement) {
    console.error('❌ Cannot update placement: missing placement data');
    return;
  }

  // Find and update placement
  const placement = allPlacements.value.find(p => p.id === event.placement.id);
  if (placement) {
    placement.position = event.newPosition;

    console.log(`✅ Placement updated for boat at (${event.newPosition.x.toFixed(1)}, ${event.newPosition.y.toFixed(1)})`);
  }
};

const handleStatusUpdated = (event: any) => {
  console.log('📊 Status updated:', event);

  if (!event.placement || !event.newStatus) {
    console.error('❌ Cannot update status: missing placement or status data');
    return;
  }

  // Find and update placement
  const placement = allPlacements.value.find(p => p.id === event.placement.id);
  if (placement) {
    const oldStatus = placement.status;
    placement.status = event.newStatus;

    // Update physical placement date if changing to 'placerad'
    if (event.newStatus === 'placerad' && oldStatus !== 'placerad') {
      placement.physical_placement_date = new Date().toISOString();
    }

    // Update boat status
    const boat = availableBoats.value.find(b => b.id === placement.boat_id);
    if (boat) {
      boat.current_status = event.newStatus;
    }

    console.log(`✅ Status updated from ${oldStatus} to ${event.newStatus} for boat ${placement.boat_id}`);
  }
};

// Navigation functions
const viewStorageDetail = (storageId: number) => {
  router.push(`/storage/locations/${storageId}`);
  console.log(`🔗 Navigating to storage detail: ${storageId}`);
};

const editStorage = (storageId: number) => {
  router.push(`/storage/locations/${storageId}?mode=edit`);
  console.log(`✏️ Navigating to edit storage: ${storageId}`);
};

const viewBoatDetail = (boatId: number) => {
  router.push(`/boats/${boatId}`);
  console.log(`🔗 Navigating to boat detail: ${boatId}`);
};

const editBoat = (boatId: number) => {
  router.push(`/boats/${boatId}?mode=edit`);
  console.log(`✏️ Navigating to edit boat: ${boatId}`);
};

// Lifecycle
onMounted(() => {
  console.log('🚀 BoatPlacement view mounted');
  console.log(`📊 Loaded ${processedStorages.value.length} storage units`);
  console.log(`⛵ Loaded ${availableBoats.value.length} boats`);
  console.log(`📍 Loaded ${allPlacements.value.length} placements`);
});
</script>

<style scoped>
.boat-placement-container {
  padding: 1.5rem;
  min-height: 100vh;
  background-color: #f8fafc;
}

/* Custom scrollbar for lists */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
