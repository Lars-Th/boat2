<template>
  <div class="konva-advanced-view">
    <div class="page-header">
      <h1>🎨 Konva Advanced - Båtlager System</h1>
      <p>Steg 1A: Båtdetalj Canvas - Redigera en båt i taget</p>
    </div>

    <div class="content-container">
      <!-- Boat Selection Panel -->
      <div class="boat-selection-panel">
        <h2>🚢 Välj Båt att Redigera</h2>
        <div class="boat-grid">
          <div
            v-for="boat in boats"
            :key="boat.id"
            class="boat-card"
            @click="selectBoatForEditing(boat)"
            :class="{ active: selectedBoat?.id === boat.id }"
          >
            <div class="boat-header">
              <span class="boat-name">{{ boat.name }}</span>
              <span class="boat-id">#{{ boat.id }}</span>
            </div>
            <div class="boat-dimensions">
              <span class="dimension">{{ boat.length }}m × {{ boat.width }}m</span>
              <span class="safety-margin">±{{ boat.safety_margin }}m</span>
            </div>
            <div class="boat-status">
              <span class="status-badge" :class="boat.current_status">
                {{ boat.current_status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Boat Detail Canvas -->
      <div v-if="selectedBoat" class="canvas-container">
        <BoatDetailCanvas :initial-boat-data="selectedBoat" />
      </div>

      <!-- Placeholder when no boat selected -->
      <div v-else class="no-boat-selected">
        <div class="placeholder-content">
          <div class="placeholder-icon">🚢</div>
          <h3>Välj en båt att redigera</h3>
          <p>Klicka på en båt från listan för att öppna båtdetalj editorn</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BoatDetailCanvas from '@/components/konva/BoatDetailCanvas.vue';
import type { BoatData } from '@/types/konva';
import boatsData from '@/assets/data/boats.json';

// Reactive state
const boats = ref<BoatData[]>([]);
const selectedBoat = ref<BoatData | null>(null);

// Load boats data
const loadBoats = () => {
  boats.value = boatsData as BoatData[];
};

// Select boat for editing
const selectBoatForEditing = (boat: BoatData) => {
  selectedBoat.value = boat;
};

// Lifecycle
onMounted(() => {
  loadBoats();
});
</script>

<style scoped>
.konva-advanced-view {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.content-container {
  display: flex;
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.boat-selection-panel {
  flex: 0 0 350px;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.boat-selection-panel h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.boat-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.boat-card {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f9fafb;
}

.boat-card:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.boat-card.active {
  border-color: #3b82f6;
  background: #dbeafe;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.boat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.boat-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 1rem;
}

.boat-id {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.boat-dimensions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.dimension {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.safety-margin {
  font-size: 0.75rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.boat-status {
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.oplacerad {
  background: #dcfce7;
  color: #166534;
}

.status-badge.i_lager {
  background: #f3f4f6;
  color: #374151;
}

.status-badge.vid_brygga {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.service {
  background: #fef3c7;
  color: #92400e;
}

.canvas-container {
  flex: 1;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.no-boat-selected {
  flex: 1;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.placeholder-content {
  text-align: center;
  color: #6b7280;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.placeholder-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
}

.placeholder-content p {
  font-size: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

/* Responsive */
@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }

  .boat-selection-panel {
    flex: none;
  }

  .boat-grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .boat-card {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 768px) {
  .konva-advanced-view {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .boat-grid {
    flex-direction: column;
  }
}
</style>
