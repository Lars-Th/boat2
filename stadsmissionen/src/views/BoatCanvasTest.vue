<template>
  <div class="boat-canvas-test-page">
    <BoatDetailCanvas :initial-boat-data="testBoat" />
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
.boat-canvas-test-page {
  width: 100vw;
  height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
  box-sizing: border-box;
}

/* BoatDetailCanvas will now take center stage with proper responsive sizing */
</style>
