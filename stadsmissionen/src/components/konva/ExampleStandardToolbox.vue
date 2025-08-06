<template>
  <StandardToolbox>
    <template #toolbar-groups>
      <!-- Import standardized styles -->
      <StandardToolboxStyles />

      <!-- Dimension Controls Group -->
      <div class="toolbar-group">
        <div class="input-group">
          <RulerIcon class="input-icon" />
          <input
            v-model="dimensions.length"
            type="number"
            class="toolbar-input"
            step="0.1"
            min="0"
          />
          <span class="input-unit">m</span>
        </div>

        <div class="input-group">
          <MoveIcon class="input-icon" />
          <input
            v-model="dimensions.width"
            type="number"
            class="toolbar-input"
            step="0.1"
            min="0"
          />
          <span class="input-unit">m</span>
        </div>

        <div class="input-group">
          <ShieldIcon class="input-icon" />
          <input
            v-model="dimensions.margin"
            type="number"
            class="toolbar-input"
            step="0.1"
            min="0"
          />
          <span class="input-unit">m</span>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Zoom Controls Group -->
      <div class="toolbar-group">
        <button @click="zoomOut" class="toolbar-button" title="Zooma ut">
          <ZoomOutIcon class="button-icon" />
        </button>
        <div class="zoom-display">{{ Math.round(zoomLevel * 100) }}%</div>
        <button @click="zoomIn" class="toolbar-button" title="Zooma in">
          <ZoomInIcon class="button-icon" />
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Text Display Options Group -->
      <div class="toolbar-group">
        <div class="checkbox-group">
          <input
            id="showName"
            v-model="textOptions.showName"
            type="checkbox"
            class="checkbox-input"
          />
          <label for="showName" class="checkbox-label">Namn</label>
        </div>

        <div class="checkbox-group">
          <input
            id="showOwner"
            v-model="textOptions.showOwner"
            type="checkbox"
            class="checkbox-input"
          />
          <label for="showOwner" class="checkbox-label">Ägare</label>
        </div>

        <div class="checkbox-group">
          <input
            id="showId"
            v-model="textOptions.showId"
            type="checkbox"
            class="checkbox-input"
          />
          <label for="showId" class="checkbox-label">ID</label>
        </div>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Visual State Testing Group -->
      <div class="toolbar-group">
        <span class="test-label">Visuella tillstånd:</span>

        <button @click="setVisualState('normal')" class="test-button" title="Normal (kan placeras)">
          <div class="test-icon green-test">✓</div>
        </button>

        <button @click="setVisualState('marginCollision')" class="test-button" title="Marginalkollision">
          <div class="test-icon orange-test">⚠</div>
        </button>

        <button @click="setVisualState('hullCollision')" class="test-button" title="Skrovkollision">
          <div class="test-icon red-test">✗</div>
        </button>

        <button @click="setVisualState('placed')" class="test-button" title="Placerad fysiskt">
          <div class="test-icon blue-test">■</div>
        </button>

        <button @click="setVisualState('reserved')" class="test-button" title="Reserverad">
          <div class="test-icon light-gray-test">◐</div>
        </button>

        <button @click="resetVisualState" class="test-button" title="Återställ">
          <div class="test-icon gray-test">↺</div>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <!-- Action Buttons Group -->
      <div class="toolbar-group">
        <button @click="saveChanges" class="toolbar-button" title="Spara ändringar">
          <SaveIcon class="button-icon" />
        </button>

        <button @click="resetChanges" class="toolbar-button" title="Återställ ändringar">
          <RotateCcwIcon class="button-icon" />
        </button>
      </div>
    </template>

        <template #canvas>
      <!-- Use same Tailwind classes as DetailPage.vue for consistency -->
      <div class="bg-white rounded-lg border canvas-container">
        <div
          ref="canvasContainer"
          class="konva-canvas"
          :style="{
            width: canvasSize.width + 'px',
            height: canvasSize.height + 'px'
            /* Border and styling handled by Tailwind classes above */
          }"
        >
          <!-- Konva Stage will mount here -->
        </div>
      </div>
    </template>
  </StandardToolbox>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  RulerIcon,
  MoveIcon,
  ShieldIcon,
  ZoomOutIcon,
  ZoomInIcon,
  SaveIcon,
  RotateCcwIcon
} from 'lucide-vue-next'
import StandardToolbox from './StandardToolbox.vue'
import StandardToolboxStyles from './StandardToolboxStyles.vue'

// Component data
const dimensions = reactive({
  length: 8.0,
  width: 2.5,
  margin: 0.5
})

const textOptions = reactive({
  showName: true,
  showOwner: true,
  showId: false
})

const zoomLevel = ref(1.0)
const canvasSize = reactive({
  width: 700,
  height: 700
})

const canvasContainer = ref<HTMLDivElement>()

// Toolbar actions
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 5.0)
  console.log('Zoom in:', zoomLevel.value)
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.1)
  console.log('Zoom out:', zoomLevel.value)
}

const setVisualState = (state: string) => {
  console.log('Setting visual state:', state)
  // Implementation depends on your specific canvas content
  // This is where you would update your Konva objects
}

const resetVisualState = () => {
  console.log('Resetting visual state')
  // Reset to default state
}

const saveChanges = () => {
  console.log('Saving changes:', {
    dimensions: dimensions,
    textOptions: textOptions,
    zoomLevel: zoomLevel.value
  })
  // Save to your data store/API
}

const resetChanges = () => {
  console.log('Resetting changes')
  // Reset to original values
  dimensions.length = 8.0
  dimensions.width = 2.5
  dimensions.margin = 0.5
  zoomLevel.value = 1.0
}

// Component lifecycle
onMounted(() => {
  console.log('Standard toolbox example mounted')
  // Initialize your Konva stage here
  // const stage = new Konva.Stage({
  //   container: canvasContainer.value,
  //   width: canvasSize.width,
  //   height: canvasSize.height
  // })
})
</script>

<style scoped>
.canvas-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  /* Border styling handled by Tailwind classes: bg-white rounded-lg border */
}

.konva-canvas {
  position: relative;
  cursor: crosshair;
}

/* Example of additional custom styles if needed */
.custom-canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}
</style>
