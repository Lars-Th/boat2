<template>
  <div class="boat-lager2-container">
    <!-- Standard Header (shadcn/ui style) -->
    <StandardHeader
      :title="'Båtlager 2.0'"
      :breadcrumbs="headerBreadcrumbs"
      :show-stats="true"
      :stats="headerStats"
    />

    <!-- View Controls (shadcn standard) -->
    <ViewControls
      :search-query="boatSearchQuery"
      search-placeholder="Sök alla båtar i systemet…"
      :show-search="true"
      :show-view-switcher="false"
      @update:searchQuery="val => boatSearchQuery = val"
      @update:search-query="val => boatSearchQuery = val"
    />

    <!-- Status Legend under header -->
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

    <div class="main-layout">
      <!-- Left Panel: Storage Selection -->
      <div class="storage-panel">
        <div class="panel-title sticky-header">
          <Building2 class="panel-icon" />
          Lager & Bryggor
        </div>

        <!-- Storage Filter -->
        <div class="filter-section">
          <div class="toggle-group">
            <button :class="['toggle-btn', { active: storageFilter === 'all' }]" @click="storageFilter = 'all'">Alla</button>
            <button :class="['toggle-btn', { active: storageFilter === 'Lager' }]" @click="storageFilter = 'Lager'">Lager</button>
            <button :class="['toggle-btn', { active: storageFilter === 'Brygga' }]" @click="storageFilter = 'Brygga'">Bryggor</button>
          </div>
        </div>

        <!-- Storage List -->
        <div class="storage-list">
          <div v-if="filteredStorages.length === 0" class="empty-state">
            Inga lager eller bryggor hittades
          </div>
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
              <p v-if="storage.Type === 'Lager' && getStorageFloorCount(storage.id) > 1" class="storage-floors">
                🏢 {{ getStorageFloorCount(storage.id) }} våningar (Lager = V1)
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

          <!-- Floor Selector (only for warehouses with multiple floors) -->
          <div v-if="selectedStorage?.Type === 'Lager' && availableFloors.length > 1" class="toolbar-group">
            <span class="toolbar-label">Våning:</span>
            <div class="floor-tabs">
              <button
                v-for="floor in availableFloors"
                :key="floor.id"
                @click="selectFloor(floor.floor_number)"
                class="floor-tab"
                :class="{ active: selectedFloor === floor.floor_number }"
                :title="`${floor.floor_name} - ${floor.floor_zones.length} zoner`"
              >
                {{ floor.floor_number }}
              </button>
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
            <button @click="resetView" class="toolbar-button" title="Återställ zoom och pan">
              <RotateCcw class="button-icon" />
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
              :disabled="!canRotateSelectedBoat"
              :title="canRotateSelectedBoat ? 'Rotera vänster 22.5°' : 'Välj en oplacerad båt för rotation'"
            >
              <RotateCcw class="w-4 h-4 mr-1" />
              Vänster
            </button>
            <button
              @click="rotateBoatRight"
              class="toolbar-button rotation-btn"
              :disabled="!canRotateSelectedBoat"
              :title="canRotateSelectedBoat ? 'Rotera höger 22.5°' : 'Välj en oplacerad båt för rotation'"
            >
              <RotateCw class="w-4 h-4 mr-1" />
              Höger
            </button>
            <div v-if="selectedPlacedBoat" class="selected-boat-info">
              Vald: {{ selectedPlacedBoat.name }}
              <span v-if="selectedPlacement" class="boat-status-tag" :class="{
                'status-oplacerad': selectedPlacement.status === 'oplacerad',
                'status-placerad': selectedPlacement.status === 'placerad',
                'status-reserverad': selectedPlacement.status === 'reserverad'
              }">
                {{ selectedPlacement.status }}
              </span>
              <span v-if="!canRotateSelectedBoat" class="rotation-hint">
                (endast oplacerade kan roteras)
              </span>
            </div>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Statistics -->
          <!-- Stats flyttade till header (StandardHeader stats) -->

          <div class="toolbar-separator"></div>

          <!-- Live Coordinates -->
          <div v-if="draggedBoatCoords" class="toolbar-group">
            <span class="toolbar-label">Position (center):</span>
            <div class="coords-display">
              <span class="coord-value">X: {{ draggedBoatCoords.x }}dm</span>
              <span class="coord-value">Y: {{ draggedBoatCoords.y }}dm</span>
              <span class="coord-value">{{ draggedBoatCoords.rotation }}°</span>
            </div>
          </div>

          <!-- Last Moved Position -->
          <div v-if="lastMovedPosition && !draggedBoatCoords" class="toolbar-group">
            <span class="toolbar-label">Senast flyttad:</span>
            <div class="coords-display">
              <span class="coord-boat">{{ lastMovedPosition.boatName }} ({{ lastMovedPosition.boatId }})</span>
              <span class="coord-value">X: {{ lastMovedPosition.x }}dm</span>
              <span class="coord-value">Y: {{ lastMovedPosition.y }}dm</span>
              <span class="coord-value">{{ lastMovedPosition.rotation }}°</span>
            </div>
          </div>

          <div class="toolbar-separator"></div>

          <!-- Save Placements -->
          <div class="toolbar-group">
            <span class="toolbar-label">
              <Save class="inline w-4 h-4 mr-1" />
              Data:
            </span>
            <button @click="savePlacements" class="toolbar-button save-btn" title="Spara alla båtpositioner till boatPlacements.json">
              <Save class="button-icon" />
              Uppdatera JSON
            </button>
            <button @click="syncBoatsFile" class="toolbar-button" title="Synka statusfält i boats.json med aktuella placeringar">
              Synka status
            </button>
            <span v-if="lastSaved" class="save-status">
              Sparad {{ lastSaved }}
            </span>
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
            <div class="tooltip-title">{{ tooltipData.boat.name }} ({{ tooltipData.boat.id }})</div>
            <div class="tooltip-sub">{{ tooltipData.boat.registreringsnummer }}</div>
          </div>
          <div class="tooltip-body">
            <div class="tooltip-row"><span>Ägare</span><span>{{ tooltipCustomer?.display_name || '—' }}</span></div>
            <div class="tooltip-row"><span>Storlek</span><span>{{ tooltipData.boat.length }} × {{ tooltipData.boat.width }} m</span></div>
            <div class="tooltip-row"><span>Status</span><span class="badge" :class="tooltipData.placement.status">{{ getStatusText(tooltipData.placement.status) }}</span></div>
            <div class="tooltip-row"><span>Lager</span><span>{{ tooltipData.placement.storage_unit_name }}</span></div>
            <div class="tooltip-row"><span>Pos</span><span>X {{ tooltipData.placement.position.x }}, Y {{ tooltipData.placement.position.y }}, {{ tooltipData.placement.position.rotation }}°</span></div>
          </div>
          <div class="tooltip-actions">
            <button class="tooltip-btn danger" @click="removeBoatFromStorage(tooltipData.boat, tooltipData.placement)">Ta bort</button>
            <button class="tooltip-btn" @click="setBoatStatusFromTooltip(tooltipData.boat, tooltipData.placement, 'oplacerad')">Flytta (gör oplacerad)</button>
          </div>
        </div>
      </div>

      <!-- Right Panel: Boat List -->
      <div class="boat-panel">
        <div class="panel-title sticky-header">
          <Anchor class="panel-icon" />
          Tillgängliga Båtar
        </div>

        <!-- Boat Filter -->
        <div class="filter-section">
            <div class="search-input-wrapper">
              <Search class="search-icon" />
              <input
                v-model="boatSearchQuery"
                placeholder="Sök alla båtar i systemet…"
                class="search-input has-icon"
              />
              <button v-if="boatSearchQuery" class="clear-btn" @click="boatSearchQuery = ''" title="Rensa sök">
                <X class="w-3 h-3" />
              </button>
            </div>
          <div class="list-meta">Visar {{ filteredBoats.length }} av {{ boats.length }}</div>
        </div>

        <!-- Boat List -->
        <div class="boat-list">
          <div v-if="filteredBoats.length === 0" class="empty-state">Inga båtar matchar filtret</div>
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
              <h4 class="boat-name">{{ boat.name }} ({{ boat.id }})</h4>
              <p class="boat-reg">{{ boat.registreringsnummer }}</p>
              <p class="boat-dims">{{ boat.length }}m × {{ boat.width }}m</p>
              <p class="boat-status">{{ getStatusText(boat.current_status) }}</p>
              <div class="compatibility-row" v-if="true">
                <div class="compatibility-icons" :title="getBoatLocationCompatibility(boat)">
                  <Building2 :class="['compat-icon', allowsWarehouse(boat) ? 'on' : 'off']" />
                  <Anchor :class="['compat-icon', allowsDock(boat) ? 'on' : 'off']" />
                </div>
                <div class="compat-actions">
                  <button
                    v-if="getWarehousePlacement(boat)"
                    class="compat-btn"
                    @click.stop="navigateToBoatStorageType(boat, 'warehouse')"
                    title="Gå till lager/våning"
                  >
                    <Building2 class="w-3 h-3" />
                    Lager
                  </button>
                  <button
                    v-if="getDockPlacement(boat)"
                    class="compat-btn"
                    @click.stop="navigateToBoatStorageType(boat, 'dock')"
                    title="Gå till brygga"
                  >
                    <Anchor class="w-3 h-3" />
                    Brygga
                  </button>
                </div>
              </div>
              <div v-if="getBoatStorageInfo(boat.id)" class="boat-storage-container">
                <p class="boat-storage">
                  <MapPin class="inline w-3 h-3 mr-1" />
                  {{ getBoatStorageInfo(boat.id) }}
                </p>
                <button
                  v-if="boat.current_status !== 'oplacerad'"
                  @click.stop="navigateToBoatStorage(boat)"
                  class="map-button"
                  title="Visa på karta"
                >
                  <Navigation class="w-3 h-3" />
                  Karta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import ViewControls from '@/components/shared/ViewControls.vue';
import { useToast } from '@/composables/useToast';
import Konva from 'konva';
import {
  Warehouse,
  Anchor,
  ZoomOut,
  ZoomIn,
  Move,
  Navigation2,
  Navigation,
  RotateCcw,
  RotateCw,
  Package,
  Lightbulb,
  CircleDot,
  Trash2,
  MapPin,
  Save,
  Search,
  Layers,
  Building2,
  X
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

// Restriction zones state
interface RestrictionZone {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const restrictionZones = ref<RestrictionZone[]>([]);

// Floor system state
interface FloorZone {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StorageFloor {
  id: number;
  storage_id: number;
  storage_name: string;
  floor_number: number;
  floor_name: string;
  is_main_floor: boolean;
  floor_zones: FloorZone[];
  storage_dimensions: {
    length: number;
    width: number;
  };
  created: string;
  modified: string;
}

const storageFloors = ref<StorageFloor[]>([]);
const selectedFloor = ref<number>(1); // Default till våning 1 (main floor)
const availableFloors = ref<StorageFloor[]>([]);

const boats = ref<Boat[]>(boatsData as Boat[]);
const storages = ref<Storage[]>(storageData as Storage[]);
const placements = ref<BoatPlacement[]>(placementsData as BoatPlacement[]);
const customers = ref<Customer[]>(customersData as Customer[]);
// Header breadcrumbs & stats (to match ListPage look)
const headerBreadcrumbs = computed(() => [
  { label: 'Start', to: '/dashboard' },
  { label: 'Båtlager', to: '/storage' },
  { label: 'Båtlager 2.0', isCurrentPage: true },
]);

const headerStats = computed(() => {
  // GLOBALA totaler enligt JSON-datan (boats.json + boatPlacements.json)
  const totalBoats = boats.value.length;
  const placedBoats = boats.value.filter(b => b.current_status === 'placerad').length;
  const reservedBoats = boats.value.filter(b => b.current_status === 'reserverad').length;
  const unplacedBoats = boats.value.filter(b => b.current_status === 'oplacerad').length;
  const totalPlacements = placements.value.length; // informationsvärde från boatPlacements.json

  return [
    { label: 'Totalt antal båtar', value: totalBoats, variant: 'default' },
    { label: 'Placerade', value: placedBoats, color: 'text-blue-600' },
    { label: 'Reserverade', value: reservedBoats, variant: 'outline' },
    { label: 'Oplacerade', value: unplacedBoats, color: 'text-green-600' },
    { label: 'Placeringar', value: totalPlacements, color: 'text-blue-600' }
  ];
});

// Save state
const lastSaved = ref<string>('');

// Selected boat for navigation
const selectedBoatForNavigation = ref<Boat | null>(null);

// Live coordinates during drag
const draggedBoatCoords = ref<{x: number, y: number, rotation: number} | null>(null);

// Last moved position for JSON adjustment
const lastMovedPosition = ref<{boatName: string, boatId: number, x: number, y: number, rotation: number} | null>(null);

// Load restriction zones for selected storage
// Toast API
const { warning, success, info } = useToast();

const loadRestrictionZones = async () => {
  if (!selectedStorage.value) {
    restrictionZones.value = [];
    return;
  }

  try {
    const response = await fetch('/src/assets/data/storageRestrictions.json');
    const restrictionData = await response.json();

    // Find restriction zones for current storage
    const storageRestrictions = restrictionData.find((entry: any) =>
      entry.storage_id === selectedStorage.value!.id
    );

    if (storageRestrictions && storageRestrictions.restriction_zones) {
      // Load existing restriction zones
      restrictionZones.value = storageRestrictions.restriction_zones.map((zone: any) => ({
        id: zone.id,
        name: zone.name,
        x: zone.x,
        y: zone.y,
        width: zone.width,
        height: zone.height
      }));

      console.log(`🛡️ Loaded ${restrictionZones.value.length} restriction zones for storage ${selectedStorage.value!.id} (${selectedStorage.value!.name})`);
    } else {
      // No restriction zones found - start with empty array
      restrictionZones.value = [];
      console.log(`🛡️ No restriction zones found for storage ${selectedStorage.value!.id} (${selectedStorage.value!.name})`);
    }
  } catch (error) {
    console.error('❌ Failed to load restriction zones:', error);
    restrictionZones.value = [];
  }
};

// Load storage floors data
const loadStorageFloors = async () => {
  try {
    const response = await fetch('/src/assets/data/storageFloors.json');
    const floorsData = await response.json();

    storageFloors.value = floorsData;
    console.log(`🏢 Laddat ${storageFloors.value.length} vånings-poster från storageFloors.json`);

    // Update available floors for current storage if selected
    if (selectedStorage.value) {
      updateAvailableFloors();
    }
  } catch (error) {
    console.error('❌ Kunde inte ladda våningsdata:', error);
    storageFloors.value = [];
  }
};

// Update available floors for current storage
const updateAvailableFloors = () => {
  if (!selectedStorage.value) {
    availableFloors.value = [];
    return;
  }

  // Find all floors for this storage
  const floorsForStorage = storageFloors.value.filter(floor =>
    floor.storage_id === selectedStorage.value!.id
  );

  availableFloors.value = floorsForStorage.sort((a, b) => a.floor_number - b.floor_number);

  console.log(`🏢 Hittade ${availableFloors.value.length} våningar för lager ${selectedStorage.value.name}:`,
    availableFloors.value.map(f => `V${f.floor_number}`));

  // Reset to floor 1 if current floor doesn't exist for this storage
  if (selectedFloor.value > availableFloors.value.length) {
    selectedFloor.value = 1;
    console.log(`🔄 Återställde till våning 1 (max: ${availableFloors.value.length})`);
  }
};

// Computed properties
const filteredStorages = computed(() => {
  if (storageFilter.value === 'all') {
    return storages.value;
  }
  return storages.value.filter(s => s.Type === storageFilter.value);
});

// Storage compatibility check
const isBoatCompatibleWithStorage = (boat: Boat, storage: Storage) => {
  const storageType = storage.Type.toLowerCase();
  const boatLocationStatus = boat.location_status.toLowerCase();

  // lager = warehouse, brygga = dock
  if (storageType === 'lager' && (boatLocationStatus.includes('lager') || boatLocationStatus === 'lager')) return true;
  if (storageType === 'brygga' && (boatLocationStatus.includes('brygga') || boatLocationStatus === 'brygga')) return true;
  if (boatLocationStatus === 'lager_brygga') return true; // Can go anywhere

  return false;
};

// Get boat location compatibility display
const getBoatLocationCompatibility = (boat: Boat) => {
  const status = boat.location_status.toLowerCase();
  if (status === 'lager') return '🏠 Lager';
  if (status === 'brygga') return '⚓ Brygga';
  if (status === 'lager_brygga') return '🏠⚓ Båda';
  return '❓ Okänd';
};

// Smart boat filtering based on selected storage
const filteredBoats = computed(() => {
  let filteredBoatList = boatSearchQuery.value
    ? boats.value.filter(boat =>
        boat.name.toLowerCase().includes(boatSearchQuery.value.toLowerCase()) ||
        boat.registreringsnummer.toLowerCase().includes(boatSearchQuery.value.toLowerCase())
      )
    : boats.value;

    // Smart filtering based on selected storage
  if (selectedStorage.value) {
    // Show boats that are:
    // 1. Unplaced (oplacerad) AND compatible with this storage type
    // 2. Placed/Reserved in THIS specific storage
    filteredBoatList = filteredBoatList.filter(boat => {
      if (boat.current_status === 'oplacerad') {
        return isBoatCompatibleWithStorage(boat, selectedStorage.value!);
      } else {
        // Check if boat is placed/reserved in this storage
        const placement = placements.value.find(p =>
          p.boat_id === boat.id &&
          p.storage_unit_id === selectedStorage.value!.id
        );
        return !!placement;
      }
    });
  } else {
    // No storage selected: show only unplaced boats
    filteredBoatList = filteredBoatList.filter(boat => boat.current_status === 'oplacerad');
  }

  // Sort boats by computed display status, then by name
  return filteredBoatList.sort((a, b) => {
    const sa = getBoatDisplayStatus(a);
    const sb = getBoatDisplayStatus(b);
    if (sa === 'oplacerad' && sb !== 'oplacerad') return -1;
    if (sa !== 'oplacerad' && sb === 'oplacerad') return 1;
    return a.name.localeCompare(b.name);
  });
});

const currentStoragePlacements = computed(() => {
  if (!selectedStorage.value) return [] as BoatPlacement[];

  // Filter by storage and floor number
  return placements.value.filter(p =>
    p.storage_unit_id === selectedStorage.value!.id &&
    (p.floor_number || 1) === selectedFloor.value
  );
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
    (p.floor_number || 1) === selectedFloor.value &&
    p.status === 'oplacerad' // Bara räkna kollisioner för flyttbara båtar på aktuell våning
  );

  for (const placement of placementsInStorage) {
    const boat = boats.value.find(b => b.id === placement.boat_id);
    if (boat) {
      const collisionState = checkBoatCollisions(boat, placement);
      // Hull collision är kommenterad bort, så vi räknar bara margin_collision
      if (collisionState === 'margin_collision') {
        collisions++;
      }
    }
  }

  return collisions;
});

// Computed property för rotation-tillgänglighet
const canRotateSelectedBoat = computed(() => {
  return selectedPlacedBoat.value &&
         selectedPlacement.value &&
         selectedPlacement.value.status === 'oplacerad';
});

const tooltipCustomer = computed(() => {
  if (!tooltipData.value) return null;
  return customers.value.find(c => c.id === tooltipData.value!.boat.customer_id) ?? null;
});

  // Compatibility helpers for list actions
  const allowsWarehouse = (boat: Boat): boolean => {
    return boat.location_status === 'lager' || boat.location_status === 'lager_brygga';
  };
  const allowsDock = (boat: Boat): boolean => {
    return boat.location_status === 'brygga' || boat.location_status === 'lager_brygga';
  };
  const getWarehousePlacement = (boat: Boat): BoatPlacement | null => {
    return placements.value.find(p => p.boat_id === boat.id && getStorageType(p.storage_unit_id) === 'warehouse') ?? null;
  };
  const getDockPlacement = (boat: Boat): BoatPlacement | null => {
    return placements.value.find(p => p.boat_id === boat.id && getStorageType(p.storage_unit_id) === 'dock') ?? null;
  };
  const getStorageType = (storageId: number): 'warehouse' | 'dock' | 'unknown' => {
    const s = storages.value.find(ss => ss.id === storageId);
    const t = String((s?.Type ?? (s as any)?.type) ?? '').toLowerCase();
    if (!t) return 'unknown';
    if (t.includes('lager') || t.includes('hall') || t.includes('warehouse')) return 'warehouse';
    if (t.includes('brygga') || t.includes('dock') || t.includes('hamn')) return 'dock';
    return 'unknown';
  };
  const navigateToBoatStorageType = (boat: Boat, type: 'warehouse'|'dock') => {
    const placement = (type === 'warehouse') ? getWarehousePlacement(boat) : getDockPlacement(boat);
    if (!placement) return;
    const storage = storages.value.find(s => s.id === placement.storage_unit_id);
    if (!storage) return;
    if (!selectedStorage.value || selectedStorage.value.id !== storage.id) {
      selectStorage(storage, true);
    }
    if (type === 'warehouse') {
      const floorNum = placement.floor_number || 1;
      if (selectedFloor.value !== floorNum) selectFloor(floorNum);
    }
  };

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

// Placements for a specific boat (all storages)
const getPlacementsForBoat = (boatId: number): BoatPlacement[] => {
  return placements.value.filter(p => p.boat_id === boatId);
};

// Compute the effective status for a boat
// Priority: placerad > reserverad > oplacerad; if selected storage is chosen and boat has a
// placement there, use that status to reflect context
const getBoatDisplayStatus = (boat: Boat): 'oplacerad' | 'placerad' | 'reserverad' => {
  if (selectedStorage.value) {
    const p = placements.value.find(pp => pp.boat_id === boat.id && pp.storage_unit_id === selectedStorage.value!.id);
    if (p) return p.status;
  }

  const all = getPlacementsForBoat(boat.id);
  if (all.some(p => p.status === 'placerad')) return 'placerad';
  if (all.some(p => p.status === 'reserverad')) return 'reserverad';
  return 'oplacerad';
};

// Sync boats.json statuses in-memory from placements on load, so list/status aligns
const reconcileBoatStatuses = () => {
  boats.value = boats.value.map(b => ({
    ...b,
    current_status: getBoatDisplayStatus(b)
  }));
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

const getStorageFloorCount = (storageId: number) => {
  const floorsForStorage = storageFloors.value.filter(floor => floor.storage_id === storageId);
  return Math.max(1, floorsForStorage.length); // Minst 1 våning (grundvåningen)
};

// Floor logic (from StorageDesigner)
const isMainFloor = computed(() => {
  // Main floor (level 1) shows restriction zones
  return selectedFloor.value === 1;
});

const isStorageFloor = computed(() => {
  // Storage floors (2+) show floor zones
  return selectedStorage.value?.Type === 'Lager' && selectedFloor.value > 1;
});

const currentFloorDesign = computed(() => {
  if (!selectedStorage.value) return null;

  // Find the floor design for current storage and floor
  return availableFloors.value.find(floor =>
    floor.storage_id === selectedStorage.value!.id &&
    floor.floor_number === selectedFloor.value
  ) || null;
});

// Bokhylle-validering för våningar 2+
const validateBookshelfPlacement = (boat: Boat, x: number, y: number): { isValid: boolean; reason?: string; shelfName?: string } => {
  if (!currentFloorDesign.value || currentFloorDesign.value.floor_zones.length === 0) {
    return { isValid: false, reason: "Inga bokhyllor definierade för denna våning" };
  }

  // Kontrollera båtstorlek - max 5m för bokhyllor
  if (boat.length > 5.0) {
    return {
      isValid: false,
      reason: `Båten är ${boat.length}m lång - för stor för bokhyllor (max 5m)`
    };
  }

  // Konvertera position från decimeter till meter för jämförelse med floor zones
  const positionX = x / 10; // decimeter -> meter
  const positionY = y / 10; // decimeter -> meter

  // Kolla om positionen är inom någon bokhylla (floor zone)
  for (const zone of currentFloorDesign.value.floor_zones) {
    if (positionX >= zone.x &&
        positionX <= zone.x + zone.width &&
        positionY >= zone.y &&
        positionY <= zone.y + zone.height) {

      // Kontrollera att båten får plats inom hyllan (inkl säkerhetsmarginal)
      const boatLength = boat.length;
      const boatWidth = boat.width;
      const safetyMargin = boat.safety_margin;

      // Hyllan är 5m bred - kontrollera att båten + marginal får plats
      const maxBoatDimension = Math.max(boatLength, boatWidth) + safetyMargin;
      if (maxBoatDimension > 5.0) {
        return {
          isValid: false,
          reason: `Båten + säkerhetsmarginal (${maxBoatDimension.toFixed(1)}m) för stor för 5m bred hylla`
        };
      }

      return {
        isValid: true,
        shelfName: zone.name
      };
    }
  }

  // Inte inom någon bokhylla
  return {
    isValid: false,
    reason: "Positionen är inte inom någon bokhylla - små båtar måste placeras i de blå hyllorna"
  };
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
    const targetPlacement = placements.value[placementIndex];
    if (targetPlacement) {
      targetPlacement.status = newStatus;
    }

    // Handle "only one unplaced boat per storage" rule
    if (newStatus === 'oplacerad') {
      setAllOtherBoatsAsPlaced(placement.storage_unit_id, placement.id);
    }
  }

  // Update boat status
  const boatIndex = boats.value.findIndex(b => b.id === boat.id);
  if (boatIndex !== -1) {
    const targetBoat = boats.value[boatIndex];
    if (targetBoat) {
      targetBoat.current_status = newStatus;
    }
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
    const targetBoat = boats.value[boatIndex];
    if (targetBoat) {
      targetBoat.current_status = 'oplacerad';
    }
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

  // Check collisions with other boats (ENDAST SAMMA VÅNING!)
  const otherPlacements = placements.value.filter(p =>
    p.boat_id !== currentBoat.id &&
    p.storage_unit_id === currentPlacement.storage_unit_id &&
    (p.floor_number || 1) === (currentPlacement.floor_number || 1)
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

    // HULL COLLISION TEMPORÄRT KOMMENTERAD BORT (2024-12-27)
    // Kommenteras bort för att ge mer frihet i placering utan stress av helt röda båtar
    // Kan aktiveras igen vid behov genom att avkommentera nedan:
    /*
    // Check hull collision first (most critical) - rotated rectangles!
    if (rotatedRectanglesOverlap(currentHullRect, otherHullRect)) {
      console.log(`🔴 Hull collision: ${currentBoat.name} (${currentRotation * 180 / Math.PI}°) ↔ ${otherBoat.name} (${otherRotation * 180 / Math.PI}°)`);
      return 'hull_collision';
    }
    */

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
    console.warn('❌ Ingen båt vald för rotation - klicka på en OPLACERAD båt först!');
    return;
  }

  // Find the placement for the selected boat
  const placement = placements.value.find(p => p.boat_id === selectedPlacedBoat.value!.id);
  if (!placement) {
    console.warn('Hittade ingen placement för vald båt:', selectedPlacedBoat.value.name);
    return;
  }

  // VIKTIGT: Kontrollera att båten är oplacerad innan rotation
  if (placement.status !== 'oplacerad') {
    console.warn(`❌ Kan inte rotera ${selectedPlacedBoat.value.name} - bara oplacerade båtar kan roteras! (nuvarande status: ${placement.status})`);
    // Rensa selektion för att förhindra förvirring
    selectedPlacedBoat.value = null;
    selectedPlacement.value = null;
    return;
  }

  console.log('✅ Roterar oplacerad båt - nuvarande rotation:', placement.position.rotation);

  // VIKTIGT: Oplacerade båtar kan roteras även med kollision detection
  // Kollision påverkar bara visuell feedback, inte rotation-möjlighet
  console.log('🔄 Rotation tillåten för oplacerad båt (oberoende av kollision)');

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

  // Calculate initial canvas size properly (same logic as resize)
  const canvasArea = canvasContainer.value.closest('.canvas-area') as HTMLElement;
  let initialWidth = 800; // fallback
  let initialHeight = 600; // fallback

  if (canvasArea) {
    const rect = canvasArea.getBoundingClientRect();
    const toolbarHeight = 60;
    initialWidth = Math.max(300, rect.width - 20);
    initialHeight = Math.max(200, rect.height - toolbarHeight - 20);
  }

  console.log(`🎬 Initializing canvas with size: ${initialWidth}x${initialHeight}px`);

  // Set container size explicitly
  canvasContainer.value.style.width = `${initialWidth}px`;
  canvasContainer.value.style.height = `${initialHeight}px`;

  // Create Konva stage
  stage.value = new Konva.Stage({
    container: canvasContainer.value,
    width: initialWidth,
    height: initialHeight,
  });

  // Create layer
  layer.value = new Konva.Layer();
  // Konva typings sometimes mismatch; cast to any to satisfy TS while keeping runtime correct
  (stage.value as any).add(layer.value as any);

  // Setup event handlers
  setupEventHandlers();

  console.log('✅ Canvas initialized');
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

  // VIKTIGT: Behåll zoom och pan när vi ritar om lagret
  const currentZoom = stage.value?.scaleX() || 1;
  const currentPosition = stage.value?.position() || { x: 0, y: 0 };

  // Debugging: Logga nuvarande zoom/pan
  console.log(`🎨 drawStorage() - Nuvarande zoom: ${(currentZoom * 100).toFixed(0)}%, position: (${currentPosition.x.toFixed(0)}, ${currentPosition.y.toFixed(0)})`);

  layer.value.destroyChildren();

  const storage = selectedStorage.value;
  const pixelsPerMeter = 10;
  const storageOffsetX = 50;
  const storageOffsetY = 50;

  // Determine storage type and apply StorageDesigner styling
  const isWarehouse = storage.Type === 'Lager';
  const isDock = storage.Type === 'Brygga';

  // StorageDesigner exact colors
  const storageStyle = {
    fill: isWarehouse ? '#FDFAF0' : '#E7F3FF', // Light cream for warehouse, light blue for dock
    stroke: isWarehouse ? '#B46100' : '#2563eb', // Brown for warehouse, blue for dock
    strokeWidth: 2
  };

  // NOTE: Canvas background removed - using CSS background instead
  // (The .konva-canvas CSS class already provides background styling)

  // Determine if storage should be dimmed (when on floors 2+)
  const shouldDimStorage = !isMainFloor.value;

  // Draw storage area with StorageDesigner styling
  const storageRect = new Konva.Rect({
    x: storageOffsetX,
    y: storageOffsetY,
    width: storage.Height * pixelsPerMeter,
    height: storage.width * pixelsPerMeter,
    ...storageStyle,
    opacity: shouldDimStorage ? 0.3 : 1.0, // Dim when editing upper floors
    listening: false,
  });
  layer.value!.add(storageRect);

  // Add storage label above the storage area (like StorageDesigner)
  const fontSize = Math.max(12, pixelsPerMeter * 1.2);
  const labelText = selectedFloor.value === 1
    ? (isWarehouse ? `${storage.name} våning 1` : storage.name)
    : `${storage.name} våning ${selectedFloor.value}`;

  const storageLabel = new Konva.Text({
    x: storageOffsetX,
    y: storageOffsetY - fontSize - 10,
    text: labelText,
    fontSize: fontSize,
    fill: shouldDimStorage ? '#9ca3af' : '#1f2937', // Dimmed text for upper floors
    fontFamily: 'Arial',
    fontStyle: 'bold',
    listening: false,
  });
  layer.value!.add(storageLabel);

  // Draw dock endpoints if it's a dock (like StorageDesigner)
  if (isDock) {
    drawDockEndpoints(storage, pixelsPerMeter, storageOffsetX, storageOffsetY);
  }

  // Draw grid with StorageDesigner styling
  drawGrid(storage, pixelsPerMeter, storageOffsetX, storageOffsetY);

  // Draw zones based on floor (like StorageDesigner)
  if (isMainFloor.value) {
    // Main floor - show restriction zones
    drawRestrictionZones(pixelsPerMeter, storageOffsetX, storageOffsetY);
    console.log('🏢 Displaying main floor - restriction zones');
  } else if (isStorageFloor.value) {
    // Upper floor - show floor zones
    drawFloorZones(pixelsPerMeter, storageOffsetX, storageOffsetY);
    console.log('🏢 Displaying storage floor - floor zones');
  }

  // Draw placed boats
  drawPlacedBoats();

  layer.value.batchDraw();

  // VERIFIERA: Kontrollera att zoom/pan inte ändrats
  const afterZoom = stage.value?.scaleX() || 1;
  const afterPosition = stage.value?.position() || { x: 0, y: 0 };
  if (Math.abs(afterZoom - currentZoom) > 0.01 || Math.abs(afterPosition.x - currentPosition.x) > 1 || Math.abs(afterPosition.y - currentPosition.y) > 1) {
    console.warn(`⚠️ drawStorage() ändrade zoom/pan! Före: zoom=${(currentZoom * 100).toFixed(0)}%, pos=(${currentPosition.x.toFixed(0)}, ${currentPosition.y.toFixed(0)}) | Efter: zoom=${(afterZoom * 100).toFixed(0)}%, pos=(${afterPosition.x.toFixed(0)}, ${afterPosition.y.toFixed(0)})`);
  }
};

// Draw dock endpoints (from StorageDesigner)
const drawDockEndpoints = (storage: Storage, pixelsPerMeter: number, storageOffsetX: number, storageOffsetY: number) => {
  if (!layer.value) return;

  const endpointWidth = 8; // Width of endpoint indicator
  const endpointHeight = storage.width * pixelsPerMeter; // Full height of dock

  // For now, default endpoints (can be made configurable later)
  const leftEndpoint = 'water';  // water, land, or dock
  const rightEndpoint = 'land';

  // Get colors for dock endpoints
  const getEndpointColor = (endpointType: string) => {
    switch (endpointType) {
      case 'water':
        return { fill: '#3B82F6', stroke: '#1E40AF' }; // Blue for water
      case 'land':
        return { fill: '#16A34A', stroke: '#15803D' }; // Green for land
      case 'dock':
        return { fill: '#F59E0B', stroke: '#D97706' }; // Orange for dock connection
      default:
        return { fill: '#6B7280', stroke: '#4B5563' }; // Gray fallback
    }
  };

  // Left endpoint
  const leftColor = getEndpointColor(leftEndpoint);
  const leftRect = new Konva.Rect({
    x: storageOffsetX - endpointWidth,
    y: storageOffsetY,
    width: endpointWidth,
    height: endpointHeight,
    fill: leftColor.fill,
    stroke: leftColor.stroke,
    strokeWidth: 2,
    listening: false,
  });
  layer.value!.add(leftRect);

  // Right endpoint
  const rightColor = getEndpointColor(rightEndpoint);
  const rightRect = new Konva.Rect({
    x: storageOffsetX + storage.Height * pixelsPerMeter,
    y: storageOffsetY,
    width: endpointWidth,
    height: endpointHeight,
    fill: rightColor.fill,
    stroke: rightColor.stroke,
    strokeWidth: 2,
    listening: false,
  });
  layer.value!.add(rightRect);
};

const drawGrid = (storage: Storage, pixelsPerMeter: number, storageOffsetX: number, storageOffsetY: number) => {
  if (!layer.value) return;

  const startX = storageOffsetX;
  const startY = storageOffsetY;
  const storageWidth = storage.Height * pixelsPerMeter;
  const storageHeight = storage.width * pixelsPerMeter;
  const gridSize = 1; // Grid size in meters (configurable)
  const gridSpacing = gridSize * pixelsPerMeter;

  // StorageDesigner grid styling
  const gridStyle = {
    stroke: '#FFDEB7', // Light orange grid like StorageDesigner
    strokeWidth: 0.5,
    opacity: 0.8,
    listening: false,
  };

  // Vertical lines within storage
  for (let x = gridSpacing; x < storageWidth; x += gridSpacing) {
    const line = new Konva.Line({
      points: [
        startX + x,
        startY,
        startX + x,
        startY + storageHeight
      ],
      ...gridStyle,
    });
    layer.value.add(line);
  }

  // Horizontal lines within storage
  for (let y = gridSpacing; y < storageHeight; y += gridSpacing) {
    const line = new Konva.Line({
      points: [
        startX,
        startY + y,
        startX + storageWidth,
        startY + y
      ],
      ...gridStyle,
    });
    layer.value.add(line);
  }
};

// Draw restriction zones (from StorageDesigner styling)
const drawRestrictionZones = (pixelsPerMeter: number, storageOffsetX: number, storageOffsetY: number) => {
  if (!layer.value || restrictionZones.value.length === 0) return;

  console.log(`🛡️ Drawing ${restrictionZones.value.length} restriction zones...`);

  // StorageDesigner exact zone styling
  const zoneStyle = {
    fill: '#FDE7E7',    // Light red fill
    stroke: '#800000',  // Dark red border
    strokeWidth: 1,
    opacity: 1.0,
    dash: [3, 3]        // Dashed border
  };

  restrictionZones.value.forEach((zone, index) => {
    console.log(`📦 Drawing zone ${index + 1}: ${zone.name} at (${zone.x}, ${zone.y}) size ${zone.width}x${zone.height}m`);

    // Convert zone coordinates from meters to pixels
    const zoneX = storageOffsetX + (zone.x * pixelsPerMeter);
    const zoneY = storageOffsetY + (zone.y * pixelsPerMeter);
    const zoneWidth = zone.width * pixelsPerMeter;
    const zoneHeight = zone.height * pixelsPerMeter;

    // Create restriction zone rectangle
    const zoneRect = new Konva.Rect({
      x: zoneX,
      y: zoneY,
      width: zoneWidth,
      height: zoneHeight,
      ...zoneStyle,
      listening: false, // Non-interactive for now
    });
    layer.value!.add(zoneRect);

    // Add zone label (centered in the middle of the zone)
    const fontSize = Math.min(10, Math.max(8, pixelsPerMeter * 0.8));
    const zoneText = new Konva.Text({
      x: zoneX + (zoneWidth / 2),
      y: zoneY + (zoneHeight / 2),
      text: zone.name,
      fontSize: fontSize,
      fill: '#800000', // Same dark red as border
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 0, // Will be set based on text width
      offsetY: fontSize / 2, // Center vertically
      listening: false,
    });

    // Center the text properly
    zoneText.offsetX(zoneText.width() / 2);
    layer.value!.add(zoneText);
  });
};

// Draw floor zones (from StorageDesigner)
const drawFloorZones = (pixelsPerMeter: number, storageOffsetX: number, storageOffsetY: number) => {
  if (!layer.value || !currentFloorDesign.value) return;

  const floorZones = currentFloorDesign.value.floor_zones;
  if (floorZones.length === 0) return;

  console.log(`🏢 Drawing ${floorZones.length} floor zones for våning ${selectedFloor.value}...`);

  floorZones.forEach((zone, index) => {
    console.log(`📦 Drawing floor zone ${index + 1}: ${zone.name} at (${zone.x}, ${zone.y}) size ${zone.width}x${zone.height}m`);

    // Convert zone coordinates from meters to pixels
    const zoneX = storageOffsetX + (zone.x * pixelsPerMeter);
    const zoneY = storageOffsetY + (zone.y * pixelsPerMeter);
    const zoneWidth = zone.width * pixelsPerMeter;
    const zoneHeight = zone.height * pixelsPerMeter;

    // Create floor zone rectangle (from StorageDesigner styling)
    const zoneRect = new Konva.Rect({
      x: zoneX,
      y: zoneY,
      width: zoneWidth,
      height: zoneHeight,
      fill: '#EBF3FF',     // Light blue fill
      stroke: '#2563eb',   // Blue border
      strokeWidth: 1,
      dash: [5, 2],        // Dashed border
      opacity: 1.0,
      listening: false,    // Non-interactive for now
    });
    layer.value!.add(zoneRect);

    // Add zone label (centered in the middle of the zone)
    const fontSize = Math.max(10, pixelsPerMeter * 1.5);
    const zoneText = new Konva.Text({
      x: zoneX + (zoneWidth / 2),
      y: zoneY + (zoneHeight / 2),
      text: zone.name,
      fontSize: fontSize,
      fill: '#2563eb', // Same blue as border
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 0, // Will be set based on text width
      offsetY: fontSize / 2, // Half of fontSize to center vertically
      listening: false,
    });

    // Center the text properly by setting offsetX to half the text width
    zoneText.offsetX(zoneText.width() / 2);
    layer.value!.add(zoneText);
  });
};

const drawPlacedBoats = () => {
  if (!layer.value) return;

  const placementsInStorage = currentStoragePlacements.value;
  console.log(`Ritar ${placementsInStorage.length} båtar i ${selectedStorage.value?.name}`);

  if (placementsInStorage.length === 0) {
    console.log('Inga båtar att rita i detta lager');
    return;
  }

  // VIKTIGT: Sortera så att oplacerade båtar ritas sist (överst visuellt)
  // Rita placerade/reserverade först, sedan oplacerade
  const sortedPlacements = [...placementsInStorage].sort((a, b) => {
    const statusPriority = { 'placerad': 0, 'reserverad': 0, 'oplacerad': 1 };
    return statusPriority[a.status] - statusPriority[b.status];
  });

  console.log(`🎨 Ritar båtar i z-ordning: ${sortedPlacements.map(p =>
    `${boats.value.find(b => b.id === p.boat_id)?.name}(${p.status})`
  ).join(' → ')}`);

  sortedPlacements.forEach(placement => {
    const boat = boats.value.find(b => b.id === placement.boat_id);
    if (boat) {
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
  // Använd samma offset som i drawStorage för konsistens
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
    ...((stateStyles[displayStatus] ?? stateStyles['oplacerad'])!.margin)
  });

  // Create hull path - med fallback till oplacerad om status saknas
  const hullPath = new Konva.Path({
    data: SVG_CONSTANTS.HULL_PATH,
    strokeScaleEnabled: false,
    name: 'hull-path',
    ...((stateStyles[displayStatus] ?? stateStyles['oplacerad'])!.hull)
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

  // Add boat name with ID
  const nameText = new Konva.Text({
    x: 0,
    y: 0,
    text: `${boat.name} (${boat.id})`,
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

      // OLIKA BETEENDE PER STATUS:
      if (placement.status === 'oplacerad') {
        // BARA oplacerade båtar kan väljas för rotation
        selectedPlacedBoat.value = boatFromPlacement;
        selectedPlacement.value = placement;
        drawStorage();
        console.log(`✅ Vald oplacerad båt för rotation: ${boatFromPlacement.name}`);
      } else if (placement.status === 'placerad') {
        // Placerade båtar: rensa selektion och toggle status
        selectedPlacedBoat.value = null;
        selectedPlacement.value = null;
        toggleBoatStatus(boatFromPlacement, placement);
        console.log(`🔵 Placerad båt klickad: ${boatFromPlacement.name} - tappar fokus, ändrar status`);
      } else if (placement.status === 'reserverad') {
        // Reserverade båtar: rensa selektion och toggle status (precis som placerade)
        selectedPlacedBoat.value = null;
        selectedPlacement.value = null;
        toggleBoatStatus(boatFromPlacement, placement);
        console.log(`⚪ Reserverad båt klickad: ${boatFromPlacement.name} - tappar fokus, ändrar status`);
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
      const storageX = (pos.x - 50); // Storage coordinates in decimeters
      const storageY = (pos.y - 50);

      // Show live coordinates in toolbar
      draggedBoatCoords.value = {
        x: Math.round(storageX * 10) / 10, // Round to 1 decimal
        y: Math.round(storageY * 10) / 10,
        rotation: placement.position.rotation
      };

      const tempPlacement = {
        ...placement,
        position: {
          ...placement.position,
          x: storageX,
          y: storageY
        }
      };

      // Check collisions at current drag position
      const collisionState = checkBoatCollisions(boat, tempPlacement);
      const dragDisplayStatus = collisionState ?? placement.status;

      // Update visual feedback during drag
      const marginPath = boatGroup.findOne('.margin-path') as Konva.Path;
      const hullPath = boatGroup.findOne('.hull-path') as Konva.Path;

      if (marginPath && hullPath) {
        // Apply collision state styles - med fallback till oplacerad om status saknas
        const style = stateStyles[dragDisplayStatus] ?? stateStyles['oplacerad'];
        if (style) {
          marginPath.setAttrs(style.margin);
          hullPath.setAttrs(style.hull);
        }
        layer.value?.batchDraw();
      }
    }
  });

  boatGroup.on('dragend', () => {
    const pos = boatGroup.position();
    const newX = (pos.x - 50); // Position i decimeter
    const newY = (pos.y - 50); // Position i decimeter

    // Save last moved position for JSON adjustment
    lastMovedPosition.value = {
      boatName: boat.name,
      boatId: boat.id,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      rotation: placement.position.rotation
    };

    // Clear live coordinates display
    draggedBoatCoords.value = null;

    console.log(`Boat moved to: ${newX.toFixed(1)}, ${newY.toFixed(1)} decimeter`);
    console.log(`📍 Position saved for JSON adjustment: ${boat.name} (${boat.id}) at (${lastMovedPosition.value.x}, ${lastMovedPosition.value.y})`);

    // Regelverk: lager_brygga-hint även på flytt
    const boatLoc = String(boat.location_status || '').toLowerCase();
    if (boatLoc === 'lager_brygga') {
      const hasWarehouse = placements.value.some(p => p.boat_id === boat.id && storages.value.find(s => s.id === p.storage_unit_id)?.Type === 'Lager');
      const hasDock = placements.value.some(p => p.boat_id === boat.id && storages.value.find(s => s.id === p.storage_unit_id)?.Type === 'Brygga');
      if (selectedStorage.value?.Type === 'Lager' && !hasDock) {
        info('Tips', `"${boat.name}" saknar ännu brygg-reservation.`);
      }
      if (selectedStorage.value?.Type === 'Brygga' && !hasWarehouse) {
        info('Tips', `"${boat.name}" saknar ännu lagerplacering.`);
      }
    }

    // BOKHYLLE-VALIDERING för våning 2+ (endast när båten flyttas)
    if (isStorageFloor.value && currentFloorDesign.value) {
      const validationResult = validateBookshelfPlacement(boat, newX, newY);
      if (!validationResult.isValid) {
        console.warn(`❌ BOKHYLLE-DRAG MISSLYCKAD: ${validationResult.reason}`);
        alert(`❌ Kan inte placera båt här!\n\n${validationResult.reason}\n\nBåten återställs till förra positionen.`);

        // Återställ till förra positionen
        boatGroup.position({
          x: 50 + placement.position.x,
          y: 50 + placement.position.y
        });

        // Redraw för att återställa visuellt
        drawStorage();
        return;
      }
      console.log(`✅ BOKHYLLE-DRAG OK: ${boat.name} flyttad till ${validationResult.shelfName}`);
    }

    // Update placement data
    const placementIndex = placements.value.findIndex(p => p.id === placement.id);
    if (placementIndex !== -1) {
      const targetPlacement = placements.value[placementIndex];
      if (targetPlacement) {
        targetPlacement.position.x = newX;
        targetPlacement.position.y = newY;
      }
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
const selectStorage = async (storage: Storage, autoCenter: boolean = false) => {
  selectedStorage.value = storage;
  console.log(`🏢 Väljer lager: ${storage.name} (ID: ${storage.id})`);

  // Debug: Visa alla placements för detta lager
  const placementsForStorage = placements.value.filter(p => p.storage_unit_id === storage.id);
  console.log(`📦 Hittade ${placementsForStorage.length} placements för detta lager:`, placementsForStorage);

  // Load restriction zones for this storage
  await loadRestrictionZones();

  // Update available floors for this storage
  updateAvailableFloors();

  drawStorage();

  // Auto-centrera BARA vid första laddning eller om explicit begärt
  if (autoCenter) {
    nextTick(() => {
      setTimeout(() => {
        centerStorage();
        console.log('📍 Lager auto-centrerat');
      }, 50);
    });
  }
};

// Select floor function
const selectFloor = (floorNumber: number) => {
  selectedFloor.value = floorNumber;
  console.log(`🏢 Väljer våning ${floorNumber} för lager ${selectedStorage.value?.name}`);

  // Redraw to show boats for this floor
  drawStorage();
};

const selectBoat = (boat: Boat) => {
  selectedBoat.value = boat;
  selectedBoatForNavigation.value = boat;

  // If boat is placed/reserved, automatically navigate to its storage
  if (boat.current_status !== 'oplacerad') {
    const placement = placements.value.find(p => p.boat_id === boat.id);
    if (placement) {
      const storage = storages.value.find(s => s.id === placement.storage_unit_id);
      if (storage && storage.id !== selectedStorage.value?.id) {
        console.log(`🧭 Navigating to ${boat.name}'s storage: ${storage.name}`);
        selectStorage(storage, true); // Auto-center
      }
    }
  }

  console.log('Selected boat:', boat.name);
};

// Initialize router
const router = useRouter();

// Navigate to boat's storage location
const navigateToBoatStorage = (boat: Boat) => {
  const placement = placements.value.find(p => p.boat_id === boat.id);
  if (placement) {
    const storage = storages.value.find(s => s.id === placement.storage_unit_id);
    if (storage) {
      // Router navigation to dashboard with coordinates
      router.push({
        path: '/dashboard',
        query: {
          lat: (storage.Lat ?? 0).toString(),
          lng: (storage.Long ?? 0).toString(),
          zoom: '17',
          focus: (storage.id ?? '').toString(),
          name: storage.name,
          boat: boat.name,
          boatId: (boat.id ?? '').toString()
        }
      });
    }
  }
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
    const targetPlacement = placements.value[placementIndex];
    if (targetPlacement) {
      targetPlacement.status = newStatus;
    }
    // Update selectedPlacement with the new status
    if (selectedPlacement.value && selectedPlacement.value.id === placement.id) {
      selectedPlacement.value.status = newStatus;
    }
  }

  // Update boat status
  const boatIndex = boats.value.findIndex(b => b.id === boat.id);
  if (boatIndex !== -1) {
    const targetBoat = boats.value[boatIndex];
    if (targetBoat) {
      targetBoat.current_status = newStatus;
    }
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

const resetView = () => {
  if (!stage.value) return;

  // Återställ till ursprunglig zoom och position
  stage.value.position({ x: 0, y: 0 });
  zoomLevel.value = 1;
  zoomPercentage.value = 100;
  stage.value.scale({ x: 1, y: 1 });
  stage.value.batchDraw();

  console.log('🔄 Zoom och pan återställt till ursprungsläge');
};

const resetCanvas = () => {
  resetView();
  console.log('🔄 Canvas återställt');
};

// Save placements directly to boatPlacements.json
const savePlacements = async () => {
  try {
    // Create a formatted JSON string with current placements data
    const placementsJson = JSON.stringify(placements.value, null, 2);

    // Show what we're about to save in console
    console.log('📊 Sparar placements:', {
      count: placements.value.length,
      data: placements.value.slice(0, 3) // Show first 3 for verification
    });

    // Since we can't directly write to files in browser, we'll show the data
    // and provide both download and copy-to-clipboard options

    // Option 1: Download file (as before)
    const blob = new Blob([placementsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'boatPlacements.json'; // Direct filename for easy replacement

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL
    URL.revokeObjectURL(url);

    // Option 2: Copy to clipboard for easy pasting
    try {
      await navigator.clipboard.writeText(placementsJson);
      console.log('📋 JSON kopierat till clipboard');
    } catch (clipboardError) {
      console.warn('⚠️ Kunde inte kopiera till clipboard:', clipboardError);
    }

    // Update last saved timestamp
    const now = new Date();
    const timeString = now.toLocaleString('sv-SE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    lastSaved.value = timeString;

    console.log(`✅ boatPlacements.json genererad och nedladdad`);
    console.log(`📊 ${placements.value.length} placements exporterade`);
    console.log(`📋 JSON-data kopierat till clipboard - klistra in i boatPlacements.json`);

    // Show instruction alert
    alert(`✅ Placements sparade!\n\n📁 Nedladdning: boatPlacements.json\n📋 JSON kopierat till clipboard\n\n🔄 För att uppdatera:\n1. Ersätt innehållet i src/assets/data/boatPlacements.json\n2. Refresha sidan`);

    // Show success feedback briefly
    setTimeout(() => {
      if (lastSaved.value === timeString) {
        lastSaved.value = '';
      }
    }, 8000); // Clear after 8 seconds (longer for instructions)

  } catch (error) {
    console.error('❌ Fel vid sparning av placements:', error);
    alert('Fel vid sparning av JSON-fil. Se konsolen för detaljer.');
  }
};

// Sync boats.json current_status with computed display status from placements
const syncBoatsFile = async () => {
  try {
    const updatedBoats = boats.value.map(b => ({
      ...b,
      current_status: getBoatDisplayStatus(b)
    }));

    const boatsJson = JSON.stringify(updatedBoats, null, 2);

    const blob = new Blob([boatsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'boats.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    try {
      await navigator.clipboard.writeText(boatsJson);
    } catch {}

    alert('✅ boats.json genererad och kopierad till urklipp.\n\nErsätt src/assets/data/boats.json och refresha.');
  } catch (e) {
    console.error('Sync boats.json failed', e);
    alert('Fel vid synk av boats.json');
  }
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
      const targetPlacement = placements.value[placementIndex];
      if (targetPlacement) {
        targetPlacement.status = 'placerad';
      }
    }

    // Uppdatera även båt-data
    const boatIndex = boats.value.findIndex(b => b.id === placement.boat_id);
    if (boatIndex !== -1) {
      const targetBoat = boats.value[boatIndex];
      if (targetBoat) {
        targetBoat.current_status = 'placerad';
      }
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
      const targetPlacement = placements.value[placementIndex];
      if (targetPlacement) {
        targetPlacement.status = 'placerad';
      }
    }

    const boatIndex = boats.value.findIndex(b => b.id === placement.boat_id);
    if (boatIndex !== -1) {
      const targetBoat = boats.value[boatIndex];
      if (targetBoat) {
        targetBoat.current_status = 'placerad';
      }
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
      const targetPlacement = placements.value[placementIndex];
      if (targetPlacement) {
        targetPlacement.status = 'reserverad';
      }
    }

    const boatIndex = boats.value.findIndex(b => b.id === placement.boat_id);
    if (boatIndex !== -1) {
      const targetBoat = boats.value[boatIndex];
      if (targetBoat) {
        targetBoat.current_status = 'reserverad';
      }
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
  const currentStorageRef = selectedStorage.value as Storage;

  try {
    const boat = JSON.parse(event.dataTransfer.getData('application/json'));

    // Check if boat is already placed in this storage
    const existingPlacement = placements.value.find(
      p => p.boat_id === boat.id && p.storage_unit_id === selectedStorage.value!.id
    );

    if (existingPlacement) {
      warning('Redan placerad', `${boat.name} finns redan i detta lager.`);
      return;
    }

    // SMART KONFLIKT-HANTERING: Bara för oplacerade båtar (en oplacerad per lager)
    const unplacedBoat = getUnplacedBoatInStorage(currentStorageRef.id);
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
        const oldBoat = boats.value[oldBoatIndex];
        if (oldBoat) {
          oldBoat.current_status = 'oplacerad'; // Tillbaka till pool
        }
      }
    }

    // Calculate drop position with zoom and pan compensation
    const rect = canvasContainer.value?.getBoundingClientRect();
    if (!rect) return;
    const canvasX = event.clientX - (rect as DOMRect).left;
    const canvasY = event.clientY - (rect as DOMRect).top;

    // När zoomad/pannad: placera båten i centrum av synliga området istället för musposition
    let finalX = canvasX;
    let finalY = canvasY;

    if (stage.value) {
      const currentZoom = stage.value.scaleX();
      const currentPosition = stage.value.position();

      // Om zoomad (inte 100%), placera i centrum av synliga området
      if (Math.abs(currentZoom - 1) > 0.1) {
        const canvasCenter = {
          x: stage.value.width() / 2,
          y: stage.value.height() / 2
        };

        // Konvertera canvas center till stage koordinater
        finalX = (canvasCenter.x - currentPosition.x) / currentZoom;
        finalY = (canvasCenter.y - currentPosition.y) / currentZoom;

        console.log(`🎯 Zoomad (${(currentZoom * 100).toFixed(0)}%): Placerar båt i synligt centrum istället för muspositionen`);
      } else {
        // Vid 100% zoom: använd musposition men kompensera för pan
        finalX = (canvasX - currentPosition.x) / currentZoom;
        finalY = (canvasY - currentPosition.y) / currentZoom;
      }
    }

    // Convert to storage coordinates (nu i DECIMETER)
    const storageX = (finalX - 50); // x - offset = decimeter position
    const storageY = (finalY - 50); // y - offset = decimeter position

    // BOKHYLLE-VALIDERING för våning 2+
    if (isStorageFloor.value && currentFloorDesign.value) {
      const validationResult = validateBookshelfPlacement(boat, storageX, storageY);
      if (!validationResult.isValid) {
        console.warn(`❌ BOKHYLLE-VALIDERING MISSLYCKAD: ${validationResult.reason}`);
        console.warn(`📚 Båten ${boat.name} (${boat.length}m) kan inte placeras på våning ${selectedFloor.value}`);
        alert(`❌ Kan inte placera båt här!\n\n${validationResult.reason}\n\nPå våning ${selectedFloor.value} kan bara båtar ≤5m placeras i bokhyllorna.`);
        return;
      }
      console.log(`✅ BOKHYLLE-VALIDERING OK: ${boat.name} kan placeras i ${validationResult.shelfName}`);
    }

    // Regelverk: kontrollera location_status och befintliga placeringar
    const boatLocation = String(boat.location_status || '').toLowerCase();
    const boatPlacements = placements.value.filter(p => p.boat_id === boat.id);

    // Om båt har lager_brygga ska den ha både en lager- och en brygg-placering
    if (boatLocation === 'lager_brygga') {
      const hasWarehouse = boatPlacements.some(p => storages.value.find(s => s.id === p.storage_unit_id)?.Type === 'Lager');
      const hasDock = boatPlacements.some(p => storages.value.find(s => s.id === p.storage_unit_id)?.Type === 'Brygga');

      // Om vi placerar i lager men ingen brygga finns – visa varning (men tillåt placering)
      if (selectedStorage.value?.Type === 'Lager' && !hasDock) {
        warning(
          'Bryggplats saknas',
          `"${boat.name}" kräver även en brygg-reservation. Lägg gärna en plats på en brygga efter lagret.`,
        );
      }
      // Om vi placerar i brygga men ingen lager finns – visa varning
      if (selectedStorage.value?.Type === 'Brygga' && !hasWarehouse) {
        warning(
          'Lagerplats saknas',
          `"${boat.name}" kräver även en lagerplacering. Lägg gärna en plats i ett lager.`,
        );
      }
    }

    // Create new placement med vald status
    const newPlacement: BoatPlacement = {
      id: Date.now(), // Temporary ID
      boat_id: boat.id,
      storage_unit_id: currentStorageRef.id,
      storage_unit_name: currentStorageRef.name,
      floor_number: selectedFloor.value,
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
      const targetBoat = boats.value[boatIndex];
      if (targetBoat) {
        targetBoat.current_status = defaultPlacementStatus.value;
      }
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
    const positionNote = Math.abs(stage.value?.scaleX() || 1 - 1) > 0.1 ? ' (centrum av synligt område)' : ' (muspositionen)';
    console.log(`${boat.name} placerad som ${statusText} på (${storageX.toFixed(1)}, ${storageY.toFixed(1)}) decimeter${positionNote}${conflictMessage}${collisionMessage}`);

    // AUTOMATISK SELECTION: Om båten placerades som oplacerad, välj den direkt för rotation
    if (defaultPlacementStatus.value === 'oplacerad') {
      selectedPlacedBoat.value = boat;
      selectedPlacement.value = newPlacement;
      console.log(`🎯 Oplacerad båt ${boat.name} automatiskt vald för rotation efter drop`);
    }

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

  // Load floor data
  await loadStorageFloors();

  // Reconcile list statuses with placements
  reconcileBoatStatuses();

  initCanvas();

  // Auto-select first storage for demo (med auto-centrering vid första laddning)
  if (storages.value.length > 0 && storages.value[0]) {
    selectStorage(storages.value[0] as Storage, true); // true = auto-center
  }

  // Close tooltip when clicking outside
  const handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as Element;
    if (!target.closest('.boat-tooltip')) {
      hideTooltipImmediately();
    }
  };

  document.addEventListener('click', handleDocumentClick);

  // Handle window resize (improved with debouncing like StorageDesigner)
  const handleResize = () => {
    // Debounce resize calls to prevent performance issues
    setTimeout(() => {
      if (!canvasContainer.value || !stage.value) return;

      console.log('🔄 Handling canvas resize...');

      // Get the parent canvas-area element for proper sizing
      const canvasArea = canvasContainer.value.closest('.canvas-area') as HTMLElement;
      if (!canvasArea) {
        console.warn('❌ Could not find canvas-area parent element');
        return;
      }

      // Calculate available space, accounting for toolbar
      const rect = canvasArea.getBoundingClientRect();
      const toolbarHeight = 60; // Approximate toolbar height
      const availableWidth = Math.max(300, rect.width - 20); // Min width with padding
      const availableHeight = Math.max(200, rect.height - toolbarHeight - 20); // Min height with padding

      console.log(`📐 Calculated canvas size: ${availableWidth}x${availableHeight}px`);

      // Update container styling to handle both expansion and contraction
      canvasContainer.value.style.width = `${availableWidth}px`;
      canvasContainer.value.style.height = `${availableHeight}px`;

      // Update stage size
      stage.value.size({
        width: availableWidth,
        height: availableHeight,
      });

      // Ensure we redraw to update visual elements
      if (selectedStorage.value) {
        drawStorage();
      } else {
        stage.value.batchDraw();
      }

      console.log(`✅ Canvas resized to: ${availableWidth}x${availableHeight}px`);
    }, 150); // Slightly longer debounce for stability
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
  background: #ffffff; /* match ListPage white background */
}

/* Sticky headers & toolbar */
.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
}
.global-search {
  padding: 0 1rem 0.5rem 1rem;
}
.panel-title {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
.canvas-toolbar {
  position: sticky;
  top: 0;
  z-index: 15;
}

/* Search input with icon */
.search-input-wrapper {
  position: relative;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #9ca3af;
}
.search-input.has-icon {
  padding-left: 30px;
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  background: #fff;
  font-size: 12px;
  line-height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* List meta and empty states */
.list-meta {
  margin-top: 6px;
  font-size: 0.625rem;
  color: #6b7280;
}
.empty-state {
  padding: 0.75rem;
  margin: 0.5rem 0;
  border: 1px dashed #e5e7eb;
  border-radius: 0.375rem;
  color: #9ca3af;
  text-align: center;
}

/* Subtle hover elevation */
.storage-item:hover,
.boat-item:hover {
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

/* Keep rest of styles */
.main-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 280px 1fr 300px;
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
    min-height: 0; /* critical for nested flex scroll */
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

/* Toggle buttons for Lager/Brygga */
.toggle-group {
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f8fafc;
}
.toggle-btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}
.toggle-btn.active {
  background: #2563eb;
  color: #fff;
}

/* Storage List */
.storage-list,
.boat-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0.5rem;
  /* allow full height inside flex without hard max-height */
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
.storage-floors,
.boat-reg,
.boat-dims,
.boat-status {
  font-size: 0.625rem;
  color: #6b7280;
  margin: 0;
}

.storage-floors {
  color: #2563eb;
  font-weight: 500;
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
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.boat-status-tag {
  font-size: 0.6rem;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-oplacerad {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-placerad {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #93c5fd;
}

.status-reserverad {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.rotation-hint {
  font-size: 0.6rem;
  color: #6b7280;
  font-style: italic;
}

/* Boat Info Tooltip */
.boat-tooltip { position: fixed; z-index: 9999; pointer-events: auto; width: 220px; background: #111827; color: #f9fafb; border-radius: 8px; box-shadow: 0 10px 24px rgba(0,0,0,.35); overflow: hidden; animation: tooltipIn .15s ease-out; font-size: 11px; border: 1px solid rgba(255,255,255,.08); }

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

.tooltip-header {padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.08);}
.tooltip-title {font-size: 12px; font-weight: 600; margin: 0; color: #fff;}
.tooltip-sub {font-size: 10px; opacity: .7; letter-spacing: .2px;}

.tooltip-body {padding: 8px 10px; display: grid; gap: 4px;}
.tooltip-row {display: flex; justify-content: space-between; align-items: center;}
.tooltip-row span:first-child {opacity: .8;}
.badge {padding: 1px 5px; border-radius: 6px; font-weight: 600; font-size: 10px;}
.badge.oplacerad {background: rgba(16,185,129,.15); color: #10b981;}
.badge.placerad {background: rgba(59,130,246,.15); color: #60a5fa;}
.badge.reserverad {background: rgba(156,163,175,.15); color: #d1d5db;}

.tooltip-actions {padding: 8px 10px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 6px;}
.tooltip-btn {flex: 1; padding: 4px 6px; border-radius: 6px; background: #1f2937; color: #e5e7eb; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; font-weight: 600; font-size: 10px;}
.tooltip-btn:hover {background: #374151;}
.tooltip-btn.danger {background: #7f1d1d; border-color: rgba(239,68,68,.5);}
.tooltip-btn.danger:hover {background: #991b1b;}

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

.boat-compatibility {
  font-size: 0.625rem;
  color: #4b5563;
  margin: 0;
  font-weight: 500;
}

.boat-storage-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.map-button {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 500;
  transition: background-color 0.2s;
  min-width: fit-content;
}

.map-button:hover {
  background: #2563eb;
}

/* Compatibility row styles */
.compatibility-row { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; gap: 8px; }
.compatibility-icons { display: flex; gap: 6px; align-items: center; }
.compat-icon { width: 14px; height: 14px; opacity: .35; color: #6b7280; }
.compat-icon.on { opacity: 1; color: #111827; }
.compat-icon.off { opacity: .3; }
.compat-actions { display: flex; gap: 6px; }
.compat-btn { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; color: #374151; font-size: 10px; }
.compat-btn:hover { background: #f9fafb; border-color: #d1d5db; }

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

/* removed old tooltip-actions/action-btn styles */

/* Save Button Styling */
.save-btn {
  background: linear-gradient(to bottom, #10b981, #059669) !important;
  color: white !important;
  border-color: #059669 !important;
  font-weight: 600;
}

.save-btn:hover {
  background: linear-gradient(to bottom, #059669, #047857) !important;
  border-color: #047857 !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
}

.save-status {
  font-size: 0.6875rem;
  color: #059669;
  font-weight: 500;
  background: #d1fae5;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #10b981;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Live Coordinates Display */
.coords-display {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.coord-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  min-width: 60px;
  text-align: center;
}

.coord-boat {
  font-size: 0.75rem;
  font-weight: 700;
  color: #059669;
  background: #d1fae5;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #10b981;
  text-align: center;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Konva Canvas */
.konva-canvas {
  flex: 1;
  background: #ffffff; /* White background like StorageDesigner */
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

/* Floor navigation styling (from StorageDesigner) */
.floor-tabs {
  display: flex;
  gap: 0.25rem;
}

.floor-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.floor-tab:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.floor-tab.active {
  background: #2563eb;
  border-color: #1d4ed8;
  color: white;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}
</style>
