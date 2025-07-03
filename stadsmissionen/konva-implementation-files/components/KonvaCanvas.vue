<template>
  <div class="konva-canvas-container">
    <div
      ref="canvasContainer"
      :id="canvasId"
      class="konva-canvas"
    />
    <div class="canvas-controls">
      <div class="zoom-controls">
        <button @click="handleZoomIn" class="control-btn">+</button>
        <button @click="handleZoomOut" class="control-btn">-</button>
        <button @click="fitToScreen" class="control-btn">⌂</button>
      </div>
      <div class="canvas-info">
        <span>Scale: {{ Math.round(currentZoom * 100) }}%</span>
        <span>Boats: {{ boats.size }}</span>
        <span v-if="selectedBoat">Selected: {{ selectedBoat.boatData.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useKonvaCanvas } from '../composables/useKonvaCanvas';
import { useBoatPlacement } from '../composables/useBoatPlacement';
import { useCollisionDetection } from '../composables/useCollisionDetection';
import { KonvaStorageService } from '../services/konva-storage.service';

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
const { updateCollisionStates } = useCollisionDetection();
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
      const storageShape = storageService.createStorageShape(storageUnit);
      storageShapes.value.set(storageUnit.id.toString(), storageShape);
      // Add to storage layer (would need access to storageLayer)
    }
  }
};

const loadBoatData = async () => {
  const boats = await storageService.loadBoatsFromJson();
  const placements = await storageService.loadPlacementsFromJson();

  // Filter placements for current storage unit
  const relevantPlacements = placements.filter(p =>
    p.storage_unit_id?.toString() === props.storageUnitId
  );

  // Create boat shapes for each placement
  relevantPlacements.forEach(placement => {
    const boat = boats.find(b => b.id === placement.boat_id);
    if (boat) {
      addBoat(boat, placement);
    }
  });
};

// Watch for boat movements and update collision states
watch(() => boats.value.size, () => {
  if (props.enableCollisionDetection) {
    updateCollisionStates(boats.value);
    updateBoatVisualStates();
  }
}, { flush: 'post' });

// Watch for selected boat changes
watch(selectedBoat, (newSelected) => {
  if (newSelected) {
    emit('boatSelected', newSelected.id);
  }
});

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
  stage,
  boats,
  selectedBoat,
});
</script>

<style scoped>
.konva-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
  overflow: hidden;
}

.konva-canvas {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.konva-canvas:active {
  cursor: grabbing;
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

.zoom-controls {
  display: flex;
  gap: 5px;
}

.control-btn {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  transition: background-color 0.2s;
}

.control-btn:hover {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.canvas-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ddd;
  min-width: 120px;
}

.canvas-info span {
  white-space: nowrap;
}
</style>
