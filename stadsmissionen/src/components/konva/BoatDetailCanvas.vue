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
                <div class="input-group">
          <input
            v-model="zoomPercentage"
            @change="setZoomFromPercentage"
            @keyup.enter="setZoomFromPercentage"
            @blur="updateZoomDisplay"
            class="toolbar-input zoom-input"
            type="number"
            min="10"
            max="500"
            step="5"
            title="Zoom procent (10-500%) - Tryck Enter eller klicka utanför"
          />
          <span class="input-unit">%</span>
        </div>
        <button @click="zoomIn" class="toolbar-button" title="Zooma in">
          <ZoomIn class="button-icon" />
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Visual State Test Buttons -->
      <div class="toolbar-group">
        <span class="test-label">Visuella tillstånd:</span>
        <button @click="setVisualState('can_place')" class="test-button" title="Kan placeras (normal)">
          <div class="test-icon green-test">✓</div>
        </button>
        <button @click="setVisualState('margin_collision')" class="test-button" title="Marginalkollision">
          <div class="test-icon orange-test">⚠</div>
        </button>
        <button @click="setVisualState('hull_collision')" class="test-button" title="Skrovkollision">
          <div class="test-icon red-test">✗</div>
        </button>
        <button @click="setVisualState('placed')" class="test-button" title="Placerad fysiskt">
          <div class="test-icon blue-test">■</div>
        </button>
        <button @click="setVisualState('reserved')" class="test-button" title="Reserverad (ej fysiskt)">
          <div class="test-icon light-gray-test">◐</div>
        </button>
        <button @click="resetVisualState" class="test-button" title="Återställ till normal">
          <div class="test-icon gray-test">↺</div>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Text Display Options -->
      <div class="toolbar-group">
        <div class="checkbox-group">
          <input
            id="showBoatName"
            v-model="showBoatName"
            type="checkbox"
            class="checkbox-input"
            @change="updateBoatText"
          />
          <label for="showBoatName" class="checkbox-label">Båtnamn</label>
        </div>

        <div class="checkbox-group">
          <input
            id="showOwner"
            v-model="showOwner"
            type="checkbox"
            class="checkbox-input"
            @change="updateBoatText"
          />
          <label for="showOwner" class="checkbox-label">Ägare</label>
        </div>

        <div class="checkbox-group">
          <input
            id="showRegistration"
            v-model="showRegistration"
            type="checkbox"
            class="checkbox-input"
            @change="updateBoatText"
          />
          <label for="showRegistration" class="checkbox-label">Reg.nr</label>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Save/Load Group -->
      <div class="toolbar-group">
        <span class="toolbar-label">Save:</span>
        <button @click="quickSaveToStorage" class="toolbar-button save-button" title="Spara båtkonfiguration lokalt">
          <SaveIcon class="button-icon" />
        </button>

        <button @click="quickLoadFromStorage" class="toolbar-button" title="Ladda sparad konfiguration" :disabled="!hasSavedConfig">
          <FolderOpenIcon class="button-icon" />
        </button>

        <button @click="downloadBoatConfig" class="toolbar-button" title="Ladda ner som JSON-fil">
          <DownloadIcon class="button-icon" />
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Boat Actions Group -->
      <div class="toolbar-group">
        <span class="toolbar-label">Actions:</span>
        <button @click="editBoat" class="toolbar-button" title="Editera båt">
          <EditIcon class="button-icon" />
        </button>

        <button @click="moveBoat" class="toolbar-button" title="Flytta båt">
          <Navigation2Icon class="button-icon" />
        </button>

        <button @click="redistributeBoat" class="toolbar-button" title="Omfördela båt">
          <RefreshCwIcon class="button-icon" />
        </button>

        <button @click="deleteBoat" class="toolbar-button" title="Radera från lager">
          <TrashIcon class="button-icon" />
        </button>
      </div>
    </div>

    <!-- Canvas - Direct attachment to toolbar -->
    <div class="canvas-wrapper">
      <div ref="canvasContainer" class="konva-canvas" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import Konva from 'konva';
import type { BoatData } from '@/types/konva';

// Lucide icons
import {
  Ruler,
  Move,
  Shield,
  ZoomOut,
  ZoomIn,
  Save as SaveIcon,
  FolderOpen as FolderOpenIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Navigation2 as Navigation2Icon,
  RefreshCw as RefreshCwIcon,
  Trash as TrashIcon
} from 'lucide-vue-next';

// Data
import customersData from '@/assets/data/customers.json';

// Props
interface Props {
  initialBoatData?: BoatData;
}

const props = withDefaults(defineProps<Props>(), {
  initialBoatData: () => ({
    id: 1,
    customer_id: 1,
    name: 'Test Båt',
    registreringsnummer: 'TEST-001',
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
const zoomPercentage = ref(100); // Zoom percentage for the input field
const resizeTimeout = ref<number | null>(null);
const manualZoomOverride = ref<number | null>(null);

// Text display options
const showBoatName = ref(true);
const showOwner = ref(true);
const showRegistration = ref(true); // Show registration number by default if available

// Visual state for testing
const currentVisualState = ref<string | null>(null);

// Status icons mapping - functional states with graphics


// Computed properties
const ownerName = computed(() => {
  const customer = customersData.find(c => c.id === boatData.value.customer_id);
  return customer ? customer.display_name : 'Okänd ägare';
});

const displayText = computed(() => {
  const lines = [];

  if (showBoatName.value) {
    lines.push(boatData.value.name);
  }

  if (showOwner.value) {
    lines.push(ownerName.value);
  }

  if (showRegistration.value) {
    lines.push(boatData.value.registreringsnummer || 'Ingen reg.');
  }

  return lines; // Show all selected lines
});

// Konva objects
let stage: Konva.Stage;
let layer: Konva.Layer;
let boatGroup: Konva.Group;
let hullPath: Konva.Path;
let marginPath: Konva.Path;
// Status and info icons are now created as groups in their respective functions

// Timer variables for hover functionality
let hoverTimer: number | null = null;
let hideTimer: number | null = null;


// Constants from HTML prototype
const SVG_CONSTANTS = {
  // Hull path - clean boat shape
  HULL_PATH: "M10,15 C10,9,14,5,20,5 H130 C134,5,138,7,141,10 L164,31 C168,35,168,43,164,47 L141,68 C138,71,134,73,130,73 H20 C14,73,10,69,10,63 Z",
  // Margin path - SAME as hull path, will be scaled larger based on safety_margin
  MARGIN_PATH: "M10,15 C10,9,14,5,20,5 H130 C134,5,138,7,141,10 L164,31 C168,35,168,43,164,47 L141,68 C138,71,134,73,130,73 H20 C14,73,10,69,10,63 Z",
  HULL_VB: { w: 174, h: 78 },
  MARGIN_VB: { w: 174, h: 78 }, // Same ViewBox, same path - scaling handles the margin
  PX_PER_M: 10,
  areaM: { w: 80, h: 15 }
};

// State styles from HTML prototype + test states
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
  },
  // TEST STATES
  can_place: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#27d07c', strokeWidth: 1, dash: [5, 5], fill: '#E9FBF3' }
  },
  margin_collision: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#dc2626', strokeWidth: 1, dash: [5, 5], fill: '#fef2f2' }
  },
  hull_collision: {
    hull: { stroke: '#dc2626', strokeWidth: 2, fill: '#fef2f2' },
    margin: { stroke: '#dc2626', strokeWidth: 1, dash: [5, 5], fill: '#fef2f2' }
  },
  placed: {
    hull: { stroke: '#1e40af', strokeWidth: 2, fill: '#dbeafe' },
    margin: { stroke: '#1e40af', strokeWidth: 1, dash: [5, 5], fill: '#eff6ff' }
  },
  reserved: {
    hull: { stroke: '#9ca3af', strokeWidth: 2, fill: '#ffffff', opacity: 0.7, dash: [8, 4] },
    margin: { stroke: '#9ca3af', strokeWidth: 1, dash: [10, 5], fill: '#f9fafb', opacity: 0.7 }
  }
};

// Initialize Konva stage
const initCanvas = () => {
  if (!canvasContainer.value) return;

  // Force a minimum delay to ensure proper layout
  setTimeout(() => {
    if (!canvasContainer.value) return;

            // Calculate optimal canvas size for the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Reserve space for toolbar (approx 80px) and some margin
    const availableHeight = viewportHeight - 120; // 80px toolbar + 40px margin
    const availableWidth = viewportWidth - 40; // 40px margin total

    // Choose size that fits well in viewport but not too large
    const maxSize = Math.min(availableWidth, availableHeight);
    const finalSize = Math.max(300, Math.min(maxSize, 600)); // Reasonable range

        // Set the container width to match canvas exactly
    const container = canvasContainer.value.closest('.boat-detail-canvas-container') as HTMLElement;
    if (container) {
      container.style.width = `${finalSize}px`;
    }

    // Set wrapper size to match canvas exactly
    const wrapper = canvasContainer.value.parentElement;
    if (wrapper) {
      wrapper.style.width = `${finalSize}px`;
      wrapper.style.height = `${finalSize}px`;
    }

    stage = new Konva.Stage({
      container: canvasContainer.value,
      width: finalSize,
      height: finalSize
    });

    layer = new Konva.Layer();
    stage.add(layer);

    // No boundary needed for preview mode

    // Create boat
    createBoat();

    // Update and center boat for initial display
    updateBoat();
    centerBoat();

    // Initialize zoom percentage display
    updateZoomDisplay();

    // Add window resize listener
    window.addEventListener('resize', handleResize);
  }, 100); // Short delay to ensure DOM is ready
};

// Handle window resize (throttled for better performance)
const handleResize = () => {
  if (resizeTimeout.value) {
    clearTimeout(resizeTimeout.value);
  }

  resizeTimeout.value = setTimeout(() => {
    if (!stage || !canvasContainer.value) return;

            // Recalculate optimal canvas size for the new viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Reserve space for toolbar (approx 80px) and some margin
    const availableHeight = viewportHeight - 120; // 80px toolbar + 40px margin
    const availableWidth = viewportWidth - 40; // 40px margin total

    // Choose size that fits well in viewport but not too large
    const maxSize = Math.min(availableWidth, availableHeight);
    const finalSize = Math.max(300, Math.min(maxSize, 600)); // Reasonable range

        // Update container width to match canvas exactly
    const container = canvasContainer.value.closest('.boat-detail-canvas-container') as HTMLElement;
    if (container) {
      container.style.width = `${finalSize}px`;
    }

    // Update wrapper size to match canvas exactly
    const wrapper = canvasContainer.value.parentElement;
    if (wrapper) {
      wrapper.style.width = `${finalSize}px`;
      wrapper.style.height = `${finalSize}px`;
    }

    // Update stage size
    stage.width(finalSize);
    stage.height(finalSize);

    // Update boat for new dimensions (auto-scale or manual zoom)
    if (manualZoomOverride.value) {
      updateBoatWithManualZoom();
    } else {
      updateBoat();
    }
    centerBoat();
  }, 100); // Throttle to 100ms
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

  // Add boat text (will be created in updateBoatText)
  updateBoatText();

  // Status icon removed - no longer showing visual state icons in boat

  // Add hover functionality for info dialog with stable timing
  boatGroup.on('mouseenter', () => {
    stage.container().style.cursor = 'pointer';

    // Clear any existing hide timer
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }

    // Show dialog after short delay to prevent flickering
    if (!hoverTimer) {
      hoverTimer = setTimeout(() => {
        showInfoDialog();
        hoverTimer = null;
      }, 100);
    }
  });

  boatGroup.on('mouseleave', () => {
    stage.container().style.cursor = 'default';

    // Clear show timer if still pending
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }

    // Hide dialog after longer delay
    hideTimer = setTimeout(() => {
      layer.find('Group').filter((node: any) => node.name() === 'infoDialog').forEach(dialog => dialog.destroy());
      layer.batchDraw();
      hideTimer = null;
    }, 500);
  });

  // Add to layer
  layer.add(boatGroup);

  // No event handlers needed for preview mode
  // Note: updateBoat() will be called from initCanvas()
};

// Update boat text with size relative to zoom factor only
const updateBoatText = () => {
  if (!boatGroup || !stage) return;

  // Remove existing text
  boatGroup.find('Text').forEach(text => text.destroy());

  const textLines = displayText.value;
  if (textLines.length === 0) return;

  // Use the current zoomLevel.value directly (set by updateBoat or updateBoatWithManualZoom)
  // This ensures consistency with the actual boat scaling
  const currentZoomFactor = zoomLevel.value || 1.0; // Default to 1.0 if not set

  // Calculate font size based ONLY on zoom factor (konstant storlek på båten)
  // Base: 3.15px font size at 1.0 zoom - samma storlek för alla båtar
  const baseFontSize = 3.15;
  const baseZoom = 1.0;

  // Texten skalas bara med zoom, inte med båtstorlek
  const zoomMultiplier = currentZoomFactor / baseZoom;
  const fontSize = baseFontSize * zoomMultiplier;

  // Create text for each line
  textLines.forEach((line, index) => {
    const textNode = new Konva.Text({
      text: line,
      fontSize: fontSize,
      fontFamily: 'Arial, sans-serif',
      fontStyle: index === 0 ? 'bold' : 'normal', // First line (boat name) is bold
      fill: '#333',
      align: 'center',
      listening: false
    });

    // Position text lines vertically
    const lineHeight = fontSize * 1.2;
    const totalHeight = textLines.length * lineHeight;
    const startY = -(totalHeight / 2) + (index * lineHeight);

    textNode.offsetX(textNode.width() / 2);
    textNode.y(startY);

    boatGroup.add(textNode);
  });

  layer.batchDraw();
};



// Create status icon graphic using Konva shapes
const _unused_createStatusIconGraphic = (type: string, color: string) => {
  const group = new Konva.Group({ listening: false });

  switch (type) {
    case 'checkmark':
      // Green checkmark using lines
      const check1 = new Konva.Line({
        points: [-4, 0, -1, 3],
        stroke: color,
        strokeWidth: 2,
        lineCap: 'round',
        lineJoin: 'round'
      });
      const check2 = new Konva.Line({
        points: [-1, 3, 4, -3],
        stroke: color,
        strokeWidth: 2,
        lineCap: 'round',
        lineJoin: 'round'
      });
      group.add(check1, check2);
      break;

    case 'cross':
      // Red X using lines
      const x1 = new Konva.Line({
        points: [-4, -4, 4, 4],
        stroke: color,
        strokeWidth: 2,
        lineCap: 'round'
      });
      const x2 = new Konva.Line({
        points: [4, -4, -4, 4],
        stroke: color,
        strokeWidth: 2,
        lineCap: 'round'
      });
      group.add(x1, x2);
      break;

    case 'warning':
      // Orange warning triangle
      const triangle = new Konva.RegularPolygon({
        sides: 3,
        radius: 6,
        fill: color,
        rotation: 180
      });
      const exclamation = new Konva.Text({
        text: '!',
        fontSize: 8,
        fontStyle: 'bold',
        fill: 'white',
        offsetX: 2,
        offsetY: 6
      });
      group.add(triangle, exclamation);
      break;

    case 'pin':
      // Location pin
      const pinBody = new Konva.Circle({
        radius: 5,
        fill: color,
        y: -2
      });
      const pinPoint = new Konva.RegularPolygon({
        sides: 3,
        radius: 3,
        fill: color,
        y: 4
      });
      group.add(pinBody, pinPoint);
      break;

    case 'square':
      // Blue square for placed
      const square = new Konva.Rect({
        width: 8,
        height: 8,
        fill: color,
        offsetX: 4,
        offsetY: 4
      });
      group.add(square);
      break;

    case 'circle_half':
      // Gray half circle for reserved
      const halfCircle = new Konva.Arc({
        innerRadius: 0,
        outerRadius: 6,
        angle: 180,
        fill: color,
        rotation: 270
      });
      group.add(halfCircle);
      break;

    case 'dock':
      // Dock icon using rectangles
      const dock1 = new Konva.Rect({
        width: 8,
        height: 2,
        fill: color,
        offsetX: 4,
        offsetY: 2
      });
      const dock2 = new Konva.Rect({
        width: 6,
        height: 2,
        fill: color,
        offsetX: 3,
        offsetY: 0,
        y: 3
      });
      group.add(dock1, dock2);
      break;

    default:
      // Fallback to simple circle
      const circle = new Konva.Circle({
        radius: 4,
        fill: color
      });
      group.add(circle);
  }

  return group;
};



// Info icon removed - using hover instead

// Show info dialog with action buttons
const showInfoDialog = () => {
  if (!stage) return;

  console.log('Showing info dialog'); // Debug

  // Remove existing info dialog
  layer.find('Group').filter((node: Konva.Node) => node.name() === 'infoDialog').forEach(dialog => dialog.destroy());

  // Create info dialog with constant size (not scaled)
  const infoDialog = new Konva.Group({
    name: 'infoDialog'
  });

  // Tooltip background - sleek and borderless
  const dialogBg = new Konva.Rect({
    width: 250, // Narrower tooltip
    height: 140, // Compact height
    fill: 'rgba(30, 30, 30, 0.95)', // Dark semi-transparent
    cornerRadius: 6,
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowBlur: 12,
    shadowOffsetY: 6
  });

  // Tooltip content - rich but compact information
  const dialogText = new Konva.Text({
    text: `${boatData.value.name}

Ägare: ${ownerName.value}
Registrering: ${boatData.value.registreringsnummer || 'Ej angett'}
Dimensioner: ${boatData.value.length} x ${boatData.value.width} m
Säkerhetsmarginal: ${boatData.value.safety_margin} m
Status: ${getStatusText(boatData.value.current_status)}`,
    fontSize: 11,
    fontFamily: 'Inter, -apple-system, sans-serif',
    fill: '#ffffff',
    padding: 12,
    lineHeight: 1.3,
    width: 226,
    align: 'left'
  });

    // Simple close button for tooltip
  const closeButton = new Konva.Circle({
    radius: 10,
    fill: 'rgba(255, 255, 255, 0.2)',
    stroke: 'rgba(255, 255, 255, 0.6)',
    strokeWidth: 1,
    listening: true,
    cursor: 'pointer'
  });

  const closeText = new Konva.Text({
    text: '×',
    fontSize: 12,
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontStyle: 'bold',
    fill: 'rgba(255, 255, 255, 0.8)',
    align: 'center',
    listening: false
  });

  closeText.offsetX(closeText.width() / 2);
  closeText.offsetY(closeText.height() / 2);

  closeButton.position({
    x: 230, // Adjusted for smaller dialog
    y: 20
  });

  closeText.position({
    x: 230, // Adjusted for smaller dialog
    y: 20
  });

  // Add subtle hover effect to close button
  closeButton.on('mouseenter', () => {
    closeButton.fill('rgba(255, 255, 255, 0.3)');
    closeButton.stroke('rgba(255, 255, 255, 0.8)');
    layer.batchDraw();
  });

  closeButton.on('mouseleave', () => {
    closeButton.fill('rgba(255, 255, 255, 0.2)');
    closeButton.stroke('rgba(255, 255, 255, 0.6)');
    layer.batchDraw();
  });

  closeButton.on('click', () => {
    infoDialog.destroy();
    layer.batchDraw();
  });

  infoDialog.add(dialogBg, dialogText, closeButton, closeText);

  // Position dialog in center of stage (constant position)
  const stageWidth = stage.width();
  const stageHeight = stage.height();
  infoDialog.position({
    x: (stageWidth - 250) / 2, // Adjusted for tooltip size
    y: (stageHeight - 140) / 2 // Adjusted for tooltip size
  });

  // Prevent dialog from hiding when hovering over it
  infoDialog.on('mouseenter', () => {
    // Clear any pending hide timer when hovering over dialog
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  });

  infoDialog.on('mouseleave', () => {
    // Start hide timer again when leaving dialog
    hideTimer = setTimeout(() => {
      infoDialog.destroy();
      layer.batchDraw();
      hideTimer = null;
    }, 300);
  });

  // Add to layer
  layer.add(infoDialog);
  layer.batchDraw();
};

// Removed hover tooltip - using info icon instead

// Helper function to get human-readable status text
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'oplacerad': 'Oplacerad (kan flyttas)',
    'i_lager': 'I lager',
    'vid_brygga': 'Vid brygga',
    'service': 'Service'
  };
  return statusMap[status] || status;
};

// Helper function to get functional status text for display


// Preview mode - no drag bounds needed

// Update boat dimensions and position with smart preview scaling
const updateBoat = () => {
  if (!boatGroup || !hullPath || !marginPath || !stage) return;

  // Get stage dimensions for smart scaling
  const stageWidth = stage.width();
  const stageHeight = stage.height();

  // Calculate boat's real dimensions in pixels (base scale)
  const baseHullWidth = boatData.value.length * SVG_CONSTANTS.PX_PER_M;
  const baseHullHeight = boatData.value.width * SVG_CONSTANTS.PX_PER_M;
  const baseMargin = boatData.value.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Calculate total boat size including margins
  const totalBoatWidth = baseHullWidth + (baseMargin * 2);
  const totalBoatHeight = baseHullHeight + (baseMargin * 2);

  // Calculate scale to make boat fill 50% of canvas (preview mode)
  const targetFillRatio = 0.5;
  const scaleX = (stageWidth * targetFillRatio) / totalBoatWidth;
  const scaleY = (stageHeight * targetFillRatio) / totalBoatHeight;
  const previewScale = Math.min(scaleX, scaleY); // Keep aspect ratio

  // Apply reasonable limits
  const finalScale = Math.max(previewScale, 0.5); // Minimum scale for visibility

  // FIXED: Use proportional scaling based on boat length to maintain proper shape
  // Calculate scaling factor based on boat length (like HTML prototype)
  const baseLength = boatData.value.length * SVG_CONSTANTS.PX_PER_M;
  const baseWidth = boatData.value.width * SVG_CONSTANTS.PX_PER_M;
  const baseMarginPx = boatData.value.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Scale hull path proportionally
  const hullScaleX = (baseLength * finalScale) / SVG_CONSTANTS.HULL_VB.w;
  const hullScaleY = (baseWidth * finalScale) / SVG_CONSTANTS.HULL_VB.h;

  hullPath.scale({
    x: hullScaleX,
    y: hullScaleY
  });
  hullPath.offset({
    x: SVG_CONSTANTS.HULL_VB.w / 2,
    y: SVG_CONSTANTS.HULL_VB.h / 2
  });

  // Scale margin path - same shape as hull but larger by safety_margin
  // When safety_margin = 0, margin will be identical to hull
  // When safety_margin > 0, margin will be uniformly larger
  const marginScaleX = ((baseLength + 2 * baseMarginPx) * finalScale) / SVG_CONSTANTS.MARGIN_VB.w;
  const marginScaleY = ((baseWidth + 2 * baseMarginPx) * finalScale) / SVG_CONSTANTS.MARGIN_VB.h;

  marginPath.scale({
    x: marginScaleX,
    y: marginScaleY
  });
  marginPath.offset({
    x: SVG_CONSTANTS.MARGIN_VB.w / 2,
    y: SVG_CONSTANTS.MARGIN_VB.h / 2
  });

  // Update styles
  const currentStyles = stateStyles[boatData.value.current_status as keyof typeof stateStyles];
  hullPath.setAttrs(currentStyles.hull);
  marginPath.setAttrs(currentStyles.margin);

  // Store the current scale for zoom operations
  zoomLevel.value = finalScale;

  // Update zoom percentage display
  updateZoomDisplay();

  // Update boat text with new scaling
  updateBoatText();

  // Status icon removed - no longer showing visual state icons in boat

  // Debug: Log scale information
  console.log('Boat update:', {
    boatLength: boatData.value.length,
    stageSize: { width: stageWidth, height: stageHeight },
    finalScale,
    finalHullSize: { width: baseLength * finalScale, height: baseWidth * finalScale }
  });

  // Redraw layer
  layer.batchDraw();
};

// Update boat with manual zoom override
const updateBoatWithManualZoom = () => {
  if (!boatGroup || !hullPath || !marginPath || !stage) return;

  // Get stage dimensions
  const stageWidth = stage.width();
  const stageHeight = stage.height();

  // Calculate boat's real dimensions in pixels (base scale)
  const baseHullWidth = boatData.value.length * SVG_CONSTANTS.PX_PER_M;
  const baseHullHeight = boatData.value.width * SVG_CONSTANTS.PX_PER_M;
  const baseMargin = boatData.value.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Use manual zoom override if available, otherwise auto-calculate
  let finalScale = manualZoomOverride.value;

  if (!finalScale) {
    // Calculate auto-scale for 70% fill
    const totalBoatWidth = baseHullWidth + (baseMargin * 2);
    const totalBoatHeight = baseHullHeight + (baseMargin * 2);
    const targetFillRatio = 0.7;
    const scaleX = (stageWidth * targetFillRatio) / totalBoatWidth;
    const scaleY = (stageHeight * targetFillRatio) / totalBoatHeight;
    const previewScale = Math.min(scaleX, scaleY);
    finalScale = Math.max(previewScale, 0.5);
  }

  // FIXED: Use proportional scaling based on boat length to maintain proper shape
  // Calculate scaling factor based on boat length (like HTML prototype)
  const baseLength = boatData.value.length * SVG_CONSTANTS.PX_PER_M;
  const baseWidth = boatData.value.width * SVG_CONSTANTS.PX_PER_M;
  const baseMarginPx = boatData.value.safety_margin * SVG_CONSTANTS.PX_PER_M;

  // Scale hull path proportionally
  const hullScaleX = (baseLength * finalScale) / SVG_CONSTANTS.HULL_VB.w;
  const hullScaleY = (baseWidth * finalScale) / SVG_CONSTANTS.HULL_VB.h;

  hullPath.scale({
    x: hullScaleX,
    y: hullScaleY
  });
  hullPath.offset({
    x: SVG_CONSTANTS.HULL_VB.w / 2,
    y: SVG_CONSTANTS.HULL_VB.h / 2
  });

  // Scale margin path - same shape as hull but larger by safety_margin
  // When safety_margin = 0, margin will be identical to hull
  // When safety_margin > 0, margin will be uniformly larger
  const marginScaleX = ((baseLength + 2 * baseMarginPx) * finalScale) / SVG_CONSTANTS.MARGIN_VB.w;
  const marginScaleY = ((baseWidth + 2 * baseMarginPx) * finalScale) / SVG_CONSTANTS.MARGIN_VB.h;

  marginPath.scale({
    x: marginScaleX,
    y: marginScaleY
  });
  marginPath.offset({
    x: SVG_CONSTANTS.MARGIN_VB.w / 2,
    y: SVG_CONSTANTS.MARGIN_VB.h / 2
  });

  // Update styles
  const currentStyles = stateStyles[boatData.value.current_status as keyof typeof stateStyles];
  hullPath.setAttrs(currentStyles.hull);
  marginPath.setAttrs(currentStyles.margin);

  // Store the current scale
  zoomLevel.value = finalScale;

  // Update zoom percentage display
  updateZoomDisplay();

  // Status icon removed - no longer showing visual state icons in boat

  // Update text to match new zoom level
  updateBoatText();

  // Redraw layer
  layer.batchDraw();
};

// Simply center boat (scaling is done in updateBoat)
const centerBoat = () => {
  if (!stage || !boatGroup) return;

  // Always center the boat in the stage
  const stageWidth = stage.width();
  const stageHeight = stage.height();

  // Center the boat in the stage
  const centerX = stageWidth / 2;
  const centerY = stageHeight / 2;

  boatGroup.position({
    x: centerX,
    y: centerY
  });

  // Debug: Log center position
  console.log('Boat centered at:', { x: centerX, y: centerY, stageSize: { width: stageWidth, height: stageHeight } });

  layer.batchDraw();
};

// Toolbar actions
const zoomIn = () => {
  if (!stage) return;

  // Manually increase zoom level
  const newScale = zoomLevel.value * 1.2;
  const maxZoom = 5.0;

  // Temporarily override auto-scaling for manual zoom
  manualZoomOverride.value = Math.min(newScale, maxZoom);

  updateBoatWithManualZoom();
  centerBoat();

  // Update zoom percentage display
  updateZoomDisplay();
};

const zoomOut = () => {
  if (!stage) return;

  // Manually decrease zoom level
  const newScale = zoomLevel.value / 1.2;
  const minZoom = 0.1;

  // Temporarily override auto-scaling for manual zoom
  manualZoomOverride.value = Math.max(newScale, minZoom);

  updateBoatWithManualZoom();
  centerBoat();

  // Update zoom percentage display
  updateZoomDisplay();
};

// Set zoom from percentage input
const setZoomFromPercentage = () => {
  if (!stage) return;

  const percentage = parseFloat(zoomPercentage.value.toString());

    // Validate percentage range
  if (isNaN(percentage) || percentage < 10 || percentage > 500) {
    // Reset to current zoom if invalid
    updateZoomDisplay();
    return;
  }

  // Convert percentage to zoom level
  const newScale = percentage / 100;

  // Temporarily override auto-scaling for manual zoom
  manualZoomOverride.value = newScale;

  updateBoatWithManualZoom();
  centerBoat();

  // Ensure zoom display is updated
  updateZoomDisplay();
};

// Update zoom percentage display to match current zoom level
const updateZoomDisplay = () => {
  const newPercentage = Math.round(zoomLevel.value * 100);
  zoomPercentage.value = newPercentage;
};

// Visual state test function
const setVisualState = (state: string) => {
  console.log('Setting visual state to:', state); // Debug
  if (!hullPath || !marginPath) return;

  // Set current visual state
  currentVisualState.value = state;

  // Temporarily override boat status for visual testing
  const testStyles = stateStyles[state as keyof typeof stateStyles];
  if (testStyles) {
    hullPath.setAttrs(testStyles.hull);
    marginPath.setAttrs(testStyles.margin);

    // Status icon removed - no longer showing visual state icons in boat

    layer.batchDraw();
  }
};

// Reset to normal state
const resetVisualState = () => {
  console.log('Resetting visual state'); // Debug
  if (!hullPath || !marginPath) return;

  // Clear current visual state
  currentVisualState.value = null;

  // Reset to boat's actual current status
  const currentStyles = stateStyles[boatData.value.current_status as keyof typeof stateStyles];
  hullPath.setAttrs(currentStyles.hull);
  marginPath.setAttrs(currentStyles.margin);

  // Status icon removed - no longer showing visual state icons in boat

  layer.batchDraw();
};

// Watchers
watch([() => boatData.value.length, () => boatData.value.width, () => boatData.value.safety_margin],
  () => {
    // Preserve current zoom level when dimensions change
    // If no manual zoom is set, use current auto-scale as manual zoom to prevent re-scaling
    if (!manualZoomOverride.value && zoomLevel.value) {
      // Save current zoom level as manual override to prevent auto-zoom
      manualZoomOverride.value = zoomLevel.value;
    }

    // Always use manual zoom update to preserve scaling
    updateBoatWithManualZoom();
    centerBoat(); // Re-center when dimensions change
  }
);

watch(() => boatData.value.current_status, () => {
  updateBoat();
});

watch(() => boatData.value.customer_id, () => {
  updateBoatText(); // Update text when customer changes
});

watch(displayText, () => {
  updateBoatText(); // Update text when display options change
});

// Lifecycle
onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  // Remove resize listener
  window.removeEventListener('resize', handleResize);

  // Clear resize timeout
  if (resizeTimeout.value) {
    clearTimeout(resizeTimeout.value);
  }

  if (stage) {
    stage.destroy();
  }
});

// ========================================
// 💾 SAVE & LOAD FUNCTIONALITY
// ========================================

/**
 * Complete boat settings structure for saving/loading
 * Contains all visual, data, and display settings
 */
interface BoatSettings {
  // Core boat data
  boatData: BoatData;

  // Visual display settings
  visualSettings: {
    currentVisualState: string | null;
    showBoatName: boolean;
    showOwner: boolean;
    showRegistration: boolean;
  };

  // Canvas settings
  canvasSettings: {
    zoomLevel: number;
    manualZoomOverride: number | null;
  };

  // Metadata
  metadata: {
    savedAt: string;
    version: string;
    component: string;
  };
}

/**
 * 💾 Save complete boat settings
 * Saves all boat data, visual states, and display settings
 * Can be used for:
 * - Persisting boat changes back to boats.json
 * - Saving visual test states for later use
 * - Backing up boat configuration
 */
const saveBoatSettings = (): BoatSettings => {
  const settings: BoatSettings = {
    // Core boat data with all current values
    boatData: {
      ...boatData.value,
      // Ensure updated timestamp
      updated_at: new Date().toISOString()
    },

    // Visual display settings
    visualSettings: {
      currentVisualState: currentVisualState.value,
      showBoatName: showBoatName.value,
      showOwner: showOwner.value,
      showRegistration: showRegistration.value
    },

    // Canvas settings
    canvasSettings: {
      zoomLevel: zoomLevel.value,
      manualZoomOverride: manualZoomOverride.value
    },

    // Metadata for tracking
    metadata: {
      savedAt: new Date().toISOString(),
      version: '1.0.0',
      component: 'BoatDetailCanvas'
    }
  };

  console.log('🚤 Boat settings saved:', settings);

  // TODO: Here you would normally save to backend/localStorage
  // For now, we'll just return the settings
  return settings;
};

/**
 * 📥 Load boat settings
 * Restores all boat data, visual states, and display settings
 * Can be used for:
 * - Loading saved boat configurations
 * - Restoring visual test states
 * - Importing boat data
 */
const loadBoatSettings = (settings: BoatSettings): void => {
  try {
    // Load core boat data
    Object.assign(boatData.value, settings.boatData);

    // Load visual settings
    currentVisualState.value = settings.visualSettings.currentVisualState;
    showBoatName.value = settings.visualSettings.showBoatName;
    showOwner.value = settings.visualSettings.showOwner;
    showRegistration.value = settings.visualSettings.showRegistration;

    // Load canvas settings
    zoomLevel.value = settings.canvasSettings.zoomLevel;
    manualZoomOverride.value = settings.canvasSettings.manualZoomOverride;

    // Update boat visualization
    updateBoat();
    centerBoat();

    // Apply visual state if set
    if (settings.visualSettings.currentVisualState) {
      setVisualState(settings.visualSettings.currentVisualState);
    }

    console.log('🚤 Boat settings loaded:', settings);

  } catch (error) {
    console.error('❌ Failed to load boat settings:', error);
  }
};

/**
 * 📄 Export boat settings as JSON
 * Creates a downloadable JSON file with all boat settings
 */
const exportBoatSettings = (): void => {
  const settings = saveBoatSettings();

  // Create downloadable JSON file
  const dataStr = JSON.stringify(settings, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

  const exportFileDefaultName = `boat_${settings.boatData.id}_${settings.boatData.name}_settings.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  console.log('📥 Boat settings exported to:', exportFileDefaultName);
};

/**
 * 📤 Import boat settings from JSON file
 * Loads boat settings from uploaded JSON file
 */
const importBoatSettings = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const settings = JSON.parse(e.target?.result as string) as BoatSettings;
      loadBoatSettings(settings);
      console.log('📤 Boat settings imported from:', file.name);
    } catch (error) {
      console.error('❌ Failed to import boat settings:', error);
    }
  };

  reader.readAsText(file);
};

/**
 * 🔄 Reset boat to defaults
 * Resets all settings to initial values
 */
const resetBoatToDefaults = (): void => {
  // Reset to original boat data
  Object.assign(boatData.value, props.initialBoatData);

  // Reset visual settings
  currentVisualState.value = null;
  showBoatName.value = true;
  showOwner.value = true;
  showRegistration.value = false;

  // Reset canvas settings
  zoomLevel.value = 1;
  manualZoomOverride.value = null;

  // Update visualization
  updateBoat();
  centerBoat();

  console.log('🔄 Boat reset to defaults');
};

// ========================================
// 💾 QUICK SAVE/LOAD FUNCTIONS (LocalStorage)
// ========================================

// Check if there's a saved configuration
const hasSavedConfig = computed(() => {
  return localStorage.getItem('boat-detail-canvas-config') !== null;
});

/**
 * 💾 Quick save to localStorage
 * Saves current boat configuration for easy reload
 */
const quickSaveToStorage = (): void => {
  try {
    const settings = saveBoatSettings();
    localStorage.setItem('boat-detail-canvas-config', JSON.stringify(settings));
    console.log('💾 Configuration saved to localStorage');

    // Show success feedback (you can add toast notification here)
    alert('Båtkonfiguration sparad!');
  } catch (error) {
    console.error('❌ Failed to save to localStorage:', error);
    alert('Fel vid sparning av konfiguration');
  }
};

/**
 * 📂 Quick load from localStorage
 * Loads previously saved boat configuration
 */
const quickLoadFromStorage = (): void => {
  try {
    const savedConfig = localStorage.getItem('boat-detail-canvas-config');
    if (savedConfig) {
      const settings = JSON.parse(savedConfig) as BoatSettings;
      loadBoatSettings(settings);
      console.log('📂 Configuration loaded from localStorage');

      // Show success feedback
      alert('Båtkonfiguration laddad!');
    }
  } catch (error) {
    console.error('❌ Failed to load from localStorage:', error);
    alert('Fel vid laddning av konfiguration');
  }
};

/**
 * 📥 Download boat configuration as JSON file
 * Creates and downloads a JSON file with current boat settings
 */
const downloadBoatConfig = (): void => {
  try {
    const settings = saveBoatSettings();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boat-config-${boatData.value.name || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Cleanup
    URL.revokeObjectURL(url);

    console.log('📥 Boat configuration downloaded');
  } catch (error) {
    console.error('❌ Failed to download configuration:', error);
    alert('Fel vid nedladdning av konfiguration');
  }
};

// ========================================
// 🛠️ TOOLBAR ACTION FUNCTIONS
// ========================================

const editBoat = () => {
  console.log('Edit boat clicked');
  // TODO: Navigate to boat edit page or show edit dialog
};

const moveBoat = () => {
  console.log('Move boat clicked');
  // TODO: Show move options or navigate to placement view
};

const redistributeBoat = () => {
  console.log('Redistribute boat clicked');
  // TODO: Show redistribute options
};

const deleteBoat = () => {
  console.log('Delete boat clicked');
  // TODO: Show delete confirmation dialog
};

/**
 * 💾 Save current boat configuration
 * Saves and logs current boat settings
 */


// Expose data and functions for parent components
defineExpose({
  // Data
  boatData,
  boatPosition,
  boatRotation,

  // Save/Load functions
  saveBoatSettings,
  loadBoatSettings,
  exportBoatSettings,
  importBoatSettings,
  resetBoatToDefaults,

  // Quick Save/Load functions
  quickSaveToStorage,
  quickLoadFromStorage,
  downloadBoatConfig,
  hasSavedConfig,

  // Visual state functions
  setVisualState,
  resetVisualState,

  // Canvas control functions
  zoomIn,
  zoomOut,
  centerBoat
});
</script>

<style scoped>
.boat-detail-canvas-container {
  display: flex;
  flex-direction: column;
  height: auto;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  overflow: hidden;
  /* Container will be sized to match canvas + toolbar */
  align-self: center;
}

.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #ced4da;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  flex-wrap: wrap;
  position: relative;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0.375rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-separator {
  width: 1px;
  height: 1.75rem;
  background: linear-gradient(to bottom, transparent, #adb5bd 20%, #adb5bd 80%, transparent);
  margin: 0 0.5rem;
}

.input-group {
  display: flex;
  align-items: center;
  position: relative;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
  border: 1px solid #adb5bd;
  border-radius: 0.375rem;
  padding: 0.25rem 0.375rem;
  gap: 0.25rem;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

.input-group:focus-within {
  border-color: #495057;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 2px rgba(59, 130, 246, 0.15);
  background: linear-gradient(to bottom, #ffffff, #ffffff);
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

.toolbar-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.toolbar-input {
  width: 3rem;
  padding: 0.25rem;
  border: none;
  background: transparent;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #495057;
  outline: none;
  text-align: center;
}

.toolbar-button {
  padding: 0.375rem;
  border: 1px solid #adb5bd;
  border-radius: 0.375rem;
  background: linear-gradient(to bottom, #ffffff, #f1f3f4);
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
}

.button-icon {
  width: 1rem;
  height: 1rem;
  stroke-width: 1.5;
}

.toolbar-button:hover {
  background: linear-gradient(to bottom, #ffffff, #e9ecef);
  border-color: #6c757d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.toolbar-button:active {
  background: linear-gradient(to bottom, #e9ecef, #dee2e6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
}

.toolbar-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  transform: none;
}

/* Save button special styling */
.save-button {
  background: linear-gradient(to bottom, #dcfce7, #bbf7d0);
  border-color: #16a34a;
  color: #15803d;
}

.save-button:hover {
  background: linear-gradient(to bottom, #bbf7d0, #86efac);
  border-color: #15803d;
  box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.zoom-display {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #495057;
  min-width: 2.5rem;
  text-align: center;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
  border: 1px solid #adb5bd;
  border-radius: 0.375rem;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.zoom-input {
  width: 3rem !important; /* Smaller width for percentage input */
  text-align: center;
  font-weight: 600;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.15s ease;
}

.checkbox-group:hover {
  background: rgba(255, 255, 255, 0.8);
}

.checkbox-input {
  width: 1rem;
  height: 1rem;
  border: 1.5px solid #6c757d;
  border-radius: 0.25rem;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  position: relative;
  appearance: none;
}

.checkbox-input:checked {
  background: linear-gradient(to bottom, #2563eb, #1d4ed8);
  border-color: #1d4ed8;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.checkbox-input:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.625rem;
  font-weight: bold;
  line-height: 1;
}

.checkbox-input:hover {
  border-color: #495057;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05), 0 0 0 2px rgba(108, 117, 125, 0.1);
}

.checkbox-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #495057;
  cursor: pointer;
  user-select: none;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* Test button styles */
.test-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #495057;
  margin-right: 0.625rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

.test-button {
  padding: 0.375rem;
  border: 1px solid #adb5bd;
  border-radius: 0.375rem;
  background: linear-gradient(to bottom, #ffffff, #f1f3f4);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
}

.test-button:hover {
  background: linear-gradient(to bottom, #ffffff, #e9ecef);
  border-color: #6c757d;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
}

.test-button:active {
  background: linear-gradient(to bottom, #e9ecef, #dee2e6);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
}

.test-icon {
  font-size: 0.875rem;
  font-weight: bold;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.green-test {
  background: #dcfce7;
  color: #16a34a;
}

.orange-test {
  background: #fed7aa;
  color: #ea580c;
}

.red-test {
  background: #fecaca;
  color: #dc2626;
}

.blue-test {
  background: #dbeafe;
  color: #2563eb;
}

.purple-test {
  background: #e9d5ff;
  color: #7c3aed;
}

.light-gray-test {
  background: #f3f4f6;
  color: #9ca3af;
}

.gray-test {
  background: #f3f4f6;
  color: #6b7280;
}

.canvas-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center; /* Center canvas vertically */
  align-items: center; /* Center canvas horizontally */
  overflow: hidden;
  /* No background or padding - canvas should fill entire area */
  background: white;
  padding: 0;
}

.konva-canvas {
  /* Canvas will be sized dynamically by the initCanvas function */
  cursor: crosshair;
  background: white;
  flex-shrink: 0; /* Prevent canvas from shrinking */
  /* No border or shadow - parent container handles styling */
}

/* Info panel removed for preview mode */

@media (max-width: 768px) {
  .canvas-toolbar {
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem;
    background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  }

  .toolbar-separator {
    display: none;
  }

  .toolbar-group {
    flex-wrap: wrap;
    padding: 0.375rem 0.5rem;
    background: rgba(255, 255, 255, 0.7);
  }

  .input-group {
    min-width: 0;
    padding: 0.375rem 0.5rem;
  }

  .toolbar-input {
    width: 2rem;
    font-size: 0.75rem;
  }

  .test-button, .toolbar-button {
    min-width: 2rem;
    height: 2rem;
    padding: 0.25rem;
  }

  .test-label {
    font-size: 0.75rem;
    margin-right: 0.5rem;
  }
}
</style>
