<template>
  <!-- This component only provides CSS styles - no actual template -->
</template>

<script setup lang="ts">
// This component provides reusable CSS styles for all toolbox elements
// Import this component in any Konva component to get the standardized styles
</script>

<style>
/* ===========================================
   STANDARDIZED PROFESSIONAL TOOLBOX STYLES
   Adobe-Style Design System
   =========================================== */

/* Toolbar Groups */
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

/* Input Groups */
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

/* Toolbar Buttons */
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

/* Checkboxes */
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

/* Display Elements */
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

.toolbar-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* Test/Action Buttons */
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

.test-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #495057;
  margin-right: 0.625rem;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}

/* Color-coded Test Icons */
.green-test {
  background: #d4edda;
  color: #155724;
}

.orange-test {
  background: #fff3cd;
  color: #856404;
}

.red-test {
  background: #f8d7da;
  color: #721c24;
}

.blue-test {
  background: #d1ecf1;
  color: #0c5460;
}

.light-gray-test {
  background: #f3f4f6;
  color: #9ca3af;
}

.gray-test {
  background: #f3f4f6;
  color: #6b7280;
}

/* Responsive Design */
@media (max-width: 768px) {
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
