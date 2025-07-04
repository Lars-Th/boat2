<template>
  <div class="konva-canvas-container">
    <div ref="canvasContainer" class="konva-canvas" />

    <!-- Basic Toolbar -->
    <div class="konva-toolbar">
      <div class="toolbar-group">
        <label>Längd (m):
          <input
            v-model.number="boatLength"
            type="number"
            min="1"
            step="0.1"
            class="toolbar-input"
          />
        </label>
        <label>Bredd (m):
          <input
            v-model.number="boatWidth"
            type="number"
            min="0.1"
            step="0.1"
            class="toolbar-input"
          />
        </label>
        <label>Marginal (m):
          <input
            v-model.number="safetyMargin"
            type="number"
            min="0"
            step="0.1"
            class="toolbar-input"
          />
        </label>
      </div>

      <div class="toolbar-group">
        <button @click="createTestBoat" class="toolbar-button">
          Skapa Testbåt
        </button>
        <button @click="rotateLeft" class="toolbar-button">⟲</button>
        <button @click="rotateRight" class="toolbar-button">⟳</button>
        <button @click="zoomOut" class="toolbar-button">-</button>
        <button @click="zoomIn" class="toolbar-button">+</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Konva from 'konva';
import {
  SVG_CONSTANTS,
  STATE_STYLES,
  calculateBoatScaling,
  calculateMarginScaling,
  applyBoatStyle,
  createDragBoundFunc
} from '@/services/konva/boat-svg.service';
import type { BoatData, KonvaLayers } from '@/types/konva';

// Reactive properties
const canvasContainer = ref<HTMLDivElement>();
const boatLength = ref(5.0);
const boatWidth = ref(2.0);
const safetyMargin = ref(0.5);

// Konva references
let stage: Konva.Stage | null = null;
let layers: KonvaLayers | null = null;
let activeBoat: any = null;

onMounted(() => {
  initializeCanvas();
});

onUnmounted(() => {
  if (stage) {
    stage.destroy();
  }
});

function initializeCanvas() {
  if (!canvasContainer.value) return;

  // Create stage
  stage = new Konva.Stage({
    container: canvasContainer.value,
    width: SVG_CONSTANTS.areaM.w * SVG_CONSTANTS.PX_PER_M,
    height: SVG_CONSTANTS.areaM.h * SVG_CONSTANTS.PX_PER_M
  });

  // Create layers
  layers = {
    background: new Konva.Layer(),
    storage: new Konva.Layer(),
    boats: new Konva.Layer(),
    ui: new Konva.Layer()
  };

  // Add layers to stage
  stage.add(layers.background);
  stage.add(layers.storage);
  stage.add(layers.boats);
  stage.add(layers.ui);

  // Draw background
  drawBackground();

  // Add test zones
  drawTestZones();
}

function drawBackground() {
  if (!layers) return;

  // Canvas border
  const border = new Konva.Rect({
    x: 0,
    y: 0,
    width: SVG_CONSTANTS.areaM.w * SVG_CONSTANTS.PX_PER_M,
    height: SVG_CONSTANTS.areaM.h * SVG_CONSTANTS.PX_PER_M,
    stroke: '#888',
    strokeWidth: 2,
    listening: false
  });

  layers.background.add(border);
}

function drawTestZones() {
  if (!layers) return;

  // Test restriction zones (från HTML-prototyp)
  const zones = [
    { x: 20, y: 10, w: 30, h: 20 },
    { x: 80, y: 50, w: 40, h: 15 }
  ];

  zones.forEach(zone => {
    const rect = new Konva.Rect({
      x: zone.x * SVG_CONSTANTS.PX_PER_M,
      y: zone.y * SVG_CONSTANTS.PX_PER_M,
      width: zone.w * SVG_CONSTANTS.PX_PER_M,
      height: zone.h * SVG_CONSTANTS.PX_PER_M,
      stroke: 'red',
      dash: [4, 4],
      listening: false
    });

    if (layers) {
      layers.storage.add(rect);
    }
  });

  if (layers) {
    layers.background.batchDraw();
    layers.storage.batchDraw();
  }
}

function createTestBoat() {
  if (!stage || !layers) return;

  // Create test boat data
  const testBoat: BoatData = {
    id: Date.now(),
    customer_id: 1,
    name: 'Test Boat',
    length: boatLength.value,
    width: boatWidth.value,
    safety_margin: safetyMargin.value,
    weight: 1200,
    konva_shape_json: '{}',
    current_status: 'oplacerad',
    location_status: 'lager',
    current_placement_id: null,
    move_to_storage_date: null,
    move_from_storage_date: null,
    move_to_brygga_date: null,
    move_from_brygga_date: null,
    service_date: null,
    notes: 'Test boat från Konva Canvas',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sms_notifications: false,
    email_notifications: false
  };

  // Create boat group
  const group = new Konva.Group({
    x: (SVG_CONSTANTS.areaM.w * SVG_CONSTANTS.PX_PER_M) / 2,
    y: (SVG_CONSTANTS.areaM.h * SVG_CONSTANTS.PX_PER_M) / 2,
    draggable: true,
    dragBoundFunc: createDragBoundFunc(testBoat)
  });

  // Create margin path
  const marginPath = new Konva.Path({
    data: SVG_CONSTANTS.MARGIN_PATH,
    strokeScaleEnabled: false
  });

  // Create hull path
  const hullPath = new Konva.Path({
    data: SVG_CONSTANTS.HULL_PATH,
    strokeScaleEnabled: false
  });

  // Scale paths
  const hullScale = calculateBoatScaling(testBoat);
  const marginScale = calculateMarginScaling(testBoat);

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

  // Add to group
  group.add(marginPath);
  group.add(hullPath);

  // Create transformer
  const transformer = new Konva.Transformer({
    nodes: [group],
    enabledAnchors: ['top-left', 'top-center', 'top-right', 'middle-right',
                     'bottom-right', 'bottom-center', 'bottom-left', 'middle-left'],
    ignoreStroke: true,
    keepRatio: false
  });

  layers.ui.add(transformer);
  layers.boats.add(group);

  // Set as active
  setActiveBoat({ group, transformer, hullPath, marginPath, data: testBoat });

  // Double click to place
  group.on('dblclick', () => {
    if (activeBoat) {
      placeBoat();
    }
  });

  layers.boats.batchDraw();
  layers.ui.batchDraw();
}

function setActiveBoat(boat: any) {
  if (activeBoat && activeBoat !== boat) {
    activeBoat.transformer.hide();
  }

  activeBoat = boat;
  boat.transformer.show();
  boat.group.moveToTop();
  boat.transformer.moveToTop();

  if (stage) {
    stage.batchDraw();
  }
}

function placeBoat() {
  if (!activeBoat) return;

  applyBoatStyle(activeBoat.hullPath, activeBoat.marginPath, 'placed');
  activeBoat.group.draggable(false);
  activeBoat.transformer.hide();
  activeBoat = null;

  if (stage) {
    stage.batchDraw();
  }
}

function rotateLeft() {
  if (activeBoat) {
    activeBoat.group.rotate(-15);
    if (stage) stage.batchDraw();
  }
}

function rotateRight() {
  if (activeBoat) {
    activeBoat.group.rotate(15);
    if (stage) stage.batchDraw();
  }
}

function zoomIn() {
  if (stage) {
    const scale = stage.scaleX() + 0.1;
    stage.scale({ x: scale, y: scale });
    stage.batchDraw();
  }
}

function zoomOut() {
  if (stage) {
    const scale = Math.max(0.1, stage.scaleX() - 0.1);
    stage.scale({ x: scale, y: scale });
    stage.batchDraw();
  }
}
</script>

<style scoped>
.konva-canvas-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fafafa;
}

.konva-canvas {
  flex: 1;
  cursor: crosshair;
  background: #fafafa;
  overflow: hidden;
}

.konva-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px;
  background: #f4f4f4;
  border-bottom: 1px solid #ccc;
  user-select: none;
}

.toolbar-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-input {
  width: 60px;
  padding: 2px 4px;
  font-size: 14px;
  margin-left: 4px;
}

.toolbar-button {
  padding: 4px 8px;
  font-size: 16px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar-button:hover {
  background: #f0f0f0;
}

label {
  font-size: 14px;
  margin-right: 8px;
}
</style>
