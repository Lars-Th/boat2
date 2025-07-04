<template>
  <div class="advanced-konva-container">
    <!-- Mode Selection -->
    <div class="mode-selector">
      <h2>🎨 Konva Advanced - Båtlager System</h2>
      <div class="mode-tabs">
        <button
          @click="currentMode = 'boat-detail'"
          :class="['mode-tab', { active: currentMode === 'boat-detail' }]"
        >
          🚢 Båtdetalj Editor
        </button>
        <button
          @click="currentMode = 'placement'"
          :class="['mode-tab', { active: currentMode === 'placement' }]"
        >
          🏭 Placering Manager
        </button>
      </div>
    </div>

    <!-- Boat Detail Mode -->
    <div v-if="currentMode === 'boat-detail'" class="mode-content">
      <div class="boat-selector">
        <h3>Välj båt att redigera:</h3>
        <div class="boat-grid">
          <div
            v-for="boat in boats"
            :key="boat.id"
            class="boat-card"
            @click="selectBoatForEditing(boat)"
            :class="{ active: selectedBoatForEditing?.id === boat.id }"
          >
            <div class="boat-name">{{ boat.name }}</div>
            <div class="boat-dims">{{ boat.length }}m × {{ boat.width }}m</div>
            <div class="boat-status">{{ boat.current_status }}</div>
          </div>
        </div>
      </div>

      <div v-if="selectedBoatForEditing" class="boat-detail-section">
        <BoatDetailCanvas :initial-boat-data="selectedBoatForEditing" />
      </div>
    </div>

    <!-- Placement Mode (Original Advanced Canvas) -->
    <div v-if="currentMode === 'placement'" class="mode-content placement-mode">
      <!-- Data Panel -->
      <div class="data-panel">
        <div class="data-section">
          <h3>📊 Data Overview</h3>
          <div class="data-stats">
            <div class="stat-item">
              <span class="stat-label">Båtar:</span>
              <span class="stat-value">{{ statistics.totalBoats }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Placerade:</span>
              <span class="stat-value">{{ statistics.placedBoats }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Oplacerade:</span>
              <span class="stat-value">{{ statistics.unplacedBoats }}</span>
            </div>
            <div class="stat-item" v-if="isLoading">
              <span class="stat-label">Status:</span>
              <span class="stat-value">🔄 Laddar...</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Lager:</span>
              <span class="stat-value">{{ statistics.warehouses }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Bryggor:</span>
              <span class="stat-value">{{ statistics.docks }}</span>
            </div>
          </div>
        </div>

        <div class="data-section">
          <div class="flex justify-between items-center mb-2">
            <h3>🚢 Oplacerade Båtar</h3>
            <button
              @click="loadRealData"
              class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              :disabled="isLoading"
            >
              {{ isLoading ? '🔄' : '↻' }}
            </button>
          </div>
          <div class="boat-list">
            <div
              v-for="boat in unplacedBoats"
              :key="boat.id"
              class="boat-item"
              @click="selectBoat(boat)"
              :class="{ active: selectedBoat?.id === boat.id }"
            >
              <div class="boat-name">{{ boat.name }}</div>
              <div class="boat-dims">{{ boat.length }}m × {{ boat.width }}m</div>
              <div class="boat-status">{{ boat.current_status }}</div>
            </div>
          </div>
        </div>

        <div class="data-section">
          <h3>🏭 Storage Units</h3>
          <div class="storage-list">
            <div
              v-for="unit in testStorageUnits"
              :key="unit.id"
              class="storage-item"
              @click="selectStorageUnit(unit)"
              :class="{ active: selectedStorageUnit?.id === unit.id }"
            >
              <div class="storage-name">{{ unit.name }}</div>
              <div class="storage-type">{{ unit.unit_type }}</div>
              <div class="storage-levels">{{ unit.level_count }} levels</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Canvas Area -->
      <div class="canvas-area">
        <div class="canvas-toolbar">
          <div class="toolbar-group">
            <button @click="showStorageUnits" class="toolbar-button">
              🏭 Show All Storage
            </button>
            <button
              @click="clearStorageSelection"
              class="toolbar-button"
              :disabled="!selectedStorageUnit"
            >
              🔄 Clear Selection
            </button>
            <button @click="showRestrictionZones" class="toolbar-button">
              🚫 Show Restrictions
            </button>
            <button @click="showBoatConstraintAreas" class="toolbar-button">
              🟢 Show Constraints
            </button>
          </div>

          <div class="toolbar-group">
            <button
              @click="createBoatFromSelected"
              class="toolbar-button"
              :disabled="!selectedBoat"
            >
              ➕ Place Selected Boat
            </button>
            <button @click="autoPlaceBoats" class="toolbar-button">
              🎯 Auto Place All
            </button>
            <button @click="clearCanvas" class="toolbar-button">
              🗑️ Clear Canvas
            </button>
          </div>

          <div class="toolbar-group">
            <button @click="zoomOut" class="toolbar-button">-</button>
            <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
            <button @click="zoomIn" class="toolbar-button">+</button>
          </div>
        </div>

        <div ref="canvasContainer" class="konva-canvas" />
      </div>

      <!-- Info Panel -->
      <div class="info-panel">
        <div class="info-section">
          <h3>🎯 Canvas Info</h3>
          <div class="info-item">
            <span>Canvas Size:</span>
            <span>{{ canvasSize.width }}×{{ canvasSize.height }}</span>
          </div>
          <div class="info-item">
            <span>Scale:</span>
            <span>{{ SVG_CONSTANTS.PX_PER_M }}px/m</span>
          </div>
          <div class="info-item">
            <span>Area:</span>
            <span>{{ SVG_CONSTANTS.areaM.w }}×{{ SVG_CONSTANTS.areaM.h }}m</span>
          </div>
        </div>

        <div class="info-section" v-if="selectedBoat">
          <h3>🚢 Selected Boat</h3>
          <div class="info-item">
            <span>Name:</span>
            <span>{{ selectedBoat.name }}</span>
          </div>
          <div class="info-item">
            <span>Length:</span>
            <span>{{ selectedBoat.length }}m</span>
          </div>
          <div class="info-item">
            <span>Width:</span>
            <span>{{ selectedBoat.width }}m</span>
          </div>
          <div class="info-item">
            <span>Safety Margin:</span>
            <span>{{ selectedBoat.safety_margin }}m</span>
          </div>
          <div class="info-item">
            <span>Status:</span>
            <span>{{ selectedBoat.current_status }}</span>
          </div>
        </div>

        <div class="info-section" v-if="selectedStorageUnit">
          <h3>🏭 Selected Storage</h3>
          <div class="info-item">
            <span>Name:</span>
            <span>{{ selectedStorageUnit.name }}</span>
          </div>
          <div class="info-item">
            <span>Type:</span>
            <span>{{ selectedStorageUnit.unit_type }}</span>
          </div>
          <div class="info-item">
            <span>Levels:</span>
            <span>{{ selectedStorageUnit.level_count }}</span>
          </div>
          <div class="info-item">
            <span>Connected:</span>
            <span>{{ selectedStorageUnit.is_connected_to_land ? 'Yes' : 'No' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import Konva from 'konva';
import {
  SVG_CONSTANTS,
  calculateBoatScaling,
  calculateMarginScaling,
  applyBoatStyle,
  createDragBoundFunc
} from '@/services/konva/boat-svg.service';
import {
  createStorageUnitGroup,
  createTestWarehouse,
  createTestDock,
  parseGeoJSON
} from '@/services/konva/storage-geojson.service';
import { dataLoader } from '@/services/konva/data-loader.service';
import type {
  BoatData,
  StorageUnit,
  KonvaLayers,
  WarehouseLevelData,
  RestrictionZone
} from '@/types/konva';

// Reactive state
const canvasContainer = ref<HTMLDivElement>();
const isLoading = ref(false);
const selectedBoat = ref<BoatData | null>(null);
const selectedStorageUnit = ref<StorageUnit | null>(null);
const zoomLevel = ref(1);

// GEMENSAM LAGER-KONFIGURATION - används för ALLT!
const STORAGE_CONFIGS = [
  { name: 'Indoor Warehouse A', x: 50, y: 50, width: 40, height: 25, type: 'warehouse' },
  { name: 'Outdoor Storage B', x: 120, y: 50, width: 35, height: 20, type: 'warehouse' },
  { name: 'Marina Dock C', x: 180, y: 50, width: 60, height: 2, type: 'dock' },
  { name: 'Covered Storage D', x: 50, y: 100, width: 30, height: 15, type: 'warehouse' },
  { name: 'L-Shaped Marina E', x: 100, y: 100, width: 45, height: 3, type: 'dock' },
  { name: 'Large Warehouse F', x: 170, y: 100, width: 50, height: 35, type: 'warehouse' }
] as const;

// Data from real JSON files
const boats = ref<BoatData[]>([]);
const storageUnits = ref<StorageUnit[]>([]);
const warehouseLevels = ref<WarehouseLevelData[]>([]);
const restrictionZones = ref<RestrictionZone[]>([]);

// Test storage units for demo
const testStorageUnits = ref<StorageUnit[]>([
  { id: 101, name: 'Indoor Warehouse A', unit_type: 'warehouse', level_count: 1, is_connected_to_land: true, shape_geometry: '{}', connected_unit_id: null, latitude: 0, longitude: 0 },
  { id: 102, name: 'Outdoor Storage B', unit_type: 'warehouse', level_count: 1, is_connected_to_land: true, shape_geometry: '{}', connected_unit_id: null, latitude: 0, longitude: 0 },
  { id: 103, name: 'Marina Dock C', unit_type: 'dock', level_count: 1, is_connected_to_land: true, shape_geometry: '{}', connected_unit_id: null, latitude: 0, longitude: 0 },
  { id: 104, name: 'Covered Storage D', unit_type: 'warehouse', level_count: 2, is_connected_to_land: true, shape_geometry: '{}', connected_unit_id: null, latitude: 0, longitude: 0 },
  { id: 105, name: 'L-Shaped Marina E', unit_type: 'dock', level_count: 1, is_connected_to_land: true, shape_geometry: '{}', connected_unit_id: null, latitude: 0, longitude: 0 },
  { id: 106, name: 'Large Warehouse F', unit_type: 'warehouse', level_count: 3, is_connected_to_land: true, shape_geometry: '{}', connected_unit_id: null, latitude: 0, longitude: 0 }
]);

// Konva references
let stage: Konva.Stage | null = null;
let layers: KonvaLayers | null = null;
let activeBoats = new Map<number, any>();

// Computed properties
const statistics = computed(() => ({
  totalBoats: boats.value.length,
  placedBoats: boats.value.filter(b => b.current_placement_id !== null).length,
  unplacedBoats: boats.value.filter(b => b.current_placement_id === null).length,
  warehouses: testStorageUnits.value.filter(u => u.unit_type === 'warehouse').length,
  docks: testStorageUnits.value.filter(u => u.unit_type === 'dock').length
}));
const unplacedBoats = computed(() => {
  const filtered = boats.value.filter(b => b.current_placement_id === null);
  console.log('🔍 Filtering boats:', {
    total: boats.value.length,
    unplaced: filtered.length,
    unplacedNames: filtered.map(b => `${b.name} (${b.current_status})`)
  });
  return filtered;
});
const canvasSize = computed(() => ({
  width: SVG_CONSTANTS.areaM.w * SVG_CONSTANTS.PX_PER_M,
  height: SVG_CONSTANTS.areaM.h * SVG_CONSTANTS.PX_PER_M
}));

onMounted(() => {
  initializeCanvas();
  loadRealData();

  // Watch for changes in boats.json automatically
  watch(() => unplacedBoats.value.length, () => {
    console.log('🔄 Unplaced boats changed:', unplacedBoats.value.length);
  });
});

onUnmounted(() => {
  if (stage) {
    stage.destroy();
  }
});

function initializeCanvas() {
  if (!canvasContainer.value) return;

  stage = new Konva.Stage({
    container: canvasContainer.value,
    width: canvasSize.value.width,
    height: canvasSize.value.height
  });

  layers = {
    background: new Konva.Layer(),
    storage: new Konva.Layer(),
    boats: new Konva.Layer(),
    ui: new Konva.Layer()
  };

  stage.add(layers.background);
  stage.add(layers.storage);
  stage.add(layers.boats);
  stage.add(layers.ui);

  drawBackground();
  setupZoom();
}

function drawBackground() {
  if (!layers) return;

  // Clean cream background - no grid pattern
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: canvasSize.value.width,
    height: canvasSize.value.height,
    fill: '#FFFBE8', // Cream color as requested
    listening: false
  });
  layers.background.add(background);

  layers.background.batchDraw();
}

function setupZoom() {
  if (!stage) return;

  // Setup zoom with mouse wheel
  stage.on('wheel', (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const oldScale = stage!.scaleX();
    const pointer = stage!.getPointerPosition();

    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage!.x()) / oldScale,
      y: (pointer.y - stage!.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    stage!.scale({ x: newScale, y: newScale });
    zoomLevel.value = newScale;

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage!.position(newPos);
    stage!.batchDraw();
  });

  // Setup pan with mouse drag
  let isPanning = false;
  let lastPointerPosition = { x: 0, y: 0 };

  stage.on('mousedown', (e) => {
    // Only pan if no boats are being dragged and clicking on empty space
    if (e.target === stage) {
      isPanning = true;
      lastPointerPosition = stage!.getPointerPosition() || { x: 0, y: 0 };
      stage!.container().style.cursor = 'grabbing';
    }
  });

  stage.on('mousemove', (e) => {
    if (!isPanning) return;

    const pointer = stage!.getPointerPosition();
    if (!pointer) return;

    const dx = pointer.x - lastPointerPosition.x;
    const dy = pointer.y - lastPointerPosition.y;

    const newPos = {
      x: stage!.x() + dx,
      y: stage!.y() + dy
    };

    stage!.position(newPos);
    stage!.batchDraw();

    lastPointerPosition = pointer;
  });

  stage.on('mouseup', () => {
    isPanning = false;
    stage!.container().style.cursor = 'default';
  });

  stage.on('mouseleave', () => {
    isPanning = false;
    stage!.container().style.cursor = 'default';
  });
}

function loadRealData() {
  isLoading.value = true;

  try {
    // Force refresh data from files
    dataLoader.refreshData();

    boats.value = dataLoader.getBoats();
    storageUnits.value = dataLoader.getStorageUnits();
    warehouseLevels.value = dataLoader.getWarehouseLevels();
    restrictionZones.value = dataLoader.getRestrictionZones();

    console.log('✅ Real data loaded (refreshed):', {
      boats: boats.value.length,
      storageUnits: storageUnits.value.length,
      warehouseLevels: warehouseLevels.value.length,
      restrictionZones: restrictionZones.value.length
    });

    // Show detailed boat info
    console.log('📊 Boats loaded:', boats.value.map(b => ({
      id: b.id,
      name: b.name,
      status: b.current_status,
      placement: b.current_placement_id
    })));

  } catch (error) {
    console.error('❌ Error loading real data:', error);
  } finally {
    isLoading.value = false;
  }
}

function showStorageUnits() {
  if (!layers) return;

  // Clear existing storage units
  layers.storage.destroyChildren();

  console.log('📊 Rendering all storage units overview');

  STORAGE_CONFIGS.forEach((config, index) => {
    let group;

    if (config.type === 'dock') {
      // Create dock shape (different from warehouse)
      group = createTestDock(
        config.x * SVG_CONSTANTS.PX_PER_M,
        config.y * SVG_CONSTANTS.PX_PER_M,
        config.width,
        config.height,
        config.name
      );
    } else {
      // Create warehouse shape
      group = createTestWarehouse(
        config.x * SVG_CONSTANTS.PX_PER_M,
        config.y * SVG_CONSTANTS.PX_PER_M,
        config.width,
        config.height,
        config.name
      );
    }

    layers!.storage.add(group);
    console.log(`✅ Added ${config.type}: ${config.name} (${config.width}×${config.height}m) at (${config.x}, ${config.y})`);
  });

  layers.storage.batchDraw();

  // Reset zoom to see all units
  resetZoom();
}

function showSelectedStorageUnit() {
  if (!layers || !selectedStorageUnit.value) return;

  // Clear existing storage units
  layers.storage.destroyChildren();

  console.log('🎯 Rendering selected storage unit:', selectedStorageUnit.value.name);

  // Create the selected storage unit centered
  const centerX = canvasSize.value.width / 2;
  const centerY = canvasSize.value.height / 2;

  // Find matching config or use first one as fallback
  const selectedConfig = STORAGE_CONFIGS.find(c => c.name === selectedStorageUnit.value!.name) || STORAGE_CONFIGS[0];

  if (!selectedConfig) {
    console.error('❌ No storage config found');
    return;
  }

  let group;

  if (selectedConfig.type === 'dock') {
    group = createTestDock(
      centerX - (selectedConfig.width * SVG_CONSTANTS.PX_PER_M) / 2,
      centerY - (selectedConfig.height * SVG_CONSTANTS.PX_PER_M) / 2,
      selectedConfig.width,
      selectedConfig.height,
      selectedConfig.name
    );
  } else {
    group = createTestWarehouse(
      centerX - (selectedConfig.width * SVG_CONSTANTS.PX_PER_M) / 2,
      centerY - (selectedConfig.height * SVG_CONSTANTS.PX_PER_M) / 2,
      selectedConfig.width,
      selectedConfig.height,
      selectedConfig.name
    );
  }

  layers!.storage.add(group);
  layers.storage.batchDraw();

  // Auto-zoom to fit the selected storage unit with padding
  autoZoomToStorage(selectedConfig);

  console.log(`✅ Showing only: ${selectedConfig.name} (${selectedConfig.width}×${selectedConfig.height}m)`);
}

function showRestrictionZones() {
  if (!layers) return;

  console.log('🚫 Showing restriction zones:', restrictionZones.value.length);

  // Check if restriction zones are already visible
  const existingZones = layers.storage.find('.restriction-zone');
  if (existingZones.length > 0) {
    console.log('⚠️ Restriction zones already visible, removing first');
    existingZones.forEach(zone => zone.destroy());
  }

  restrictionZones.value.forEach((zone, index) => {
    // Create unique position for each zone based on its warehouse
    const baseX = zone.x_coordinate * SVG_CONSTANTS.PX_PER_M;
    const baseY = zone.y_coordinate * SVG_CONSTANTS.PX_PER_M;

    const rect = new Konva.Rect({
      x: baseX,
      y: baseY,
      width: zone.width * SVG_CONSTANTS.PX_PER_M,
      height: zone.height * SVG_CONSTANTS.PX_PER_M,
      fill: 'rgba(255, 0, 0, 0.2)',
      stroke: '#ff0000',
      strokeWidth: 2,
      dash: [5, 5],
      listening: false,
      name: 'restriction-zone'
    });

    const label = new Konva.Text({
      x: baseX + 5,
      y: baseY + 5,
      text: `${zone.name} (${zone.type})`,
      fontSize: 10,
      fill: '#ff0000',
      listening: false,
      name: 'restriction-zone'
    });

    layers!.storage.add(rect);
    layers!.storage.add(label);

    console.log(`✅ Added restriction zone: ${zone.name} at (${baseX}, ${baseY})`);
  });

  layers.storage.batchDraw();
}

function selectBoat(boat: BoatData) {
  selectedBoat.value = boat;
  selectedStorageUnit.value = null;
}

function selectStorageUnit(unit: StorageUnit) {
  selectedStorageUnit.value = unit;
  selectedBoat.value = null;

  console.log('🏭 Selected storage unit:', unit.name);

  // Automatically show only the selected storage unit
  showSelectedStorageUnit();
}

function clearStorageSelection() {
  selectedStorageUnit.value = null;
  console.log('🔄 Cleared storage selection');

  // Show all storage units again
  showStorageUnits();
}

function createBoatFromSelected() {
  if (!selectedBoat.value || !stage || !layers) return;

  const boat = selectedBoat.value;

  // Check if boat is already on canvas
  if (activeBoats.has(boat.id)) {
    console.log('⚠️ Boat already on canvas:', boat.name);
    return;
  }

  console.log('🚢 Creating boat:', boat.name, `${boat.length}m × ${boat.width}m`);

  // Find a free position to avoid overlap
  const position = findFreePosition(boat);

  // Create boat group with storage-aware drag constraints
  const group = new Konva.Group({
    x: position.x,
    y: position.y,
    draggable: true,
    dragBoundFunc: createStorageAwareDragBoundFunc(boat)
  });

  // Create paths
  const marginPath = new Konva.Path({
    data: SVG_CONSTANTS.MARGIN_PATH,
    strokeScaleEnabled: false
  });

  const hullPath = new Konva.Path({
    data: SVG_CONSTANTS.HULL_PATH,
    strokeScaleEnabled: false
  });

  // Scale paths
  const hullScale = calculateBoatScaling(boat);
  const marginScale = calculateMarginScaling(boat);

  hullPath.scale({ x: hullScale.scaleX, y: hullScale.scaleY });
  hullPath.offset({
    x: SVG_CONSTANTS.HULL_VB.w / 2,
    y: SVG_CONSTANTS.HULL_VB.h / 2
  });

  marginPath.scale({ x: marginScale.scaleX, y: marginScale.scaleY });
  marginPath.offset({
    x: SVG_CONSTANTS.MARGIN_VB.w / 2,
    y: SVG_CONSTANTS.MARGIN_VB.h / 2
  });

  // Apply styling
  applyBoatStyle(hullPath, marginPath, 'new');

  // Add boat name label - CENTERED inside boat
  const nameLabel = new Konva.Text({
    x: 0,
    y: 0,
    text: boat.name,
    fontSize: 10,
    fill: '#333',
    listening: false,
    align: 'center',
    verticalAlign: 'middle'
  });

  // Center the text
  nameLabel.offset({
    x: nameLabel.width() / 2,
    y: nameLabel.height() / 2
  });

  group.add(marginPath);
  group.add(hullPath);
  group.add(nameLabel);

  // Create rotation handle (small circle)
  const rotationHandle = new Konva.Circle({
    x: 0,
    y: -30,
    radius: 6,
    fill: '#4A90E2',
    stroke: '#fff',
    strokeWidth: 2,
    draggable: true,
    visible: false
  });

  // Create edit button (small square)
  const editButton = new Konva.Rect({
    x: 25,
    y: -8,
    width: 16,
    height: 16,
    fill: '#28a745',
    stroke: '#fff',
    strokeWidth: 1,
    cornerRadius: 2,
    visible: false
  });

  const editIcon = new Konva.Text({
    x: 30,
    y: -5,
    text: '✎',
    fontSize: 10,
    fill: '#fff',
    listening: false,
    visible: false
  });

  group.add(rotationHandle);
  group.add(editButton);
  group.add(editIcon);

  layers.boats.add(group);

  // Store reference
  activeBoats.set(boat.id, {
    group,
    hullPath,
    marginPath,
    nameLabel,
    rotationHandle,
    editButton,
    editIcon,
    data: boat,
    isPlaced: false
  });

  // Setup interactions
  setupBoatInteractions(boat.id);

  layers.boats.batchDraw();
}

// Setup boat interactions - hover, double-click, rotation, edit
function setupBoatInteractions(boatId: number) {
  const boatRef = activeBoats.get(boatId);
  if (!boatRef) return;

  const { group, hullPath, marginPath, nameLabel, rotationHandle, editButton, editIcon, data, isPlaced } = boatRef;

  // HOVER: Show controls and tooltip
  group.on('mouseenter', () => {
    document.body.style.cursor = 'pointer';

    // Show controls if not placed
    if (!boatRef.isPlaced) {
      rotationHandle.visible(true);
      editButton.visible(true);
      editIcon.visible(true);
      layers!.boats.batchDraw();
    }

    // Show tooltip
    showBoatTooltip(data, group.x(), group.y());
  });

  group.on('mouseleave', () => {
    document.body.style.cursor = 'default';

    // Hide controls
    rotationHandle.visible(false);
    editButton.visible(false);
    editIcon.visible(false);
    layers!.boats.batchDraw();

    // Hide tooltip
    hideBoatTooltip();
  });

  // DOUBLE-CLICK: Place boat (make it grå) or activate placed boat
  group.on('dblclick', () => {
    if (boatRef.isPlaced) {
      // Activate placed boat
      applyBoatStyle(hullPath, marginPath, 'new');
      group.draggable(true);
      boatRef.isPlaced = false;
      console.log(`🔓 Activated ${data.name} for editing`);
    } else {
      // Place boat (make it grå)
      applyBoatStyle(hullPath, marginPath, 'placed');
      group.draggable(false);
      boatRef.isPlaced = true;
      rotationHandle.visible(false);
      editButton.visible(false);
      editIcon.visible(false);
      console.log(`✅ Placed ${data.name} - now grå and fixed`);
    }
    layers!.boats.batchDraw();
  });

  // ROTATION HANDLE: Rotate boat
  rotationHandle.on('dragmove', () => {
    const angle = Math.atan2(
      rotationHandle.y(),
      rotationHandle.x()
    );
    group.rotation(angle * 180 / Math.PI + 90);

    // Update rotation handle position
    const distance = 30;
    rotationHandle.x(Math.cos(angle) * distance);
    rotationHandle.y(Math.sin(angle) * distance);

    layers!.boats.batchDraw();
  });

  // EDIT BUTTON: Open boat details
  editButton.on('click', () => {
    openBoatDetails(data);
  });

  editIcon.on('click', () => {
    openBoatDetails(data);
  });
}

// Show boat tooltip
function showBoatTooltip(boat: BoatData, x: number, y: number) {
  // Remove existing tooltip
  const existingTooltip = layers!.ui.findOne('.boat-tooltip');
  if (existingTooltip) existingTooltip.destroy();

  // Create tooltip background
  const tooltipBg = new Konva.Rect({
    x: x + 20,
    y: y - 40,
    width: 160,
    height: 80,
    fill: '#fff',
    stroke: '#ccc',
    strokeWidth: 1,
    cornerRadius: 4,
    shadowColor: '#000',
    shadowBlur: 10,
    shadowOpacity: 0.2,
    shadowOffset: { x: 2, y: 2 },
    name: 'boat-tooltip'
  });

  // Create tooltip text
  const tooltipText = new Konva.Text({
    x: x + 30,
    y: y - 30,
    text: `${boat.name}\n${boat.length}m × ${boat.width}m\nStatus: ${boat.current_status}\nLocation: ${boat.location_status}`,
    fontSize: 10,
    fill: '#333',
    lineHeight: 1.2,
    name: 'boat-tooltip'
  });

  layers!.ui.add(tooltipBg);
  layers!.ui.add(tooltipText);
  layers!.ui.batchDraw();
}

// Hide boat tooltip
function hideBoatTooltip() {
  const tooltips = layers!.ui.find('.boat-tooltip');
  tooltips.forEach(tooltip => tooltip.destroy());
  layers!.ui.batchDraw();
}

// Open boat details (placeholder for now)
function openBoatDetails(boat: BoatData) {
  console.log(`🔧 Opening details for ${boat.name}`);
  // TODO: Implement boat details dialog/modal
  alert(`Boat Details:\n\nName: ${boat.name}\nLength: ${boat.length}m\nWidth: ${boat.width}m\nWeight: ${boat.weight}kg\nStatus: ${boat.current_status}\nLocation: ${boat.location_status}`);
}

// Create drag bound function - båtar måste hålla sig inuti lager
function createStorageAwareDragBoundFunc(boat: BoatData): (pos: Konva.Vector2d) => Konva.Vector2d {
  const boatPixelLength = boat.length * SVG_CONSTANTS.PX_PER_M;
  const boatPixelWidth = boat.width * SVG_CONSTANTS.PX_PER_M;
  const halfLength = boatPixelLength / 2;
  const halfWidth = boatPixelWidth / 2;

  // Endast warehouse-lager för båt-lagring (filtrerat från gemensam konfiguration)
  let warehouseConfigs = STORAGE_CONFIGS
    .filter(config => config.type === 'warehouse')
    .map(storage => ({
      ...storage,
      x: storage.x * SVG_CONSTANTS.PX_PER_M,
      y: storage.y * SVG_CONSTANTS.PX_PER_M,
      width: storage.width * SVG_CONSTANTS.PX_PER_M,
      height: storage.height * SVG_CONSTANTS.PX_PER_M
    }));

  // If a specific storage unit is selected, use its centered position
  if (selectedStorageUnit.value) {
    const selectedConfig = STORAGE_CONFIGS.find(c => c.name === selectedStorageUnit.value!.name);
    if (selectedConfig && selectedConfig.type === 'warehouse') {
      const centerX = canvasSize.value.width / 2;
      const centerY = canvasSize.value.height / 2;
      const storagePixelWidth = selectedConfig.width * SVG_CONSTANTS.PX_PER_M;
      const storagePixelHeight = selectedConfig.height * SVG_CONSTANTS.PX_PER_M;

      warehouseConfigs = [{
        ...selectedConfig,
        x: centerX - storagePixelWidth / 2,
        y: centerY - storagePixelHeight / 2,
        width: storagePixelWidth,
        height: storagePixelHeight
      }];
    }
  }

  return (pos: Konva.Vector2d): Konva.Vector2d => {
    // Hitta vilket lager båten tillhör
    let targetWarehouse = null;
    const detectionMargin = 20; // 2m margin för detektering

    // Försök hitta lager som innehåller båten
    for (const warehouse of warehouseConfigs) {
      const expandedLeft = warehouse.x - detectionMargin;
      const expandedRight = warehouse.x + warehouse.width + detectionMargin;
      const expandedTop = warehouse.y - detectionMargin;
      const expandedBottom = warehouse.y + warehouse.height + detectionMargin;

      if (pos.x >= expandedLeft && pos.x <= expandedRight &&
          pos.y >= expandedTop && pos.y <= expandedBottom) {
        targetWarehouse = warehouse;
        break;
      }
    }

    // Om inget lager hittas, hitta närmaste lager
    if (!targetWarehouse) {
      let closestDistance = Infinity;
      for (const warehouse of warehouseConfigs) {
        const centerX = warehouse.x + warehouse.width / 2;
        const centerY = warehouse.y + warehouse.height / 2;
        const distance = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));

        if (distance < closestDistance) {
          closestDistance = distance;
          targetWarehouse = warehouse;
        }
      }
    }

    // Begränsa båten till att stanna INUTI målagret
    if (targetWarehouse) {
      const wallMargin = 15; // 1.5m margin från lager-väggarna
      const constrainedX = Math.max(
        targetWarehouse.x + wallMargin + halfLength,
        Math.min(targetWarehouse.x + targetWarehouse.width - wallMargin - halfLength, pos.x)
      );
      const constrainedY = Math.max(
        targetWarehouse.y + wallMargin + halfWidth,
        Math.min(targetWarehouse.y + targetWarehouse.height - wallMargin - halfWidth, pos.y)
      );

      console.log(`🔒 Constraining ${boat.name} to stay inside warehouse at (${Math.round(constrainedX)}, ${Math.round(constrainedY)})`);
      return { x: constrainedX, y: constrainedY };
    }

    // Fallback: canvas bounds
    const bounds = {
      minX: halfLength,
      minY: halfWidth,
      maxX: canvasSize.value.width - halfLength,
      maxY: canvasSize.value.height - halfWidth
    };

    return {
      x: Math.min(Math.max(pos.x, bounds.minX), bounds.maxX),
      y: Math.min(Math.max(pos.y, bounds.minY), bounds.maxY)
    };
  };
}

// Find free position for boat placement - prioritize storage centers
function findFreePosition(boat: BoatData): { x: number; y: number } {
  const boatPixelLength = boat.length * SVG_CONSTANTS.PX_PER_M;
  const boatPixelWidth = boat.width * SVG_CONSTANTS.PX_PER_M;

  // Define available storage areas (warehouses only - boats go inside)
  let storageConfigs = STORAGE_CONFIGS.filter(s => s.type === 'warehouse'); // Only warehouses for boat storage

    // If a specific storage unit is selected, use its centered position
  if (selectedStorageUnit.value) {
    const selectedConfig = STORAGE_CONFIGS.find(c => c.name === selectedStorageUnit.value!.name);
    if (selectedConfig && selectedConfig.type === 'warehouse') {
      const centerX = canvasSize.value.width / 2;
      const centerY = canvasSize.value.height / 2;
      const storagePixelWidth = selectedConfig.width * SVG_CONSTANTS.PX_PER_M;
      const storagePixelHeight = selectedConfig.height * SVG_CONSTANTS.PX_PER_M;

      storageConfigs = [{
        name: selectedConfig.name,
        x: (centerX - storagePixelWidth / 2) / SVG_CONSTANTS.PX_PER_M as any,
        y: (centerY - storagePixelHeight / 2) / SVG_CONSTANTS.PX_PER_M as any,
        width: selectedConfig.width,
        height: selectedConfig.height,
        type: selectedConfig.type
      }] as any;
    }
  }

  // Try to place boat in center of available warehouses
  for (const storage of storageConfigs) {
    const storagePixelX = storage.x * SVG_CONSTANTS.PX_PER_M;
    const storagePixelY = storage.y * SVG_CONSTANTS.PX_PER_M;
    const storagePixelWidth = storage.width * SVG_CONSTANTS.PX_PER_M;
    const storagePixelHeight = storage.height * SVG_CONSTANTS.PX_PER_M;

    // Check if boat fits in this storage
    if (boatPixelLength < storagePixelWidth - 20 && boatPixelWidth < storagePixelHeight - 20) {
      // Try center position first
      const centerX = storagePixelX + storagePixelWidth / 2;
      const centerY = storagePixelY + storagePixelHeight / 2;

      // Check if center position is free
      let positionFree = true;
      for (const [_, existingBoat] of activeBoats) {
        const distance = Math.sqrt(
          Math.pow(centerX - existingBoat.group.x(), 2) +
          Math.pow(centerY - existingBoat.group.y(), 2)
        );
        const minDistance = (boat.length + existingBoat.data.length) * SVG_CONSTANTS.PX_PER_M / 2 + 30;

        if (distance < minDistance) {
          positionFree = false;
          break;
        }
      }

      if (positionFree) {
        console.log(`✅ Placed ${boat.name} in center of ${storage.name} at (${Math.round(centerX)}, ${Math.round(centerY)})`);
        return { x: centerX, y: centerY };
      }

      // If center is occupied, try other positions within this storage
      for (let attempts = 0; attempts < 10; attempts++) {
        const margin = 40; // 4m margin from storage walls
        const randomX = storagePixelX + margin + Math.random() * (storagePixelWidth - 2 * margin);
        const randomY = storagePixelY + margin + Math.random() * (storagePixelHeight - 2 * margin);

        let tooClose = false;
        for (const [_, existingBoat] of activeBoats) {
          const distance = Math.sqrt(
            Math.pow(randomX - existingBoat.group.x(), 2) +
            Math.pow(randomY - existingBoat.group.y(), 2)
          );
          const minDistance = (boat.length + existingBoat.data.length) * SVG_CONSTANTS.PX_PER_M / 2 + 30;

          if (distance < minDistance) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          console.log(`✅ Placed ${boat.name} in ${storage.name} at (${Math.round(randomX)}, ${Math.round(randomY)})`);
          return { x: randomX, y: randomY };
        }
      }
    }
  }

    // Fallback: place in first available warehouse center
  if (storageConfigs.length > 0) {
    const firstStorage = storageConfigs[0]!;
    const centerX = firstStorage.x * SVG_CONSTANTS.PX_PER_M + (firstStorage.width * SVG_CONSTANTS.PX_PER_M) / 2;
    const centerY = firstStorage.y * SVG_CONSTANTS.PX_PER_M + (firstStorage.height * SVG_CONSTANTS.PX_PER_M) / 2;

    console.log(`⚠️ Fallback: placing ${boat.name} in ${firstStorage.name} center`);
    return { x: centerX, y: centerY };
  }

  // Last resort: canvas center
  console.log(`⚠️ Last resort: placing ${boat.name} in canvas center`);
  return {
    x: canvasSize.value.width / 2,
    y: canvasSize.value.height / 2
  };
}

function autoPlaceBoats() {
  const boatsToPlace = unplacedBoats.value.slice(0, 5);
  console.log('🎯 Auto placing boats:', boatsToPlace.map(b => b.name));

  boatsToPlace.forEach((boat, index) => {
    setTimeout(() => {
      selectedBoat.value = boat;
      createBoatFromSelected();
    }, index * 300);
  });
}

// Visa båt-begränsningsområden för debugging
function showBoatConstraintAreas() {
  if (!layers) return;

  // Ta bort befintliga constraint-områden
  const existingConstraints = layers.ui.find('.constraint-area');
  existingConstraints.forEach(area => area.destroy());

  // Visa warehouse-områden för båt-begränsning
  let warehouseConfigs = STORAGE_CONFIGS.filter(config => config.type === 'warehouse');

  // If a specific storage unit is selected, use its centered position
  if (selectedStorageUnit.value) {
    const selectedConfig = STORAGE_CONFIGS.find(c => c.name === selectedStorageUnit.value!.name);
    if (selectedConfig && selectedConfig.type === 'warehouse') {
      const centerX = canvasSize.value.width / 2;
      const centerY = canvasSize.value.height / 2;
      const storagePixelWidth = selectedConfig.width * SVG_CONSTANTS.PX_PER_M;
      const storagePixelHeight = selectedConfig.height * SVG_CONSTANTS.PX_PER_M;

      warehouseConfigs = [{
        name: selectedConfig.name,
        x: (centerX - storagePixelWidth / 2) / SVG_CONSTANTS.PX_PER_M as any,
        y: (centerY - storagePixelHeight / 2) / SVG_CONSTANTS.PX_PER_M as any,
        width: selectedConfig.width,
        height: selectedConfig.height,
        type: selectedConfig.type
      }] as any;
    }
  }

  warehouseConfigs.forEach(warehouse => {
    const x = warehouse.x * SVG_CONSTANTS.PX_PER_M;
    const y = warehouse.y * SVG_CONSTANTS.PX_PER_M;
    const width = warehouse.width * SVG_CONSTANTS.PX_PER_M;
    const height = warehouse.height * SVG_CONSTANTS.PX_PER_M;

    // Visa det faktiska området där båtar kan placeras
    const constraintRect = new Konva.Rect({
      x: x,
      y: y,
      width: width,
      height: height,
      fill: 'rgba(0, 255, 0, 0.1)', // Ljusgrön genomskinlig
      stroke: '#00ff00',
      strokeWidth: 2,
      dash: [10, 5],
      listening: false,
      name: 'constraint-area'
    });

    const label = new Konva.Text({
      x: x + 5,
      y: y + 5,
      text: `${warehouse.name}\nConstraint Area`,
      fontSize: 8,
      fill: '#00aa00',
      listening: false,
      name: 'constraint-area'
    });

    layers!.ui.add(constraintRect);
    layers!.ui.add(label);
  });

  layers.ui.batchDraw();
  console.log('🟢 Showing boat constraint areas for debugging');
}

function clearCanvas() {
  if (!layers) return;

  layers.boats.destroyChildren();
  layers.ui.destroyChildren();
  layers.storage.destroyChildren();

  activeBoats.clear();

  if (stage) {
    stage.batchDraw();
  }
}

function zoomIn() {
  if (!stage) return;
  const newScale = stage.scaleX() * 1.2;
  stage.scale({ x: newScale, y: newScale });
  zoomLevel.value = newScale;
  stage.batchDraw();
}

function zoomOut() {
  if (!stage) return;
  const newScale = stage.scaleX() / 1.2;
  stage.scale({ x: newScale, y: newScale });
  zoomLevel.value = newScale;
  stage.batchDraw();
}

function resetZoom() {
  if (!stage) return;
  stage.scale({ x: 1, y: 1 });
  stage.position({ x: 0, y: 0 });
  zoomLevel.value = 1;
  stage.batchDraw();
}

function autoZoomToStorage(config: { width: number; height: number; name: string }) {
  if (!stage) return;

  const padding = 50; // 50px padding around the storage
  const storagePixelWidth = config.width * SVG_CONSTANTS.PX_PER_M;
  const storagePixelHeight = config.height * SVG_CONSTANTS.PX_PER_M;

  // Calculate scale to fit storage with padding
  const scaleX = (stage.width() - padding * 2) / storagePixelWidth;
  const scaleY = (stage.height() - padding * 2) / storagePixelHeight;
  const scale = Math.min(scaleX, scaleY, 3); // Max 3x zoom

  // Center the view on the storage
  const centerX = stage.width() / 2;
  const centerY = stage.height() / 2;

  stage.scale({ x: scale, y: scale });
  stage.position({
    x: centerX - (canvasSize.value.width / 2) * scale,
    y: centerY - (canvasSize.value.height / 2) * scale
  });

  zoomLevel.value = scale;
  stage.batchDraw();

  console.log(`🔍 Auto-zoomed to ${config.name} at ${Math.round(scale * 100)}%`);
}
</script>

<style scoped>
.advanced-konva-container {
  display: flex;
  height: 100vh;
  background: #f8f9fa;
}

.data-panel {
  width: 300px;
  background: white;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}

.canvas-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-panel {
  width: 250px;
  background: white;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
}

.data-section, .info-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.data-section h3, .info-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.data-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.boat-list, .storage-list {
  max-height: 300px;
  overflow-y: auto;
}

.boat-item, .storage-item {
  padding: 8px;
  margin: 4px 0;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.boat-item:hover, .storage-item:hover {
  background: #f0f0f0;
}

.boat-item.active, .storage-item.active {
  background: #e3f2fd;
  border-color: #2196f3;
}

.boat-name, .storage-name {
  font-weight: 600;
  font-size: 12px;
  color: #333;
}

.boat-dims, .boat-status, .storage-type, .storage-levels {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-button {
  padding: 6px 12px;
  font-size: 12px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-button:hover:not(:disabled) {
  background: #f0f0f0;
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-level {
  font-size: 12px;
  color: #666;
  min-width: 40px;
  text-align: center;
}

.konva-canvas {
  flex: 1;
  background: #FFFBE8; /* Cream background */
  overflow: hidden;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.info-item span:first-child {
  color: #666;
}

.info-item span:last-child {
  font-weight: 600;
  color: #333;
}
</style>
