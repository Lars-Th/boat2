<template>
  <div class="boat-canvas-test">
    <div class="test-header">
      <h1>🚢 Båt Canvas Test</h1>
      <p>Test av BoatDetailCanvas komponenten - Steg 1A implementation</p>
    </div>

    <div class="test-content">
      <!-- Quick Info Panel -->
      <div class="info-panel">
        <h3>🎯 Test Information</h3>
        <div class="info-list">
          <div class="info-item">
            <strong>Komponent:</strong> BoatDetailCanvas.vue
          </div>
          <div class="info-item">
            <strong>Testbåt:</strong> {{ testBoat.name }}
          </div>
          <div class="info-item">
            <strong>Dimensioner:</strong> {{ testBoat.length }}m × {{ testBoat.width }}m
          </div>
          <div class="info-item">
            <strong>Marginal:</strong> {{ testBoat.safety_margin }}m
          </div>
          <div class="info-item">
            <strong>Status:</strong> {{ testBoat.current_status }}
          </div>
        </div>

        <div class="test-instructions">
          <h4>🎮 Hur du testar:</h4>
          <ul>
            <li>Ändra värden i toolbar (längd, bredd, marginal)</li>
            <li>Använd rotationsknappar (⟲ ⟳)</li>
            <li>Zooma in/ut med +/- knapparna</li>
            <li>Dra båten runt i canvas</li>
            <li>Klicka på båten för att visa transform handles</li>
            <li>Testa Spara och Återställ funktionerna</li>
          </ul>
        </div>
      </div>

      <!-- Canvas Component -->
      <div class="canvas-section">
        <BoatDetailCanvas :initial-boat-data="testBoat" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BoatDetailCanvas from '@/components/konva/BoatDetailCanvas.vue';
import type { BoatData } from '@/types/konva';

// Test boat data
const testBoat = ref<BoatData>({
  id: 999,
  customer_id: 1,
  name: 'Test Canvas Båt',
  length: 7.5,
  width: 2.5,
  safety_margin: 0.8,
  weight: 1500,
  konva_shape_json: '',
  current_status: 'oplacerad',
  location_status: 'lager',
  current_placement_id: null,
  move_to_storage_date: null,
  move_from_storage_date: null,
  move_to_brygga_date: null,
  move_from_brygga_date: null,
  service_date: null,
  notes: 'Test båt för Canvas komponenten',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sms_notifications: false,
  email_notifications: false,
});
</script>

<style scoped>
.boat-canvas-test {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 1rem;
}

.test-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.test-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.test-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.test-content {
  display: flex;
  gap: 1rem;
  max-width: 1800px;
  margin: 0 auto;
}

.info-panel {
  flex: 0 0 300px;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.info-panel h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.info-panel h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 1.5rem 0 0.5rem 0;
}

.info-list {
  margin-bottom: 1.5rem;
}

.info-item {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
}

.info-item strong {
  color: #374151;
  font-weight: 600;
}

.test-instructions {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.test-instructions ul {
  margin: 0;
  padding-left: 1.5rem;
}

.test-instructions li {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.canvas-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 1024px) {
  .test-content {
    flex-direction: column;
  }

  .info-panel {
    flex: none;
    order: 2;
  }

  .canvas-section {
    order: 1;
    min-height: 600px;
  }
}

@media (max-width: 768px) {
  .boat-canvas-test {
    padding: 0.5rem;
  }

  .test-header {
    padding: 1rem;
  }

  .test-header h1 {
    font-size: 2rem;
  }

  .test-content {
    gap: 0.5rem;
  }
}
</style>
