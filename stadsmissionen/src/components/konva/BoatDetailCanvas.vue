<template>
  <div class="boat-detail-canvas-container">
    <!-- Compact Toolbar -->
    <div class="canvas-toolbar">
      <div class="toolbar-group">
        <div class="input-group">
          <Ruler class="input-icon" />
          <input
            v-model.number="boatData.length"
            type="number"
            min="1"
            step="0.1"
            class="toolbar-input"
            placeholder="L"
          />
          <span class="input-unit">m</span>
        </div>

        <div class="input-group">
          <Move class="input-icon" />
          <input
            v-model.number="boatData.width"
            type="number"
            min="0.1"
            step="0.1"
            class="toolbar-input"
            placeholder="B"
          />
          <span class="input-unit">m</span>
        </div>

        <div class="input-group">
          <Shield class="input-icon" />
          <input
            v-model.number="boatData.safety_margin"
            type="number"
            min="0"
            step="0.1"
            class="toolbar-input"
            placeholder="M"
          />
          <span class="input-unit">m</span>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button @click="zoomOut" class="toolbar-button" title="Zooma ut">
          <ZoomOut class="button-icon" />
        </button>
        <span class="zoom-display">{{ Math.round(zoomLevel * 100) }}%</span>
        <button @click="zoomIn" class="toolbar-button" title="Zooma in">
          <ZoomIn class="button-icon" />
        </button>
      </div>
    </div>

    <!-- Canvas -->
    <div class="canvas-wrapper">
      <div ref="canvasContainer" class="konva-canvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import Konva from 'konva';
import type { BoatData } from '@/types/konva';

// Lucide icons
import {
  Ruler,
  Move,
  Shield,
  ZoomOut,
  ZoomIn
} from 'lucide-vue-next';

// Props
interface Props {
  initialBoatData?: BoatData;
}

const props = withDefaults(defineProps<Props>(), {
  initialBoatData: () => ({
    id: 1,
    customer_id: 1,
    name: 'Test Båt',
    length: 5.0,
    width: 2.0,
    safety_margin: 0.5,
    weight: 800,
    konva_shape_json: '',
    current_status: 'oplacerad',
    location_status: 'lager',
    current_placement_id: null,
    move_to_storage_date: null,
    move_from_storage_date: null,
    move_to_brygga_date: null,
    move_from_brygga_date: null,
    service_date: null,
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sms_notifications: false,
    email_notifications: false,
  } as BoatData)
});

// Refs
const canvasContainer = ref<HTMLDivElement>();
const boatData = ref<BoatData>({ ...props.initialBoatData });
const boatPosition = ref({ x: 0, y: 0 });
const boatRotation = ref(0);
const zoomLevel = ref(1);

// Konva objects
let stage: Konva.Stage;
let layer: Konva.Layer;
let boatGroup: Konva.Group;
let hullPath: Konva.Path;
let marginPath: Konva.Path;


// Constants from HTML prototype
const SVG_CONSTANTS = {
  HULL_PATH: "M2,8.373V63.627C2,67.147,5.76,70,10.4,70h113.58a9.823,9.823,0,0,0,6.128-2.015l34.122-27.627a5.317,5.317,0,0,0,0-8.715L130.106,4.015A9.823,9.823,0,0,0,123.978,2H10.4C5.76,2,2,4.853,2,8.373Z",
  MARGIN_PATH: "M2,10.5V84.231c0,4.7,4.466,8.5,9.975,8.5h134.9a10.853,10.853,0,0,0,7.278-2.689l40.526-36.864a7.617,7.617,0,0,0,0-11.629L154.152,4.689A10.853,10.853,0,0,0,146.874,2H11.975C6.466,2,2,5.807,2,10.5Z",
  HULL_VB: { w: 166.498, h: 70 },
  MARGIN_VB: { w: 196.375, h: 91.734 },
  PX_PER_M: 10,
  areaM: { w: 80, h: 15 }
};

// State styles from HTML prototype
const stateStyles = {
  oplacerad: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#27d07c', strokeWidth: 1, dash: [5, 5], fill: '#E9FBF3' }
  },
  i_lager: {
    hull: { stroke: '#A8A8A8', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#A8A8A8', strokeWidth: 1, dash: [5, 5], fill: '#F5F5F8' }
  },
  vid_brygga: {
    hull: { stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#3b82f6', strokeWidth: 1, dash: [5, 5], fill: '#eff6ff' }
  },
  service: {
    hull: { stroke: '#f59e0b', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#f59e0b', strokeWidth: 1, dash: [5, 5], fill: '#fef3c7' }
  }
};

// Initialize Konva stage
const initCanvas = () => {
  if (!canvasContainer.value) return;

  const containerRect = canvasContainer.value.getBoundingClientRect();
  const width = containerRect.width || 800;
  const height = containerRect.height || 600;

  stage = new Konva.Stage({
    container: canvasContainer.value,
    width,
    height
  });

  layer = new Konva.Layer();
  stage.add(layer);

  // No boundary needed for preview mode

  // Create boat
  createBoat();

  // Auto-center and auto-zoom
  centerAndZoomToBoat();
};

// Create boat group with paths
const createBoat = () => {
  // Create group (preview mode - no dragging)
  boatGroup = new Konva.Group({
    x: 0,
    y: 0,
    draggable: false
  });

  // Create paths
  marginPath = new Konva.Path({
    data: SVG_CONSTANTS.MARGIN_PATH,
    strokeScaleEnabled: false,
    ...stateStyles[boatData.value.current_status as keyof typeof stateStyles].margin
  });

  hullPath = new Konva.Path({
    data: SVG_CONSTANTS.HULL_PATH,
    strokeScaleEnabled: false,
    ...stateStyles[boatData.value.current_status as keyof typeof stateStyles].hull
  });

  // Add paths to group
  boatGroup.add(marginPath, hullPath);

  // Add boat name text
  const boatText = new Konva.Text({
    text: boatData.value.name,
    fontSize: 14,
    fontFamily: 'Arial',
    fill: '#333',
    align: 'center',
    verticalAlign: 'middle',
    listening: false
  });

  boatText.offsetX(boatText.width() / 2);
  boatText.offsetY(boatText.height() / 2);
  boatGroup.add(boatText);

  // Add to layer
  layer.add(boatGroup);

    // No event handlers needed for preview mode

  // Initial update
  updateBoat();
};

// Preview mode - no drag bounds needed

// Update boat dimensions and position
const updateBoat = () => {
  if (!boatGroup || !hullPath || !marginPath) return;

  // Boat is preview only - no scaling

  // Update rotation (position is auto-centered)
  boatRotation.value = boatGroup.rotation();

  // Calculate dimensions
  const L = boatData.value.length * SVG_CONSTANTS.PX_PER_M;
  const B = boatData.value.width * SVG_CONSTANTS.PX_PER_M;
  const M = boatData.value.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Update hull path
  hullPath.scale({
    x: L / SVG_CONSTANTS.HULL_VB.w,
    y: B / SVG_CONSTANTS.HULL_VB.h
  });
  hullPath.offset({
    x: SVG_CONSTANTS.HULL_VB.w / 2,
    y: SVG_CONSTANTS.HULL_VB.h / 2
  });

  // Update margin path
  marginPath.scale({
    x: (L + 2 * M) / SVG_CONSTANTS.MARGIN_VB.w,
    y: (B + 2 * M) / SVG_CONSTANTS.MARGIN_VB.h
  });
  marginPath.offset({
    x: SVG_CONSTANTS.MARGIN_VB.w / 2,
    y: SVG_CONSTANTS.MARGIN_VB.h / 2
  });

  // Update styles
  const currentStyles = stateStyles[boatData.value.current_status as keyof typeof stateStyles];
  hullPath.setAttrs(currentStyles.hull);
  marginPath.setAttrs(currentStyles.margin);

  // Redraw layer
  layer.batchDraw();
};

// Center and zoom to boat (auto-zoom and auto-center)
const centerAndZoomToBoat = () => {
  if (!stage || !boatGroup) return;

  // Always center the boat in the stage
  const stageWidth = stage.width();
  const stageHeight = stage.height();

  // Center the boat in the stage
  boatGroup.position({
    x: stageWidth / 2,
    y: stageHeight / 2
  });

  // Calculate optimal zoom based on boat dimensions
  const margin = boatData.value.safety_margin * SVG_CONSTANTS.PX_PER_M;
  const boatWidth = (boatData.value.length * SVG_CONSTANTS.PX_PER_M) + (margin * 2);
  const boatHeight = (boatData.value.width * SVG_CONSTANTS.PX_PER_M) + (margin * 2);

  // Calculate zoom to fit boat with some padding
  const paddingFactor = 0.3; // 30% padding around boat
  const scaleX = (stageWidth * (1 - paddingFactor)) / boatWidth;
  const scaleY = (stageHeight * (1 - paddingFactor)) / boatHeight;
  const optimalScale = Math.min(scaleX, scaleY, 2.0); // Max 2x zoom

  zoomLevel.value = optimalScale;
  stage.scale({ x: optimalScale, y: optimalScale });

  // No offset needed since boat is centered
  stage.offset({ x: 0, y: 0 });

  layer.batchDraw();
};

// Toolbar actions
const zoomIn = () => {
  if (!stage) return;
  const newScale = zoomLevel.value * 1.2;
  zoomLevel.value = Math.min(newScale, 3);
  stage.scale({ x: zoomLevel.value, y: zoomLevel.value });
  stage.batchDraw();
};

const zoomOut = () => {
  if (!stage) return;
  const newScale = zoomLevel.value / 1.2;
  zoomLevel.value = Math.max(newScale, 0.1);
  stage.scale({ x: zoomLevel.value, y: zoomLevel.value });
  stage.batchDraw();
};

// Watchers
watch([() => boatData.value.length, () => boatData.value.width, () => boatData.value.safety_margin],
  () => {
    updateBoat();
    centerAndZoomToBoat(); // Re-center and zoom when dimensions change
  }
);

watch(() => boatData.value.current_status, () => {
  updateBoat();
});

// Lifecycle
onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  if (stage) {
    stage.destroy();
  }
});

// Expose data for parent components
defineExpose({
  boatData,
  boatPosition,
  boatRotation
});
</script>

<style scoped>
.boat-detail-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toolbar-separator {
  width: 1px;
  height: 1.5rem;
  background: #e5e7eb;
  margin: 0 0.25rem;
}

.input-group {
  display: flex;
  align-items: center;
  position: relative;
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  gap: 0.125rem;
  transition: all 0.2s;
}

.input-group:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.input-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: #6b7280;
}

.input-unit {
  font-size: 0.625rem;
  color: #6b7280;
  font-weight: 500;
}

.toolbar-label {
  font-size: 0.625rem;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-input {
  width: 3rem;
  padding: 0.125rem;
  border: none;
  background: transparent;
  font-size: 0.625rem;
  font-weight: 500;
  color: #374151;
  outline: none;
  text-align: center;
}

.toolbar-button {
  padding: 0.25rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
}

.button-icon {
  width: 1rem;
  height: 1rem;
}

.toolbar-button:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.toolbar-button:active {
  background: #f3f4f6;
}

.toolbar-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-display {
  font-size: 0.625rem;
  font-weight: 600;
  color: #6b7280;
  min-width: 2rem;
  text-align: center;
  padding: 0 0.25rem;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.konva-canvas {
  flex: 1;
  background: #fafafa;
  cursor: crosshair;
}

/* Info panel removed for preview mode */

@media (max-width: 768px) {
  .canvas-toolbar {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.25rem;
  }

  .toolbar-separator {
    display: none;
  }

  .toolbar-group {
    flex-wrap: wrap;
  }

  .input-group {
    min-width: 0;
  }

  .toolbar-input {
    width: 1.5rem;
  }
}
</style>
