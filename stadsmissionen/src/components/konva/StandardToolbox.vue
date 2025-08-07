<template>
  <div class="standard-toolbox">
    <!-- Professional Adobe-style Toolbar -->
    <div class="canvas-toolbar">
      <slot name="toolbar-groups">
        <!-- Default toolbar groups will be provided by parent component -->
      </slot>
    </div>

    <!-- Canvas Container with Border -->
    <div class="canvas-container">
      <slot name="canvas">
        <!-- Canvas content goes here -->
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
// This component provides the standardized toolbox layout
// All functionality is handled by parent components through slots
</script>

<style scoped>
/* ===========================================
   STANDARDIZED PROFESSIONAL TOOLBOX DESIGN
   =========================================== */

.standard-toolbox {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f8f9fa;
}

/* Professional Adobe-style Toolbar */
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

/* Canvas Container with Professional Border - matches DetailPage.vue */
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f5f5f5;
  position: relative;
  overflow: hidden;
}

/* Responsive Design */
@media (max-width: 768px) {
  .canvas-toolbar {
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem;
    background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  }

  .canvas-container {
    padding: 1rem;
  }
}
</style>
