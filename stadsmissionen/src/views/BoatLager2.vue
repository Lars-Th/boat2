<template>
  <div class="boat-lager2-container">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Båtlager 2.0</h1>
        <p class="page-subtitle">Avancerat system för båtplacering med korrekt visualisering</p>
      </div>

      <!-- Status Legend -->
      <div class="status-legend">
        <div class="legend-item">
          <div class="status-indicator green"></div>
          <span>Oplacerad</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator blue"></div>
          <span>Placerad</span>
        </div>
        <div class="legend-item">
          <div class="status-indicator gray"></div>
          <span>Reserverad</span>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <!-- Left Panel: Storage Selection -->
      <div class="storage-panel">
        <h3 class="panel-title">
          <Warehouse class="panel-icon" />
          Lager & Bryggor
        </h3>

        <!-- Storage Filter -->
        <div class="filter-section">
          <select v-model="storageFilter" class="filter-select">
            <option value="all">Alla</option>
            <option value="Lager">Lager</option>
            <option value="Brygga">Bryggor</option>
          </select>
        </div>

        <!-- Storage List -->
        <div class="storage-list">
          <div
            v-for="storage in filteredStorages"
            :key="storage.id"
            @click="selectStorage(storage)"
            :class="[
              'storage-item',
              { active: selectedStorage?.id === storage.id }
            ]"
          >
            <div class="storage-info">
              <h4 class="storage-name">{{ storage.name }}</h4>
              <p class="storage-type">{{ storage.Type }}</p>
              <p class="storage-size">{{ storage.Height }}m × {{ storage.width }}m</p>
              <p class="storage-boats">
                <span class="boat-count">{{ getStorageBoatCount(storage.id) }}</span> båtar
                <span v-if="getStorageStatusCounts(storage.id).total > 0" class="status-breakdown">
                  ({{ getStorageStatusCounts(storage.id).placerad }}P/{{ getStorageStatusCounts(storage.id).reserverad }}R/{{ getStorageStatusCounts(storage.id).oplacerad }}O)
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Canvas Area -->
      <div class="canvas-area">
        <!-- Canvas Toolbar (same style as StorageDesigner) -->
        <div class="canvas-toolbar">
          <!-- Storage Info -->
          <div class="toolbar-group">
            <span class="toolbar-label">Lager:</span>
            <div class="info-display">
              {{ selectedStorage?.name || 'Inget valt' }}
            </div>
          </div>

          <div class="toolbar-separator"></div>

          <!-- View Controls -->
          <div class="toolbar-group">
            <span class="toolbar-label">Zoom:</span>
            <button @click="zoomOut" class="toolbar-button" title="Zooma ut">
              <ZoomOut class="button-icon" />
            </button>
            <div class="input-group">
              <input
                v-model="zoomPercentage"
                @change="setZoomFromPercentage"
                class="toolbar-input zoom-input"
                type="number"
                min="25"
                max="300"
                step="25"
              />
              <span class="input-unit">%</span>
            </div>
            <button @click="zoomIn" class="toolbar-button" title="Zooma in">
              <ZoomIn class="button-icon" />
            </button>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Pan Mode -->
          <div class="toolbar-group">
            <button @click="centerStorage" class="toolbar-button" title="Centrera lagret">
              <Navigation2 class="button-icon" />
            </button>
            <button
              @click="togglePanMode"
              :class="['toolbar-button', { active: isPanMode }]"
              title="Panoreringsläge"
            >
              <Move class="button-icon" />
              {{ isPanMode ? 'PAN PÅ' : 'PAN AV' }}
            </button>
          </div>

          <div class="toolbar-separator"></div>

                    <!-- Info om klick-funktionalitet -->
          <div class="toolbar-group">
            <span class="toolbar-label">Klicka på båt:</span>
            <div class="info-display">
              <span class="status-info placerad">Blå → Grön</span>
              <span class="status-info reserverad">Grå → Grön</span>
              <span class="status-info oplacerad">Grön → Blå</span>
            </div>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Snabba status-knappar -->
                  <div class="toolbar-group">
          <span class="toolbar-label">Placerings-status:</span>
          <select v-model="defaultPlacementStatus" class="status-select">
            <option value="oplacerad">Oplacerad (grön)</option>
            <option value="placerad">Placerad (blå)</option>
            <option value="reserverad">Reserverad (grå)</option>
          </select>
        </div>

        <div class="toolbar-separator"></div>

        <div class="toolbar-group">
          <span class="toolbar-label">Snabb-status:</span>
          <button @click="setAllBoatsAsPlaced" class="toolbar-button status-action" title="Sätt alla OPLACERADE båtar som placerade (blå, låsta). Andra båtar behåller sin status.">
            Placera oplacerade
          </button>
          <button @click="setAllBoatsAsReserved" class="toolbar-button status-action" title="Sätt alla OPLACERADE båtar som reserverade (grå). Andra båtar behåller sin status.">
            Reservera oplacerade
          </button>
        </div>

          <div class="toolbar-separator"></div>

          <!-- Info om den nya logiken -->
          <div class="toolbar-group">
            <span class="toolbar-label">
              <Lightbulb class="inline w-4 h-4 mr-1" />
              Logik:
            </span>
            <div class="logic-info">
              <span class="logic-text">Reserverade båtar behåller sin status</span>
              <span class="logic-text">Bara en grön båt per lager</span>
            </div>
          </div>

          <div class="toolbar-separator"></div>

                    <!-- Rotation Controls -->
                    <div class="toolbar-group">
            <span class="toolbar-label">
              <RotateCw class="inline w-4 h-4 mr-1" />
              Rotation:
            </span>
            <button
              @click="rotateBoatLeft"
              class="toolbar-button rotation-btn"
              :disabled="!selectedPlacedBoat"
              title="Rotera vänster 22.5°"
            >
              <RotateCcw class="w-4 h-4 mr-1" />
              Vänster
            </button>
            <button
              @click="rotateBoatRight"
              class="toolbar-button rotation-btn"
              :disabled="!selectedPlacedBoat"
              title="Rotera höger 22.5°"
            >
              <RotateCw class="w-4 h-4 mr-1" />
              Höger
            </button>
            <div v-if="selectedPlacedBoat" class="selected-boat-info">
              Vald: {{ selectedPlacedBoat.name }}
            </div>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Statistics -->
          <div class="toolbar-group">
            <span class="toolbar-label">Stats:</span>
            <div class="stats-display">
              <span>{{ placedBoatCount }} totalt</span>
              <span class="unplaced-count">{{ unplacedBoatCount }} oplacerade</span>
              <span>{{ collisionCount }} kollisioner</span>
            </div>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Reset -->
          <div class="toolbar-group">
            <button @click="resetCanvas" class="toolbar-button" title="Återställ vy">
              <RotateCcw class="button-icon" />
              Reset
            </button>
          </div>
        </div>

        <!-- Konva Canvas Container -->
        <div
          ref="canvasContainer"
          class="konva-canvas"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @dragenter="handleDragEnter"
          @dragleave="handleDragLeave"
        ></div>

        <!-- Drop Zone Overlay -->
        <div v-if="isDragging" class="drop-zone-overlay">
          <div class="drop-zone-content">
            <Package class="drop-icon" />
            <p>Släpp båten här för att placera</p>
          </div>
        </div>

        <!-- Boat Info Tooltip -->
                <div
          v-if="showTooltip && tooltipData"
          class="boat-tooltip"
          :style="{
            left: tooltipPosition.x + 'px',
            top: tooltipPosition.y + 'px'
          }"
          @mouseenter="keepTooltipOpen"
          @mouseleave="hideTooltipDelayed"
        >
                              <div class="tooltip-header">
            <div class="tooltip-header-main">
              <h4 class="tooltip-boat-name">{{ tooltipData.boat.name }}</h4>
              <span class="tooltip-boat-reg">{{ tooltipData.boat.registreringsnummer }}</span>
            </div>
            <div v-if="tooltipCustomer" class="tooltip-owner-info">
              <span class="tooltip-owner-label">Ägare</span>
              <span class="tooltip-owner-name">{{ tooltipCustomer.display_name }}</span>
            </div>
          </div>

                    <div class="tooltip-content">
            <div class="tooltip-status-row">
              <span class="tooltip-status-label">Status</span>
              <span
                class="tooltip-status-badge"
                :class="tooltipData.placement.status"
              >
                {{ getStatusText(tooltipData.placement.status) }}
              </span>
            </div>

            <div class="tooltip-specs-grid">
              <div class="tooltip-spec-item">
                <span class="tooltip-spec-label">Storlek</span>
                <span class="tooltip-spec-value">{{ tooltipData.boat.length }}×{{ tooltipData.boat.width }}m</span>
              </div>
            </div>

            <!-- Action buttons -->
                        <div class="tooltip-actions">
              <button
                @click="setBoatStatusFromTooltip(tooltipData.boat, tooltipData.placement, 'oplacerad')"
                :class="['tooltip-action-btn', 'btn-oplacerad', { active: tooltipData.placement.status === 'oplacerad' }]"
                title="Gör båten oplacerad (grön)"
              >
                <CircleDot class="w-3 h-3 mr-1 text-green-500" />
                Oplacerad
              </button>
              <button
                @click="setBoatStatusFromTooltip(tooltipData.boat, tooltipData.placement, 'placerad')"
                :class="['tooltip-action-btn', 'btn-placerad', { active: tooltipData.placement.status === 'placerad' }]"
                title="Markera som placerad (blå)"
              >
                <CircleDot class="w-3 h-3 mr-1 text-blue-500" />
                Placerad
              </button>
              <button
                @click="setBoatStatusFromTooltip(tooltipData.boat, tooltipData.placement, 'reserverad')"
                :class="['tooltip-action-btn', 'btn-reserverad', { active: tooltipData.placement.status === 'reserverad' }]"
                title="Markera som reserverad (grå)"
              >
                <CircleDot class="w-3 h-3 mr-1 text-gray-400" />
                Reserverad
              </button>
              <button
                @click="removeBoatFromStorage(tooltipData.boat, tooltipData.placement)"
                class="tooltip-action-btn btn-remove"
                title="Ta bort båten från lagret"
              >
                <Trash2 class="w-3 h-3 mr-1" />
                Ta bort
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Boat List -->
      <div class="boat-panel">
        <h3 class="panel-title">
          <Anchor class="panel-icon" />
          Tillgängliga Båtar
        </h3>

        <!-- Boat Filter -->
        <div class="filter-section">
          <input
            v-model="boatSearchQuery"
            placeholder="Sök båtar..."
            class="search-input"
          />
        </div>

        <!-- Boat List -->
        <div class="boat-list">
          <div
            v-for="boat in filteredBoats"
            :key="boat.id"
            @click="selectBoat(boat)"
            @dragstart="handleBoatDragStart(boat, $event)"
            :draggable="true"
            :class="[
              'boat-item',
              {
                active: selectedBoat?.id === boat.id,
                placed: isBoatPlaced(boat.id),
                [boat.current_status]: true
              }
            ]"
          >
            <div class="boat-info">
              <h4 class="boat-name">{{ boat.name }}</h4>
              <p class="boat-reg">{{ boat.registreringsnummer }}</p>
              <p class="boat-dims">{{ boat.length }}m × {{ boat.width }}m</p>
              <p class="boat-status">{{ getStatusText(boat.current_status) }}</p>
              <p v-if="getBoatStorageInfo(boat.id)" class="boat-storage">
                <MapPin class="inline w-3 h-3 mr-1" />
                {{ getBoatStorageInfo(boat.id) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import Konva from 'konva';
import {
  Warehouse,
  Anchor,
  ZoomOut,
  ZoomIn,
  Move,
  Navigation2,
  RotateCcw,
  RotateCw,
  Package,
  Lightbulb,
  CircleDot,
  Trash2,
  MapPin
} from 'lucide-vue-next';

// Import JSON data
import storageData from '@/assets/data/combinedStorage.json';
import boatsData from '@/assets/data/boats.json';
import placementsData from '@/assets/data/boatPlacements.json';
import customersData from '@/assets/data/customers.json';

// Types
interface Storage {
  id: number;
  name: string;
  Type: string;
  Lat: number;
  Long: number;
  Height: number;
  width: number;
  Comment: string;
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
  konva_shape_json: string;
  current_status: 'oplacerad' | 'placerad' | 'reserverad';
  location_status: string;
  current_placement_id: number | null;
}

interface BoatPlacement {
  id: number;
  boat_id: number;
  storage_unit_id: number;
  storage_unit_name: string;
  floor_number: number;
  status: 'oplacerad' | 'placerad' | 'reserverad';
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
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: number;
  customer_no: string;
  name: string;
  first_name: string;
  external_id: string;
  display_name: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

// SVG Constants (EXAKT samma som BoatDetailCanvas)
const SVG_CONSTANTS = {
  HULL_PATH: "M10,15 C10,9,14,5,20,5 H130 C134,5,138,7,141,10 L164,31 C168,35,168,43,164,47 L141,68 C138,71,134,73,130,73 H20 C14,73,10,69,10,63 Z",
  MARGIN_PATH: "M10,15 C10,9,14,5,20,5 H130 C134,5,138,7,141,10 L164,31 C168,35,168,43,164,47 L141,68 C138,71,134,73,130,73 H20 C14,73,10,69,10,63 Z",
  HULL_VB: { w: 174, h: 78 },
  MARGIN_VB: { w: 174, h: 78 },
  PX_PER_M: 10 // Används för båt-skalning (inte position)
};

// State styles - EXAKT samma som BoatDetailCanvas.vue
const stateStyles: Record<string, { hull: any; margin: any }> = {
  // PLACEMENT STATUS (korrekta från BoatDetailCanvas)
  oplacerad: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#27d07c', strokeWidth: 1, dash: [5, 5], fill: '#E9FBF3' }
  },
  placerad: {
    hull: { stroke: '#1e40af', strokeWidth: 2, fill: '#dbeafe' },
    margin: { stroke: '#1e40af', strokeWidth: 1, dash: [5, 5], fill: '#eff6ff' }
  },
  reserverad: {
    hull: { stroke: '#9ca3af', strokeWidth: 2, fill: '#ffffff', opacity: 0.7, dash: [8, 4] },
    margin: { stroke: '#9ca3af', strokeWidth: 1, dash: [10, 5], fill: '#f9fafb', opacity: 0.7 }
  },

  // COLLISION DETECTION STATES (från BoatDetailCanvas)
  margin_collision: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#dc2626', strokeWidth: 1, dash: [5, 5], fill: '#fef2f2' }
  },
  hull_collision: {
    hull: { stroke: '#dc2626', strokeWidth: 2, fill: '#fef2f2' },
    margin: { stroke: '#dc2626', strokeWidth: 1, dash: [5, 5], fill: '#fef2f2' }
  }
};

// Reactive state
const canvasContainer = ref<HTMLDivElement | null>(null);
const stage = ref<Konva.Stage | null>(null);
const layer = ref<Konva.Layer | null>(null);

const selectedStorage = ref<Storage | null>(null);
const selectedBoat = ref<Boat | null>(null);
const selectedPlacedBoat = ref<Boat | null>(null);
const selectedPlacement = ref<BoatPlacement | null>(null);
const storageFilter = ref<string>('all');
const boatSearchQuery = ref<string>('');

const zoomLevel = ref<number>(1);
const zoomPercentage = ref<number>(100);
const isPanMode = ref<boolean>(false);
const isDragging = ref<boolean>(false);

// Tooltip state
const showTooltip = ref<boolean>(false);
const tooltipData = ref<{boat: Boat; placement: BoatPlacement} | null>(null);
const tooltipPosition = ref<{x: number; y: number}>({x: 0, y: 0});
const defaultPlacementStatus = ref<'oplacerad' | 'placerad' | 'reserverad'>('oplacerad');

const boats = ref<Boat[]>(boatsData as Boat[]);
const storages = ref<Storage[]>(storageData as Storage[]);
const placements = ref<BoatPlacement[]>(placementsData as BoatPlacement[]);
const customers = ref<Customer[]>(customersData as Customer[]);

// Computed properties
const filteredStorages = computed(() => {
  if (storageFilter.value === 'all') {
    return storages.value;
  }
  return storages.value.filter(s => s.Type === storageFilter.value);
});

const filteredBoats = computed(() => {
  if (!boatSearchQuery.value) {
    return boats.value;
  }
  const query = boatSearchQuery.value.toLowerCase();
  return boats.value.filter(boat =>
    boat.name.toLowerCase().includes(query) ||
    boat.registreringsnummer.toLowerCase().includes(query)
  );
});

const currentStoragePlacements = computed(() => {
  if (!selectedStorage.value) return [];
  return placements.value.filter(p => p.storage_unit_id === selectedStorage.value!.id);
});

const placedBoatCount = computed(() => {
  return currentStoragePlacements.value.length;
});

const unplacedBoatCount = computed(() => {
  return currentStoragePlacements.value.filter(p => p.status === 'oplacerad').length;
});

const collisionCount = computed(() => {
  if (!selectedStorage.value) return 0;

  let collisions = 0;
  const placementsInStorage = placements.value.filter(p =>
    p.storage_unit_id === selectedStorage.value!.id &&
    p.status === 'oplacerad' // Bara räkna kollisioner för flyttbara båtar
  );

  for (const placement of placementsInStorage) {
    const boat = boats.value.find(b => b.id === placement.boat_id);
    if (boat) {
      const collisionState = checkBoatCollisions(boat, placement);
      if (collisionState === 'hull_collision' || collisionState === 'margin_collision') {
        collisions++;
      }
    }
  }

  return collisions;
});

const tooltipCustomer = computed(() => {
  if (!tooltipData.value) return null;
  return customers.value.find(c => c.id === tooltipData.value!.boat.customer_id) || null;
});

// Helper functions
const getStorageBoatCount = (storageId: number): number => {
  return placements.value.filter(p => p.storage_unit_id === storageId).length;
};

const isBoatPlaced = (boatId: number): boolean => {
  return placements.value.some(p => p.boat_id === boatId);
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'oplacerad': 'Oplacerad',
    'placerad': 'Placerad',
    'reserverad': 'Reserverad'
  };
  return statusMap[status] || status;
};

const getBoatStorageInfo = (boatId: number): string | null => {
  const placement = placements.value.find(p => p.boat_id === boatId);
  if (!placement) return null;

    return placement.storage_unit_name;
};

const getStorageStatusCounts = (storageId: number) => {
  const storagePlacements = placements.value.filter(p => p.storage_unit_id === storageId);

  const counts = {
    total: storagePlacements.length,
    placerad: storagePlacements.filter(p => p.status === 'placerad').length,
    reserverad: storagePlacements.filter(p => p.status === 'reserverad').length,
    oplacerad: storagePlacements.filter(p => p.status === 'oplacerad').length
  };

  return counts;
};

// Tooltip interaction functions
let tooltipHideTimeout: number | null = null;

const keepTooltipOpen = () => {
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }
};

const hideTooltipDelayed = () => {
  tooltipHideTimeout = setTimeout(() => {
    showTooltip.value = false;
    tooltipData.value = null;
  }, 200);
};

const hideTooltipImmediately = () => {
  if (tooltipHideTimeout) {
    clearTimeout(tooltipHideTimeout);
    tooltipHideTimeout = null;
  }
  showTooltip.value = false;
  tooltipData.value = null;
};

const setBoatStatusFromTooltip = (boat: Boat, placement: BoatPlacement, newStatus: 'oplacerad' | 'placerad' | 'reserverad') => {
  // Update placement status
  const placementIndex = placements.value.findIndex(p => p.id === placement.id);
  if (placementIndex !== -1) {
    placements.value[placementIndex].status = newStatus;

    // Handle "only one unplaced boat per storage" rule
    if (newStatus === 'oplacerad') {
      setAllOtherBoatsAsPlaced(placement.storage_unit_id, placement.id);
    }
  }

  // Update boat status
  const boatIndex = boats.value.findIndex(b => b.id === boat.id);
  if (boatIndex !== -1) {
    boats.value[boatIndex].current_status = newStatus;
  }

  // Update tooltip data to reflect changes
  if (tooltipData.value) {
    tooltipData.value.placement.status = newStatus;
    tooltipData.value.boat.current_status = newStatus;
  }

  // Redraw canvas
  drawStorage();

  console.log(`${boat.name} status ändrad till: ${newStatus}`);
};

const removeBoatFromStorage = (boat: Boat, placement: BoatPlacement) => {
  // Remove placement
  const placementIndex = placements.value.findIndex(p => p.id === placement.id);
  if (placementIndex !== -1) {
    placements.value.splice(placementIndex, 1);
  }

  // Update boat status back to unplaced
  const boatIndex = boats.value.findIndex(b => b.id === boat.id);
  if (boatIndex !== -1) {
    boats.value[boatIndex].current_status = 'oplacerad';
  }

  // Hide tooltip
  showTooltip.value = false;
  tooltipData.value = null;

  // Redraw canvas
  drawStorage();

  console.log(`${boat.name} borttagen från lagret`);
};

// Collision detection function - NU MED ROTATION SUPPORT!
const checkBoatCollisions = (currentBoat: Boat, currentPlacement: BoatPlacement): string | null => {
  if (!selectedStorage.value) return null;

  const pixelsPerDecimeter = 1;
  const startX = 50;
  const startY = 50;

  // Calculate current boat position
  const currentX = startX + currentPlacement.position.x * pixelsPerDecimeter;
  const currentY = startY + currentPlacement.position.y * pixelsPerDecimeter;
  const currentRotation = (currentPlacement.position.rotation || 0) * Math.PI / 180; // Convert to radians

  const hullWidth = currentBoat.length * SVG_CONSTANTS.PX_PER_M;
  const hullHeight = currentBoat.width * SVG_CONSTANTS.PX_PER_M;
  const marginSize = currentBoat.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Create rotated rectangles for current boat
  const currentHullRect = createRotatedRectangle(currentX, currentY, hullWidth, hullHeight, currentRotation);
  const currentMarginRect = createRotatedRectangle(currentX, currentY, hullWidth + marginSize, hullHeight + marginSize, currentRotation);

  // Check storage boundaries collision (använd margin för boundary check)
  const storageWidth = selectedStorage.value.Height * 10;
  const storageHeight = selectedStorage.value.width * 10;
  
  if (isRectangleOutsideStorage(currentMarginRect, startX, startY, storageWidth, storageHeight)) {
    console.log(`🔴 Storage boundary collision: ${currentBoat.name} (${currentRotation * 180 / Math.PI}°) utanför lager`);
    return 'margin_collision';
  }

  // Check collisions with other boats
  const otherPlacements = placements.value.filter(p =>
    p.boat_id !== currentBoat.id &&
    p.storage_unit_id === currentPlacement.storage_unit_id
  );

  for (const otherPlacement of otherPlacements) {
    const otherBoat = boats.value.find(b => b.id === otherPlacement.boat_id);
    if (!otherBoat) continue;

    // Calculate other boat position and rotation
    const otherX = startX + otherPlacement.position.x * pixelsPerDecimeter;
    const otherY = startY + otherPlacement.position.y * pixelsPerDecimeter;
    const otherRotation = (otherPlacement.position.rotation || 0) * Math.PI / 180;

    const otherHullWidth = otherBoat.length * SVG_CONSTANTS.PX_PER_M;
    const otherHullHeight = otherBoat.width * SVG_CONSTANTS.PX_PER_M;
    const otherMarginSize = otherBoat.safety_margin * SVG_CONSTANTS.PX_PER_M;

    // Create rotated rectangles for other boat
    const otherHullRect = createRotatedRectangle(otherX, otherY, otherHullWidth, otherHullHeight, otherRotation);
    const otherMarginRect = createRotatedRectangle(otherX, otherY, otherHullWidth + otherMarginSize, otherHullHeight + otherMarginSize, otherRotation);

    // Check hull collision first (most critical) - rotated rectangles!
    if (rotatedRectanglesOverlap(currentHullRect, otherHullRect)) {
      console.log(`🔴 Hull collision: ${currentBoat.name} (${currentRotation * 180 / Math.PI}°) ↔ ${otherBoat.name} (${otherRotation * 180 / Math.PI}°)`);
      return 'hull_collision';
    }

    // Check margin collision (safety zone) - rotated rectangles!
    if (rotatedRectanglesOverlap(currentMarginRect, otherMarginRect)) {
      console.log(`🟡 Margin collision: ${currentBoat.name} (${currentRotation * 180 / Math.PI}°) ↔ ${otherBoat.name} (${otherRotation * 180 / Math.PI}°)`);
      return 'margin_collision';
    }
  }

  return null; // No collision
};

// Helper function for rectangle overlap detection (legacy - för icke-roterade)
const rectanglesOverlap = (rect1: any, rect2: any): boolean => {
  return !(rect1.x2 < rect2.x1 ||
           rect2.x2 < rect1.x1 ||
           rect1.y2 < rect2.y1 ||
           rect2.y2 < rect1.y1);
};

// ROTATED COLLISION DETECTION FUNCTIONS
interface Point {
  x: number;
  y: number;
}

interface RotatedRectangle {
  corners: Point[];
  center: Point;
  width: number;
  height: number;
  rotation: number;
}

// Skapa en roterad rektangel från center, dimensioner och rotation
const createRotatedRectangle = (centerX: number, centerY: number, width: number, height: number, rotation: number): RotatedRectangle => {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  
  // Beräkna de fyra hörnen relativt center, sedan rotera dem
  const corners: Point[] = [
    // Top-left
    {
      x: centerX + (-halfWidth * cos - (-halfHeight) * sin),
      y: centerY + (-halfWidth * sin + (-halfHeight) * cos)
    },
    // Top-right
    {
      x: centerX + (halfWidth * cos - (-halfHeight) * sin),
      y: centerY + (halfWidth * sin + (-halfHeight) * cos)
    },
    // Bottom-right
    {
      x: centerX + (halfWidth * cos - halfHeight * sin),
      y: centerY + (halfWidth * sin + halfHeight * cos)
    },
    // Bottom-left
    {
      x: centerX + (-halfWidth * cos - halfHeight * sin),
      y: centerY + (-halfWidth * sin + halfHeight * cos)
    }
  ];
  
  return {
    corners,
    center: { x: centerX, y: centerY },
    width,
    height,
    rotation
  };
};

// Kolla om två roterade rektanglar överlappar (Separating Axis Theorem)
const rotatedRectanglesOverlap = (rect1: RotatedRectangle, rect2: RotatedRectangle): boolean => {
  // Få axlarna från båda rektanglarna (edge normals)
  const axes: Point[] = [];
  
  // Axlar från rect1
  for (let i = 0; i < 4; i++) {
    const p1 = rect1.corners[i];
    const p2 = rect1.corners[(i + 1) % 4];
    if (p1 && p2) {
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const normal = { x: -edge.y, y: edge.x }; // Perpendicular
      axes.push(normal);
    }
  }
  
  // Axlar från rect2
  for (let i = 0; i < 4; i++) {
    const p1 = rect2.corners[i];
    const p2 = rect2.corners[(i + 1) % 4];
    if (p1 && p2) {
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const normal = { x: -edge.y, y: edge.x }; // Perpendicular
      axes.push(normal);
    }
  }
  
  // Testa varje axel för separation
  for (const axis of axes) {
    // Normalisera axeln
    const length = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
    if (length === 0) continue;
    const normalizedAxis = { x: axis.x / length, y: axis.y / length };
    
    // Projekta båda rektanglarna på denna axel
    const projection1 = projectRectangleOnAxis(rect1, normalizedAxis);
    const projection2 = projectRectangleOnAxis(rect2, normalizedAxis);
    
    // Kolla om projectionerna överlappar
    if (projection1.max < projection2.min || projection2.max < projection1.min) {
      return false; // Separation found - inga kollisioner
    }
  }
  
  return true; // Ingen separation hittad - kollision!
};

// Projekta en roterad rektangel på en axel
const projectRectangleOnAxis = (rect: RotatedRectangle, axis: Point): { min: number; max: number } => {
  let min = Infinity;
  let max = -Infinity;
  
  for (const corner of rect.corners) {
    // Dot product för att projekta punkt på axel
    const projection = corner.x * axis.x + corner.y * axis.y;
    min = Math.min(min, projection);
    max = Math.max(max, projection);
  }
  
  return { min, max };
};

// Kolla om en roterad rektangel är utanför storage boundaries
const isRectangleOutsideStorage = (rect: RotatedRectangle, storageX: number, storageY: number, storageWidth: number, storageHeight: number): boolean => {
  // Kolla om någon corner är utanför storage
  for (const corner of rect.corners) {
    if (corner.x < storageX || 
        corner.x > storageX + storageWidth ||
        corner.y < storageY ||
        corner.y > storageY + storageHeight) {
      return true;
    }
  }
  return false;
};

// Simple rotation functions
const rotateBoatLeft = () => {
  rotateBoat(-22.5);
};

const rotateBoatRight = () => {
  rotateBoat(22.5);
};

const rotateBoat = (angleDelta: number) => {
    console.log('Rotation attempt - selectedPlacedBoat:', selectedPlacedBoat.value?.name);

  if (!selectedPlacedBoat.value) {
    console.warn('Ingen båt vald för rotation - klicka på en båt först!');
    return;
  }

  // Find the placement for the selected boat
  const placement = placements.value.find(p => p.boat_id === selectedPlacedBoat.value!.id);
  if (!placement) {
    console.warn('Hittade ingen placement för vald båt:', selectedPlacedBoat.value.name);
    return;
  }

    console.log('Nuvarande rotation:', placement.position.rotation);

  // Calculate new rotation
  let newRotation = placement.position.rotation + angleDelta;

  // Keep rotation within 0-360 degrees
  while (newRotation < 0) newRotation += 360;
  while (newRotation >= 360) newRotation -= 360;

  console.log('Ny rotation kommer att vara:', newRotation);

  // Update placement data
  placement.position.rotation = newRotation;

  // Also update selectedPlacement if it matches
  if (selectedPlacement.value && selectedPlacement.value.id === placement.id) {
    selectedPlacement.value.position.rotation = newRotation;
  }

  // Redraw the storage to show the updated rotation
  drawStorage();

  console.log(`${selectedPlacedBoat.value.name} roterad från ${(placement.position.rotation - angleDelta).toFixed(1)}° till ${newRotation.toFixed(1)}° (behåller ursprungsstatus: ${placement.status})`);
};

// Canvas functions
const initCanvas = () => {
  if (!canvasContainer.value) return;

  // Create Konva stage
  stage.value = new Konva.Stage({
    container: canvasContainer.value,
    width: canvasContainer.value.clientWidth,
    height: canvasContainer.value.clientHeight,
  });

  // Create layer
  layer.value = new Konva.Layer();
  stage.value.add(layer.value);

  // Setup event handlers
  setupEventHandlers();

  console.log('Canvas initialized');
};

const setupEventHandlers = () => {
  if (!stage.value) return;

  // Pan handling med mouse drag (liknande AdvancedKonvaCanvas)
  let isPanning = false;
  let lastPointerPosition = { x: 0, y: 0 };

  stage.value.on('mousedown', (e) => {
    // Pan om vi är i pan-mode och INTE drar en båt
    if (isPanMode.value) {
      // Kolla om vi klickar på en draggable båt-group
      const isDraggableBoat = e.target &&
        e.target.parent &&
        e.target.parent.getType() === 'Group' &&
        e.target.parent.draggable();

      if (!isDraggableBoat) {
        isPanning = true;
        lastPointerPosition = stage.value!.getPointerPosition() || { x: 0, y: 0 };
        stage.value!.container().style.cursor = 'grabbing';
        console.log('🖱️ Pan started');
      }
    }
  });

  stage.value.on('mousemove', (e) => {
    if (!isPanning) return;

    const pointer = stage.value!.getPointerPosition();
    if (!pointer) return;

    const dx = pointer.x - lastPointerPosition.x;
    const dy = pointer.y - lastPointerPosition.y;

    const newPos = {
      x: stage.value!.x() + dx,
      y: stage.value!.y() + dy
    };

    stage.value!.position(newPos);
    stage.value!.batchDraw();

    lastPointerPosition = pointer;
  });

  stage.value.on('mouseup mouseleave', () => {
    if (isPanning) {
      isPanning = false;
      if (stage.value) {
        stage.value.container().style.cursor = isPanMode.value ? 'grab' : 'default';
      }
      console.log('🖱️ Pan stopped');
    }
  });

  // Zoom with wheel från center av canvas
  stage.value.on('wheel', (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const oldScale = stage.value!.scaleX();
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.25, Math.min(3, newScale));

    if (clampedScale !== oldScale) {
      applyZoom(clampedScale);
    }
  });
};

const drawStorage = () => {
  if (!selectedStorage.value || !layer.value) return;

  layer.value.destroyChildren();

  const storage = selectedStorage.value;
  const pixelsPerMeter = 10;

  // Draw storage background
  const background = new Konva.Rect({
    x: 50,
    y: 50,
    width: storage.Height * pixelsPerMeter,
    height: storage.width * pixelsPerMeter,
    fill: '#f8fafc',
    stroke: '#cbd5e1',
    strokeWidth: 2,
  });

  layer.value.add(background);

  // Draw grid
  drawGrid(storage, pixelsPerMeter);

  // Draw placed boats
  drawPlacedBoats();

  layer.value.batchDraw();
};

const drawGrid = (storage: Storage, pixelsPerMeter: number) => {
  if (!layer.value) return;

  const startX = 50;
  const startY = 50;
  const storageWidth = storage.Height * pixelsPerMeter;
  const storageHeight = storage.width * pixelsPerMeter;

  // Vertical lines
  for (let x = 0; x <= storage.Height; x += 5) {
    const line = new Konva.Line({
      points: [
        startX + x * pixelsPerMeter,
        startY,
        startX + x * pixelsPerMeter,
        startY + storageHeight,
      ],
      stroke: '#e2e8f0',
      strokeWidth: 0.5,
    });
    layer.value.add(line);
  }

  // Horizontal lines
  for (let y = 0; y <= storage.width; y += 5) {
    const line = new Konva.Line({
      points: [
        startX,
        startY + y * pixelsPerMeter,
        startX + storageWidth,
        startY + y * pixelsPerMeter,
      ],
      stroke: '#e2e8f0',
      strokeWidth: 0.5,
    });
    layer.value.add(line);
  }
};

const drawPlacedBoats = () => {
  if (!layer.value) return;

  const placementsInStorage = currentStoragePlacements.value;
  console.log(`Ritar ${placementsInStorage.length} båtar i ${selectedStorage.value?.name}`);

  if (placementsInStorage.length === 0) {
    console.log('Inga båtar att rita i detta lager');
    return;
  }

  placementsInStorage.forEach(placement => {
    const boat = boats.value.find(b => b.id === placement.boat_id);
    if (boat) {
      console.log(`🎨 Ritar båt: ${boat.name} (status: ${placement.status}) på position ${placement.position.x}, ${placement.position.y}`);
      drawBoat(boat, placement);
    } else {
      console.warn(`⚠️ Hittade inte båt med ID ${placement.boat_id}`);
    }
  });
};

const drawBoat = (boat: Boat, placement: BoatPlacement) => {
  if (!layer.value) return;

  // Position är nu i DECIMETER (inte meter)
  const pixelsPerDecimeter = 1; // 1 decimeter = 1 pixel
  const startX = 50;
  const startY = 50;

      // Check for collisions only if boat is oplacerad (flyttbar)
  const collisionState = placement.status === 'oplacerad' ? checkBoatCollisions(boat, placement) : null;

  // VIKTIGT: Alla båtar behåller sina ursprungliga stateStyles UTAN modifikationer
  // Inga extra tjocka linjer eller andra visuella ändringar när valda
  let displayStatus: string;
  if (placement.status === 'oplacerad' && collisionState) {
    // Visa kollision för oplacerade båtar under drag
    displayStatus = collisionState;
  } else {
    // Alla båtar: använd BARA ursprunglig status (oplacerad, placerad, reserverad)
    displayStatus = placement.status;
  }

  // Create boat group - draggable endast om oplacerad
  const isDraggable = placement.status === 'oplacerad';

  const boatGroup = new Konva.Group({
    x: startX + placement.position.x * pixelsPerDecimeter,
    y: startY + placement.position.y * pixelsPerDecimeter,
    rotation: placement.position.rotation,
    draggable: isDraggable,
    id: `placed-boat-${boat.id}`,
  });

  // Create margin path - med fallback till oplacerad om status saknas
  const marginPath = new Konva.Path({
    data: SVG_CONSTANTS.MARGIN_PATH,
    strokeScaleEnabled: false,
    name: 'margin-path',
    ...(stateStyles[displayStatus] || stateStyles['oplacerad']).margin
  });

  // Create hull path - med fallback till oplacerad om status saknas
  const hullPath = new Konva.Path({
    data: SVG_CONSTANTS.HULL_PATH,
    strokeScaleEnabled: false,
    name: 'hull-path',
    ...(stateStyles[displayStatus] || stateStyles['oplacerad']).hull
  });

  // Calculate scaling
  const baseLength = boat.length * SVG_CONSTANTS.PX_PER_M;
  const baseWidth = boat.width * SVG_CONSTANTS.PX_PER_M;
  const baseMargin = boat.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Scale hull
  const hullScaleX = baseLength / SVG_CONSTANTS.HULL_VB.w;
  const hullScaleY = baseWidth / SVG_CONSTANTS.HULL_VB.h;

  hullPath.scale({ x: hullScaleX, y: hullScaleY });
  hullPath.offset({
    x: SVG_CONSTANTS.HULL_VB.w / 2,
    y: SVG_CONSTANTS.HULL_VB.h / 2
  });

  // Scale margin
  const marginScaleX = (baseLength + 2 * baseMargin) / SVG_CONSTANTS.MARGIN_VB.w;
  const marginScaleY = (baseWidth + 2 * baseMargin) / SVG_CONSTANTS.MARGIN_VB.h;

  marginPath.scale({ x: marginScaleX, y: marginScaleY });
  marginPath.offset({
    x: SVG_CONSTANTS.MARGIN_VB.w / 2,
    y: SVG_CONSTANTS.MARGIN_VB.h / 2
  });

  // Add boat name
  const nameText = new Konva.Text({
    x: 0,
    y: 0,
    text: boat.name,
    fontSize: 10,
    fill: '#374151', // Tailwind gray-700
    align: 'center',
    verticalAlign: 'middle'
  });

  nameText.offset({
    x: nameText.width() / 2,
    y: nameText.height() / 2
  });

  // Add to group
  boatGroup.add(marginPath);
  boatGroup.add(hullPath);
  boatGroup.add(nameText);

  // Add event handlers - olika beteende beroende på status
  boatGroup.on('click', () => {
    const boatFromPlacement = boats.value.find(b => b.id === placement.boat_id);
    if (boatFromPlacement) {
      // Update selected boat and placement for rotation (BARA för funktionalitet, INGEN visuell ändring)
      selectedPlacedBoat.value = boatFromPlacement;
      selectedPlacement.value = placement;

      // OLIKA BETEENDE PER STATUS:
      if (placement.status === 'oplacerad') {
        // Oplacerade båtar: bara selection för rotation, ingen automatisk statusändring
        // Status ändras ENDAST via toolbar-knappar
        drawStorage();
        console.log(`Vald oplacerad båt för rotation: ${boatFromPlacement.name} (status ändras bara via knappar)`);
      } else if (placement.status === 'placerad') {
        // Placerade båtar: toggle status som tidigare
        toggleBoatStatus(boatFromPlacement, placement);
      } else if (placement.status === 'reserverad') {
        // Reserverade båtar: bara selection för rotation, behåll grå stil
        // Status ändras ENDAST via toolbar-knappar
        drawStorage();
        console.log(`Vald reserverad båt för rotation: ${boatFromPlacement.name} (behåller grå stil, status ändras bara via knappar)`);
      }
    }
  });

  boatGroup.on('dragstart', () => {
    // Hide tooltip when dragging starts
    showTooltip.value = false;
    tooltipData.value = null;
  });

    boatGroup.on('dragmove', () => {
    // Update collision detection during drag for real-time feedback (only for oplacerad boats)
    if (placement.status === 'oplacerad') {
      const pos = boatGroup.position();
      const tempPlacement = {
        ...placement,
        position: {
          ...placement.position,
          x: (pos.x - 50),
          y: (pos.y - 50)
        }
      };

      // Check collisions at current drag position
      const collisionState = checkBoatCollisions(boat, tempPlacement);
      const dragDisplayStatus = collisionState || placement.status;

      // Update visual feedback during drag
      const marginPath = boatGroup.findOne('.margin-path') as Konva.Path;
      const hullPath = boatGroup.findOne('.hull-path') as Konva.Path;

      if (marginPath && hullPath) {
        // Apply collision state styles - med fallback till oplacerad om status saknas
        const style = stateStyles[dragDisplayStatus] || stateStyles['oplacerad'];
        marginPath.setAttrs(style.margin);
        hullPath.setAttrs(style.hull);
        layer.value?.batchDraw();
      }
    }
  });

  boatGroup.on('dragend', () => {
    const pos = boatGroup.position();
    const newX = (pos.x - 50); // Position i decimeter
    const newY = (pos.y - 50); // Position i decimeter

    console.log(`Boat moved to: ${newX.toFixed(1)}, ${newY.toFixed(1)} decimeter`);

    // Update placement data
    const placementIndex = placements.value.findIndex(p => p.id === placement.id);
    if (placementIndex !== -1) {
      placements.value[placementIndex].position.x = newX;
      placements.value[placementIndex].position.y = newY;
    }

    // Redraw all boats to update collision states
    drawStorage();
  });

            // Tooltip hover events
  boatGroup.on('mouseenter', () => {
    if (!stage.value || !canvasContainer.value) return;

    // Clear any pending hide timeout
    keepTooltipOpen();

    const canvasRect = canvasContainer.value.getBoundingClientRect();
    const boatPosition = boatGroup.position();

    // Konvertera canvas-koordinater till viewport-koordinater med zoom/pan
    const transform = stage.value.getAbsoluteTransform();
    const worldPos = transform.point({ x: boatPosition.x, y: boatPosition.y });

    // Position tooltip från båtens hörn och nedåt
    const boatWidth = boat.width * pixelsPerDecimeter;
    const boatHeight = boat.length * pixelsPerDecimeter;

    const tooltipX = canvasRect.left + worldPos.x + boatWidth + 5; // Från höger hörn
    const tooltipY = canvasRect.top + worldPos.y + boatHeight + 5; // Nedåt från båten

    tooltipData.value = { boat, placement };
    tooltipPosition.value = { x: tooltipX, y: tooltipY };
    showTooltip.value = true;

    // Change cursor
    stage.value.container().style.cursor = 'pointer';
  });

  boatGroup.on('mouseleave', () => {
    hideTooltipDelayed();

    // Reset cursor
    if (stage.value) {
      stage.value.container().style.cursor = 'default';
    }
  });

    // Tooltip förblir på båtens position - ingen mousemove tracking

  layer.value.add(boatGroup);
};

// UI event handlers
const selectStorage = (storage: Storage) => {
  selectedStorage.value = storage;
  console.log(`🏢 Väljer lager: ${storage.name} (ID: ${storage.id})`);

  // Debug: Visa alla placements för detta lager
  const placementsForStorage = placements.value.filter(p => p.storage_unit_id === storage.id);
  console.log(`📦 Hittade ${placementsForStorage.length} placements för detta lager:`, placementsForStorage);

  drawStorage();

  // Auto-centrera lagret när det väljs (vänta tills rendering är klar)
  nextTick(() => {
    setTimeout(() => {
      centerStorage();
      console.log('📍 Lager auto-centrerat');
    }, 50);
  });
};

const selectBoat = (boat: Boat) => {
  selectedBoat.value = boat;
  console.log('Selected boat:', boat.name);
};

// Boat selection is now handled directly in the click event

const toggleBoatStatus = (boat: Boat, placement: BoatPlacement) => {
  // Kom ihåg gamla statusen för logging
  const oldStatus = placement.status;

  // SMART TOGGLE-LOGIK för alla status:
  let newStatus: 'oplacerad' | 'placerad' | 'reserverad';

  switch (oldStatus) {
    case 'placerad':    // Blå → Grön (kan flyttas)
      newStatus = 'oplacerad';
      break;
    case 'reserverad':  // Grå → Grön (kan flyttas)
      newStatus = 'oplacerad';
      break;
    case 'oplacerad':   // Grön → Blå (låst)
    default:
      newStatus = 'placerad';
      break;
  }

  // SMART LOGIK: Om båt ska bli oplacerad, sätt ENDAST andra oplacerade båtar som placerade
  // (Reserverade båtar behåller sin status!)
  if (newStatus === 'oplacerad') {
    setAllOtherBoatsAsPlaced(placement.storage_unit_id, placement.id);
  }

  // Update placement status
  const placementIndex = placements.value.findIndex(p => p.id === placement.id);
  if (placementIndex !== -1) {
    placements.value[placementIndex].status = newStatus;
    // Update selectedPlacement with the new status
    if (selectedPlacement.value && selectedPlacement.value.id === placement.id) {
      selectedPlacement.value.status = newStatus;
    }
  }

  // Update boat status
  const boatIndex = boats.value.findIndex(b => b.id === boat.id);
  if (boatIndex !== -1) {
    boats.value[boatIndex].current_status = newStatus;
  }

  // Keep the boat selected for rotation after status change
  // selectedPlacedBoat.value = boat;
  // selectedPlacement.value remains as is with updated status

  // Redraw med ny status och draggability
  drawStorage();

    const statusTextMap = {
    'placerad': 'placerad (blå, låst)',
    'reserverad': 'reserverad (grå)',
    'oplacerad': 'oplacerad (grön, kan flyttas)'
  };

  const oldStatusText = statusTextMap[oldStatus] || oldStatus;
  const newStatusText = statusTextMap[newStatus];

  console.log(`${boat.name}: ${oldStatusText} → ${newStatusText}`);

  if (newStatus === 'oplacerad') {
    console.log(`${boat.name} kan nu flyttas (bara en oplacerad per lager)`);
  }
};

const togglePanMode = () => {
  isPanMode.value = !isPanMode.value;

  // Uppdatera cursor style
  if (stage.value) {
    stage.value.container().style.cursor = isPanMode.value ? 'grab' : 'default';
  }

  console.log(`🖱️ Pan mode ${isPanMode.value ? 'aktiverat' : 'inaktiverat'}`);
};

const zoomIn = () => {
  const newZoom = Math.min(3, zoomLevel.value * 1.2);
  applyZoom(newZoom);
};

const zoomOut = () => {
  const newZoom = Math.max(0.25, zoomLevel.value / 1.2);
  applyZoom(newZoom);
};

const applyZoom = (newScale: number) => {
  if (!stage.value) return;

  const oldScale = zoomLevel.value;

  // Beräkna canvas center
  const canvasCenter = {
    x: stage.value.width() / 2,
    y: stage.value.height() / 2
  };

  // Beräkna nuvarande stage position
  const currentPos = stage.value.position();

  // Beräkna punkten vi vill zooma runt (canvas center i stage-koordinater)
  const zoomPoint = {
    x: (canvasCenter.x - currentPos.x) / oldScale,
    y: (canvasCenter.y - currentPos.y) / oldScale
  };

  // Sätt ny scale
  zoomLevel.value = newScale;
  zoomPercentage.value = Math.round(newScale * 100);
  stage.value.scale({ x: newScale, y: newScale });

  // Beräkna ny position för att behålla center
  const newPos = {
    x: canvasCenter.x - zoomPoint.x * newScale,
    y: canvasCenter.y - zoomPoint.y * newScale
  };

  stage.value.position(newPos);
  stage.value.batchDraw();
};



const setZoomFromPercentage = () => {
  const zoom = zoomPercentage.value / 100;
  applyZoom(zoom);
};

const centerStorage = () => {
  if (!stage.value || !selectedStorage.value) return;

  // Beräkna lager center i dess lokala koordinater (offset + storlek/2)
  const pixelsPerMeter = 10;
  const storageCenter = {
    x: 50 + (selectedStorage.value.Height * pixelsPerMeter) / 2,
    y: 50 + (selectedStorage.value.width * pixelsPerMeter) / 2
  };

  // Beräkna canvas center
  const canvasCenter = {
    x: stage.value.width() / 2,
    y: stage.value.height() / 2
  };

  // Beräkna position för att centrera lagret
  const currentScale = zoomLevel.value;
  const newPos = {
    x: canvasCenter.x - storageCenter.x * currentScale,
    y: canvasCenter.y - storageCenter.y * currentScale
  };

  stage.value.position(newPos);
  stage.value.batchDraw();

  console.log('🎯 Lager centrerat');
};

const resetCanvas = () => {
  if (!stage.value) return;

  stage.value.position({ x: 0, y: 0 });
  zoomLevel.value = 1;
  zoomPercentage.value = 100;

  applyZoom(1); // Använd applyZoom för konsistent zoom-hantering

  console.log('🔄 Canvas återställt');
};

// Drag & Drop handlers
const handleBoatDragStart = (boat: Boat, event: DragEvent) => {
  if (!event.dataTransfer) return;

  event.dataTransfer.setData('application/json', JSON.stringify(boat));
  isDragging.value = true;
  console.log('Drag started:', boat.name);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  // Only set to false if we're actually leaving the drop zone
  if (!event.relatedTarget || !canvasContainer.value?.contains(event.relatedTarget as Node)) {
    isDragging.value = false;
  }
};

// SMART LOGIK: Hjälpfunktioner för lager-hantering
const setAllOtherBoatsAsPlaced = (storageUnitId: number, excludePlacementId: number) => {
  // Hitta endast ANDRA OPLACERADE båtar i samma lager (inte reserverade!)
  const otherUnplacedBoats = placements.value.filter(
    p => p.storage_unit_id === storageUnitId &&
         p.id !== excludePlacementId &&
         p.status === 'oplacerad'
  );

  if (otherUnplacedBoats.length === 0) {
    console.log('Inga andra oplacerade båtar att påverka');
    return;
  }

  // Sätt endast andra oplacerade båtar som placerade (behåll reserverade intakta)
  otherUnplacedBoats.forEach(placement => {
    const placementIndex = placements.value.findIndex(p => p.id === placement.id);
    if (placementIndex !== -1) {
      placements.value[placementIndex].status = 'placerad';
    }

    // Uppdatera även båt-data
    const boatIndex = boats.value.findIndex(b => b.id === placement.boat_id);
    if (boatIndex !== -1) {
      boats.value[boatIndex].current_status = 'placerad';
    }
  });

  console.log(`Satte ${otherUnplacedBoats.length} andra OPLACERADE båtar som placerade`);
  console.log('Reserverade båtar behöll sin grå status');
};

const getUnplacedBoatInStorage = (storageUnitId: number) => {
  return placements.value.find(
    p => p.storage_unit_id === storageUnitId && p.status === 'oplacerad'
  );
};

const setAllBoatsAsPlaced = () => {
  if (!selectedStorage.value) {
    console.warn('Inget lager valt');
    return;
  }

  // Hitta endast oplacerade båtar i detta lager
  const unplacedBoats = placements.value.filter(
    p => p.storage_unit_id === selectedStorage.value!.id && p.status === 'oplacerad'
  );

  if (unplacedBoats.length === 0) {
    console.log('Inga oplacerade båtar att placera i detta lager');
    return;
  }

  unplacedBoats.forEach(placement => {
    const placementIndex = placements.value.findIndex(p => p.id === placement.id);
    if (placementIndex !== -1) {
      placements.value[placementIndex].status = 'placerad';
    }

    const boatIndex = boats.value.findIndex(b => b.id === placement.boat_id);
    if (boatIndex !== -1) {
      boats.value[boatIndex].current_status = 'placerad';
    }
  });

  // Clear selection
  selectedPlacedBoat.value = null;
  selectedPlacement.value = null;

  drawStorage();
  console.log(`${unplacedBoats.length} oplacerade båtar i ${selectedStorage.value.name} är nu placerade (blå, låsta)`);
  console.log('Andra båtar behöll sin status');
};

const setAllBoatsAsReserved = () => {
  if (!selectedStorage.value) {
    console.warn('Inget lager valt');
    return;
  }

  // Hitta endast oplacerade båtar i detta lager
  const unplacedBoats = placements.value.filter(
    p => p.storage_unit_id === selectedStorage.value!.id && p.status === 'oplacerad'
  );

  if (unplacedBoats.length === 0) {
    console.log('Inga oplacerade båtar att reservera i detta lager');
    return;
  }

  unplacedBoats.forEach(placement => {
    const placementIndex = placements.value.findIndex(p => p.id === placement.id);
    if (placementIndex !== -1) {
      placements.value[placementIndex].status = 'reserverad';
    }

    const boatIndex = boats.value.findIndex(b => b.id === placement.boat_id);
    if (boatIndex !== -1) {
      boats.value[boatIndex].current_status = 'reserverad';
    }
  });

  // Clear selection
  selectedPlacedBoat.value = null;
  selectedPlacement.value = null;

  drawStorage();
  console.log(`${unplacedBoats.length} oplacerade båtar i ${selectedStorage.value.name} är nu reserverade (grå)`);
  console.log('Andra båtar behöll sin status');
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragging.value = false;

  if (!event.dataTransfer || !selectedStorage.value) return;

  try {
    const boat = JSON.parse(event.dataTransfer.getData('application/json'));

    // Check if boat is already placed in this storage
    const existingPlacement = placements.value.find(
      p => p.boat_id === boat.id && p.storage_unit_id === selectedStorage.value!.id
    );

    if (existingPlacement) {
      console.warn('Boat is already placed in this storage');
      return;
    }

    // SMART KONFLIKT-HANTERING: Bara för oplacerade båtar (en oplacerad per lager)
    const unplacedBoat = getUnplacedBoatInStorage(selectedStorage.value.id);
    if (unplacedBoat && defaultPlacementStatus.value === 'oplacerad') {
      const conflictBoat = boats.value.find(b => b.id === unplacedBoat.boat_id);
      console.warn(`KONFLIKT: ${conflictBoat?.name} är redan oplacerad i detta lager!`);
      console.log(`Tar bort ${conflictBoat?.name} och placerar ${boat.name} som oplacerad istället`);

      // Ta bort den oplacerade båten
      const removeIndex = placements.value.findIndex(p => p.id === unplacedBoat.id);
      if (removeIndex !== -1) {
        placements.value.splice(removeIndex, 1);
      }

      // Uppdatera båt-status för den borttagna båten
      const oldBoatIndex = boats.value.findIndex(b => b.id === unplacedBoat.boat_id);
      if (oldBoatIndex !== -1) {
        boats.value[oldBoatIndex].current_status = 'oplacerad'; // Tillbaka till pool
      }
    }

    // Calculate drop position
    const rect = canvasContainer.value!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert to storage coordinates (nu i DECIMETER)
    const storageX = (x - 50); // x - offset = decimeter position
    const storageY = (y - 50); // y - offset = decimeter position

    // Create new placement med vald status
    const newPlacement: BoatPlacement = {
      id: Date.now(), // Temporary ID
      boat_id: boat.id,
      storage_unit_id: selectedStorage.value.id,
      storage_unit_name: selectedStorage.value.name,
      floor_number: 1,
      status: defaultPlacementStatus.value, // Använd vald status från dropdown
      position: {
        x: storageX,
        y: storageY,
        rotation: 0
      },
      placed_by_user_id: 1,
      placed_date: new Date().toISOString(),
      reservation_date: new Date().toISOString(),
      physical_placement_date: null, // Inte fysiskt placerad än
      notes: 'Ny båt - redo för positionering',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    placements.value.push(newPlacement);

        // Update boat status till vald status
    const boatIndex = boats.value.findIndex(b => b.id === boat.id);
    if (boatIndex !== -1) {
      boats.value[boatIndex].current_status = defaultPlacementStatus.value;
    }

        drawStorage();

        // Check for collisions after placement (only if placed as oplacerad)
    const finalCollisionState = defaultPlacementStatus.value === 'oplacerad' ? checkBoatCollisions(boat, newPlacement) : null;
    if (finalCollisionState) {
      console.warn(`KOLLISION: ${boat.name} har ${finalCollisionState} efter placering (men får ändå vald status)`);
    }

    const conflictMessage = unplacedBoat && defaultPlacementStatus.value === 'oplacerad' ? ' (ersatte oplacerad båt)' : '';
    const statusText = defaultPlacementStatus.value === 'oplacerad' ? 'oplacerad' :
                      defaultPlacementStatus.value === 'placerad' ? 'placerad' : 'reserverad';
    const collisionMessage = finalCollisionState ? ` - ${finalCollisionState} visas` : '';
    console.log(`${boat.name} placerad som ${statusText} på (${storageX.toFixed(1)}, ${storageY.toFixed(1)}) decimeter${conflictMessage}${collisionMessage}`);

  } catch (error) {
    console.error('Error handling drop:', error);
  }
};

// Lifecycle
onMounted(async () => {
  await nextTick();

  // Debug: Visa inläst data
  console.log('DATA DEBUGGING:');
  console.log(`Laddade ${storages.value.length} lager:`, storages.value.map(s => `${s.name} (ID: ${s.id})`));
  console.log(`Laddade ${boats.value.length} båtar:`, boats.value.map(b => `${b.name} (ID: ${b.id})`));
  console.log(`Laddade ${placements.value.length} placements:`, placements.value.map(p => `Båt ${p.boat_id} i lager ${p.storage_unit_id}`));
  console.log(`Laddade ${customers.value.length} kunder:`, customers.value.map(c => `${c.display_name} (ID: ${c.id})`));

  initCanvas();

  // Auto-select first storage for demo
  if (storages.value.length > 0) {
    selectStorage(storages.value[0]);
  }

  // Close tooltip when clicking outside
  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.boat-tooltip')) {
      hideTooltipImmediately();
    }
  };

  document.addEventListener('click', handleDocumentClick);

  // Handle window resize
  const handleResize = () => {
    if (canvasContainer.value && stage.value) {
      stage.value.size({
        width: canvasContainer.value.clientWidth,
        height: canvasContainer.value.clientHeight,
      });
      stage.value.batchDraw();
    }
  };

  window.addEventListener('resize', handleResize);

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('click', handleDocumentClick);
    if (tooltipHideTimeout) {
      clearTimeout(tooltipHideTimeout);
    }
    if (stage.value) {
      stage.value.destroy();
    }
  });
});
</script>

<style scoped>
.boat-lager2-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  color: #64748b;
  margin: 0;
  font-size: 0.875rem;
}

.status-legend {
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.status-indicator.green { background: #27d07c; }
.status-indicator.blue { background: #1e40af; }
.status-indicator.gray { background: #9ca3af; }

/* Main Layout */
.main-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  gap: 0;
  overflow: hidden;
}

/* Side Panels */
.storage-panel,
.boat-panel {
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.boat-panel {
  border-right: none;
  border-left: 1px solid #e2e8f0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #f1f5f9;
}

.panel-icon {
  width: 1rem;
  height: 1rem;
}

.filter-section {
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.filter-select,
.search-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

/* Storage List */
.storage-list,
.boat-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.storage-item,
.boat-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.storage-item:hover,
.boat-item:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.storage-item.active,
.boat-item.active {
  border-color: #2563eb;
  background: #eff6ff;
}

.boat-item.placed {
  opacity: 0.6;
}

.boat-item.oplacerad {
  border-left: 3px solid #27d07c;
}

.boat-item.placerad {
  border-left: 3px solid #1e40af;
}

.boat-item.reserverad {
  border-left: 3px solid #9ca3af;
}

.storage-info,
.boat-info {
  flex: 1;
}

.storage-name,
.boat-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
}

.storage-type,
.storage-size,
.storage-boats,
.boat-reg,
.boat-dims,
.boat-status {
  font-size: 0.625rem;
  color: #6b7280;
  margin: 0;
}





/* Canvas Area */
.canvas-area {
  display: flex;
  flex-direction: column;
  background: white;
  position: relative;
}

/* Canvas Toolbar (same style as StorageDesigner) */
.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  min-height: 3.5rem;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.toolbar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.toolbar-separator {
  width: 1px;
  height: 1.5rem;
  background: #d1d5db;
  margin: 0 0.25rem;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toolbar-input {
  width: 4rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  text-align: center;
}

.zoom-input {
  width: 3rem;
}

.input-unit {
  font-size: 0.625rem;
  color: #6b7280;
  font-weight: 500;
}

.toolbar-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.toolbar-button.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.button-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.status-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  background: white;
  color: #374151;
  min-width: 140px;
}

.status-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.info-display,
.stats-display {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;
}

.stats-display {
  display: flex;
  gap: 1rem;
}

.info-display {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.status-info {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  border: 1px solid;
}

.status-info.placerad {
  background: #dbeafe;
  color: #1e40af;
  border-color: #1e40af;
}

.status-info.oplacerad {
  background: #dcfce7;
  color: #166534;
  border-color: #27d07c;
}

.status-info.reserverad {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #9ca3af;
}

.status-action {
  background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
  border-color: #9ca3af;
  color: #374151;
  font-size: 0.75rem;
  padding: 0.375rem 0.75rem;
}

.status-action:hover {
  background: linear-gradient(to bottom, #e5e7eb, #d1d5db);
  border-color: #6b7280;
}

.unplaced-count {
  color: #16a34a;
  font-weight: 600;
}

.logic-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.logic-text {
  font-size: 0.6875rem;
  color: #6b7280;
  font-style: italic;
}

/* Rotation Controls */
.rotation-btn {
  font-size: 0.75rem !important;
  padding: 6px 12px !important;
  min-width: auto !important;
  font-weight: 500;
  margin-right: 4px;
}

.rotation-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.selected-boat-info {
  font-size: 0.7rem;
  color: #1e40af;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #bfdbfe;
  margin-top: 4px;
  font-weight: 500;
}

/* Boat Info Tooltip */
.boat-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: auto;
  max-width: 180px;
  min-width: 160px;
  background: rgba(0, 0, 0, 0.92);
  color: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: tooltipIn 0.15s ease-out;
  font-size: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes tooltipIn {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.tooltip-header {
  padding: 8px 10px 6px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-header-main {
  margin-bottom: 3px;
}

.tooltip-boat-name {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0 0 1px 0;
  line-height: 1.1;
  color: white;
}

.tooltip-boat-reg {
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: 400;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: white;
}

.tooltip-owner-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: 3px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tooltip-owner-label {
  font-size: 0.55rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 400;
  color: white;
}

.tooltip-owner-name {
  font-size: 0.7rem;
  font-weight: 500;
  opacity: 0.9;
  color: white;
}

.tooltip-content {
  padding: 6px 10px 8px 10px;
}

/* Båtlista - Originalklasser */
.boat-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
}

.boat-reg,
.boat-dims,
.boat-status,
.boat-storage {
  font-size: 0.625rem;
  color: #6b7280;
  margin: 0;
}

.boat-storage {
  color: #059669;
  font-weight: 500;
}

.boat-count {
  font-weight: 600;
  color: #374151;
}

.status-breakdown {
  font-size: 0.55rem;
  color: #9ca3af;
  font-weight: 400;
  margin-left: 4px;
}

.tooltip-specs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.tooltip-spec-item {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.tooltip-spec-label {
  color: white;
  font-weight: 400;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  opacity: 0.8;
}

.tooltip-spec-value {
  color: white;
  font-weight: 500;
  font-size: 0.65rem;
  line-height: 1.2;
}

.tooltip-status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.tooltip-status-label {
  color: white;
  font-weight: 400;
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  opacity: 0.8;
}

.tooltip-status-badge {
  font-size: 0.6rem;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: white;
}

.tooltip-status-badge.oplacerad {
  background: rgba(39, 208, 124, 0.3);
}

.tooltip-status-badge.placerad {
  background: rgba(30, 64, 175, 0.3);
}

.tooltip-status-badge.reserverad {
  background: rgba(156, 163, 175, 0.3);
}

/* Tooltip Actions */
.tooltip-actions {
  padding: 8px 10px 6px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.tooltip-action-btn {
  padding: 4px 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.6rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  line-height: 1;
}

.tooltip-action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-1px);
}

.tooltip-action-btn.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.6);
  font-weight: 600;
}

.tooltip-action-btn.btn-remove {
  grid-column: 1 / -1;
  background: rgba(220, 38, 38, 0.3);
  border-color: rgba(220, 38, 38, 0.5);
}

.tooltip-action-btn.btn-remove:hover {
  background: rgba(220, 38, 38, 0.5);
  border-color: rgba(220, 38, 38, 0.7);
}

/* Konva Canvas */
.konva-canvas {
  flex: 1;
  background: #f8fafc;
  cursor: crosshair;
}

/* Drop Zone Overlay */
.drop-zone-overlay {
  position: absolute;
  top: 3.5rem; /* Below toolbar */
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

.drop-zone-content {
  text-align: center;
  color: #3b82f6;
}

.drop-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.5rem;
}

.drop-zone-content p {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

/* Scrollbars */
.storage-list::-webkit-scrollbar,
.boat-list::-webkit-scrollbar {
  width: 4px;
}

.storage-list::-webkit-scrollbar-track,
.boat-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.storage-list::-webkit-scrollbar-thumb,
.boat-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}
</style>
