<template>
  <div class="boat-placement-canvas-container">
    <!-- Advanced Toolbar with Statistics -->
    <div class="placement-toolbar">
      <!-- Storage Info -->
      <div class="toolbar-group">
        <h3 class="storage-title">{{ storage.name }}</h3>
        <span class="storage-type">{{ storage.type_display }}</span>
        <span class="storage-dimensions">{{ storage.width }}m × {{ storage.height }}m</span>
      </div>

      <!-- Floor Navigation (for warehouses) -->
      <div v-if="storage.type === 'warehouse' && (storage.level_count ?? 1) > 1" class="toolbar-group">
        <span class="toolbar-label">Våning:</span>
        <div class="floor-tabs">
          <button
            v-for="floor in availableFloors"
            :key="floor"
            @click="setActiveFloor(floor)"
            class="floor-tab"
            :class="{ active: activeFloor === floor }"
          >
            {{ floor }}
          </button>
        </div>
      </div>

      <!-- View Controls -->
      <div class="toolbar-group">
        <button @click="centerView" class="toolbar-button" title="Centrera vy">
          <Navigation2 class="button-icon" />
        </button>
        <button @click="togglePanMode" class="toolbar-button" :class="{ active: isPanMode }" title="Panorering">
          <Move class="button-icon" />
        </button>
        <button @click="resetCanvasPosition" class="toolbar-button reset-button" title="Återställ canvas position">
          <RefreshCw class="button-icon" />
        </button>
      </div>

      <!-- Zoom Controls -->
      <div class="toolbar-group">
        <button @click="zoomOut" class="icon-button" title="Zooma ut">
          <ZoomOut class="button-icon" />
        </button>
        <input
          v-model="zoomPercentage"
          @change="setZoomFromPercentage"
          @keyup.enter="setZoomFromPercentage"
          class="zoom-input"
          type="number"
          min="25"
          max="300"
          step="5"
        />
        <span class="zoom-unit">%</span>
        <button @click="zoomIn" class="icon-button" title="Zooma in">
          <ZoomIn class="button-icon" />
        </button>
      </div>

      <!-- Boat Controls (visible when boat is selected) -->
      <div v-if="selectedBoatData" class="toolbar-group boat-controls">
        <span class="toolbar-label">{{ selectedBoatData.name }}:</span>

        <!-- Rotation Controls -->
        <button @click="rotateSelectedBoat(-22.5)" class="icon-button" title="Rotera vänster">
          <RotateCcw class="button-icon" />
        </button>
        <button @click="rotateSelectedBoat(22.5)" class="icon-button" title="Rotera höger">
          <RotateCw class="button-icon" />
        </button>

        <!-- Status Controls -->
        <button
          @click="setSelectedBoatStatus('reserverad')"
          class="status-button reserverad"
          :class="{ active: selectedPlacement?.status === 'reserverad' }"
          title="Reserverad plats"
        >
          Reserverad
        </button>
        <button
          @click="setSelectedBoatStatus('placerad')"
          class="status-button placerad"
          :class="{ active: selectedPlacement?.status === 'placerad' }"
          title="Placerad fysiskt"
        >
          Placerad
        </button>

        <!-- Deselect -->
        <button @click="deselectBoat" class="icon-button" title="Avmarkera">
          <X class="button-icon" />
        </button>
      </div>

      <!-- Advanced Statistics -->
      <div class="toolbar-group stats-group">
        <span class="placement-stats">
          {{ placedBoats.length }} båtar placerade
        </span>
        <span class="utilization-stats">
          Utnyttjande: {{ Math.round(storageUtilization) }}%
        </span>
        <label class="collision-toggle" v-if="placedBoats.length > 1">
          <input
            type="checkbox"
            v-model="showCollisions"
            @change="updateBoatDisplay"
          />
          <span class="toggle-label">Kollisioner ({{ collisionCount }})</span>
        </label>
      </div>
    </div>

    <!-- Canvas Container -->
    <div
      class="canvas-container"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
    >
      <div ref="canvasContainer" class="konva-canvas-wrapper"></div>

      <!-- Drop Zone Indicator -->
      <div v-if="isDragOver" class="drop-zone-indicator">
        <div class="drop-zone-content">
          <Package class="drop-zone-icon" />
          <p>Släpp båten här för att placera</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import Konva from 'konva';
import { Navigation2, Move, ZoomOut, ZoomIn, Package, RotateCcw, RotateCw, X, RefreshCw } from 'lucide-vue-next';

// Import data for restrictions and floors
import storageRestrictionsData from '@/assets/data/storageRestrictions.json';
import storageFloorsData from '@/assets/data/storageFloors.json';

// Import types
import type { Boat } from '@/types/entities';

// Local type definitions
interface Storage {
  id: number;
  name: string;
  type: string;
  type_display: string;
  width: number;
  height: number;
  level_count?: number;
}

interface BoatPlacement {
  id: number;
  boat_id: number;
  storage_id: number;
  floor: number;
  x: number;
  y: number;
  rotation?: number;
  status: 'reserverad' | 'placerad' | 'oplacerad';
}

// Props
const props = defineProps<{
  storage: Storage;
  boats: Boat[];
  placements: BoatPlacement[];
}>();

// Emits
const emit = defineEmits<{
  'boat-selected': [boat: Boat];
  'boat-placed': [event: { boat: Boat; position: { x: number; y: number; rotation: number } }];
  'boat-removed': [event: { boat: Boat; placement: BoatPlacement }];
  'placement-updated': [event: { placement: BoatPlacement; newPosition: { x: number; y: number; rotation: number } }];
  'status-updated': [event: { placement: BoatPlacement; newStatus: 'reserverad' | 'placerad' }];
  'boat-rotated': [event: { placement: BoatPlacement; newRotation: number }];
  'boat-dropped': [event: { boat: any; position: { x: number; y: number }; storage_id: number; floor: number }];
}>();

// Reactive data
const canvasContainer = ref<HTMLDivElement | null>(null);
const stage = ref<Konva.Stage | null>(null);
const backgroundLayer = ref<Konva.Layer | null>(null);
const restrictionLayer = ref<Konva.Layer | null>(null);
const floorLayer = ref<Konva.Layer | null>(null);
const boatLayer = ref<Konva.Layer | null>(null);

// View state
const activeFloor = ref(1);
const zoomLevel = ref(1);
const zoomPercentage = ref(100);
const isPanMode = ref(false);
const isDragOver = ref(false);
const showCollisions = ref(true);
const isDragging = ref(false);
const dragPreviewBoat = ref<Boat | null>(null);

// Canvas settings
const canvasSize = ref({ width: 800, height: 600 });
const pixelsPerMeter = ref(10);
const storageOffset = ref({ x: 0, y: 0 });

// Selected boat state
const selectedBoat = ref<number | null>(null);

// Computed properties
const availableFloors = computed(() => {
  const floors = [];
  for (let i = 1; i <= (props.storage.level_count || 1); i++) {
    floors.push(i);
  }
  return floors;
});

const placedBoats = computed(() => {
  return props.placements.filter(
    (placement) =>
      placement.storage_id === props.storage.id &&
      placement.floor === activeFloor.value
  );
});

const selectedPlacement = computed(() => {
  if (!selectedBoat.value) return null;
  return props.placements.find(p => p.boat_id === selectedBoat.value);
});

const selectedBoatData = computed(() => {
  if (!selectedBoat.value) return null;
  return props.boats.find(b => b.id === selectedBoat.value);
});

const restrictions = computed(() => {
  return storageRestrictionsData.filter(
    (restriction: any) => restriction.storage_id === props.storage.id
  );
});

const floorZones = computed(() => {
  if (activeFloor.value === 1) return []; // Main floor shows restrictions instead

  const floorDesign = storageFloorsData.find(
    (entry: any) => entry.storage_id === props.storage.id && entry.floor_number === activeFloor.value
  );
  return floorDesign?.floor_zones || [];
});

// Advanced computed properties for storage management
const storageUtilization = computed(() => {
  if (placedBoats.value.length === 0) return 0;

  const storageArea = props.storage.width * props.storage.height;
  const usedArea = placedBoats.value.reduce((total, placement) => {
    const boat = props.boats.find(b => b.id === placement.boat_id);
    if (!boat) return total;
    return total + (boat.length * boat.width);
  }, 0);

  return Math.min(100, (usedArea / storageArea) * 100);
});

const collisionCount = computed(() => {
  if (!showCollisions.value) return 0;

  let collisions = 0;
  const boats = placedBoats.value;

  for (let i = 0; i < boats.length; i++) {
    for (let j = i + 1; j < boats.length; j++) {
      const boat1 = boats[i];
      const boat2 = boats[j];
      if (!boat1 || !boat2) continue;

      const placement1 = props.placements.find(p => p.boat_id === boat1.boat_id);
      const placement2 = props.placements.find(p => p.boat_id === boat2.boat_id);
      if (placement1 && placement2 && detectBoatCollision(placement1, placement2)) {
        collisions++;
      }
    }
  }

  return collisions;
});

// Collision Detection Functions (inspired by Konva collision examples)
const detectBoatCollision = (placement1: BoatPlacement, placement2: BoatPlacement): boolean => {
  const boat1 = props.boats.find(b => b.id === placement1.boat_id);
  const boat2 = props.boats.find(b => b.id === placement2.boat_id);

  if (!boat1 || !boat2) return false;

  // Calculate boat bounds including safety margins
  const boat1Bounds = calculateBoatBounds(boat1, placement1);
  const boat2Bounds = calculateBoatBounds(boat2, placement2);

  // Check if bounds overlap
  return !(
    boat1Bounds.right < boat2Bounds.left ||
    boat1Bounds.left > boat2Bounds.right ||
    boat1Bounds.bottom < boat2Bounds.top ||
    boat1Bounds.top > boat2Bounds.bottom
  );
};

const calculateBoatBounds = (boat: Boat, placement: BoatPlacement) => {
  const margin = boat.safety_margin || 0.5;
  return {
    left: placement.x - margin,
    right: placement.x + boat.length + margin,
    top: placement.y - margin,
    bottom: placement.y + boat.width + margin,
  };
};

const checkBoatCollisionsWith = (boat: Boat, placement: BoatPlacement): boolean => {
  return placedBoats.value.some(otherPlacement => {
    if (otherPlacement.boat_id === boat.id) return false;
    return detectBoatCollision(placement, otherPlacement);
  });
};

// Canvas initialization
const initCanvas = () => {
  if (!canvasContainer.value) return;

  stage.value = new Konva.Stage({
    container: canvasContainer.value,
    width: canvasSize.value.width,
    height: canvasSize.value.height,
  });

  // Create layers
  backgroundLayer.value = new Konva.Layer();
  restrictionLayer.value = new Konva.Layer();
  floorLayer.value = new Konva.Layer();
  boatLayer.value = new Konva.Layer();

  stage.value.add(backgroundLayer.value as Konva.Layer);
  stage.value.add(restrictionLayer.value as Konva.Layer);
  stage.value.add(floorLayer.value as Konva.Layer);
  stage.value.add(boatLayer.value as Konva.Layer);

  // Setup event handlers
  setupEventHandlers();

  // Draw initial content
  updateStorageDisplay();
  updateBoatDisplay();

  // Update canvas offset for centering
  const centerX = (canvasSize.value.width - props.storage.width * pixelsPerMeter.value) / 2;
  const centerY = (canvasSize.value.height - props.storage.height * pixelsPerMeter.value) / 2;
  storageOffset.value = { x: Math.max(50, centerX), y: Math.max(50, centerY) };

  console.log('✅ Konva canvas initialized successfully');
};

// Event handlers setup
const setupEventHandlers = () => {
  if (!stage.value) return;

  // Handle stage clicks for deselection
  stage.value.on('click', (e) => {
    if (e.target === stage.value) {
      selectedBoat.value = null;
      updateBoatDisplay();
    }
  });

  // Pan mode handling
  stage.value.on('mousedown touchstart', (e) => {
    if (isPanMode.value && e.target === stage.value) {
      stage.value?.draggable(true);
    }
  });

  stage.value.on('mouseup touchend', () => {
    if (isPanMode.value) {
      stage.value?.draggable(false);
    }
  });

  // Zoom with wheel
  stage.value.on('wheel', (e) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = Math.max(0.25, Math.min(3, newScale));

    if (clampedScale !== oldScale) {
      setZoom(clampedScale);
    }
  });
};

// Storage display update
const updateStorageDisplay = () => {
  if (!backgroundLayer.value || !restrictionLayer.value || !floorLayer.value) return;

  // Clear layers
  backgroundLayer.value?.destroyChildren();
  restrictionLayer.value.destroyChildren();
  floorLayer.value.destroyChildren();

  // Draw background
  const background = new Konva.Rect({
    x: storageOffset.value.x,
    y: storageOffset.value.y,
    width: props.storage.width * pixelsPerMeter.value,
    height: props.storage.height * pixelsPerMeter.value,
    fill: '#f9fafb',
    stroke: '#d1d5db',
    strokeWidth: 2,
  });

  backgroundLayer.value.add(background);

  // Draw grid
  const gridSize = 1; // 1 meter grid
  const storagePixelWidth = props.storage.width * pixelsPerMeter.value;
  const storagePixelHeight = props.storage.height * pixelsPerMeter.value;

  // Vertical lines
  for (let x = 0; x <= props.storage.width; x += gridSize) {
    const line = new Konva.Line({
      points: [
        storageOffset.value.x + x * pixelsPerMeter.value,
        storageOffset.value.y,
        storageOffset.value.x + x * pixelsPerMeter.value,
        storageOffset.value.y + storagePixelHeight,
      ],
      stroke: '#e5e7eb',
      strokeWidth: 0.5,
    });
    backgroundLayer.value.add(line);
  }

  // Horizontal lines
  for (let y = 0; y <= props.storage.height; y += gridSize) {
    const line = new Konva.Line({
      points: [
        storageOffset.value.x,
        storageOffset.value.y + y * pixelsPerMeter.value,
        storageOffset.value.x + storagePixelWidth,
        storageOffset.value.y + y * pixelsPerMeter.value,
      ],
      stroke: '#e5e7eb',
      strokeWidth: 0.5,
    });
    backgroundLayer.value.add(line);
  }

  // Draw restrictions for main floor
  if (activeFloor.value === 1) {
    restrictions.value.forEach((restriction: any) => {
      const rect = new Konva.Rect({
        x: storageOffset.value.x + restriction.x * pixelsPerMeter.value,
        y: storageOffset.value.y + restriction.y * pixelsPerMeter.value,
        width: restriction.width * pixelsPerMeter.value,
        height: restriction.height * pixelsPerMeter.value,
        fill: 'rgba(239, 68, 68, 0.2)',
        stroke: '#ef4444',
        strokeWidth: 1,
        dash: [5, 5],
      });
      restrictionLayer.value?.add(rect);
    });
  }

  // Draw floor zones for upper floors
  floorZones.value.forEach((zone: any) => {
    const points = zone.coordinates.flatMap((coord: any) => [
      storageOffset.value.x + coord.x * pixelsPerMeter.value,
      storageOffset.value.y + coord.y * pixelsPerMeter.value,
    ]);

    const polygon = new Konva.Line({
      points: points,
      fill: 'rgba(59, 130, 246, 0.1)',
      stroke: '#3b82f6',
      strokeWidth: 1,
      closed: true,
    });
    floorLayer.value?.add(polygon);
  });

  backgroundLayer.value.batchDraw();
  restrictionLayer.value.batchDraw();
  floorLayer.value.batchDraw();
};

// Boat display update
const updateBoatDisplay = () => {
  if (!boatLayer.value) return;

  boatLayer.value.destroyChildren();

  placedBoats.value.forEach((placement) => {
    const boat = props.boats.find(b => b.id === placement.boat_id);
    if (boat) {
      drawBoat(boat, placement);
    }
  });

  boatLayer.value.batchDraw();
};

// Exakt samma färger som BoatDetailCanvas
const getBoatStatusColors = (status: 'reserverad' | 'placerad' | 'selected' | 'oplacerad'): any => {
  switch (status) {
    case 'placerad':
      return {
        hull: { stroke: '#1e40af', strokeWidth: 2, fill: '#dbeafe' },
        margin: { stroke: '#1e40af', strokeWidth: 1, dash: [5, 5], fill: '#eff6ff' },
        text: '#1e40af',
      };
    case 'reserverad':
      return {
        hull: { stroke: '#9ca3af', strokeWidth: 2, fill: '#ffffff', opacity: 0.7, dash: [8, 4] },
        margin: { stroke: '#9ca3af', strokeWidth: 1, dash: [10, 5], fill: '#f9fafb', opacity: 0.7 },
        text: '#6b7280',
      };
    case 'selected':
    case 'oplacerad':
      return {
        hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
        margin: { stroke: '#27d07c', strokeWidth: 1, dash: [5, 5], fill: '#E9FBF3' },
        text: '#16a34a',
      };
    default:
      return {
        hull: { stroke: '#6b7280', strokeWidth: 2, fill: '#f3f4f6' },
        margin: { stroke: '#6b7280', strokeWidth: 1, dash: [5, 5], fill: '#f9fafb' },
        text: '#6b7280',
      };
  }
};

// SVG Constants (same as BoatDetailCanvas)
const SVG_CONSTANTS = {
  MAIN_VB: { w: 174, h: 78 },
  MARGIN_VB: { w: 174, h: 78 },
  PX_PER_M: 10
};

// Create boat group with proper SVG paths (same as BoatDetailCanvas)
const createBoatShape = (boat: Boat, colors: any) => {
  const boatGroup = new Konva.Group();

  // Calculate scaling factor based on boat dimensions
  const baseLength = boat.length * SVG_CONSTANTS.PX_PER_M;
  const baseWidth = boat.width * SVG_CONSTANTS.PX_PER_M;

  // Create boat hull using simplified shape for performance
  const hull = new Konva.Rect({
    x: 0,
    y: 0,
    width: baseLength,
    height: baseWidth,
    fill: colors.hull.fill,
    stroke: colors.hull.stroke,
    strokeWidth: colors.hull.strokeWidth,
    dash: colors.hull.dash || [],
    opacity: colors.hull.opacity || 1,
    cornerRadius: 3,
  });

  // Safety margin visualization
  const margin = boat.safety_margin * SVG_CONSTANTS.PX_PER_M;
  const marginRect = new Konva.Rect({
    x: -margin,
    y: -margin,
    width: baseLength + 2 * margin,
    height: baseWidth + 2 * margin,
    fill: colors.margin.fill,
    stroke: colors.margin.stroke,
    strokeWidth: colors.margin.strokeWidth,
    dash: colors.margin.dash || [],
    opacity: colors.margin.opacity || 0.3,
  });

  boatGroup.add(marginRect);
  boatGroup.add(hull);

  return boatGroup;
};

// Draw individual boat
const drawBoat = (boat: Boat, placement: BoatPlacement) => {
  if (!boatLayer.value) return;

  // Determine boat status for coloring
  let displayStatus: 'reserverad' | 'placerad' | 'selected' | 'oplacerad' = placement.status;
  if (selectedBoat.value === boat.id) {
    displayStatus = 'selected';
  }

  // Check if boat has collisions for style
  const hasCollisions = showCollisions.value && checkBoatCollisionsWith(boat, placement);

  // Get status colors
  const colors = getBoatStatusColors(displayStatus);

  // Create boat shape using BoatDetailCanvas logic
  const boatShapeGroup = createBoatShape(boat, colors);

  // Main boat group with interactivity
  const boatGroup = new Konva.Group({
    draggable: true,
    id: `boat-${boat.id}`,
  });

  boatGroup.add(boatShapeGroup);

  // Visual feedback for collision warnings
  if (showCollisions.value && hasCollisions) {
    const warningOutline = new Konva.Rect({
      x: -5,
      y: -5,
      width: boat.length * pixelsPerMeter.value + 10,
      height: boat.width * pixelsPerMeter.value + 10,
      stroke: '#ef4444',
      strokeWidth: 3,
      dash: [10, 5],
      fill: 'transparent',
    });
    boatGroup.add(warningOutline);
  }

  // Draw boat name (centered properly)
  const nameText = new Konva.Text({
    x: 0,
    y: (boat.width * pixelsPerMeter.value) / 2 + 12,
    text: boat.name,
    fontSize: 12,
    fontFamily: 'Inter, Arial, sans-serif',
    fill: colors.text,
    width: boat.length * pixelsPerMeter.value,
    height: boat.width * pixelsPerMeter.value,
    align: 'center',
    verticalAlign: 'top',
  });

  boatGroup.add(nameText);

  // Setup position and transformations
  boatGroup.position({
    x: storageOffset.value.x + placement.x * pixelsPerMeter.value,
    y: storageOffset.value.y + placement.y * pixelsPerMeter.value,
  });

  if (placement.rotation) {
    boatGroup.rotation(placement.rotation);
  }

  // Event handlers
  boatGroup.on('click', () => {
    selectBoat(boat.id);
  });

  boatGroup.on('dragstart', () => {
    isDragging.value = true;
    dragPreviewBoat.value = boat;
  });

  boatGroup.on('dragmove', () => {
    // Real-time collision detection during drag
    if (showCollisions.value) {
      const currentPos = boatGroup.position();
      const testPlacement = {
        ...placement,
        x: (currentPos.x - storageOffset.value.x) / pixelsPerMeter.value,
        y: (currentPos.y - storageOffset.value.y) / pixelsPerMeter.value,
      };

      const hasCollision = checkBoatCollisionsWith(boat, testPlacement);
      boatGroup.opacity(hasCollision ? 0.6 : 1);
    }
  });

  boatGroup.on('dragend', () => {
    isDragging.value = false;
    dragPreviewBoat.value = null;

    const finalPos = boatGroup.position();
    const newX = (finalPos.x - storageOffset.value.x) / pixelsPerMeter.value;
    const newY = (finalPos.y - storageOffset.value.y) / pixelsPerMeter.value;

    // Check bounds
    if (newX < 0 || newY < 0 ||
        newX + boat.length > props.storage.width ||
        newY + boat.width > props.storage.height) {
      // Reset to original position
      boatGroup.position({
        x: storageOffset.value.x + placement.x * pixelsPerMeter.value,
        y: storageOffset.value.y + placement.y * pixelsPerMeter.value,
      });
      console.warn('⚠️ Boat moved outside storage bounds - reverted');
      return;
    }

    // Emit position update
    emit('placement-updated', {
      placement: placement,
      newPosition: {
        x: newX,
        y: newY,
        rotation: placement.rotation || 0,
      },
    });

    boatGroup.opacity(1);
    console.log(`📍 Boat ${boat.name} moved to (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
  });

  boatLayer.value.add(boatGroup);
};

// Boat selection management
const selectBoat = (boatId: number) => {
  selectedBoat.value = boatId;
  updateBoatDisplay();

  const boat = props.boats.find(b => b.id === boatId);
  if (boat) {
    emit('boat-selected', boat);
  }

  console.log(`🚤 Selected boat ${boatId}`);
};

const deselectBoat = () => {
  selectedBoat.value = null;
  updateBoatDisplay();
  console.log('❌ Boat deselected');
};

// Rotation function
const rotateSelectedBoat = (degrees: number) => {
  if (!selectedBoat.value || !selectedPlacement.value) return;

  const currentRotation = selectedPlacement.value.rotation || 0;
  const newRotation = (currentRotation + degrees) % 360;

  emit('boat-rotated', {
    placement: selectedPlacement.value,
    newRotation: newRotation,
  });

  console.log(`🔄 Rotated boat ${selectedBoat.value} by ${degrees}° (now ${newRotation}°)`);
};

// Status management
const setSelectedBoatStatus = (status: 'reserverad' | 'placerad') => {
  if (!selectedBoat.value || !selectedPlacement.value) return;

  emit('status-updated', {
    placement: selectedPlacement.value,
    newStatus: status,
  });

  console.log(`📊 Set boat ${selectedBoat.value} status to ${status}`);
};

// UI Control Functions
const setActiveFloor = (floor: number) => {
  activeFloor.value = floor;
  updateStorageDisplay();
  updateBoatDisplay();
};

const centerView = () => {
  if (!stage.value) return;

  const stageWidth = stage.value.width();
  const stageHeight = stage.value.height();
  const storagePixelWidth = props.storage.width * pixelsPerMeter.value;
  const storagePixelHeight = props.storage.height * pixelsPerMeter.value;

  const x = (stageWidth - storagePixelWidth) / 2;
  const y = (stageHeight - storagePixelHeight) / 2;

  stage.value.position({ x, y });
  stage.value.batchDraw();
};

const togglePanMode = () => {
  isPanMode.value = !isPanMode.value;
  console.log(`🖱️ Pan mode: ${isPanMode.value ? 'ON' : 'OFF'}`);
};

const resetCanvasPosition = () => {
  if (!stage.value) return;

  stage.value.position({ x: 0, y: 0 });
  stage.value.scale({ x: 1, y: 1 });
  zoomLevel.value = 1;
  zoomPercentage.value = 100;

  storageOffset.value = { x: 0, y: 0 };

  updateStorageDisplay();
  updateBoatDisplay();

  console.log('🔄 Canvas position reset');
};

const zoomOut = () => {
  const newZoom = Math.max(0.25, zoomLevel.value - 0.1);
  setZoom(newZoom);
};

const zoomIn = () => {
  const newZoom = Math.min(3, zoomLevel.value + 0.1);
  setZoom(newZoom);
};

const setZoom = (zoom: number) => {
  if (!stage.value) return;

  zoomLevel.value = zoom;
  zoomPercentage.value = Math.round(zoom * 100);

  stage.value.scale({ x: zoom, y: zoom });
  stage.value.batchDraw();

  console.log(`🔍 Zoom set to ${Math.round(zoom * 100)}%`);
};

const setZoomFromPercentage = () => {
  const zoom = zoomPercentage.value / 100;
  setZoom(zoom);
};

// Drag and drop handlers
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;

  if (!event.dataTransfer) return;

  try {
    const boatData = JSON.parse(event.dataTransfer.getData('application/json'));
    if (!boatData || !boatData.id) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const storageX = (x - storageOffset.value.x) / pixelsPerMeter.value;
    const storageY = (y - storageOffset.value.y) / pixelsPerMeter.value;

    emit('boat-dropped', {
      boat: boatData,
      position: { x: storageX, y: storageY },
      storage_id: props.storage.id,
      floor: activeFloor.value,
    });

    console.log(`🎯 Dropped boat ${boatData.name} at (${storageX.toFixed(1)}, ${storageY.toFixed(1)})`);

  } catch (error) {
    console.error('❌ Error handling boat drop:', error);
  }
};

// Position bounds checking
const constrainStagePosition = () => {
  if (!stage.value) return;

  const currentPos = stage.value.position();
  const stageWidth = stage.value.width();
  const stageHeight = stage.value.height();

  const minX = -props.storage.width * pixelsPerMeter.value + 100;
  const maxX = stageWidth - 100;
  const minY = -props.storage.height * pixelsPerMeter.value + 100;
  const maxY = stageHeight - 100;

  const newX = Math.max(minX, Math.min(maxX, currentPos.x));
  const newY = Math.max(minY, Math.min(maxY, currentPos.y));

  if (newX !== currentPos.x || newY !== currentPos.y) {
    stage.value.position({ x: newX, y: newY });
    stage.value.batchDraw();
  }
};

// Watchers
watch(() => props.placements, () => {
  updateBoatDisplay();
}, { deep: true });

watch(() => props.boats, () => {
  updateBoatDisplay();
}, { deep: true });

watch(activeFloor, () => {
  updateStorageDisplay();
  updateBoatDisplay();
});

// Periodic canvas position check
let positionCheckInterval: ReturnType<typeof setInterval> | null = null;

const startPositionCheck = () => {
  positionCheckInterval = setInterval(() => {
    if (stage.value) {
      constrainStagePosition();
    }
  }, 100);
};

const stopPositionCheck = () => {
  if (positionCheckInterval) {
    clearInterval(positionCheckInterval);
    positionCheckInterval = null;
  }
};

// Lifecycle
onMounted(async () => {
  await nextTick();

  // Auto-resize canvas based on container
  const resizeCanvas = () => {
    if (canvasContainer.value) {
      const rect = canvasContainer.value.getBoundingClientRect();
      canvasSize.value = {
        width: Math.max(800, rect.width),
        height: Math.max(600, rect.height),
      };

      if (stage.value) {
        stage.value.size(canvasSize.value);
        stage.value.batchDraw();
      }
    }
  };

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  initCanvas();
  startPositionCheck();

  // Auto-focus on canvas for keyboard events
  canvasContainer.value?.focus();
});

onUnmounted(() => {
  stopPositionCheck();

  if (stage.value) {
    stage.value.destroy();
  }

  window.removeEventListener('resize', () => {});
});
</script>

<style scoped>
.boat-placement-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

/* Enhanced Toolbar Styling */
.placement-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  min-height: 4rem;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.toolbar-group.stats-group {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.1);
  gap: 1rem;
}

.storage-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.storage-type {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  padding: 0.125rem 0.375rem;
  background: #f1f5f9;
  border-radius: 0.25rem;
}

.storage-dimensions {
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
}

.toolbar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

/* Floor Tabs */
.floor-tabs {
  display: flex;
  gap: 0.25rem;
}

.floor-tab {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.floor-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.floor-tab.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* Buttons */
.toolbar-button,
.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #6b7280;
  min-width: 2.5rem;
  height: 2.5rem;
}

.toolbar-button:hover,
.icon-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  color: #374151;
}

.toolbar-button.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.button-icon {
  width: 1rem;
  height: 1rem;
}

/* Zoom Controls */
.zoom-input {
  width: 4rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  text-align: center;
  background: white;
}

.zoom-unit {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Boat Controls */
.boat-controls {
  background: rgba(34, 197, 94, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.status-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  background: white;
}

.status-button.reserverad {
  color: #6b7280;
}

.status-button.reserverad.active {
  background: #9ca3af;
  color: white;
  border-color: #9ca3af;
}

.status-button.placerad {
  color: #1e40af;
}

.status-button.placerad.active {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

/* Statistics */
.placement-stats,
.utilization-stats {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.collision-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.collision-toggle input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  accent-color: #2563eb;
}

.toggle-label {
  user-select: none;
}

/* Canvas Container */
.canvas-container {
  flex: 1;
  position: relative;
  background: #f8fafc;
  overflow: hidden;
}

.konva-canvas-wrapper {
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.konva-canvas-wrapper:focus {
  outline: none;
}

/* Drop Zone */
.drop-zone-indicator {
  position: absolute;
  top: 0;
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

.drop-zone-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 0.5rem;
}

.drop-zone-content p {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .placement-toolbar {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  .toolbar-group {
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
  }

  .storage-title {
    font-size: 1rem;
  }

  .toolbar-button,
  .icon-button {
    min-width: 2rem;
    height: 2rem;
    padding: 0.375rem;
  }
}
</style>
