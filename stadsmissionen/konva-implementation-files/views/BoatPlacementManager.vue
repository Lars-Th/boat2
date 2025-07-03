<template>
  <div class="boat-placement-manager">
    <!-- Sidebar with boat inventory -->
    <div class="sidebar">
      <div class="boat-inventory">
        <h3>Available Boats</h3>
        <div class="boat-list">
          <div
            v-for="boat in unplacedBoats"
            :key="boat.id"
            class="boat-item"
            :class="{ selected: selectedBoat?.id === boat.id }"
            @click="selectBoat(boat)"
            draggable="true"
            @dragstart="handleBoatDragStart(boat, $event)"
          >
            <div class="boat-info">
              <span class="boat-name">{{ boat.name }}</span>
              <span class="boat-dimensions">{{ boat.length }}m × {{ boat.width }}m</span>
              <span class="boat-status" :class="boat.current_status">
                {{ boat.current_status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="storage-selector">
        <h3>Storage Location</h3>
        <select v-model="selectedStorageUnitId" @change="handleStorageChange">
          <option value="">Select storage unit...</option>
          <option
            v-for="unit in storageUnits"
            :key="unit.id"
            :value="unit.id"
          >
            {{ unit.name }} ({{ unit.unit_type }})
          </option>
        </select>
      </div>

      <div v-if="selectedBoat" class="placement-controls">
        <h3>Placement Suggestions</h3>
        <div class="suggestions-list">
          <div
            v-for="(suggestion, index) in placementSuggestions"
            :key="index"
            class="suggestion-item"
            @click="applySuggestion(suggestion)"
          >
            <div class="suggestion-score">{{ Math.round(suggestion.score) }}%</div>
            <div class="suggestion-details">
              <div>X: {{ suggestion.x }}, Y: {{ suggestion.y }}</div>
              <div>Rotation: {{ suggestion.rotation }}°</div>
              <div class="suggestion-reason">{{ suggestion.reasoning }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main canvas area -->
    <div class="main-canvas">
      <KonvaCanvas
        :storage-unit-id="selectedStorageUnitId"
        :mode="'placement'"
        :show-grid="true"
        :enable-collision-detection="true"
        @boat-moved="handleBoatMoved"
        @boat-dropped="handleBoatDropped"
        @boat-selected="handleBoatSelected"
        ref="canvasRef"
      />
    </div>

    <!-- Details panel -->
    <div class="details-panel">
      <div v-if="selectedBoat" class="boat-details">
        <h3>{{ selectedBoat.name }}</h3>
        <div class="detail-row">
          <label>Dimensions:</label>
          <span>{{ selectedBoat.length }}m × {{ selectedBoat.width }}m</span>
        </div>
        <div class="detail-row">
          <label>Weight:</label>
          <span>{{ selectedBoat.weight }}kg</span>
        </div>
        <div class="detail-row">
          <label>Status:</label>
          <span class="status-badge" :class="selectedBoat.current_status">
            {{ selectedBoat.current_status }}
          </span>
        </div>
        <div class="detail-row">
          <label>Safety Margin:</label>
          <span>{{ selectedBoat.safety_margin }}m</span>
        </div>
        <div class="detail-row">
          <label>Notes:</label>
          <span>{{ selectedBoat.notes || 'No notes' }}</span>
        </div>
      </div>

      <div v-if="collisionReport" class="collision-report">
        <h3>Collision Report</h3>
        <div class="report-summary">
          <div class="report-item">
            <label>Total Boats:</label>
            <span>{{ collisionReport.totalBoats }}</span>
          </div>
          <div class="report-item" v-if="collisionReport.criticalCollisions > 0">
            <label>Critical Collisions:</label>
            <span class="critical">{{ collisionReport.criticalCollisions }}</span>
          </div>
          <div class="report-item" v-if="collisionReport.warningCollisions > 0">
            <label>Warning Collisions:</label>
            <span class="warning">{{ collisionReport.warningCollisions }}</span>
          </div>
        </div>
        <div v-if="collisionReport.collisionPairs.length > 0" class="collision-pairs">
          <h4>Collision Pairs:</h4>
          <div v-for="pair in collisionReport.collisionPairs" :key="pair" class="collision-pair">
            {{ pair }}
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="saveLayout" class="btn-primary">Save Layout</button>
        <button @click="exportImage" class="btn-secondary">Export Image</button>
        <button @click="resetLayout" class="btn-danger">Reset Layout</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBoatPlacement } from '../composables/useBoatPlacement';
import { useCollisionDetection } from '../composables/useCollisionDetection';
import { KonvaStorageService } from '../services/konva-storage.service';
import KonvaCanvas from '../components/KonvaCanvas.vue';

const storageService = new KonvaStorageService();
const { findOptimalPlacements, checkCollision } = useBoatPlacement();
const { getCollisionReport } = useCollisionDetection();

const canvasRef = ref<InstanceType<typeof KonvaCanvas>>();
const selectedStorageUnitId = ref<string>('');
const selectedBoat = ref<any>(null);
const storageUnits = ref<any[]>([]);
const boats = ref<any[]>([]);
const placementSuggestions = ref<any[]>([]);
const collisionReport = ref<any>(null);

const unplacedBoats = computed(() =>
  boats.value.filter(boat => !boat.current_placement_id || boat.current_status === 'oplacerad')
);

const selectBoat = (boat: any) => {
  selectedBoat.value = boat;
  loadPlacementSuggestions();
};

const handleBoatDragStart = (boat: any, event: DragEvent) => {
  selectedBoat.value = boat;
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(boat));
  }
};

const handleStorageChange = () => {
  if (selectedBoat.value) {
    loadPlacementSuggestions();
  }
};

const handleBoatSelected = (boatId: string) => {
  selectedBoat.value = boats.value.find(b => b.id.toString() === boatId);
};

const handleBoatMoved = async (boatId: string, x: number, y: number, rotation: number) => {
  // Update collision report when boats are moved
  updateCollisionReport();
};

const handleBoatDropped = (boatId: string, x: number, y: number) => {
  console.log('Boat dropped:', { boatId, x, y });
  updateCollisionReport();
};

const loadPlacementSuggestions = async () => {
  if (!selectedBoat.value || !selectedStorageUnitId.value) {
    placementSuggestions.value = [];
    return;
  }

  const storageUnit = storageUnits.value.find(u => u.id.toString() === selectedStorageUnitId.value);
  if (storageUnit) {
    try {
      const suggestions = await findOptimalPlacements(selectedBoat.value, storageUnit);
      placementSuggestions.value = suggestions;
    } catch (error) {
      console.error('Error loading placement suggestions:', error);
      placementSuggestions.value = [];
    }
  }
};

const applySuggestion = (suggestion: any) => {
  if (selectedBoat.value && canvasRef.value) {
    canvasRef.value.updateBoatPosition(
      selectedBoat.value.id,
      suggestion.x,
      suggestion.y,
      suggestion.rotation
    );
  }
};

const updateCollisionReport = () => {
  if (canvasRef.value && canvasRef.value.boats) {
    collisionReport.value = getCollisionReport(canvasRef.value.boats);
  }
};

const saveLayout = async () => {
  if (canvasRef.value) {
    const layout = storageService.saveLayout(canvasRef.value.boats);
    const success = await storageService.saveLayoutToJson(layout);
    if (success) {
      alert('Layout saved successfully!');
    } else {
      alert('Failed to save layout.');
    }
  }
};

const exportImage = () => {
  if (canvasRef.value) {
    const imageData = canvasRef.value.exportCanvas();
    if (imageData) {
      const link = document.createElement('a');
      link.download = `boat-layout-${Date.now()}.png`;
      link.href = imageData;
      link.click();
    }
  }
};

const resetLayout = () => {
  if (confirm('Are you sure you want to reset the layout? This will remove all boat placements.')) {
    // Clear all boats from canvas
    if (canvasRef.value) {
      canvasRef.value.boats.forEach((boat, boatId) => {
        canvasRef.value.removeBoat(boatId);
      });
    }
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
  grid-template-columns: 320px 1fr 320px;
  height: 100vh;
  gap: 1px;
  background: #f0f0f0;
}

.sidebar, .details-panel {
  background: white;
  overflow-y: auto;
  padding: 20px;
}

.main-canvas {
  background: white;
  overflow: hidden;
}

.boat-inventory h3,
.storage-selector h3,
.placement-controls h3,
.boat-details h3,
.collision-report h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 8px;
}

.boat-list {
  max-height: 300px;
  overflow-y: auto;
}

.boat-item {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
}

.boat-item:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.boat-item.selected {
  border-color: #007bff;
  background: #e3f2fd;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.2);
}

.boat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.boat-name {
  font-weight: bold;
  color: #333;
}

.boat-dimensions {
  font-size: 12px;
  color: #666;
}

.boat-status, .status-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  text-transform: uppercase;
  font-weight: bold;
}

.boat-status.i_lager, .status-badge.i_lager {
  background: #e8f5e8;
  color: #4caf50;
}

.boat-status.vid_brygga, .status-badge.vid_brygga {
  background: #e3f2fd;
  color: #2196f3;
}

.boat-status.oplacerad, .status-badge.oplacerad {
  background: #fff3e0;
  color: #ff9800;
}

.storage-selector select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.suggestions-list {
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-score {
  font-weight: bold;
  color: #007bff;
  margin-bottom: 4px;
}

.suggestion-details {
  font-size: 12px;
  color: #666;
}

.suggestion-reason {
  font-style: italic;
  margin-top: 4px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 4px 0;
}

.detail-row label {
  font-weight: bold;
  color: #555;
}

.report-summary {
  margin-bottom: 15px;
}

.report-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.critical {
  color: #f44336;
  font-weight: bold;
}

.warning {
  color: #ff9800;
  font-weight: bold;
}

.collision-pairs {
  margin-top: 10px;
}

.collision-pair {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
  padding: 2px 0;
}

.actions {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-primary, .btn-secondary, .btn-danger {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}
</style>
