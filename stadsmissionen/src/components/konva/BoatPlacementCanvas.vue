<template>
  <div class="boat-placement-canvas-container">
    <!-- Toolbar -->
    <div class="placement-toolbar">
      <!-- Storage Info -->
      <div class="toolbar-group">
        <h3 class="storage-title">{{ storage.name }}</h3>
        <span class="storage-type">{{ storage.type_display }}</span>
        <span class="storage-dimensions">{{ storage.dimensions }}</span>
      </div>

      <!-- Floor Navigation (for warehouses) -->
      <div v-if="storage.type === 'warehouse' && storage.level_count > 1" class="toolbar-group">
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

      <!-- Placement Stats -->
      <div class="toolbar-group">
        <span class="placement-stats">
          {{ placedBoats.length }} båtar placerade
        </span>
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
import BoatDetailCanvas from '@/components/konva/BoatDetailCanvas.vue';

// Import data for restrictions and floors
import storageRestrictionsData from '@/assets/data/storageRestrictions.json';
import storageFloorsData from '@/assets/data/storageFloors.json';

// Types
interface StorageUnit {
  id: number;
  name: string;
  type: 'warehouse' | 'dock';
  type_display: string;
  dimensions: string;
  level_count?: number;
  height: number;
  width: number;
}

interface Boat {
  id: number;
  name: string;
  registreringsnummer: string;
  length: number;
  width: number;
  safety_margin: number;
  current_status: 'oplacerad' | 'reserverad' | 'placerad';
  location_status: 'lager' | 'brygga' | 'lager_brygga';
}

interface BoatPlacement {
  id: number;
  boat_id: number;
  storage_id: number;
  floor_number: number;
  status: 'reserverad' | 'placerad';
  position: {
    x: number;
    y: number;
    rotation: number;
  };
  placed_date: string;
  notes: string;
}

interface RestrictionZone {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FloorZone {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Props
const props = defineProps<{
  storage: StorageUnit;
  boats: Boat[];
  placements: BoatPlacement[];
}>();

// Emits
const emit = defineEmits<{
  'boat-placed': [event: { boat: Boat; position: { x: number; y: number; rotation: number } }];
  'boat-removed': [event: { boat: Boat; placement: BoatPlacement }];
  'placement-updated': [event: { placement: BoatPlacement; newPosition: { x: number; y: number; rotation: number } }];
  'status-updated': [event: { placement: BoatPlacement; newStatus: 'reserverad' | 'placerad' }];
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

// Canvas settings
const canvasSize = ref({ width: 800, height: 600 });
const pixelsPerMeter = ref(10);
const storageOffset = ref({ x: 0, y: 0 });

// Computed properties
const availableFloors = computed(() => {
  const floors = [];
  for (let i = 1; i <= (props.storage.level_count || 1); i++) {
    floors.push(i);
  }
  return floors;
});

const placedBoats = computed(() => {
  return props.placements.filter(placement =>
    placement.floor_number === activeFloor.value
  );
});

const restrictionZones = computed(() => {
  const storageRestrictions = storageRestrictionsData.find(
    (entry: any) => entry.storage_id === props.storage.id
  );
  return storageRestrictions?.restriction_zones || [];
});

const floorZones = computed(() => {
  if (activeFloor.value === 1) return []; // Main floor shows restrictions instead

  const floorDesign = storageFloorsData.find(
    (entry: any) => entry.storage_id === props.storage.id && entry.floor_number === activeFloor.value
  );
  return floorDesign?.floor_zones || [];
});

// Canvas management
const initCanvas = () => {
  if (!canvasContainer.value) return;

  calculateCanvasSize();

  // Create stage
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

  stage.value.add(backgroundLayer.value);
  stage.value.add(restrictionLayer.value);
  stage.value.add(floorLayer.value);
  stage.value.add(boatLayer.value);

  // Setup event handlers
  setupEventHandlers();

  // Draw initial content
  updateStorageDisplay();
  updateBoatDisplay();

  console.log('🎨 BoatPlacementCanvas initialized');
};

const calculateCanvasSize = () => {
  if (!canvasContainer.value) return;

  const container = canvasContainer.value.getBoundingClientRect();
  canvasSize.value = {
    width: Math.max(600, container.width),
    height: Math.max(400, container.height - 60) // Account for toolbar
  };

  // Calculate pixels per meter to fit storage in canvas with padding
  const padding = 80;
  const availableWidth = canvasSize.value.width - padding;
  const availableHeight = canvasSize.value.height - padding;

  const widthScale = availableWidth / props.storage.width;
  const heightScale = availableHeight / props.storage.height;
  pixelsPerMeter.value = Math.min(widthScale, heightScale, 20); // Max 20px per meter

  // Center the storage
  const storagePixelWidth = props.storage.width * pixelsPerMeter.value;
  const storagePixelHeight = props.storage.height * pixelsPerMeter.value;

  storageOffset.value = {
    x: (canvasSize.value.width - storagePixelWidth) / 2,
    y: (canvasSize.value.height - storagePixelHeight) / 2,
  };
};

const updateStorageDisplay = () => {
  if (!backgroundLayer.value || !restrictionLayer.value || !floorLayer.value) return;

  // Clear layers
  backgroundLayer.value.destroyChildren();
  restrictionLayer.value.destroyChildren();
  floorLayer.value.destroyChildren();

  // Draw background
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: canvasSize.value.width,
    height: canvasSize.value.height,
    fill: '#ffffff',
  });
  backgroundLayer.value.add(background);

  // Draw storage outline
  const storageRect = new Konva.Rect({
    x: storageOffset.value.x,
    y: storageOffset.value.y,
    width: props.storage.width * pixelsPerMeter.value,
    height: props.storage.height * pixelsPerMeter.value,
    fill: props.storage.type === 'dock' ? '#E7F3FF' : '#FDFAF0',
    stroke: props.storage.type === 'dock' ? '#2563eb' : '#B46100',
    strokeWidth: 2,
    dash: props.storage.type === 'dock' ? [] : [],
  });
  backgroundLayer.value.add(storageRect);

  // For docks, show water areas (placement zones) around the dock
  if (props.storage.type === 'dock') {
    const waterMargin = 80; // 80 pixels water area around dock - mindre för bättre synlighet
    const waterAreas = [
      // Left water area
      {
        x: storageOffset.value.x - waterMargin,
        y: storageOffset.value.y - waterMargin,
        width: waterMargin,
        height: props.storage.height * pixelsPerMeter.value + 2 * waterMargin
      },
      // Right water area
      {
        x: storageOffset.value.x + props.storage.width * pixelsPerMeter.value,
        y: storageOffset.value.y - waterMargin,
        width: waterMargin,
        height: props.storage.height * pixelsPerMeter.value + 2 * waterMargin
      },
      // Top water area
      {
        x: storageOffset.value.x,
        y: storageOffset.value.y - waterMargin,
        width: props.storage.width * pixelsPerMeter.value,
        height: waterMargin
      },
      // Bottom water area
      {
        x: storageOffset.value.x,
        y: storageOffset.value.y + props.storage.height * pixelsPerMeter.value,
        width: props.storage.width * pixelsPerMeter.value,
        height: waterMargin
      }
    ];

    waterAreas.forEach(area => {
      const waterRect = new Konva.Rect({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        fill: '#B3E5FC',
        opacity: 0.3,
        stroke: '#03A9F4',
        strokeWidth: 1,
        dash: [3, 3],
      });
      backgroundLayer.value.add(waterRect);
    });

    // Add water label
    const waterLabel = new Konva.Text({
      x: storageOffset.value.x - waterMargin,
      y: storageOffset.value.y - waterMargin - 20,
      text: 'Vatten (placeringsområde)',
      fontSize: 11,
      fontFamily: 'Arial',
      fill: '#0277BD',
      fontStyle: 'italic',
      opacity: 0.8,
    });
    backgroundLayer.value.add(waterLabel);
  }

  // Draw storage name
  const nameText = new Konva.Text({
    x: storageOffset.value.x,
    y: storageOffset.value.y - 30,
    text: `${props.storage.name}${props.storage.type === 'warehouse' ? ` - Våning ${activeFloor.value}` : ''}`,
    fontSize: 16,
    fontFamily: 'Arial',
    fill: '#374151',
    fontStyle: 'bold',
  });
  backgroundLayer.value.add(nameText);

  // Draw grid
  drawGrid();

  // Draw restriction zones (main floor) or floor zones (upper floors)
  if (activeFloor.value === 1) {
    drawRestrictionZones();
  } else {
    drawFloorZones();
  }

  backgroundLayer.value.batchDraw();
  restrictionLayer.value.batchDraw();
  floorLayer.value.batchDraw();
};

const drawGrid = () => {
  if (!backgroundLayer.value) return;

  const gridSize = 1; // 1 meter grid
  const gridPixels = gridSize * pixelsPerMeter.value;
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
      stroke: '#FFDEB7',
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
      stroke: '#FFDEB7',
      strokeWidth: 0.5,
    });
    backgroundLayer.value.add(line);
  }
};

const drawRestrictionZones = () => {
  if (!restrictionLayer.value) return;

  restrictionZones.value.forEach((zone: RestrictionZone) => {
    const zoneGroup = new Konva.Group();

    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: zone.width * pixelsPerMeter.value,
      height: zone.height * pixelsPerMeter.value,
      fill: '#FDE7E7',
      stroke: '#800000',
      strokeWidth: 1,
      dash: [5, 5],
    });

    const text = new Konva.Text({
      x: 0,
      y: 0,
      width: zone.width * pixelsPerMeter.value,
      height: zone.height * pixelsPerMeter.value,
      text: zone.name,
      fontSize: 12,
      fontFamily: 'Arial',
      fill: '#800000',
      align: 'center',
      verticalAlign: 'middle',
    });

    zoneGroup.add(rect);
    zoneGroup.add(text);

    zoneGroup.position({
      x: storageOffset.value.x + zone.x * pixelsPerMeter.value,
      y: storageOffset.value.y + zone.y * pixelsPerMeter.value,
    });

    restrictionLayer.value.add(zoneGroup);
  });
};

const drawFloorZones = () => {
  if (!floorLayer.value) return;

  // Dim the main storage area to show this is an upper floor
  const dimOverlay = new Konva.Rect({
    x: storageOffset.value.x,
    y: storageOffset.value.y,
    width: props.storage.width * pixelsPerMeter.value,
    height: props.storage.height * pixelsPerMeter.value,
    fill: '#000000',
    opacity: 0.1,
  });
  floorLayer.value.add(dimOverlay);

  floorZones.value.forEach((zone: FloorZone) => {
    const zoneGroup = new Konva.Group();

    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: zone.width * pixelsPerMeter.value,
      height: zone.height * pixelsPerMeter.value,
      fill: '#E7F3FF',
      stroke: '#2563eb',
      strokeWidth: 2,
      dash: [8, 4],
    });

    const text = new Konva.Text({
      x: 0,
      y: 0,
      width: zone.width * pixelsPerMeter.value,
      height: zone.height * pixelsPerMeter.value,
      text: zone.name,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#2563eb',
      align: 'center',
      verticalAlign: 'middle',
      fontStyle: 'bold',
    });

    zoneGroup.add(rect);
    zoneGroup.add(text);

    zoneGroup.position({
      x: storageOffset.value.x + zone.x * pixelsPerMeter.value,
      y: storageOffset.value.y + zone.y * pixelsPerMeter.value,
    });

    floorLayer.value.add(zoneGroup);
  });
};

const updateBoatDisplay = () => {
  if (!boatLayer.value) return;

  boatLayer.value.destroyChildren();

  placedBoats.value.forEach((placement) => {
    const boat = props.boats.find(b => b.id === placement.boat_id);
    if (!boat) return;

    drawBoat(boat, placement);
  });

  boatLayer.value.batchDraw();
};

// Selected boat tracking
const selectedBoat = ref<number | null>(null);

const drawBoat = (boat: Boat, placement: BoatPlacement) => {
  if (!boatLayer.value) return;

  // Determine boat status for coloring
  let displayStatus = placement.status;
  if (selectedBoat.value === boat.id) {
    displayStatus = 'selected';
  }

  // Get status colors
  const colors = getBoatStatusColors(displayStatus);

  // Create boat shape using BoatDetailCanvas logic
  const boatPixelLength = boat.length * pixelsPerMeter.value;
  const boatPixelWidth = boat.width * pixelsPerMeter.value;
  const marginPixels = boat.safety_margin * pixelsPerMeter.value;

  const boatShapeGroup = createBoatShape(boat, colors, boatPixelLength, boatPixelWidth, marginPixels);

  // Main boat group with interactivity
  const boatGroup = new Konva.Group({
    draggable: true,
    id: `boat-${boat.id}`,
  });

  boatGroup.add(boatShapeGroup);

  // Draw boat name (centered properly)
  const nameText = new Konva.Text({
    x: 0,
    y: 0,
    text: boat.name,
    fontSize: Math.max(8, Math.min(14, Math.min(boatPixelLength, boatPixelWidth) * 0.2)),
    fontFamily: 'Arial',
    fill: colors.text,
    align: 'center',
    fontStyle: 'bold',
  });

  // Center text properly efter att width/height är calculerad
  nameText.offsetX(nameText.width() / 2);
  nameText.offsetY(nameText.height() / 2);
  boatGroup.add(nameText);

  // Position and rotate
  boatGroup.position({
    x: storageOffset.value.x + placement.position.x * pixelsPerMeter.value,
    y: storageOffset.value.y + placement.position.y * pixelsPerMeter.value,
  });
  boatGroup.rotation(placement.position.rotation);

  // Add click handler for selection
  boatGroup.on('click', () => {
    selectBoat(boat.id);
  });

  // Add drag event handlers
  boatGroup.on('dragmove', () => {
    // Select boat when dragging starts
    if (selectedBoat.value !== boat.id) {
      selectBoat(boat.id);
    }

    // Apply placement constraints based on storage type
    applyPlacementConstraints(boatGroup, boat);
  });

  boatGroup.on('dragend', () => {
    const pos = boatGroup.position();
    const newPosition = {
      x: (pos.x - storageOffset.value.x) / pixelsPerMeter.value,
      y: (pos.y - storageOffset.value.y) / pixelsPerMeter.value,
      rotation: boatGroup.rotation(),
    };

    emit('placement-updated', {
      placement,
      newPosition,
    });
  });

  boatLayer.value?.add(boatGroup);
};

// Boat selection management - BARA EN BÅT MARKERAD ÅT GÅNGEN
const selectBoat = (boatId: number) => {
  // Deselect current boat first
  if (selectedBoat.value && selectedBoat.value !== boatId) {
    console.log(`🔄 Deselecting boat ${selectedBoat.value}`);
  }

  selectedBoat.value = boatId;
  updateBoatDisplay(); // Redraw to show selection
  console.log(`🚤 Selected boat ${boatId} (only this boat is now green)`);
};

const deselectBoat = () => {
  const previousSelection = selectedBoat.value;
  selectedBoat.value = null;
  updateBoatDisplay(); // Redraw to clear selection
  console.log(`❌ Deselected boat ${previousSelection}`);
};

// Get currently selected boat data
const selectedBoatData = computed(() => {
  if (!selectedBoat.value) return null;
  return props.boats.find(boat => boat.id === selectedBoat.value);
});

const selectedPlacement = computed(() => {
  if (!selectedBoat.value) return null;
  return props.placements.find(placement => placement.boat_id === selectedBoat.value);
});

// Boat manipulation functions
const rotateSelectedBoat = (degrees: number) => {
  if (!selectedBoat.value || !selectedPlacement.value) return;

  const currentRotation = selectedPlacement.value.position.rotation;
  const newRotation = (currentRotation + degrees) % 360;

  // UPPDATERA DIREKT LOKALT för omedelbar visuell feedback
  selectedPlacement.value.position.rotation = newRotation;
  updateBoatDisplay(); // Rita om båtarna direkt

  // Emittera även till parent för att uppdatera data permanent
  emit('placement-updated', {
    placement: selectedPlacement.value,
    newPosition: {
      x: selectedPlacement.value.position.x,
      y: selectedPlacement.value.position.y,
      rotation: newRotation,
    },
  });

  console.log(`🔄 Rotated boat ${selectedBoat.value} by ${degrees}° to ${newRotation}° (direct visual update)`);
};

const setSelectedBoatStatus = (status: 'reserverad' | 'placerad') => {
  if (!selectedBoat.value || !selectedPlacement.value) return;

  // Emit status change (parent should update the placement)
  emit('status-updated', {
    placement: selectedPlacement.value,
    newStatus: status,
  });

  console.log(`📊 Set boat ${selectedBoat.value} status to ${status}`);
};

// Placement constraint logic for different storage types
const applyPlacementConstraints = (boatGroup: Konva.Group, boat: Boat) => {
  if (!stage.value) return;

  const pos = boatGroup.position();
  const boatLength = boat.length * pixelsPerMeter.value;
  const boatWidth = boat.width * pixelsPerMeter.value;

  let constrainedX = pos.x;
  let constrainedY = pos.y;

  const storageLeft = storageOffset.value.x;
  const storageTop = storageOffset.value.y;
  const storageRight = storageOffset.value.x + props.storage.width * pixelsPerMeter.value;
  const storageBottom = storageOffset.value.y + props.storage.height * pixelsPerMeter.value;

  if (props.storage.type === 'warehouse') {
    // LAGER: Båtar ska placeras INNANFÖR storage bounds och restriction zones
    // Keep boat fully inside storage boundaries
    constrainedX = Math.max(storageLeft, Math.min(constrainedX, storageRight - boatLength));
    constrainedY = Math.max(storageTop, Math.min(constrainedY, storageBottom - boatWidth));

    // TODO: Add constraint checking against restriction zones
    // Boats should avoid red restriction zones when in warehouse

    } else if (props.storage.type === 'dock') {
    // BRYGGA: Båtar ska placeras UTANFÖR dockens ytterkant (i vattnet) men nära och synligt
    const dockMargin = 15; // Mindre marginal för att hålla båtar nära bryggan

    // Definiera vattenområden runt bryggan (samma som i visualiseringen)
    const waterMargin = 80; // Mindre än visuella 100px för bättre synlighet

    // Om båten dras över bryggan, flytta till närmaste vattenområde
    const isOverDock = pos.x >= storageLeft &&
                      pos.x <= storageRight - boatLength &&
                      pos.y >= storageTop &&
                      pos.y <= storageBottom - boatWidth;

    if (isOverDock) {
      // Hitta närmaste vattenområde
      const centerX = pos.x + boatLength / 2;
      const centerY = pos.y + boatWidth / 2;
      const dockCenterX = storageLeft + (props.storage.width * pixelsPerMeter.value) / 2;
      const dockCenterY = storageTop + (props.storage.height * pixelsPerMeter.value) / 2;

      const deltaX = centerX - dockCenterX;
      const deltaY = centerY - dockCenterY;

      // Placera på den sida av bryggan som är närmast
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Vänster eller höger sida
        if (deltaX < 0) {
          // Vänster sida (vatten)
          constrainedX = storageLeft - boatLength - dockMargin;
          constrainedY = Math.max(storageTop - waterMargin/2,
                                 Math.min(pos.y, storageBottom + waterMargin/2 - boatWidth));
        } else {
          // Höger sida (vatten)
          constrainedX = storageRight + dockMargin;
          constrainedY = Math.max(storageTop - waterMargin/2,
                                 Math.min(pos.y, storageBottom + waterMargin/2 - boatWidth));
        }
      } else {
        // Topp eller botten sida
        if (deltaY < 0) {
          // Topp (vatten)
          constrainedY = storageTop - boatWidth - dockMargin;
          constrainedX = Math.max(storageLeft - waterMargin/2,
                                 Math.min(pos.x, storageRight + waterMargin/2 - boatLength));
        } else {
          // Botten (vatten)
          constrainedY = storageBottom + dockMargin;
          constrainedX = Math.max(storageLeft - waterMargin/2,
                                 Math.min(pos.x, storageRight + waterMargin/2 - boatLength));
        }
      }
    } else {
      // Båten är redan i vatten, begränsa till vattenområdet
      constrainedX = Math.max(storageLeft - waterMargin,
                             Math.min(pos.x, storageRight + waterMargin - boatLength));
      constrainedY = Math.max(storageTop - waterMargin,
                             Math.min(pos.y, storageBottom + waterMargin - boatWidth));
    }
  }

  // Apply constraints
  boatGroup.position({
    x: constrainedX,
    y: constrainedY
  });
};

// Constants from BoatDetailCanvas for accurate boat shapes
const SVG_CONSTANTS = {
  // Hull path - clean boat shape
  HULL_PATH: "M10,15 C10,9,14,5,20,5 H130 C134,5,138,7,141,10 L164,31 C168,35,168,43,164,47 L141,68 C138,71,134,73,130,73 H20 C14,73,10,69,10,63 Z",
  // Margin path - same as hull path, scaled larger
  MARGIN_PATH: "M10,15 C10,9,14,5,20,5 H130 C134,5,138,7,141,10 L164,31 C168,35,168,43,164,47 L141,68 C138,71,134,73,130,73 H20 C14,73,10,69,10,63 Z",
  HULL_VB: { w: 174, h: 78 },
  MARGIN_VB: { w: 174, h: 78 },
  PX_PER_M: 10
};

// Create boat group with proper SVG paths (same as BoatDetailCanvas)
const createBoatShape = (boat: Boat, colors: any, pixelLength: number, pixelWidth: number, marginPixels: number) => {
  const boatGroup = new Konva.Group();

  // Calculate scaling factor based on boat dimensions
  const baseLength = boat.length * SVG_CONSTANTS.PX_PER_M;
  const baseWidth = boat.width * SVG_CONSTANTS.PX_PER_M;
  const baseMarginPx = boat.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Scale hull path proportionally to match actual boat dimensions
  const hullScaleX = baseLength / SVG_CONSTANTS.HULL_VB.w;
  const hullScaleY = baseWidth / SVG_CONSTANTS.HULL_VB.h;

  // Create hull path
  const hullPath = new Konva.Path({
    data: SVG_CONSTANTS.HULL_PATH,
    strokeScaleEnabled: false,
    ...colors.hull
  });

  hullPath.scale({
    x: hullScaleX,
    y: hullScaleY
  });
  hullPath.offset({
    x: SVG_CONSTANTS.HULL_VB.w / 2,
    y: SVG_CONSTANTS.HULL_VB.h / 2
  });

  // Create margin path if safety margin exists
  if (boat.safety_margin > 0) {
    const marginScaleX = (baseLength + 2 * baseMarginPx) / SVG_CONSTANTS.MARGIN_VB.w;
    const marginScaleY = (baseWidth + 2 * baseMarginPx) / SVG_CONSTANTS.MARGIN_VB.h;

    const marginPath = new Konva.Path({
      data: SVG_CONSTANTS.MARGIN_PATH,
      strokeScaleEnabled: false,
      ...colors.margin
    });

    marginPath.scale({
      x: marginScaleX,
      y: marginScaleY
    });
    marginPath.offset({
      x: SVG_CONSTANTS.MARGIN_VB.w / 2,
      y: SVG_CONSTANTS.MARGIN_VB.h / 2
    });

    boatGroup.add(marginPath);
  }

  boatGroup.add(hullPath);
  return boatGroup;
};

// Exakt samma färger som BoatDetailCanvas
const getBoatStatusColors = (status: 'reserverad' | 'placerad' | 'selected' | 'oplacerad') => {
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
        hull: { stroke: '#6b7280', strokeWidth: 2, fill: '#f9fafb' },
        margin: { stroke: '#6b7280', strokeWidth: 1, dash: [5, 5], fill: '#f3f4f6' },
        text: '#374151',
      };
  }
};

// Event handlers
const setupEventHandlers = () => {
  if (!stage.value) return;

  // Zoom with wheel - förbättrad hantering
  stage.value.on('wheel', (e) => {
    e.evt.preventDefault();

    const oldScale = stage.value!.scaleX();
    const pointer = stage.value!.getPointerPosition();

    if (!pointer) return; // Safety check

    // Säkrare beräkning av zoom-punkt
    const stagePos = stage.value!.position();
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.15; // Något mindre faktor för smidigare zoom
    const newScale = direction > 0 ? oldScale * factor : oldScale / factor;

    applyZoom(newScale, mousePointTo);
  });

  // Pan mode handling + deselect when clicking background
  stage.value.on('mousedown', (e) => {
    if (isPanMode.value) {
      stage.value!.container().style.cursor = 'grabbing';
    }

    // Deselect boat if clicking on background (not on a boat)
    const clickedShape = e.target;
    if (clickedShape === stage.value || clickedShape?.getClassName() === 'Layer') {
      deselectBoat();
    }
  });

  stage.value.on('mouseup', () => {
    if (isPanMode.value) {
      stage.value!.container().style.cursor = 'grab';
    }
  });

  // Window resize
  window.addEventListener('resize', handleResize);
};

const handleResize = () => {
  calculateCanvasSize();
  if (stage.value) {
    stage.value.size(canvasSize.value);

    // Ensure stage stays in bounds after resize
    constrainStagePosition();

    updateStorageDisplay();

    console.log(`📐 Canvas resized to ${canvasSize.value.width}x${canvasSize.value.height}`);
  }
};

// Position bounds checking
const constrainStagePosition = () => {
  if (!stage.value) return;

  const currentPos = stage.value.position();
  const scale = stage.value.scaleX();
  const stageWidth = stage.value.width();
  const stageHeight = stage.value.height();

  // Calculate bounds - content should stay mostly visible
  // Tighter bounds to prevent canvas from going too far off-screen
  const maxOffsetX = stageWidth * 0.5;
  const maxOffsetY = stageHeight * 0.5;
  const minOffsetX = -stageWidth * 0.5;
  const minOffsetY = -stageHeight * 0.5;

  let constrainedX = Math.max(minOffsetX, Math.min(maxOffsetX, currentPos.x));
  let constrainedY = Math.max(minOffsetY, Math.min(maxOffsetY, currentPos.y));

  // Check for extreme positions that suggest a problem
  const isExtremePosition = Math.abs(currentPos.x) > stageWidth * 2 || Math.abs(currentPos.y) > stageHeight * 2;

  if (isExtremePosition) {
    console.warn('⚠️ Extreme canvas position detected, resetting to center');
    stage.value.position({ x: 0, y: 0 });
    return;
  }

  // Apply constraints if needed
  if (constrainedX !== currentPos.x || constrainedY !== currentPos.y) {
    stage.value.position({ x: constrainedX, y: constrainedY });
    console.log(`🔒 Stage position constrained to (${constrainedX.toFixed(1)}, ${constrainedY.toFixed(1)})`);
  }
};

// Zoom and pan functions
const applyZoom = (newScale: number, zoomPoint?: { x: number; y: number }) => {
  if (!stage.value) return;

  const limitedScale = Math.max(0.25, Math.min(3, newScale));
  zoomLevel.value = limitedScale;
  updateZoomDisplay();

  if (zoomPoint) {
    // Förenklad zoom-centrering
    const stage_w = stage.value.width();
    const stage_h = stage.value.height();

    const newPos = {
      x: stage_w / 2 - zoomPoint.x * limitedScale,
      y: stage_h / 2 - zoomPoint.y * limitedScale,
    };
    stage.value.position(newPos);
  }

  stage.value.scale({ x: limitedScale, y: limitedScale });

  // Ensure stage stays in bounds
  constrainStagePosition();

  stage.value.batchDraw();
};

const zoomIn = () => applyZoom(zoomLevel.value * 1.2);
const zoomOut = () => applyZoom(zoomLevel.value / 1.2);

const centerView = () => {
  if (!stage.value) return;

  // Reset to centered position
  stage.value.position({ x: 0, y: 0 });
  stage.value.scale({ x: 1, y: 1 });
  zoomLevel.value = 1;
  updateZoomDisplay();
  stage.value.batchDraw();

  console.log('🎯 View centered and reset');
};

const resetCanvasPosition = () => {
  if (!stage.value) return;

  console.log('🔄 Manually resetting canvas position');

  // Force reset everything to safe values
  stage.value.position({ x: 0, y: 0 });
  stage.value.scale({ x: 1, y: 1 });
  zoomLevel.value = 1;
  updateZoomDisplay();

  // Disable pan mode if active
  if (isPanMode.value) {
    isPanMode.value = false;
    stage.value.draggable(false);
    stage.value.container().style.cursor = 'default';
    stage.value.off('dragend.panmode');
  }

  // Recalculate and redraw everything
  calculateCanvasSize();
  updateStorageDisplay();
  updateBoatDisplay();

  console.log('✅ Canvas position reset complete');
};

const togglePanMode = () => {
  isPanMode.value = !isPanMode.value;
  if (stage.value) {
    stage.value.container().style.cursor = isPanMode.value ? 'grab' : 'default';
    stage.value.draggable(isPanMode.value);

    // Add drag bounds when enabling pan mode
    if (isPanMode.value) {
      stage.value.on('dragend.panmode', () => {
        constrainStagePosition();
      });
    } else {
      stage.value.off('dragend.panmode');
    }
  }
};

const setZoomFromPercentage = () => {
  const percentage = parseFloat(zoomPercentage.value.toString());
  if (isNaN(percentage) || percentage < 25 || percentage > 300) {
    updateZoomDisplay();
    return;
  }
  applyZoom(percentage / 100);
};

const updateZoomDisplay = () => {
  zoomPercentage.value = Math.round(zoomLevel.value * 100);
};

// Floor management
const setActiveFloor = (floor: number) => {
  activeFloor.value = floor;
  updateStorageDisplay();
  updateBoatDisplay();
  console.log(`🏢 Switched to floor ${floor}`);
};

// Drag and drop handlers
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = true;
  console.log('🎯 Drag entered canvas area');
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  // Only hide indicator if leaving the entire canvas container
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const isLeavingContainer =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (isLeavingContainer) {
    isDragOver.value = false;
    console.log('🎯 Drag left canvas area');
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;

  console.log('🎯 Drop event triggered');

  try {
    const boatDataStr = event.dataTransfer?.getData('application/json');
    if (!boatDataStr) {
      console.error('❌ No boat data in drop event');
      return;
    }

    const boatData = JSON.parse(boatDataStr);
    console.log('🎯 Parsed boat data:', boatData.name);

    if (!canvasContainer.value) {
      console.error('❌ Canvas container not found');
      return;
    }

    const rect = canvasContainer.value.getBoundingClientRect();

    // Calculate drop position relative to storage
    const dropX = event.clientX - rect.left;
    const dropY = event.clientY - rect.top;

    console.log(`🎯 Drop position: ${dropX}, ${dropY}`);
    console.log(`🎯 Storage offset: ${storageOffset.value.x}, ${storageOffset.value.y}`);
    console.log(`🎯 Pixels per meter: ${pixelsPerMeter.value}`);

    const storageX = (dropX - storageOffset.value.x) / pixelsPerMeter.value;
    const storageY = (dropY - storageOffset.value.y) / pixelsPerMeter.value;

    console.log(`🎯 Storage coordinates: ${storageX.toFixed(1)}, ${storageY.toFixed(1)}`);
    console.log(`🎯 Storage bounds: ${props.storage.width} x ${props.storage.height}`);

    // Check if boat is already placed
    const existingPlacement = props.placements.find(p => p.boat_id === boatData.id);
    if (existingPlacement) {
      console.log(`❌ Boat ${boatData.name} is already placed`);
      return;
    }

    // For warehouses: drop within storage bounds
    // For docks: drop within extended water area
    const isValidDrop = props.storage.type === 'warehouse'
      ? (storageX >= 0 && storageX <= props.storage.width && storageY >= 0 && storageY <= props.storage.height)
      : (storageX >= -8 && storageX <= props.storage.width + 8 && storageY >= -8 && storageY <= props.storage.height + 8); // Allowance for water area

    if (isValidDrop) {
      console.log(`✅ Valid drop position, emitting boat-placed event`);

      emit('boat-placed', {
        boat: boatData,
        position: { x: storageX, y: storageY, rotation: 0 }
      });

      console.log(`🎯 Boat ${boatData.name} dropped at (${storageX.toFixed(1)}, ${storageY.toFixed(1)})`);
    } else {
      console.log(`❌ Drop outside valid placement area`);
    }
  } catch (error) {
    console.error('❌ Failed to parse dropped boat data:', error);
  }
};

// Watchers
watch(() => props.storage, () => {
  calculateCanvasSize();
  updateStorageDisplay();
  updateBoatDisplay();
});

watch(() => props.placements, () => {
  updateBoatDisplay();
});

watch(activeFloor, () => {
  updateStorageDisplay();
  updateBoatDisplay();
});

// Periodic canvas position check
let positionCheckInterval: NodeJS.Timeout | null = null;

const startPositionCheck = () => {
  positionCheckInterval = setInterval(() => {
    if (stage.value) {
      constrainStagePosition();
    }
  }, 5000); // Check every 5 seconds
};

const stopPositionCheck = () => {
  if (positionCheckInterval) {
    clearInterval(positionCheckInterval);
    positionCheckInterval = null;
  }
};

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initCanvas();
    startPositionCheck(); // Start periodic position checking
  });
});

onUnmounted(() => {
  stopPositionCheck(); // Stop position checking
  window.removeEventListener('resize', handleResize);
  if (stage.value) {
    stage.value.destroy();
  }
});
</script>

<style scoped>
.boat-placement-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.placement-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.storage-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.storage-type {
  font-size: 0.75rem;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
}

.storage-dimensions {
  font-size: 0.75rem;
  color: #6b7280;
}

.toolbar-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

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
}

.floor-tab.active {
  background: #2563eb;
  border-color: #1d4ed8;
  color: white;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.toolbar-button.active {
  background: #2563eb;
  border-color: #1d4ed8;
  color: white;
}

.icon-button {
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.375rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.button-icon {
  width: 1rem;
  height: 1rem;
}

.zoom-input {
  width: 4rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  text-align: center;
}

.zoom-unit {
  font-size: 0.75rem;
  color: #6b7280;
  margin-left: -0.25rem;
}

.placement-stats {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;
}

.boat-controls {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.status-button {
  padding: 0.375rem 0.75rem;
  border: 1px solid;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.status-button.reserverad {
  background: #fef3c7;
  border-color: #d97706;
  color: #92400e;
}

.status-button.reserverad.active {
  background: #f59e0b;
  border-color: #d97706;
  color: white;
}

.status-button.placerad {
  background: #dcfce7;
  border-color: #16a34a;
  color: #15803d;
}

.status-button.placerad.active {
  background: #16a34a;
  border-color: #15803d;
  color: white;
}

.status-button:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

.reset-button {
  background: #fee2e2 !important;
  border-color: #fca5a5 !important;
  color: #dc2626 !important;
}

.reset-button:hover {
  background: #fecaca !important;
  border-color: #f87171 !important;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white;
}

.konva-canvas-wrapper {
  width: 100%;
  height: 100%;
}

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
}

.drop-zone-content {
  text-align: center;
  color: #3b82f6;
}

.drop-zone-icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 0.5rem;
}

.drop-zone-content p {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}
</style>
