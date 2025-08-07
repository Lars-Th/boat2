<template>
  <div class="storage-designer-container">
    <!-- Toolbar -->
    <div class="canvas-toolbar">
      <!-- Row 1: Basic Settings (Namn, Typ, Höjd, Bredd) -->
      <div class="toolbar-group">
        <span class="toolbar-label">Namn:</span>
        <div class="input-group">
          <input
            v-model="storageName"
            class="toolbar-input"
            type="text"
            placeholder="Namn på lager/brygga"
            maxlength="50"
          />
        </div>
      </div>

      <div class="toolbar-group">
        <span class="toolbar-label">Typ:</span>
        <div class="input-group">
          <select
            v-model="storageTypeDisplay"
            class="toolbar-input type-select"
          >
            <option value="Lager">Lager</option>
            <option value="Brygga">Brygga</option>
          </select>
        </div>
      </div>

      <div class="toolbar-group">
        <span class="toolbar-label">Höjd:</span>
        <div class="input-group">
          <input
            v-model.number="storageLength"
            class="toolbar-input"
            type="number"
            min="1"
            max="200"
            step="0.1"
            placeholder="Höjd (m)"
          />
          <span class="input-unit">m</span>
        </div>
      </div>

      <div class="toolbar-group">
        <span class="toolbar-label">Bredd:</span>
        <div class="input-group">
          <input
            v-model.number="storageWidth"
            class="toolbar-input"
            type="number"
            min="1"
            max="200"
            step="0.1"
            placeholder="Bredd (m)"
          />
          <span class="input-unit">m</span>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Floor Settings for Warehouse -->
      <template v-if="storageType === 'warehouse'" :key="`warehouse-${storageType}`">
        <div class="toolbar-group">
          <span class="toolbar-label">Våningar:</span>
          <div class="input-group">
            <Building class="input-icon" />
            <input
              v-model.number="levelCount"
              @input="updateFloorTabs"
              class="toolbar-input"
              type="number"
              min="1"
              max="10"
              step="1"
              title="Antal våningar (max 10)"
            />
            <span class="input-unit">st</span>
          </div>
        </div>

        <!-- Floor Navigation -->
        <div class="toolbar-group floor-navigation" v-if="levelCount > 1">
          <span class="toolbar-label">Nivå:</span>
          <div class="floor-tabs">
            <button
              v-for="floor in availableFloors"
              :key="floor"
              @click="setActiveFloor(floor)"
              class="floor-tab"
              :class="{ active: activeFloor === floor }"
              :title="`Våning ${floor}`"
            >
              {{ floor }}
            </button>
          </div>
        </div>
      </template>

      <!-- Dock Endpoint Settings -->
      <template v-if="storageType === 'dock'" :key="`dock-${storageType}`">
        <div class="toolbar-group">
          <span class="toolbar-label">Kortändar:</span>
          <div class="dock-endpoints">
            <div class="endpoint-group">
              <label class="endpoint-label">Vänster:</label>
              <select v-model="leftEndpoint" @change="updateDockDisplay" class="endpoint-select">
                <option value="water">Vatten</option>
                <option value="land">Land</option>
                <option value="dock">Annan brygga</option>
              </select>
            </div>
            <div class="endpoint-group">
              <label class="endpoint-label">Höger:</label>
              <select v-model="rightEndpoint" @change="updateDockDisplay" class="endpoint-select">
                <option value="water">Vatten</option>
                <option value="land">Land</option>
                <option value="dock">Annan brygga</option>
              </select>
            </div>
          </div>
        </div>
      </template>

      <!-- Floor Zones Section (for floors 2+ only) -->
      <template v-if="isStorageFloor">
        <div class="toolbar-separator"></div>

        <div class="zones-section">
          <h3 class="zones-section-title">Våning {{ activeFloor }} - Hyllor (max 1 yta)</h3>

          <!-- Row 1: Create + Manage + Edit -->
          <div class="zones-row">
            <div class="toolbar-group zone-create-group">
              <span class="toolbar-label">Skapa:</span>
              <button
                @click="startDrawingFloorZone()"
                class="toolbar-button create-zone-button"
                :class="{ active: isDrawingFloorMode }"
                :disabled="currentFloorZones.length >= 1"
                title="Rita ny hyllyta (max 1 per våning)"
              >
                <PlusIcon class="button-icon" />
                {{ isDrawingFloorMode ? 'Avbryt' : 'Rita' }}
              </button>
            </div>

            <div class="toolbar-group zone-manage-group">
              <span class="toolbar-label">Hantera:</span>
              <button @click="deleteSelectedFloorZone" class="toolbar-button" title="Ta bort vald yta" :disabled="!selectedFloorZone">
                <Trash2Icon class="button-icon" />
                Ta bort
              </button>
              <button @click="clearFloorSelection" class="toolbar-button" title="Avmarkera" :disabled="!selectedFloorZone">
                <XIcon class="button-icon" />
                Avmarkera
              </button>
            </div>

            <!-- Name editing in same row -->
            <div class="toolbar-group zone-editor-group" :class="{ disabled: !selectedFloorZone }">
              <span class="toolbar-label">Redigera:</span>
              <div class="input-group">
                <EditIcon class="input-icon" />
                <input
                  v-model="selectedFloorZoneName"
                  @input="updateSelectedFloorZone"
                  class="toolbar-input zone-name-input"
                  type="text"
                  placeholder="Namn på vald yta"
                  maxlength="30"
                  :disabled="!selectedFloorZone"
                />
              </div>
            </div>
          </div>

        <!-- Row 2: Measurements -->
        <div class="zones-row">
          <div class="toolbar-group zone-measurements-group" :class="{ disabled: !selectedFloorZone }">
            <span class="toolbar-label">Mått:</span>
            <div class="input-group">
              <Move class="input-icon" />
              <input
                v-model.number="selectedFloorZoneX"
                @input="updateSelectedFloorZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="X"
                :disabled="!selectedFloorZone"
              />
              <span class="input-unit">m</span>
            </div>

            <div class="input-group">
              <Move class="input-icon" />
              <input
                v-model.number="selectedFloorZoneY"
                @input="updateSelectedFloorZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="Y"
                :disabled="!selectedFloorZone"
              />
              <span class="input-unit">m</span>
            </div>

            <div class="input-group">
              <Ruler class="input-icon" />
              <input
                v-model.number="selectedFloorZoneWidth"
                @input="updateSelectedFloorZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0.5"
                step="0.1"
                placeholder="Bredd"
                :disabled="!selectedFloorZone"
              />
              <span class="input-unit">m</span>
            </div>

            <div class="input-group">
              <Ruler class="input-icon" />
              <input
                v-model.number="selectedFloorZoneHeight"
                @input="updateSelectedFloorZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0.5"
                step="0.1"
                placeholder="Höjd"
                :disabled="!selectedFloorZone"
              />
              <span class="input-unit">m</span>
            </div>
          </div>
        </div>
        </div>
      </template>

      <!-- Restriction Zones Section (only on main floor) -->
      <template v-if="isMainFloor && !isStorageFloor">
        <div class="toolbar-separator"></div>

        <div class="zones-section">
          <h3 class="zones-section-title">Begränsningsytor</h3>

        <!-- Row 1: Create + Manage + Edit -->
        <div class="zones-row">
          <div class="toolbar-group zone-create-group">
            <span class="toolbar-label">Skapa:</span>
            <button
              @click="startDrawingZone()"
              class="toolbar-button create-zone-button"
              :class="{ active: isDrawingMode }"
              title="Rita ny begränsningsyta"
            >
              <PlusIcon class="button-icon" />
              {{ isDrawingMode ? 'Avbryt' : 'Rita' }}
            </button>
          </div>

          <div class="toolbar-group zone-manage-group">
            <span class="toolbar-label">Hantera:</span>
            <button @click="deleteSelectedZone" class="toolbar-button" title="Ta bort vald yta" :disabled="!selectedZone">
              <Trash2Icon class="button-icon" />
              Ta bort
            </button>
            <button @click="clearSelection" class="toolbar-button" title="Avmarkera" :disabled="!selectedZone">
              <XIcon class="button-icon" />
              Avmarkera
            </button>
          </div>

          <div class="toolbar-group zone-editor-group" :class="{ disabled: !selectedZone }">
            <span class="toolbar-label">Redigera:</span>
            <div class="input-group">
              <EditIcon class="input-icon" />
              <input
                v-model="selectedZoneName"
                @input="updateSelectedZone"
                class="toolbar-input zone-name-input"
                type="text"
                placeholder="Namn på vald yta"
                maxlength="30"
                :disabled="!selectedZone"
              />
            </div>
          </div>
        </div>

        <!-- Row 2: Measurements -->
        <div class="zones-row">
          <div class="toolbar-group zone-measurements-group" :class="{ disabled: !selectedZone }">
            <span class="toolbar-label">Mått:</span>
            <div class="input-group">
              <Move class="input-icon" />
              <input
                v-model.number="selectedZoneX"
                @input="updateSelectedZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="X"
                :disabled="!selectedZone"
              />
              <span class="input-unit">m</span>
            </div>

            <div class="input-group">
              <Move class="input-icon" />
              <input
                v-model.number="selectedZoneY"
                @input="updateSelectedZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="Y"
                :disabled="!selectedZone"
              />
              <span class="input-unit">m</span>
            </div>

            <div class="input-group">
              <Ruler class="input-icon" />
              <input
                v-model.number="selectedZoneWidth"
                @input="updateSelectedZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0.5"
                step="0.1"
                placeholder="Bredd"
                :disabled="!selectedZone"
              />
              <span class="input-unit">m</span>
            </div>

            <div class="input-group">
              <Ruler class="input-icon" />
              <input
                v-model.number="selectedZoneHeight"
                @input="updateSelectedZone"
                class="toolbar-input measurement-input"
                type="number"
                min="0.5"
                step="0.1"
                placeholder="Höjd"
                :disabled="!selectedZone"
              />
              <span class="input-unit">m</span>
            </div>
          </div>
        </div>
        </div>
      </template>

      <!-- Zoom Controls -->
      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button @click="zoomOut" class="toolbar-button icon-button" title="Zooma ut">
          <ZoomOut class="button-icon" />
        </button>
        <div class="input-group">
          <input
            v-model="zoomPercentage"
            @change="setZoomFromPercentage"
            @keyup.enter="setZoomFromPercentage"
            @blur="updateZoomDisplay"
            class="toolbar-input zoom-input"
            type="number"
            min="25"
            max="300"
            step="25"
            title="Zoom procent"
          />
          <span class="input-unit">%</span>
        </div>
        <button @click="zoomIn" class="toolbar-button icon-button" title="Zooma in">
          <ZoomIn class="button-icon" />
        </button>
        <button @click="centerStorage" class="toolbar-button icon-button" title="Centrera lagret/bryggan">
          <Navigation2 class="button-icon" />
        </button>
        <button
          @click="togglePanMode"
          class="toolbar-button icon-button"
          :class="{ active: isPanMode }"
          title="Panorera canvas (dra för att flytta)"
        >
          <Move class="button-icon" />
        </button>

        <div class="input-group">
          <Grid3x3 class="input-icon" />
          <input
            v-model.number="gridSize"
            @input="updateStorageLayout"
            class="toolbar-input"
            type="number"
            min="1"
            max="20"
            step="1"
            placeholder="Grid"
          />
          <span class="input-unit">m</span>
        </div>
      </div>

    </div>

    <!-- Canvas Container -->
    <div class="canvas-container">
      <div ref="canvasContainer" class="konva-canvas-wrapper"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import Konva from 'konva';
// Lucide icons - matching BoatDetailCanvas design
import {
  Ruler,
  Move,
  Building,
  Grid3x3,
  Plus as PlusIcon,
  Trash2 as Trash2Icon,
  ZoomOut,
  ZoomIn,
  Navigation2,
  Edit as EditIcon,
  X as XIcon
} from 'lucide-vue-next';

// Restriction Zone interface
interface RestrictionZone {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Floor Zone interface
interface FloorZone {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Simplified Floor Design interface (one floor at a time)
interface FloorDesign {
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

// Storage design interface (for restriction zones)
interface StorageDesign {
  id: number;
  name: string;
  type: 'warehouse' | 'dock';
  length: number;
  width: number;
  levelCount?: number;
  restrictionZones: RestrictionZone[];
  // Dock-specific properties
  leftEndpoint?: 'water' | 'land' | 'dock';
  rightEndpoint?: 'water' | 'land' | 'dock';
  created: string;
  modified: string;
}

// Props
const props = withDefaults(defineProps<{
  initialStorageDesign?: StorageDesign;
  selectedStorageId?: number;
  selectedFloorNumber?: number;
  externalLength?: number;
  externalWidth?: number;
  externalName?: string;
  externalType?: string;
}>(), {
  selectedStorageId: 6, // Default to Båthall Nord
  selectedFloorNumber: 1, // Default to main floor
  externalLength: undefined,
  externalWidth: undefined,
  externalName: undefined,
  externalType: undefined
});

// Emits for two-way data binding
const emit = defineEmits<{
  'update:length': [value: number];
  'update:width': [value: number];
  'update:name': [value: string];
  'update:type': [value: string];
}>();

// Reactive data
const selectedStorageId = ref(props.selectedStorageId);
const storageType = ref<'warehouse' | 'dock'>(
  props.externalType === 'Brygga' ? 'dock' : 'warehouse'
);
const storageName = ref(props.externalName || 'Nytt Lager');
const storageLength = ref(props.externalLength || 50);
const storageWidth = ref(props.externalWidth || 30);
const levelCount = ref(1);

// Resize Observer for container changes
const resizeObserver = ref<ResizeObserver | null>(null);

// Dock endpoint settings
const leftEndpoint = ref<'water' | 'land' | 'dock'>('water');
const rightEndpoint = ref<'water' | 'land' | 'dock'>('land');

// Current floor design (simplified - one floor at a time)
const currentFloorDesign = ref<FloorDesign | null>(null);

// Loading guard to prevent multiple simultaneous loads
const isLoadingFloorDesign = ref(false);
const loadFloorDesignTimeout = ref<number | null>(null);

// Restriction zone settings
const isDrawingMode = ref(false);
const selectedZone = ref<RestrictionZone | null>(null);
const restrictionZones = ref<RestrictionZone[]>([]);
const nextZoneId = ref(1);

// Pan mode for canvas navigation
const isPanMode = ref(false);

// Computed for storage type display (maps internal values to display values)
const storageTypeDisplay = computed({
  get: () => storageType.value === 'dock' ? 'Brygga' : 'Lager',
  set: (value: string) => {
    if (value === 'Brygga') {
      storageType.value = 'dock';
    } else if (value === 'Lager') {
      storageType.value = 'warehouse';
    }
  }
});

// Floor settings (restored)
const activeFloor = ref(props.selectedFloorNumber || 1);
const availableFloors = computed(() => {
  const floors = [];
  for (let i = 1; i <= levelCount.value; i++) {
    floors.push(i);
  }
  return floors;
});
const isDrawingFloorMode = ref(false);
const selectedFloorZone = ref<FloorZone | null>(null);
const nextFloorZoneId = ref(1);

// Current floor zones (from simplified structure)
const currentFloorZones = computed(() => {
  return currentFloorDesign.value?.floor_zones || [];
});

// Computed properties for zone editing
const selectedZoneName = computed({
  get: () => selectedZone.value?.name || '',
  set: (value: string) => {
    if (selectedZone.value) {
      selectedZone.value.name = value;
    }
  }
});

const selectedZoneX = computed({
  get: () => selectedZone.value?.x || 0,
  set: (value: number) => {
    if (selectedZone.value) {
      selectedZone.value.x = value;
    }
  }
});

const selectedZoneY = computed({
  get: () => selectedZone.value?.y || 0,
  set: (value: number) => {
    if (selectedZone.value) {
      selectedZone.value.y = value;
    }
  }
});

const selectedZoneWidth = computed({
  get: () => selectedZone.value?.width || 0,
  set: (value: number) => {
    if (selectedZone.value) {
      selectedZone.value.width = value;
    }
  }
});

const selectedZoneHeight = computed({
  get: () => selectedZone.value?.height || 0,
  set: (value: number) => {
    if (selectedZone.value) {
      selectedZone.value.height = value;
    }
  }
});

// Computed properties for floor zone editing (restored)
const selectedFloorZoneName = computed({
  get: () => selectedFloorZone.value?.name || '',
  set: (value: string) => {
    if (selectedFloorZone.value) {
      selectedFloorZone.value.name = value;
    }
  }
});

const selectedFloorZoneX = computed({
  get: () => selectedFloorZone.value?.x || 0,
  set: (value: number) => {
    if (selectedFloorZone.value) {
      selectedFloorZone.value.x = value;
    }
  }
});

const selectedFloorZoneY = computed({
  get: () => selectedFloorZone.value?.y || 0,
  set: (value: number) => {
    if (selectedFloorZone.value) {
      selectedFloorZone.value.y = value;
    }
  }
});

const selectedFloorZoneWidth = computed({
  get: () => selectedFloorZone.value?.width || 0,
  set: (value: number) => {
    if (selectedFloorZone.value) {
      selectedFloorZone.value.width = value;
    }
  }
});

const selectedFloorZoneHeight = computed({
  get: () => selectedFloorZone.value?.height || 0,
  set: (value: number) => {
    if (selectedFloorZone.value) {
      selectedFloorZone.value.height = value;
    }
  }
});

// Check if current floor is main floor (for UI logic) - restored
const isMainFloor = computed(() => {
  // Only main floor (level 1) should show restriction zones
  return activeFloor.value === 1;
});

// Check if current floor is a storage floor (for floor zones) - restored
const isStorageFloor = computed(() => {
  // Only floors 2+ should show floor zones, but limit to 1 zone per floor
  return storageType.value === 'warehouse' && activeFloor.value > 1;
});

// Canvas settings
const canvasContainer = ref<HTMLElement>();
const zoomPercentage = ref(100);
const zoomLevel = ref(1.0);

// Konva objects
let stage: Konva.Stage;
let backgroundLayer: Konva.Layer;
let zonesLayer: Konva.Layer;
let uiLayer: Konva.Layer;

// Drawing state
let isDrawing = ref(false);
let startDrawPos = { x: 0, y: 0 };
let currentDrawRect: Konva.Rect | null = null;

// Dynamic canvas sizing
const canvasSize = ref({ width: 800, height: 600 });
const storageOffset = ref({ x: 50, y: 50 });
const pixelsPerMeter = ref(4);
const gridSize = ref(1); // Grid size in meters

// Zone styling - consistent for all restriction zones
const zoneStyle = {
  fill: '#FDE7E7',
  stroke: '#800000',
  strokeWidth: 1,
  opacity: 1.0,
  dash: [3, 3]
};

// Floor zone styling constants are defined inline where used

// Computed
const storagePixelSize = computed(() => ({
  width: storageLength.value * pixelsPerMeter.value,
  height: storageWidth.value * pixelsPerMeter.value,
}));

// Calculate optimal canvas size based on container
const calculateCanvasSize = () => {
  if (!canvasContainer.value) {
    return { width: 800, height: 600 };
  }

  // Get the actual container size
  const container = canvasContainer.value.closest('.storage-designer-container') as HTMLElement;
  if (!container) {
    return { width: 800, height: 600 };
  }

  const containerRect = container.getBoundingClientRect();

  // Fixed height to prevent infinite growth, dynamic width
  const availableHeight = 600; // Fixed height to prevent vertical growth loops
  const availableWidth = Math.max(300, containerRect.width - 20); // Dynamic width with minimum and padding

  return {
    width: availableWidth,
    height: availableHeight
  };
};

// Calculate optimal pixels per meter and storage offset for centering
const calculateStorageDisplay = () => {
  const canvas = canvasSize.value;
  const storage = { width: storageLength.value, height: storageWidth.value };

  // Calculate scale to fit storage in canvas with minimal padding
  const padding = 40; // Minimal padding for better space utilization
  const scaleX = (canvas.width - padding) / storage.width;
  const scaleY = (canvas.height - padding) / storage.height;
  const scale = Math.min(scaleX, scaleY, 8); // Max 8 pixels per meter

  // Calculate pixels per meter (min 2 for readability)
  const optimalPixelsPerMeter = Math.max(2, scale);

  // Calculate offset to center the storage
  const storagePixelWidth = storage.width * optimalPixelsPerMeter;
  const storagePixelHeight = storage.height * optimalPixelsPerMeter;
  const offsetX = (canvas.width - storagePixelWidth) / 2;
  const offsetY = (canvas.height - storagePixelHeight) / 2;

  return {
    pixelsPerMeter: optimalPixelsPerMeter,
    offset: { x: offsetX, y: offsetY }
  };
};

// Initialize canvas
const initCanvas = () => {
  if (!canvasContainer.value) return;

  // Force a minimum delay to ensure proper layout
  setTimeout(() => {
    if (!canvasContainer.value) return;

    // Calculate optimal canvas size for viewport
    canvasSize.value = calculateCanvasSize();

    // Calculate optimal display settings
    const displaySettings = calculateStorageDisplay();
    pixelsPerMeter.value = displaySettings.pixelsPerMeter;
    storageOffset.value = displaySettings.offset;

    // Ensure canvas uses full available size
    canvasContainer.value.style.width = `${canvasSize.value.width}px`;
    canvasContainer.value.style.height = `${canvasSize.value.height}px`;

    const wrapper = canvasContainer.value.parentElement;
    if (wrapper) {
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.background = 'white';
      wrapper.style.padding = '0';
      wrapper.style.margin = '0';
    }

    // Create stage
    stage = new Konva.Stage({
      container: canvasContainer.value as HTMLDivElement,
      width: canvasSize.value.width,
      height: canvasSize.value.height,
    });

    // Create layers
    backgroundLayer = new Konva.Layer();
    zonesLayer = new Konva.Layer();
    uiLayer = new Konva.Layer();

    stage.add(backgroundLayer);
    stage.add(zonesLayer);
    stage.add(uiLayer);

    // Setup mouse events for drawing
    setupDrawingEvents();

    // Draw initial layout
    updateStorageLayout();
    renderRestrictionZones();

    // Center storage on initial load
    centerStorage();

    // Load initial design if provided
    if (props.initialStorageDesign) {
      loadStorageDesign(props.initialStorageDesign);
    }

    // Add window resize listener
    window.addEventListener('resize', handleResize);

        // Setup ResizeObserver for container width changes only (parent container changes)
    if (canvasContainer.value && 'ResizeObserver' in window) {
      resizeObserver.value = new ResizeObserver((entries) => {
        // Only trigger on significant width changes to avoid infinite loops
        const entry = entries[0];
        if (entry && entry.contentRect) {
          const newWidth = entry.contentRect.width;
          const currentWidth = canvasSize.value.width;

          // Only resize if width difference is significant (>10px) to prevent micro-adjustments
          if (Math.abs(newWidth - currentWidth) > 10) {
            console.log('📏 Significant width change detected, resizing canvas');
            setTimeout(() => handleResize(), 100); // Debounce resize calls
          }
        }
      });

      // Observe the parent container (StorageLocationDetail), not the StorageDesigner container
      const parentContainer = canvasContainer.value.closest('.bg-background.rounded-lg.border.p-4') as HTMLElement;
      if (parentContainer) {
        resizeObserver.value.observe(parentContainer);
        console.log('📏 ResizeObserver attached to parent container for width changes only');
      }
    }

    stage.batchDraw();
  }, 100); // Short delay to ensure DOM is ready
};

// Setup drawing events
const setupDrawingEvents = () => {
    // Stage click to deselect (only if clicking on empty area)
  stage.on('click', (e) => {
    console.log('🖱️ Stage click detected:', {
      target: e.target.constructor.name,
      isDrawingMode: isDrawingMode.value,
      isDrawingFloorMode: isDrawingFloorMode.value,
      isStage: e.target === stage,
      activeFloor: activeFloor.value
    });

    // Only deselect if we specifically clicked on the stage itself (not on any child)
    if (e.target === stage && !isDrawingMode.value && !isDrawingFloorMode.value) {
      if (activeFloor.value === 1) {
        selectedZone.value = null;
        renderRestrictionZones();
      } else {
        selectedFloorZone.value = null;
        renderFloorZones();
      }
      console.log('🔘 Deselected all zones (clicked on empty stage)');
    }
  });

  // Mouse down - start drawing or panning
  stage.on('mousedown', () => {
    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Pan mode - start panning
    if (isPanMode.value) {
      isDrawing.value = true;
      startDrawPos = pos;
      if (stage) {
        stage.container().style.cursor = 'grabbing';
      }
      return;
    }

    // Drawing mode - start drawing
    const isDrawingAnyMode = isDrawingMode.value || isDrawingFloorMode.value;
    if (!isDrawingAnyMode) return;

    isDrawing.value = true;

    // Convert to storage-relative coordinates
    const storagePos = getStorageRelativePosition(pos);
    startDrawPos = storagePos;

    // Choose style based on current mode
    const currentStyle = isDrawingFloorMode.value ?
              { fill: '#EBF3FF', stroke: '#2563eb', strokeWidth: 1, dash: [5, 2] } :
      zoneStyle;

    // Create preview rectangle
    currentDrawRect = new Konva.Rect({
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      ...currentStyle,
      opacity: 0.7, // Slightly higher opacity for better preview visibility
      listening: false,
    });

    uiLayer.add(currentDrawRect);
    stage.batchDraw();
  });

  // Mouse move - update drawing or panning
  stage.on('mousemove', () => {
    if (!isDrawing.value) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    // Pan mode - move the stage
    if (isPanMode.value) {
      const dx = pos.x - startDrawPos.x;
      const dy = pos.y - startDrawPos.y;

      const currentPos = stage.position();
      stage.position({
        x: currentPos.x + dx,
        y: currentPos.y + dy
      });

      startDrawPos = pos;
      stage.batchDraw();
      return;
    }

    // Drawing mode - update rectangle
    if (!currentDrawRect) return;
    const endPos = getStorageRelativePosition(pos);

    // Calculate rectangle bounds
    let x = Math.min(startDrawPos.x, endPos.x);
    let y = Math.min(startDrawPos.y, endPos.y);
    let width = Math.abs(endPos.x - startDrawPos.x);
    let height = Math.abs(endPos.y - startDrawPos.y);

    // Apply storage constraints
    const constrained = constrainToStorage(x, y, width, height);

    // Update preview rectangle in screen coordinates with constrained values
    const screenPos = getScreenPosition({ x: constrained.x, y: constrained.y });
    const screenWidth = constrained.width * pixelsPerMeter.value;
    const screenHeight = constrained.height * pixelsPerMeter.value;

    currentDrawRect.setAttrs({
      x: screenPos.x,
      y: screenPos.y,
      width: screenWidth,
      height: screenHeight,
    });

    stage.batchDraw();
  });

  // Mouse up - finish drawing or panning
  stage.on('mouseup', () => {
    if (!isDrawing.value) return;

    // Pan mode - reset cursor and finish panning
    if (isPanMode.value) {
      isDrawing.value = false;
      if (stage) {
        stage.container().style.cursor = 'grab';
      }
      return;
    }

    // Drawing mode - finish drawing
    if (!currentDrawRect) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const endPos = getStorageRelativePosition(pos);

    // Calculate final zone dimensions
    let x = Math.min(startDrawPos.x, endPos.x);
    let y = Math.min(startDrawPos.y, endPos.y);
    let width = Math.abs(endPos.x - startDrawPos.x);
    let height = Math.abs(endPos.y - startDrawPos.y);

    // Apply storage constraints
    const constrained = constrainToStorage(x, y, width, height);

    // Only create zone if it has meaningful size
    if (constrained.width > 1 && constrained.height > 1) {
      if (isDrawingFloorMode.value) {
        createFloorZone(constrained.x, constrained.y, constrained.width, constrained.height);
      } else {
        createRestrictionZone(constrained.x, constrained.y, constrained.width, constrained.height);
      }
    }

    // Cleanup
    currentDrawRect.destroy();
    currentDrawRect = null;
    isDrawing.value = false;
    isDrawingMode.value = false;
    isDrawingFloorMode.value = false;

    stage.batchDraw();
  });
};

// Handle window resize
const handleResize = () => {
  setTimeout(() => {
    if (!stage || !canvasContainer.value) return;

    // Recalculate canvas size
    canvasSize.value = calculateCanvasSize();

    // Recalculate display settings
    const displaySettings = calculateStorageDisplay();
    pixelsPerMeter.value = displaySettings.pixelsPerMeter;
    storageOffset.value = displaySettings.offset;

    // Update canvas container size
    canvasContainer.value.style.width = `${canvasSize.value.width}px`;
    canvasContainer.value.style.height = `${canvasSize.value.height}px`;

    // Update wrapper styling
    const wrapper = canvasContainer.value.parentElement;
    if (wrapper) {
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.style.background = 'white';
      wrapper.style.padding = '0';
      wrapper.style.margin = '0';
    }

    // Resize stage
    stage.width(canvasSize.value.width);
    stage.height(canvasSize.value.height);

    // Redraw everything
    updateStorageLayout();
    renderRestrictionZones();
  }, 100);
};

// Convert screen position to storage-relative position (in meters)
const getStorageRelativePosition = (screenPos: { x: number; y: number }) => {
  return {
    x: (screenPos.x - storageOffset.value.x) / pixelsPerMeter.value,
    y: (screenPos.y - storageOffset.value.y) / pixelsPerMeter.value,
  };
};

// Apply storage bounds constraints to a position and size
const constrainToStorage = (x: number, y: number, width: number, height: number) => {
  // Constrain position
  const constrainedX = Math.max(0, Math.min(x, storageLength.value - width));
  const constrainedY = Math.max(0, Math.min(y, storageWidth.value - height));

  // Constrain size to fit within storage from constrained position
  const constrainedWidth = Math.max(0.5, Math.min(width, storageLength.value - constrainedX));
  const constrainedHeight = Math.max(0.5, Math.min(height, storageWidth.value - constrainedY));

  return {
    x: constrainedX,
    y: constrainedY,
    width: constrainedWidth,
    height: constrainedHeight
  };
};

// Convert storage-relative position to screen position
const getScreenPosition = (storagePos: { x: number; y: number }) => {
  return {
    x: storagePos.x * pixelsPerMeter.value + storageOffset.value.x,
    y: storagePos.y * pixelsPerMeter.value + storageOffset.value.y,
  };
};

// Update storage layout when dimensions change
const updateStorageLayout = () => {
  if (!backgroundLayer) return;

  backgroundLayer.destroyChildren();

  // Draw background
  const background = new Konva.Rect({
    x: 0,
    y: 0,
    width: canvasSize.value.width,
    height: canvasSize.value.height,
    fill: '#ffffff', // White background like BoatDetailCanvas
    listening: false,
  });
  backgroundLayer.add(background);

  // Determine if storage should be dimmed (when on floors 2+)
  const shouldDimStorage = !isMainFloor.value;

  // Draw storage area
  const pixelSize = storagePixelSize.value;
  const storageRect = new Konva.Rect({
    x: storageOffset.value.x,
    y: storageOffset.value.y,
    width: pixelSize.width,
    height: pixelSize.height,
    fill: storageType.value === 'warehouse' ? '#FDFAF0' : '#E7F3FF', // Light cream for warehouse, light blue for dock
    stroke: storageType.value === 'warehouse' ? '#B46100' : '#2563eb', // Brown for warehouse, blue for dock
    strokeWidth: 2,
    dash: [], // Solid border for all storage types
    opacity: shouldDimStorage ? 0.3 : 1.0, // Dim when editing upper floors
    listening: false,
  });
  backgroundLayer.add(storageRect);

  // Add storage label above the storage area
  const fontSize = Math.max(12, pixelsPerMeter.value * 2);
  const labelText = activeFloor.value === 1
    ? (storageType.value === 'warehouse' ? `${storageName.value} våning 1` : storageName.value)
    : `${storageName.value} våning ${activeFloor.value}`;

  const label = new Konva.Text({
    x: storageOffset.value.x,
    y: storageOffset.value.y - fontSize - 10, // Position above the storage area
    text: labelText,
    fontSize: fontSize,
    fill: shouldDimStorage ? '#9ca3af' : '#1f2937', // Dimmed text for upper floors
    fontFamily: 'Arial',
    fontStyle: 'bold',
    listening: false,
  });
  backgroundLayer.add(label);

  // Draw dock endpoints if it's a dock
  if (storageType.value === 'dock') {
    drawDockEndpoints();
  }

  // Draw grid
  drawGrid();

  backgroundLayer.batchDraw();

  // Keep storage centered after layout updates
  if (stage && stage.scale().x > 0) {
    centerStorage();
  }
};

// Draw dock endpoints
const drawDockEndpoints = () => {
  const pixelSize = storagePixelSize.value;
  const endpointWidth = 8; // Width of endpoint indicator
  const endpointHeight = pixelSize.height; // Full height of dock

  // Left endpoint
  const leftColor = getEndpointColor(leftEndpoint.value);
  const leftRect = new Konva.Rect({
    x: storageOffset.value.x - endpointWidth,
    y: storageOffset.value.y,
    width: endpointWidth,
    height: endpointHeight,
    fill: leftColor.fill,
    stroke: leftColor.stroke,
    strokeWidth: 2,
    listening: false,
  });
  backgroundLayer.add(leftRect);

  // Right endpoint
  const rightColor = getEndpointColor(rightEndpoint.value);
  const rightRect = new Konva.Rect({
    x: storageOffset.value.x + pixelSize.width,
    y: storageOffset.value.y,
    width: endpointWidth,
    height: endpointHeight,
    fill: rightColor.fill,
    stroke: rightColor.stroke,
    strokeWidth: 2,
    listening: false,
  });
  backgroundLayer.add(rightRect);
};

// Get colors for dock endpoints
const getEndpointColor = (endpointType: 'water' | 'land' | 'dock') => {
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

// Update dock display when endpoints change
const updateDockDisplay = () => {
  if (storageType.value === 'dock') {
    updateStorageLayout();
  }
};

// Draw grid
const drawGrid = () => {
  const pixelSize = storagePixelSize.value;
  const gridSpacing = gridSize.value * pixelsPerMeter.value; // User-defined grid

  // Vertical lines within storage
  for (let x = gridSpacing; x < pixelSize.width; x += gridSpacing) {
    const line = new Konva.Line({
      points: [storageOffset.value.x + x, storageOffset.value.y, storageOffset.value.x + x, storageOffset.value.y + pixelSize.height],
      stroke: '#FFDEB7',
      strokeWidth: 0.5,
      opacity: 0.8,
      listening: false,
    });
    backgroundLayer.add(line);
  }

  // Horizontal lines within storage
  for (let y = gridSpacing; y < pixelSize.height; y += gridSpacing) {
    const line = new Konva.Line({
      points: [storageOffset.value.x, storageOffset.value.y + y, storageOffset.value.x + pixelSize.width, storageOffset.value.y + y],
      stroke: '#FFDEB7',
      strokeWidth: 0.5,
      opacity: 0.8,
      listening: false,
    });
    backgroundLayer.add(line);
  }
};

// Create restriction zone
const createRestrictionZone = (x: number, y: number, width: number, height: number) => {
  const zone: RestrictionZone = {
    id: nextZoneId.value,
    name: `BY ${nextZoneId.value}`,
    x,
    y,
    width,
    height,
  };

  nextZoneId.value++;

  restrictionZones.value.push(zone);
  renderRestrictionZones();

  console.log('✅ Created restriction zone (bounded):', {
    x: x.toFixed(1),
    y: y.toFixed(1),
    width: width.toFixed(1),
    height: height.toFixed(1),
    withinBounds: `${x + width <= storageLength.value} x ${y + height <= storageWidth.value}`
  });
};

// Removed duplicate createFloorZone function (keeping the one with 1-zone limit)

// Render all restriction zones
const renderRestrictionZones = () => {
  if (!zonesLayer) return;

  console.log(`🔄 Rendering ${restrictionZones.value.length} restriction zones...`);
  zonesLayer.destroyChildren();

    restrictionZones.value.forEach((zone, index) => {
    console.log(`📦 Rendering zone ${index + 1}: ${zone.name} at (${zone.x}, ${zone.y})`);
    const screenPos = getScreenPosition({ x: zone.x, y: zone.y });
    const pixelWidth = zone.width * pixelsPerMeter.value;
    const pixelHeight = zone.height * pixelsPerMeter.value;

    // Create a group to hold both rectangle and text together
    const zoneGroup = new Konva.Group({
      x: screenPos.x,
      y: screenPos.y,
      draggable: true,
      listening: true,
      name: `zone-${zone.id}`, // Add name for debugging
    });

    // Determine if this zone is selected and apply visual states
    const isSelected = selectedZone.value?.id === zone.id;
    const isOtherSelected = selectedZone.value && selectedZone.value.id !== zone.id;

    const rect = new Konva.Rect({
      x: 0, // Relative to group
      y: 0, // Relative to group
      width: pixelWidth,
      height: pixelHeight,
      ...zoneStyle,
      opacity: isOtherSelected ? 0.3 : 1.0, // Dim unselected zones
      listening: true, // Enable clicking on rect too
    });

        // Add label (centered in the middle of the zone, relative to group)
    const text = new Konva.Text({
      x: pixelWidth / 2,
      y: pixelHeight / 2,
      text: zone.name,
      fontSize: 10,
      fill: isOtherSelected ? '#a0a0a0' : '#800000', // Dim text color for unselected zones
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 0, // Will be set based on text width
      offsetY: 5, // Half of fontSize to center vertically
      listening: true, // Enable clicking on text too
    });

    // Center the text properly by setting offsetX to half the text width
    text.offsetX(text.width() / 2);

    // Enhanced highlight if selected
    if (isSelected) {
      rect.strokeWidth(3);
      rect.stroke('#000000');
      rect.dash([5, 5]);
      // Add a subtle glow effect for selected zone
      rect.shadowColor('black');
      rect.shadowBlur(5);
      rect.shadowOpacity(0.3);
    }

    // Create the selection function
    const selectThisZone = (e: any) => {
      e.cancelBubble = true;
      if (e.evt) e.evt.stopPropagation();
      selectedZone.value = zone;
      console.log(`🎯 Selected zone: ${zone.name} (ID: ${zone.id})`);
      renderRestrictionZones();
    };

    // Add click handlers to multiple elements for reliability
    rect.on('click', selectThisZone);
    text.on('click', selectThisZone);
    zoneGroup.on('click', selectThisZone);

    // Add rect and text to group
    zoneGroup.add(rect);
    zoneGroup.add(text);

    // Add visual feedback for interactivity
    const addHoverEffects = (element: any) => {
      element.on('mouseenter', () => {
        if (!isSelected) {
          rect.opacity(0.8);
          stage.batchDraw();
        }
        stage.container().style.cursor = 'grab';
      });

      element.on('mouseleave', () => {
        if (!isSelected) {
          rect.opacity(isOtherSelected ? 0.3 : 1.0);
          stage.batchDraw();
        }
        stage.container().style.cursor = 'default';
      });
    };

    // Add hover effects to all clickable elements
    addHoverEffects(rect);
    addHoverEffects(text);
    addHoverEffects(zoneGroup);

    // Drag to move - with bounds checking (on group)
    zoneGroup.on('dragstart', () => {
      stage.container().style.cursor = 'grabbing';
      console.log(`🚀 Started dragging zone: ${zone.name}`);
    });

    zoneGroup.on('dragmove', () => {
      const newPos = getStorageRelativePosition({ x: zoneGroup.x(), y: zoneGroup.y() });

      // Apply storage constraints
      const constrained = constrainToStorage(newPos.x, newPos.y, zone.width, zone.height);

      // Update zone position
      zone.x = constrained.x;
      zone.y = constrained.y;

      // Update group position to match constrained values
      const screenPos = getScreenPosition({ x: constrained.x, y: constrained.y });
      zoneGroup.position({ x: screenPos.x, y: screenPos.y });
    });

    zoneGroup.on('dragend', () => {
      stage.container().style.cursor = 'grab'; // Keep grab cursor since we're still hovering
      console.log(`✅ Finished dragging zone: ${zone.name} to (${zone.x.toFixed(1)}, ${zone.y.toFixed(1)})`);
    });

    zonesLayer.add(zoneGroup);
  });

  zonesLayer.batchDraw();
};

// Tool functions
const startDrawingZone = () => {
  isDrawingMode.value = !isDrawingMode.value;
  selectedZone.value = null;

  // Disable pan mode when starting to draw
  if (isDrawingMode.value && isPanMode.value) {
    isPanMode.value = false;
    if (stage) {
      stage.container().style.cursor = 'default';
    }
  }

  console.log(`🎯 ${isDrawingMode.value ? 'Starting to draw new restriction zone...' : 'Stopped drawing'}`);
};

const deleteSelectedZone = () => {
  if (!selectedZone.value) return;

  restrictionZones.value = restrictionZones.value.filter(z => z.id !== selectedZone.value?.id);
  selectedZone.value = null;
  renderRestrictionZones();
};

// Zone editing functions
const updateSelectedZone = () => {
  if (!selectedZone.value) return;

  // Apply storage constraints
  const constrained = constrainToStorage(
    selectedZone.value.x,
    selectedZone.value.y,
    selectedZone.value.width,
    selectedZone.value.height
  );

  // Update zone with constrained values
  selectedZone.value.x = constrained.x;
  selectedZone.value.y = constrained.y;
  selectedZone.value.width = constrained.width;
  selectedZone.value.height = constrained.height;

  // Re-render zones to update visual representation
  renderRestrictionZones();

  console.log('✏️ Updated zone:', {
    name: selectedZone.value.name,
    x: selectedZone.value.x.toFixed(1),
    y: selectedZone.value.y.toFixed(1),
    width: selectedZone.value.width.toFixed(1),
    height: selectedZone.value.height.toFixed(1)
  });
};

const clearSelection = () => {
  selectedZone.value = null;
  renderRestrictionZones();
  console.log('❌ Manually cleared zone selection');
};

// Simplified floor functions
const loadRestrictionZones = async () => {
  try {
    const response = await fetch('/src/assets/data/storageRestrictions.json');
    const restrictionData = await response.json();

    // Find restriction zones for current storage
    const storageRestrictions = restrictionData.find((entry: any) =>
      entry.storage_id === selectedStorageId.value
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

      // Update next zone ID to avoid conflicts
      if (restrictionZones.value.length > 0) {
        nextZoneId.value = Math.max(...restrictionZones.value.map(z => z.id), 0) + 1;
      }

      console.log(`🛡️ Loaded ${restrictionZones.value.length} restriction zones for storage ${selectedStorageId.value}`);
    } else {
      // No restriction zones found - start with empty array
      restrictionZones.value = [];
      nextZoneId.value = 1;
      console.log(`🛡️ No restriction zones found for storage ${selectedStorageId.value}`);
    }
  } catch (error) {
    console.error('❌ Failed to load restriction zones:', error);
    restrictionZones.value = [];
    nextZoneId.value = 1;
  }
};

const loadFloorDesign = async () => {
  // Prevent multiple simultaneous loads
  if (isLoadingFloorDesign.value) {
    console.log('⏳ Floor design already loading, skipping...');
    return;
  }

  isLoadingFloorDesign.value = true;

  try {
    // Load storage unit from storageUnits.json
    const storageResponse = await fetch('/src/assets/data/storageUnits.json');
    const storageUnits = await storageResponse.json();
    const storageUnit = storageUnits.find((unit: any) => unit.id === selectedStorageId.value);

    if (storageUnit) {
      // Map unit_type from JSON to component storageType
      storageType.value = storageUnit.unit_type; // warehouse or dock directly
      console.log(`🏗️ Storage type set to: ${storageType.value} (from unit_type: ${storageUnit.unit_type})`);

      // Use level_count directly from JSON
      levelCount.value = Math.min(storageUnit.level_count || 1, 10); // Max 10 levels as per UI constraint
      console.log(`🏢 Level count from JSON: ${levelCount.value} våningar`);

      // Set storage name directly from JSON
      storageName.value = storageUnit.name;
      console.log(`📝 Storage name set to: ${storageName.value}`);

      // Set dimensions directly from JSON
      if (storageUnit.length && storageUnit.width) {
        storageLength.value = storageUnit.length;
        storageWidth.value = storageUnit.width;
        console.log(`📏 Dimensions from JSON: ${storageLength.value} x ${storageWidth.value} meters`);
      } else {
        // Fallback dimensions if not specified
        storageLength.value = storageType.value === 'dock' ? 30.0 : 50.0;
        storageWidth.value = storageType.value === 'dock' ? 15.0 : 30.0;
        console.log(`📏 Using fallback dimensions: ${storageLength.value} x ${storageWidth.value} meters`);
      }
    } else {
      console.warn(`⚠️ Storage unit with ID ${selectedStorageId.value} not found in storageUnits.json`);
      // Set defaults
      storageType.value = 'warehouse';
      levelCount.value = 1;
      storageName.value = 'Okänt Lager';
      storageLength.value = 50.0;
      storageWidth.value = 30.0;
    }

    // Load restriction zones for this storage (main floor data)
    await loadRestrictionZones();

    // Ensure active floor is valid for this storage
    if (activeFloor.value > levelCount.value) {
      activeFloor.value = 1;
      console.log(`🔄 Reset active floor to 1 (max available: ${levelCount.value})`);
    }

    // Update floor tabs after level count is loaded
    updateFloorTabs();

    // Load the specific floor design from JSON
    const response = await fetch('/src/assets/data/storageFloors.json');
    const floorDesigns: FloorDesign[] = await response.json();

    // Find the floor design for current storage and floor
    const targetDesign = floorDesigns.find(design =>
      design.storage_id === selectedStorageId.value &&
      design.floor_number === activeFloor.value
    );

    if (targetDesign) {
      currentFloorDesign.value = targetDesign;

      // Note: Storage name and dimensions now come from storageUnits.json, not floor design
      // Only load floor-specific data (zones) from floor design
      console.log(`📶 Loaded floor design: ${targetDesign.storage_name} - ${targetDesign.floor_name}`);
      console.log(`📦 Floor zones loaded: ${targetDesign.floor_zones.length} zones`);
    } else {
      // Create new floor design if none exists
      currentFloorDesign.value = {
        id: Date.now(),
        storage_id: selectedStorageId.value,
        storage_name: storageName.value,
        floor_number: activeFloor.value,
        floor_name: `Våning ${activeFloor.value}`,
        is_main_floor: activeFloor.value === 1,
        floor_zones: [],
        storage_dimensions: {
          length: storageLength.value,
          width: storageWidth.value
        },
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };

      console.log(`🆕 Created new floor design: ${currentFloorDesign.value.floor_name}`);
    }

    updateActiveFloorDisplay();
  } catch (error) {
    console.error('❌ Failed to load floor design:', error);
  } finally {
    isLoadingFloorDesign.value = false;
  }
};

const updateFloorTabs = () => {
  // Reset to floor 1 if current floor exceeds available floors
  if (activeFloor.value > levelCount.value) {
    activeFloor.value = 1;
  }

  // Don't reload data here, just update UI - the activeFloor watcher will handle data loading
  console.log(`🏢 Updated floor tabs, active floor: ${activeFloor.value}`);
};

const setActiveFloor = (floorNumber: number) => {
  activeFloor.value = floorNumber;
  selectedFloorZone.value = null;
  selectedZone.value = null;

  // The activeFloor watcher will handle loading the design
  console.log(`🏢 Switched to floor ${floorNumber}`);
};

const updateActiveFloorDisplay = () => {
  if (!stage || !backgroundLayer || !zonesLayer) return;

  // Update storage layout with floor-specific styling
  updateStorageLayout();

  if (isMainFloor.value) {
    // Main floor - show restriction zones (max unlimited per floor)
    renderRestrictionZones();
    console.log('🏢 Displaying main floor - restriction zones');
  } else if (isStorageFloor.value) {
    // Upper floor - show floor zones (max 1 per floor)
    renderFloorZones();
    console.log('🏢 Displaying storage floor - floor zones (max 1)');
  }
};

// Floor zone drawing functions (restored with 1-zone limit)
const startDrawingFloorZone = () => {
  // Check if we already have 1 zone on this floor
  if (currentFloorZones.value.length >= 1) {
    console.log('❌ Cannot create more than 1 zone per floor');
    return;
  }

  isDrawingFloorMode.value = !isDrawingFloorMode.value;
  selectedFloorZone.value = null;

  // Disable pan mode when starting to draw
  if (isDrawingFloorMode.value && isPanMode.value) {
    isPanMode.value = false;
    if (stage) {
      stage.container().style.cursor = 'default';
    }
  }

  console.log(`🎯 ${isDrawingFloorMode.value ? 'Starting to draw new floor zone...' : 'Stopped drawing floor zone'}`);
};

const deleteSelectedFloorZone = () => {
  if (!selectedFloorZone.value || !currentFloorDesign.value) return;

  currentFloorDesign.value.floor_zones = currentFloorDesign.value.floor_zones.filter(z => z.id !== selectedFloorZone.value?.id);
  selectedFloorZone.value = null;
  renderFloorZones();
};

const clearFloorSelection = () => {
  selectedFloorZone.value = null;
  renderFloorZones();
  console.log('❌ Manually cleared floor zone selection');
};

// Floor zone editing functions
const updateSelectedFloorZone = () => {
  if (!selectedFloorZone.value) return;

  // Apply storage constraints
  const constrained = constrainToStorage(
    selectedFloorZone.value.x,
    selectedFloorZone.value.y,
    selectedFloorZone.value.width,
    selectedFloorZone.value.height
  );

  // Update floor zone with constrained values
  selectedFloorZone.value.x = constrained.x;
  selectedFloorZone.value.y = constrained.y;
  selectedFloorZone.value.width = constrained.width;
  selectedFloorZone.value.height = constrained.height;

  // Re-render floor zones to update visual representation
  renderFloorZones();

  console.log('✏️ Updated floor zone:', {
    name: selectedFloorZone.value.name,
    x: selectedFloorZone.value.x.toFixed(1),
    y: selectedFloorZone.value.y.toFixed(1),
    width: selectedFloorZone.value.width.toFixed(1),
    height: selectedFloorZone.value.height.toFixed(1)
  });
};

// Create floor zone (limited to 1 per floor)
const createFloorZone = (x: number, y: number, width: number, height: number) => {
  if (!currentFloorDesign.value) return;

  // Check if we already have 1 zone on this floor
  if (currentFloorDesign.value.floor_zones.length >= 1) {
    console.log('❌ Cannot create more than 1 zone per floor');
    return;
  }

  const zone: FloorZone = {
    id: nextFloorZoneId.value,
    name: `V${activeFloor.value}-1`, // Always "1" since only 1 zone per floor
    x,
    y,
    width,
    height,
  };

  nextFloorZoneId.value++;

  currentFloorDesign.value.floor_zones.push(zone);
  renderFloorZones();

  console.log('✅ Created floor zone (1 per floor limit):', {
    floor: activeFloor.value,
    x: x.toFixed(1),
    y: y.toFixed(1),
    width: width.toFixed(1),
    height: height.toFixed(1)
  });
};

// Render floor zones
const renderFloorZones = () => {
  if (!zonesLayer || !currentFloorDesign.value) return;

  zonesLayer.destroyChildren();

  currentFloorDesign.value.floor_zones.forEach((zone: FloorZone) => {
    const screenPos = getScreenPosition({ x: zone.x, y: zone.y });
    const pixelWidth = zone.width * pixelsPerMeter.value;
    const pixelHeight = zone.height * pixelsPerMeter.value;

    const isSelected = selectedFloorZone.value?.id === zone.id;

    // Create a group to hold both rectangle and text together
    const zoneGroup = new Konva.Group({
      x: screenPos.x,
      y: screenPos.y,
      draggable: true,
      listening: true,
      name: `floor-zone-${zone.id}`,
    });

    // Create zone rectangle (relative to group)
    const rect = new Konva.Rect({
      x: 0, // Relative to group
      y: 0, // Relative to group
      width: pixelWidth,
      height: pixelHeight,
      fill: '#EBF3FF',
              stroke: '#2563eb',
      strokeWidth: isSelected ? 3 : 1,
      dash: [5, 2],
      opacity: 1.0,
      listening: true
    });

    // Create zone text (centered in the middle of the zone, relative to group)
    const fontSize = Math.max(10, pixelsPerMeter.value * 1.5);
    const text = new Konva.Text({
      x: pixelWidth / 2,
      y: pixelHeight / 2,
      text: zone.name,
      fontSize: fontSize,
              fill: '#2563eb',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
      verticalAlign: 'middle',
      offsetX: 0,
      offsetY: fontSize / 2,
      listening: true
    });

    // Center the text properly by setting offsetX to half the text width
    text.offsetX(text.width() / 2);

    // Enhanced highlight if selected
    if (isSelected) {
      rect.shadowColor('black');
      rect.shadowBlur(8);
      rect.shadowOpacity(0.3);
    }

    zoneGroup.add(rect);
    zoneGroup.add(text);

    // Click handler for zone group (select/deselect zones)
    zoneGroup.on('click', (e) => {
      e.cancelBubble = true;
      e.evt.stopPropagation();

      if (selectedFloorZone.value?.id === zone.id) {
        // Deselect if already selected
        selectedFloorZone.value = null;
      } else {
        // Select this zone
        selectedFloorZone.value = zone;
      }
      renderFloorZones();
      console.log(`👆 Floor zone clicked: ${zone.name} (${selectedFloorZone.value ? 'selected' : 'deselected'})`);
    });

    // Add visual feedback for interactivity
    const addHoverEffects = (element: any) => {
      element.on('mouseenter', () => {
        if (!isSelected) {
          rect.opacity(0.8);
          stage.batchDraw();
        }
        stage.container().style.cursor = 'grab';
      });

      element.on('mouseleave', () => {
        if (!isSelected) {
          rect.opacity(1.0);
          stage.batchDraw();
        }
        stage.container().style.cursor = 'default';
      });
    };

    // Apply hover effects to all interactive elements
    addHoverEffects(rect);
    addHoverEffects(text);
    addHoverEffects(zoneGroup);

    // Drag handlers
    zoneGroup.on('dragstart', () => {
      stage.container().style.cursor = 'grabbing';
    });

    zoneGroup.on('dragmove', () => {
      const pos = zoneGroup.position();
      const storagePos = getStorageRelativePosition(pos);

      // Apply storage constraints
      const constrained = constrainToStorage(storagePos.x, storagePos.y, zone.width, zone.height);

      // Update zone data
      zone.x = constrained.x;
      zone.y = constrained.y;

      const newScreenPos = getScreenPosition({ x: constrained.x, y: constrained.y });
      zoneGroup.position(newScreenPos);
    });

    zoneGroup.on('dragend', () => {
      stage.container().style.cursor = 'grab';
      const finalPos = getStorageRelativePosition(zoneGroup.position());

      // Apply final storage constraints
      const constrained = constrainToStorage(finalPos.x, finalPos.y, zone.width, zone.height);
      zone.x = constrained.x;
      zone.y = constrained.y;

      console.log(`📍 Floor zone "${zone.name}" moved to: (${zone.x.toFixed(1)}, ${zone.y.toFixed(1)})`);
    });

    zonesLayer.add(zoneGroup);
  });

  zonesLayer.batchDraw();
};

// Removed duplicate renderFloorZones function

// Zoom functions
const zoomIn = () => {
  const newScale = Math.min(zoomLevel.value * 1.2, 3.0);
  applyZoom(newScale);
};

const zoomOut = () => {
  const newScale = Math.max(zoomLevel.value / 1.2, 0.25);
  applyZoom(newScale);
};

const applyZoom = (newScale: number) => {
  if (!stage) return;

  const oldScale = zoomLevel.value;

  // Calculate storage center in canvas coordinates
  const storageCenter = {
    x: storageOffset.value.x + storagePixelSize.value.width / 2,
    y: storageOffset.value.y + storagePixelSize.value.height / 2
  };

  // Calculate canvas center
  const canvasCenter = {
    x: canvasSize.value.width / 2,
    y: canvasSize.value.height / 2
  };

  // Calculate current stage position
  const currentPos = stage.position();

  // Calculate the point we want to zoom around (storage center in stage coordinates)
  const zoomPoint = {
    x: (storageCenter.x - currentPos.x) / oldScale,
    y: (storageCenter.y - currentPos.y) / oldScale
  };

  // Apply new scale
  zoomLevel.value = newScale;
  stage.scale({ x: newScale, y: newScale });

  // Calculate new position to keep storage center in view center
  const newPos = {
    x: canvasCenter.x - zoomPoint.x * newScale,
    y: canvasCenter.y - zoomPoint.y * newScale
  };

  stage.position(newPos);
  stage.batchDraw();
  updateZoomDisplay();
};

// Center storage in viewport
const centerStorage = () => {
  if (!stage) return;

  // Calculate storage center in its local coordinates
  const storageCenter = {
    x: storageOffset.value.x + storagePixelSize.value.width / 2,
    y: storageOffset.value.y + storagePixelSize.value.height / 2
  };

  // Calculate canvas center
  const canvasCenter = {
    x: canvasSize.value.width / 2,
    y: canvasSize.value.height / 2
  };

  // Calculate position to center storage
  const currentScale = zoomLevel.value;
  const newPos = {
    x: canvasCenter.x - storageCenter.x * currentScale,
    y: canvasCenter.y - storageCenter.y * currentScale
  };

  stage.position(newPos);
  stage.batchDraw();
};

// Toggle pan mode
const togglePanMode = () => {
  isPanMode.value = !isPanMode.value;

  // Disable drawing modes when pan is active
  if (isPanMode.value) {
    isDrawingMode.value = false;
    isDrawingFloorMode.value = false;
  }

  // Update cursor style
  if (stage) {
    stage.container().style.cursor = isPanMode.value ? 'grab' : 'default';
  }

  console.log(`🖱️ Pan mode ${isPanMode.value ? 'activated' : 'deactivated'}`);
};

const setZoomFromPercentage = () => {
  const percentage = parseFloat(zoomPercentage.value.toString());
  if (isNaN(percentage) || percentage < 25 || percentage > 300) {
    updateZoomDisplay();
    return;
  }
  const newScale = percentage / 100;
  applyZoom(newScale);
};

const updateZoomDisplay = () => {
  const newPercentage = Math.round(zoomLevel.value * 100);
  zoomPercentage.value = newPercentage;
};

// Save functions - simplified for single floor
const saveFloorDesign = () => {
  if (!currentFloorDesign.value) return;

  // Update modified timestamp
  currentFloorDesign.value.modified = new Date().toISOString();

  try {
    const storageKey = `floor-design-${currentFloorDesign.value.storage_id}-${currentFloorDesign.value.floor_number}`;
    localStorage.setItem(storageKey, JSON.stringify(currentFloorDesign.value));
    console.log(`💾 Floor design saved: ${currentFloorDesign.value.storage_name} - ${currentFloorDesign.value.floor_name}`);
  } catch (error) {
    console.error('❌ Failed to save floor design:', error);
  }
};

// Backwards compatibility - save restriction zones as StorageDesign
const saveStorageDesign = () => {
  const design: StorageDesign = {
    id: 1,
    name: storageName.value || 'Untitled Storage',
    type: storageType.value,
    length: storageLength.value,
    width: storageWidth.value,
    levelCount: storageType.value === 'warehouse' ? levelCount.value : undefined,
    restrictionZones: restrictionZones.value,
    // Include dock endpoints if it's a dock
    leftEndpoint: storageType.value === 'dock' ? leftEndpoint.value : undefined,
    rightEndpoint: storageType.value === 'dock' ? rightEndpoint.value : undefined,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
  };

  try {
    localStorage.setItem('storage-designer-design', JSON.stringify(design));
    console.log('💾 Storage design saved to localStorage');
  } catch (error) {
    console.error('❌ Failed to save storage design:', error);
  }
};

const downloadFloorConfig = () => {
  if (!currentFloorDesign.value) return;

  const blob = new Blob([JSON.stringify(currentFloorDesign.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `floor-design-${currentFloorDesign.value.storage_name.replace(/\s+/g, '-').toLowerCase()}-floor-${currentFloorDesign.value.floor_number}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('⬇️ Floor design downloaded');
};

// Backwards compatibility
const downloadStorageConfig = downloadFloorConfig;

// Load storage design (backwards compatibility - only loads restriction zones)
const loadStorageDesign = (design?: StorageDesign) => {
  if (!design) return;

  storageName.value = design.name;
  storageType.value = design.type;
  storageLength.value = design.length;
  storageWidth.value = design.width;
  if (design.levelCount) levelCount.value = design.levelCount;
  restrictionZones.value = [...design.restrictionZones];
  nextZoneId.value = Math.max(...restrictionZones.value.map(z => z.id), 0) + 1;

  // Load dock endpoints if available
  if (design.leftEndpoint) leftEndpoint.value = design.leftEndpoint;
  if (design.rightEndpoint) rightEndpoint.value = design.rightEndpoint;

  // For backwards compatibility, if this is called, assume we're on main floor
  activeFloor.value = 1;

  // Load the corresponding floor design
  loadFloorDesign();
};

// Watch for dimension and name changes to recalculate layout
watch([storageLength, storageWidth, storageType, storageName], () => {
  if (!stage) return;

  // Recalculate display settings when storage dimensions change
  const displaySettings = calculateStorageDisplay();
  pixelsPerMeter.value = displaySettings.pixelsPerMeter;
  storageOffset.value = displaySettings.offset;

  // Only update layout, don't reload data
  updateStorageLayout();
  if (isMainFloor.value) {
    renderRestrictionZones();
  } else if (isStorageFloor.value) {
    renderFloorZones();
  }
});

// Watch for active floor changes with debounce
watch(activeFloor, () => {
  if (!stage) return;

  // Clear any pending timeout
  if (loadFloorDesignTimeout.value) {
    clearTimeout(loadFloorDesignTimeout.value);
  }

  // Debounce floor design loading
  loadFloorDesignTimeout.value = setTimeout(() => {
    loadFloorDesign();
  }, 100) as unknown as number;
});

// Watch for external props changes (from detail form)
watch([() => props.externalLength, () => props.externalWidth, () => props.externalName, () => props.externalType, () => props.selectedStorageId],
  ([newLength, newWidth, newName, newType, newStorageId]) => {
    let shouldReloadData = false;

    if (newLength !== undefined && newLength !== storageLength.value) {
      storageLength.value = newLength;
    }
    if (newWidth !== undefined && newWidth !== storageWidth.value) {
      storageWidth.value = newWidth;
    }
    if (newName !== undefined && newName !== storageName.value) {
      storageName.value = newName;
    }
    if (newType !== undefined) {
      // Map external type to internal type
      const mappedType = newType === 'Brygga' ? 'dock' : 'warehouse';
      if (mappedType !== storageType.value) {
        const oldType = storageType.value;
        storageType.value = mappedType;
        console.log(`🔄 Storage type updated from external form: ${newType} → ${mappedType} (old: ${oldType})`);
        console.log(`📊 storageType.value after change: ${storageType.value}`);

        // Force immediate UI update for type change
        nextTick(() => {
          console.log(`⏰ NextTick - storageType.value: ${storageType.value}`);
          if (stage && backgroundLayer) {
            updateStorageLayout();
            console.log(`🎨 Canvas updated for new type: ${mappedType}`);
          }
        });

        shouldReloadData = true;
      }
    }
    if (newStorageId !== undefined && newStorageId !== selectedStorageId.value) {
      selectedStorageId.value = newStorageId;
      console.log(`🔄 Storage ID updated from external form: ${newStorageId}`);

      // Reset to first floor when changing storage
      activeFloor.value = 1;
      shouldReloadData = true;
    }

    // Only reload data if storage ID or type actually changed
    if (shouldReloadData) {
      loadFloorDesign();
    }
  },
  { immediate: false } // Don't run immediately to prevent initial loop
);

// Watch internal values and emit changes back to parent
watch(storageLength, (newValue) => {
  if (newValue !== props.externalLength) {
    emit('update:length', newValue);
    console.log(`📤 Emitting length change: ${newValue}`);
  }
});

watch(storageWidth, (newValue) => {
  if (newValue !== props.externalWidth) {
    emit('update:width', newValue);
    console.log(`📤 Emitting width change: ${newValue}`);
  }
});

watch(storageName, (newValue) => {
  if (newValue !== props.externalName) {
    emit('update:name', newValue);
    console.log(`📤 Emitting name change: ${newValue}`);
  }
});

watch(storageType, (newValue, oldValue) => {
  const externalType = newValue === 'dock' ? 'Brygga' : 'Lager';
  console.log(`🔄 Internal storageType changed: ${oldValue} → ${newValue} (emitting: ${externalType})`);
  console.log(`📊 Vue reactivity - template should re-render with new type: ${newValue}`);

  if (externalType !== props.externalType) {
    emit('update:type', externalType);
    console.log(`📤 Emitting type change: ${externalType}`);
  }

  // Update UI sections immediately when type changes
  nextTick(() => {
    console.log(`⏰ Internal watch nextTick - storageType: ${storageType.value}`);
    if (stage && backgroundLayer) {
      updateStorageLayout();
      console.log(`🎨 UI sections updated for type: ${newValue}`);
    }
  });
}, { immediate: false, flush: 'sync' });

// Lifecycle
onMounted(() => {
  console.log('🚀 StorageDesigner mounted, loading initial data...');
  console.log(`📏 Initial dimensions from props: ${props.externalLength} x ${props.externalWidth}`);
  console.log(`📏 Set internal dimensions: ${storageLength.value} x ${storageWidth.value}`);
  console.log(`🏷️ Initial name from props: ${props.externalName} → ${storageName.value}`);
  console.log(`🏢 Initial type from props: ${props.externalType} → ${storageType.value}`);

  // Load initial floor design
  loadFloorDesign();

  nextTick(() => {
    initCanvas();
  });
});

onUnmounted(() => {
  // Clear any pending timeouts
  if (loadFloorDesignTimeout.value) {
    clearTimeout(loadFloorDesignTimeout.value);
  }

  // Remove event listener
  window.removeEventListener('resize', handleResize);

  // Cleanup ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect();
    resizeObserver.value = null;
    console.log('📏 ResizeObserver disconnected');
  }

  if (stage) {
    stage.destroy();
  }
});

// Expose functions for external use
defineExpose({
  saveStorageDesign,
  saveFloorDesign,
  downloadStorageConfig,
  downloadFloorConfig,
  loadStorageDesign,
  loadFloorDesign,
  loadRestrictionZones,
  restrictionZones,
  currentFloorDesign,
  activeFloor,
  setActiveFloor,
});
</script>

<style scoped>
.storage-designer-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 680px; /* Fixed height to prevent infinite growth */
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* Toolbar styles with minimal design */
.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  position: relative;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0;
}

.toolbar-separator {
  width: 1px;
  height: 1.75rem;
  background: #adb5bd;
  margin: 0 0.5rem;
  opacity: 0.6;
}

.toolbar-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.toolbar-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.625rem;
  background: white;
  color: #1e293b;
  width: 6rem;
  height: 1.75rem;
  transition: all 0.2s ease;
}

.toolbar-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.toolbar-input {
  border: none;
  background: transparent;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #1f2937;
  min-width: 2.5rem;
  text-align: center;
  outline: none;
  padding: 0;
}

.toolbar-input:focus {
  outline: none;
}

/* Type select styled to match other inputs */
.type-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M3 4.5L6 7.5L9 4.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.25rem center;
  background-size: 0.75rem;
  padding-right: 1.5rem;
  cursor: pointer;
  min-width: 3.5rem;
}

.type-select::-ms-expand {
  display: none;
}

.zoom-input {
  width: 3rem !important;
  text-align: center;
  font-weight: 600;
}

.input-group {
  display: flex;
  align-items: center;
  position: relative;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  padding: 0.25rem 0.375rem;
  gap: 0.25rem;
  transition: all 0.2s ease;
}

.input-group:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  background: #ffffff;
}

.input-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: #6c757d;
  stroke-width: 1.5;
}

.input-unit {
  font-size: 0.6875rem;
  color: #6c757d;
  font-weight: 500;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  color: #64748b;
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 1.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-button:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #94a3b8;
  color: #475569;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f1f5f9;
  color: #94a3b8;
}

.create-button {
  background: #10b981;
  color: white;
  border-color: #047857;
}

.create-button:hover:not(:disabled) {
  background: #059669;
  border-color: #065f46;
}

.button-icon {
  width: 0.875rem;
  height: 0.875rem;
  stroke-width: 1.5;
}

/* Zone groups styling */
.zone-create-group,
.zone-manage-group,
.zone-editor-group,
.zone-measurements-group {
  transition: opacity 0.2s ease, filter 0.2s ease;
  flex-shrink: 0;
}

/* Zone type buttons */
.zone-type-button {
  min-width: 70px;
  font-size: 0.75rem;
}

.zone-type-button.active {
  background: #16a34a;
  color: white;
  border-color: #166534;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
}

.zone-editor-group.disabled,
.zone-measurements-group.disabled {
  opacity: 0.5;
  filter: grayscale(0.3);
}

.zone-editor-group.disabled input,
.zone-measurements-group.disabled input,
.zone-editor-group.disabled .input-icon,
.zone-measurements-group.disabled .input-icon {
  color: #9ca3af;
  cursor: not-allowed;
}

/* Zones section styling */
.zones-section {
  position: relative;
  padding: 0.5rem;
  margin: 0.25rem 0;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: transparent;
}

.zones-section-title {
  position: absolute;
  top: -0.625rem;
  left: 0.75rem;
  background: #f8f9fa;
  padding: 0 0.5rem;
  font-size: 0.65rem;
  font-weight: 400;
  color: #9ca3af;
  margin: 0;
  line-height: 1.25rem;
  text-transform: none;
  letter-spacing: normal;
}

/* Two-row layout for zones */
.zones-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.zones-row:last-child {
  margin-bottom: 0;
}

.zones-row .toolbar-group {
  margin-bottom: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Input sizing */
.measurement-input {
  width: 3.5rem !important;
  min-width: 3.5rem !important;
}

.zone-name-input {
  width: 8rem !important;
  min-width: 8rem !important;
}

/* Measurements group - take full width on second row */
.zones-row:nth-child(2) {
  width: 100%;
}

.zones-section .zone-measurements-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  width: 100%;
}

.zones-section .zone-measurements-group .input-group {
  margin-right: 0;
}

/* Ensure first row items don't grow too much */
.zones-row:first-of-type .toolbar-group {
  flex-shrink: 0;
}

.save-button {
  background: #2563eb;
  color: white;
  border-color: #1d4ed8;
}

.save-button:hover {
  background: #2563eb;
  border-color: #1e40af;
}

.toolbar-button.active {
  background: #2563eb;
  color: white;
  border-color: #1d4ed8;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
  font-weight: 600;
}

.toolbar-button.active:hover {
  background: #1d4ed8;
  border-color: #1e40af;
}

.create-zone-button {
  font-weight: 600;
  min-width: 90px;
  justify-content: center;
}

.create-zone-button.active {
  background: #dc2626;
  border-color: #b91c1c;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1);
}

.create-zone-button.active:hover {
  background: #b91c1c;
  border-color: #991b1b;
}

/* Icon-only buttons should be square */
.icon-button {
  width: 2rem !important;
  min-width: 2rem !important;
  height: 2rem !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.button-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
}

.toolbar-separator {
  width: 1px;
  height: 1.5rem;
  background: #cbd5e1;
  margin: 0 0.25rem;
  flex-shrink: 0;
  opacity: 0.6;
}

.zoom-input {
  width: 3rem !important;
  text-align: center;
  font-weight: 600;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white; /* Same as canvas background */
  padding: 0;
  margin: 0;
  overflow: hidden;
  min-height: 0; /* Important for flex sizing */
  width: 100%;
  height: 100%;
}

.konva-canvas-wrapper {
  border-radius: 0;
  box-shadow: none;
  background: white;
  overflow: hidden;
  border: none;
  width: 100% !important;
  height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Floor navigation styling */
.floor-navigation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  color: #475569;
}

.floor-tab.active {
  background: #2563eb;
  border-color: #1d4ed8;
  color: white;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* Floor zones section - now uses same styling as zones-section */

/* Dock endpoint styling */
.dock-endpoints {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.endpoint-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.endpoint-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #495057;
  min-width: 3rem;
}

.endpoint-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.625rem;
  background: white;
  color: #1e293b;
  min-width: 5rem;
  height: 1.75rem;
  transition: all 0.2s ease;
}

.endpoint-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
</style>
