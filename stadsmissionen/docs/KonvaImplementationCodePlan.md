# Konva.js Implementation Code Plan

## Dependencies Installation

```bash
npm install konva vue-konva @types/konva
npm install --save-dev @types/geojson
```

## File Structure

```
src/
├── components/
│   ├── drawing/
│   │   ├── KonvaCanvas.vue
│   │   ├── KonvaBoatShape.vue
│   │   ├── KonvaStorageShape.vue
│   │   └── KonvaGrid.vue
│   ├── storage/
│   │   ├── BoatInventory.vue
│   │   ├── StorageSelector.vue
│   │   ├── PlacementControls.vue
│   │   └── CollisionIndicator.vue
│   └── tools/
│       ├── DrawingToolbar.vue
│       ├── ZoomControls.vue
│       └── ShapeProperties.vue
├── views/
│   ├── BoatStorageOverview.vue
│   ├── WarehouseDesigner.vue
│   ├── MarinaDesigner.vue
│   ├── BoatPlacementManager.vue
│   ├── WarehouseManagement.vue
│   └── MarinaManagement.vue
├── composables/
│   ├── useKonvaCanvas.ts
│   ├── useBoatPlacement.ts
│   ├── useCollisionDetection.ts
│   └── useStorageGeometry.ts
├── services/
│   ├── konva-storage.service.ts
│   ├── placement.service.ts
│   └── geometry.service.ts
├── types/
│   ├── konva.ts
│   └── storage.ts
└── utils/
    ├── konva-helpers.ts
    └── geojson-converter.ts
```

## Core Types

### `src/types/konva.ts`
```typescript
import Konva from 'konva';
import { BoatData, StorageUnit, PlacementData } from './entities';

export interface KonvaBoatShape {
  id: string;
  konvaObject: Konva.Group;
  boatData: BoatData;
  placement: PlacementData;
  isColliding: boolean;
  visualState: 'normal' | 'selected' | 'dragging' | 'collision';
  safetyMargin: number;
}

export interface KonvaStorageShape {
  id: string;
  konvaObject: Konva.Group;
  storageUnit: StorageUnit;
  bounds: Konva.Rect;
  restrictionZones: Konva.Shape[];
  connectionPoints: Konva.Circle[];
}

export interface KonvaCanvasConfig {
  width: number;
  height: number;
  scale: number;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  enableCollisionDetection: boolean;
}

export interface PlacementSuggestion {
  x: number;
  y: number;
  rotation: number;
  score: number;
  reasoning: string;
}

export interface CollisionResult {
  hasCollision: boolean;
  collisionSeverity: 'none' | 'warning' | 'critical';
  collisionColor: string;
  overlappingBoats: string[];
}
```

### `src/types/storage.ts`
```typescript
export interface StorageLayout {
  id: string;
  name: string;
  type: 'warehouse' | 'dock';
  konvaShapes: KonvaStorageShape[];
  boats: KonvaBoatShape[];
  levels: WarehouseLevel[];
  capacity: number;
  currentOccupancy: number;
}

export interface DrawingTool {
  name: 'select' | 'rectangle' | 'circle' | 'polygon' | 'line' | 'restriction';
  icon: string;
  cursor: string;
  isActive: boolean;
}

export interface ZoomLevel {
  scale: number;
  description: string;
  minDetails: boolean;
}
```

## Core Composables

### `src/composables/useKonvaCanvas.ts`
```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import Konva from 'konva';
import { KonvaCanvasConfig, KonvaBoatShape, KonvaStorageShape } from '@/types/konva';

export function useKonvaCanvas(containerId: string, config: KonvaCanvasConfig) {
  const stage = ref<Konva.Stage | null>(null);
  const backgroundLayer = ref<Konva.Layer | null>(null);
  const gridLayer = ref<Konva.Layer | null>(null);
  const storageLayer = ref<Konva.Layer | null>(null);
  const boatLayer = ref<Konva.Layer | null>(null);
  const uiLayer = ref<Konva.Layer | null>(null);

  const boats = ref<Map<string, KonvaBoatShape>>(new Map());
  const storageShapes = ref<Map<string, KonvaStorageShape>>(new Map());
  const selectedBoat = ref<KonvaBoatShape | null>(null);

  const initializeCanvas = () => {
    stage.value = new Konva.Stage({
      container: containerId,
      width: config.width,
      height: config.height,
      draggable: true,
      scaleX: config.scale,
      scaleY: config.scale,
    });

    // Initialize layers
    backgroundLayer.value = new Konva.Layer();
    gridLayer.value = new Konva.Layer();
    storageLayer.value = new Konva.Layer();
    boatLayer.value = new Konva.Layer();
    uiLayer.value = new Konva.Layer();

    // Add layers to stage
    stage.value.add(backgroundLayer.value);
    stage.value.add(gridLayer.value);
    stage.value.add(storageLayer.value);
    stage.value.add(boatLayer.value);
    stage.value.add(uiLayer.value);

    setupEventHandlers();
    if (config.showGrid) drawGrid();
  };

  const setupEventHandlers = () => {
    if (!stage.value) return;

    // Zoom functionality
    stage.value.on('wheel', (e) => {
      e.evt.preventDefault();
      const scaleBy = 1.05;
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      const mousePointTo = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      const newScale = e.evt.deltaY > 0 ? stage.scaleX() * scaleBy : stage.scaleX() / scaleBy;

      stage.scale({ x: newScale, y: newScale });
      stage.position({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    });

    // Selection handling
    stage.value.on('click tap', (e) => {
      if (e.target === stage.value) {
        selectedBoat.value = null;
        updateBoatVisualStates();
      }
    });
  };

  const drawGrid = () => {
    if (!gridLayer.value) return;

    gridLayer.value.destroyChildren();

    const gridSize = config.gridSize;
    const width = config.width;
    const height = config.height;

    // Vertical lines
    for (let i = 0; i <= width / gridSize; i++) {
      const line = new Konva.Line({
        points: [i * gridSize, 0, i * gridSize, height],
        stroke: '#ddd',
        strokeWidth: 1,
        listening: false,
      });
      gridLayer.value.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= height / gridSize; i++) {
      const line = new Konva.Line({
        points: [0, i * gridSize, width, i * gridSize],
        stroke: '#ddd',
        strokeWidth: 1,
        listening: false,
      });
      gridLayer.value.add(line);
    }
  };

  const addBoat = (boatData: BoatData, placement: PlacementData) => {
    // Implementation for adding boat to canvas
    // Parse konva_shape_json from boatData
    // Create KonvaBoatShape
    // Add to boatLayer
    // Enable drag and drop
  };

  const removeBoat = (boatId: string) => {
    const boat = boats.value.get(boatId);
    if (boat) {
      boat.konvaObject.destroy();
      boats.value.delete(boatId);
      boatLayer.value?.draw();
    }
  };

  const updateBoatPosition = (boatId: string, x: number, y: number, rotation: number) => {
    const boat = boats.value.get(boatId);
    if (boat) {
      boat.konvaObject.position({ x, y });
      boat.konvaObject.rotation(rotation);
      boat.placement.x_coordinate = x;
      boat.placement.y_coordinate = y;
      boat.placement.rotation_angle = rotation;
      boatLayer.value?.draw();
    }
  };

  const updateBoatVisualStates = () => {
    boats.value.forEach((boat) => {
      const isSelected = selectedBoat.value?.id === boat.id;
      const fill = isSelected ? '#4CAF50' :
                   boat.isColliding ? '#F44336' :
                   boat.visualState === 'dragging' ? '#FF9800' : '#2196F3';

      // Update boat visual appearance
      boat.konvaObject.getChildren().forEach((child) => {
        if (child.getClassName() === 'Rect') {
          (child as Konva.Rect).fill(fill);
        }
      });
    });
    boatLayer.value?.draw();
  };

  const exportCanvas = () => {
    return stage.value?.toDataURL();
  };

  const fitToScreen = () => {
    if (!stage.value) return;

    const padding = 50;
    const containerWidth = config.width;
    const containerHeight = config.height;

    // Calculate bounds of all objects
    // Fit stage to show all content
  };

  onMounted(() => {
    initializeCanvas();
  });

  onUnmounted(() => {
    stage.value?.destroy();
  });

  return {
    stage,
    boats,
    storageShapes,
    selectedBoat,
    addBoat,
    removeBoat,
    updateBoatPosition,
    updateBoatVisualStates,
    exportCanvas,
    fitToScreen,
  };
}
```

### `src/composables/useBoatPlacement.ts`
```typescript
import { ref, computed } from 'vue';
import { PlacementService } from '@/services/placement.service';
import { BoatData, StorageUnit, PlacementData } from '@/types/entities';
import { PlacementSuggestion, CollisionResult } from '@/types/konva';

export function useBoatPlacement() {
  const placementService = new PlacementService();
  const currentPlacements = ref<PlacementData[]>([]);
  const draggedBoat = ref<BoatData | null>(null);
  const isDragging = ref(false);

  const findOptimalPlacements = async (
    boat: BoatData,
    storageUnit: StorageUnit
  ): Promise<PlacementSuggestion[]> => {
    return placementService.findOptimalPlacement(boat, storageUnit, {
      safetyMargin: boat.safety_margin,
      allowRotation: true,
      maxSuggestions: 5,
    });
  };

  const checkCollision = (
    boat: BoatData,
    placement: PlacementData,
    existingPlacements: PlacementData[]
  ): CollisionResult => {
    return placementService.detectCollisions(placement, existingPlacements);
  };

  const snapToGrid = (x: number, y: number, gridSize: number) => {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  };

  const validatePlacement = (
    boat: BoatData,
    placement: PlacementData,
    storageUnit: StorageUnit
  ): boolean => {
    // Check if boat fits within storage unit bounds
    // Check safety margins
    // Check collision with existing placements
    return true;
  };

  return {
    currentPlacements,
    draggedBoat,
    isDragging,
    findOptimalPlacements,
    checkCollision,
    snapToGrid,
    validatePlacement,
  };
}
```

### `src/composables/useCollisionDetection.ts`
```typescript
import { ref, computed } from 'vue';
import { KonvaBoatShape } from '@/types/konva';

export function useCollisionDetection() {
  const collisionEnabled = ref(true);
  const collisionSeverity = ref<'none' | 'warning' | 'critical'>('none');

  const checkBoatCollision = (
    boat1: KonvaBoatShape,
    boat2: KonvaBoatShape
  ): boolean => {
    // Implementation for collision detection between two boats
    // Using Konva's hit detection or custom geometry calculations
    return false;
  };

  const getCollisionColor = (severity: 'none' | 'warning' | 'critical'): string => {
    switch (severity) {
      case 'warning': return '#FF9800'; // Orange
      case 'critical': return '#F44336'; // Red
      default: return '#4CAF50'; // Green
    }
  };

  const updateCollisionStates = (boats: Map<string, KonvaBoatShape>) => {
    boats.forEach((boat1, id1) => {
      let hasCollision = false;
      boats.forEach((boat2, id2) => {
        if (id1 !== id2 && checkBoatCollision(boat1, boat2)) {
          hasCollision = true;
        }
      });
      boat1.isColliding = hasCollision;
    });
  };

  return {
    collisionEnabled,
    collisionSeverity,
    checkBoatCollision,
    getCollisionColor,
    updateCollisionStates,
  };
}
```

## Core Services

### `src/services/konva-storage.service.ts`
```typescript
import { BoatData, StorageUnit, PlacementData } from '@/types/entities';
import { KonvaBoatShape, KonvaStorageShape } from '@/types/konva';
import Konva from 'konva';

export class KonvaStorageService {
  async loadBoatsFromJson(): Promise<BoatData[]> {
    const response = await fetch('/src/assets/data/boats.json');
    return response.json();
  }

  async loadStorageUnitsFromJson(): Promise<StorageUnit[]> {
    const response = await fetch('/src/assets/data/storageUnits.json');
    return response.json();
  }

  async loadPlacementsFromJson(): Promise<PlacementData[]> {
    const response = await fetch('/src/assets/data/placements.json');
    return response.json();
  }

  createBoatShape(boatData: BoatData, placement: PlacementData): KonvaBoatShape {
    // Parse konva_shape_json from boatData
    const shapeConfig = JSON.parse(boatData.konva_shape_json);

    const boatGroup = new Konva.Group({
      x: placement.x_coordinate,
      y: placement.y_coordinate,
      rotation: placement.rotation_angle,
      draggable: true,
    });

    const boatRect = new Konva.Rect({
      ...shapeConfig,
      listening: true,
    });

    const boatLabel = new Konva.Text({
      text: boatData.name,
      fontSize: 12,
      fill: 'black',
      align: 'center',
      verticalAlign: 'middle',
      width: shapeConfig.width,
      height: shapeConfig.height,
    });

    boatGroup.add(boatRect);
    boatGroup.add(boatLabel);

    return {
      id: boatData.id.toString(),
      konvaObject: boatGroup,
      boatData,
      placement,
      isColliding: false,
      visualState: 'normal',
      safetyMargin: boatData.safety_margin,
    };
  }

  createStorageShape(storageUnit: StorageUnit): KonvaStorageShape {
    const storageGroup = new Konva.Group();

    // Parse GeoJSON shape_geometry
    const geometry = JSON.parse(storageUnit.shape_geometry);

    let bounds: Konva.Rect;

    if (geometry.type === 'Polygon') {
      // Create polygon for warehouse
      const points = geometry.coordinates[0].flat();
      const polygon = new Konva.Line({
        points,
        fill: 'rgba(200, 200, 200, 0.3)',
        stroke: '#666',
        strokeWidth: 2,
        closed: true,
      });
      storageGroup.add(polygon);

      bounds = new Konva.Rect({
        x: Math.min(...points.filter((_, i) => i % 2 === 0)),
        y: Math.min(...points.filter((_, i) => i % 2 === 1)),
        width: Math.max(...points.filter((_, i) => i % 2 === 0)) - Math.min(...points.filter((_, i) => i % 2 === 0)),
        height: Math.max(...points.filter((_, i) => i % 2 === 1)) - Math.min(...points.filter((_, i) => i % 2 === 1)),
        listening: false,
      });
    } else if (geometry.type === 'LineString') {
      // Create line for dock
      const points = geometry.coordinates.flat();
      const line = new Konva.Line({
        points,
        stroke: '#0066cc',
        strokeWidth: 4,
      });
      storageGroup.add(line);

      bounds = new Konva.Rect({
        x: Math.min(...points.filter((_, i) => i % 2 === 0)) - 10,
        y: Math.min(...points.filter((_, i) => i % 2 === 1)) - 10,
        width: Math.max(...points.filter((_, i) => i % 2 === 0)) - Math.min(...points.filter((_, i) => i % 2 === 0)) + 20,
        height: Math.max(...points.filter((_, i) => i % 2 === 1)) - Math.min(...points.filter((_, i) => i % 2 === 1)) + 20,
        listening: false,
      });
    }

    return {
      id: storageUnit.id.toString(),
      konvaObject: storageGroup,
      storageUnit,
      bounds,
      restrictionZones: [],
      connectionPoints: [],
    };
  }

  saveLayout(boats: Map<string, KonvaBoatShape>): PlacementData[] {
    const placements: PlacementData[] = [];

    boats.forEach((boat) => {
      const placement: PlacementData = {
        ...boat.placement,
        x_coordinate: boat.konvaObject.x(),
        y_coordinate: boat.konvaObject.y(),
        rotation_angle: boat.konvaObject.rotation(),
      };
      placements.push(placement);
    });

    return placements;
  }
}
```

## Key Vue Components

### `src/components/drawing/KonvaCanvas.vue`
```vue
<template>
  <div class="konva-canvas-container">
    <div
      ref="canvasContainer"
      :id="canvasId"
      class="konva-canvas"
    />
    <div class="canvas-controls">
      <ZoomControls
        :zoom-level="currentZoom"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @fit-to-screen="fitToScreen"
      />
      <div class="canvas-info">
        <span>Scale: {{ Math.round(currentZoom * 100) }}%</span>
        <span>Boats: {{ boats.size }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useKonvaCanvas } from '@/composables/useKonvaCanvas';
import { useBoatPlacement } from '@/composables/useBoatPlacement';
import { KonvaStorageService } from '@/services/konva-storage.service';
import ZoomControls from './ZoomControls.vue';

interface Props {
  storageUnitId?: string;
  mode: 'design' | 'placement' | 'management';
  showGrid?: boolean;
  enableCollisionDetection?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showGrid: true,
  enableCollisionDetection: true,
});

const emit = defineEmits<{
  boatSelected: [boatId: string];
  boatMoved: [boatId: string, x: number, y: number, rotation: number];
  boatDropped: [boatId: string, x: number, y: number];
  shapeCreated: [shapeData: any];
}>();

const canvasId = ref(`konva-canvas-${Math.random().toString(36).substr(2, 9)}`);
const canvasContainer = ref<HTMLDivElement>();
const currentZoom = ref(1);

const config = {
  width: 1200,
  height: 800,
  scale: 1,
  gridSize: 20,
  snapToGrid: true,
  showGrid: props.showGrid,
  enableCollisionDetection: props.enableCollisionDetection,
};

const {
  stage,
  boats,
  storageShapes,
  selectedBoat,
  addBoat,
  removeBoat,
  updateBoatPosition,
  updateBoatVisualStates,
  exportCanvas,
  fitToScreen,
} = useKonvaCanvas(canvasId.value, config);

const { findOptimalPlacements, checkCollision } = useBoatPlacement();
const storageService = new KonvaStorageService();

const handleZoomIn = () => {
  currentZoom.value = Math.min(currentZoom.value * 1.2, 3);
  stage.value?.scale({ x: currentZoom.value, y: currentZoom.value });
};

const handleZoomOut = () => {
  currentZoom.value = Math.max(currentZoom.value / 1.2, 0.1);
  stage.value?.scale({ x: currentZoom.value, y: currentZoom.value });
};

const loadStorageData = async () => {
  if (props.storageUnitId) {
    const storageUnits = await storageService.loadStorageUnitsFromJson();
    const storageUnit = storageUnits.find(unit => unit.id.toString() === props.storageUnitId);
    if (storageUnit) {
      // Create and add storage shape to canvas
    }
  }
};

const loadBoatData = async () => {
  const boats = await storageService.loadBoatsFromJson();
  const placements = await storageService.loadPlacementsFromJson();

  // Filter placements for current storage unit
  const relevantPlacements = placements.filter(p =>
    p.storage_unit_id.toString() === props.storageUnitId
  );

  // Create boat shapes for each placement
  relevantPlacements.forEach(placement => {
    const boat = boats.find(b => b.id === placement.boat_id);
    if (boat) {
      addBoat(boat, placement);
    }
  });
};

onMounted(async () => {
  await loadStorageData();
  await loadBoatData();
});

watch(() => props.storageUnitId, async (newId) => {
  if (newId) {
    await loadStorageData();
    await loadBoatData();
  }
});

defineExpose({
  exportCanvas,
  fitToScreen,
  addBoat,
  removeBoat,
  updateBoatPosition,
});
</script>

<style scoped>
.konva-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
}

.konva-canvas {
  width: 100%;
  height: 100%;
}

.canvas-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

.canvas-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 10px;
  border-radius: 4px;
}
</style>
```

### `src/views/BoatPlacementManager.vue`
```vue
<template>
  <div class="boat-placement-manager">
    <div class="sidebar">
      <BoatInventory
        :boats="unplacedBoats"
        @boat-drag-start="handleBoatDragStart"
        @boat-selected="handleBoatSelected"
      />
      <StorageSelector
        :storage-units="storageUnits"
        :selected-unit="selectedStorageUnit"
        @unit-selected="handleStorageUnitSelected"
      />
      <PlacementControls
        :selected-boat="selectedBoat"
        :placement-suggestions="placementSuggestions"
        @apply-suggestion="handleApplySuggestion"
        @manual-placement="handleManualPlacement"
      />
    </div>

    <div class="main-canvas">
      <KonvaCanvas
        :storage-unit-id="selectedStorageUnit?.id"
        :mode="'placement'"
        :show-grid="true"
        :enable-collision-detection="true"
        @boat-moved="handleBoatMoved"
        @boat-dropped="handleBoatDropped"
        @boat-selected="handleBoatSelected"
        ref="canvasRef"
      />
    </div>

    <div class="details-panel">
      <div v-if="selectedBoat" class="boat-details">
        <h3>{{ selectedBoat.name }}</h3>
        <p>Dimensions: {{ selectedBoat.length }}m × {{ selectedBoat.width }}m</p>
        <p>Status: {{ selectedBoat.current_status }}</p>
        <p>Safety Margin: {{ selectedBoat.safety_margin }}m</p>
      </div>

      <CollisionIndicator
        v-if="collisionResult"
        :collision-result="collisionResult"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBoatPlacement } from '@/composables/useBoatPlacement';
import { useCollisionDetection } from '@/composables/useCollisionDetection';
import { KonvaStorageService } from '@/services/konva-storage.service';
import KonvaCanvas from '@/components/drawing/KonvaCanvas.vue';
import BoatInventory from '@/components/storage/BoatInventory.vue';
import StorageSelector from '@/components/storage/StorageSelector.vue';
import PlacementControls from '@/components/storage/PlacementControls.vue';
import CollisionIndicator from '@/components/storage/CollisionIndicator.vue';

const storageService = new KonvaStorageService();
const { findOptimalPlacements, checkCollision } = useBoatPlacement();
const { updateCollisionStates } = useCollisionDetection();

const canvasRef = ref<InstanceType<typeof KonvaCanvas>>();
const selectedStorageUnit = ref();
const selectedBoat = ref();
const storageUnits = ref([]);
const boats = ref([]);
const placementSuggestions = ref([]);
const collisionResult = ref();

const unplacedBoats = computed(() =>
  boats.value.filter(boat => !boat.current_placement_id)
);

const handleBoatDragStart = (boat: any) => {
  selectedBoat.value = boat;
};

const handleBoatSelected = (boatId: string) => {
  selectedBoat.value = boats.value.find(b => b.id.toString() === boatId);
};

const handleStorageUnitSelected = (unit: any) => {
  selectedStorageUnit.value = unit;
};

const handleBoatMoved = async (boatId: string, x: number, y: number, rotation: number) => {
  if (selectedBoat.value) {
    const placement = {
      boat_id: parseInt(boatId),
      storage_unit_id: selectedStorageUnit.value.id,
      x_coordinate: x,
      y_coordinate: y,
      rotation_angle: rotation,
    };

    collisionResult.value = checkCollision(selectedBoat.value, placement, []);
  }
};

const handleBoatDropped = (boatId: string, x: number, y: number) => {
  // Save placement to database
  console.log('Boat dropped:', { boatId, x, y });
};

const handleApplySuggestion = (suggestion: any) => {
  if (selectedBoat.value && canvasRef.value) {
    canvasRef.value.updateBoatPosition(
      selectedBoat.value.id,
      suggestion.x,
      suggestion.y,
      suggestion.rotation
    );
  }
};

const handleManualPlacement = (x: number, y: number, rotation: number) => {
  if (selectedBoat.value && canvasRef.value) {
    canvasRef.value.updateBoatPosition(
      selectedBoat.value.id,
      x,
      y,
      rotation
    );
  }
};

onMounted(async () => {
  boats.value = await storageService.loadBoatsFromJson();
  storageUnits.value = await storageService.loadStorageUnitsFromJson();
});
</script>

<style scoped>
.boat-placement-manager {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  height: 100vh;
  gap: 10px;
  padding: 10px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.details-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.boat-details h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.boat-details p {
  margin: 5px 0;
  color: #666;
  font-size: 14px;
}
</style>
```

## Navigation Updates

### `src/router/routes.ts` (additions)
```typescript
// Add these routes to existing routes array
{
  path: '/batlager',
  name: 'BoatStorage',
  component: () => import('@/views/BoatStorageOverview.vue'),
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      redirect: 'overview'
    },
    {
      path: 'overview',
      name: 'BoatStorageOverview',
      component: () => import('@/views/BoatStorageOverview.vue')
    },
    {
      path: 'lager',
      name: 'WarehouseManagement',
      component: () => import('@/views/WarehouseManagement.vue')
    },
    {
      path: 'lager/:id/design',
      name: 'WarehouseDesigner',
      component: () => import('@/views/WarehouseDesigner.vue')
    },
    {
      path: 'bryggor',
      name: 'MarinaManagement',
      component: () => import('@/views/MarinaManagement.vue')
    },
    {
      path: 'bryggor/:id/design',
      name: 'MarinaDesigner',
      component: () => import('@/views/MarinaDesigner.vue')
    },
    {
      path: 'placement',
      name: 'BoatPlacementManager',
      component: () => import('@/views/BoatPlacementManager.vue')
    }
  ]
}
```

### `src/router/navigation.ts` (additions)
```typescript
// Add to existing navigation items
{
  id: 'batlager',
  label: 'Båtlager',
  icon: 'anchor',
  route: '/batlager',
  children: [
    {
      id: 'batlager-overview',
      label: 'Översikt',
      route: '/batlager/overview'
    },
    {
      id: 'batlager-lager',
      label: 'Lager',
      route: '/batlager/lager'
    },
    {
      id: 'batlager-bryggor',
      label: 'Bryggor',
      route: '/batlager/bryggor'
    },
    {
      id: 'batlager-placement',
      label: 'Placering',
      route: '/batlager/placement'
    }
  ]
}
```

## Key Implementation Notes

1. **Konva.js Integration**: Based on the [official Konva documentation](https://konvajs.org/docs/index.html), the system uses layers for different object types (background, grid, storage, boats, UI).

2. **Existing Data Leverage**: The `boats.json` already contains `konva_shape_json` which can be directly parsed into Konva shapes.

3. **GeoJSON Support**: Storage units use GeoJSON format which needs conversion to Konva shapes (Polygon → closed Line, LineString → Line).

4. **Performance**: [Konva.js](https://konvajs.org/) is designed for high performance with thousands of shapes, perfect for large boat inventories.

5. **Collision Detection**: Uses different colors for collision severity as requested - not critical at this stage but visually informative.

6. **Vue Integration**: Uses Vue 3 composition API with Konva for reactive updates and state management.

This code structure provides the foundation for the entire boat storage system with Konva.js, leveraging your existing data structure while adding the professional CAD-like interface you requested.
