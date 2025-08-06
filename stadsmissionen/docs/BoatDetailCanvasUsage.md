# BoatDetailCanvas - Användning och Återanvändning

## 📋 Översikt

`BoatDetailCanvas.vue` är en komplett, återanvändbar komponent för att visualisera och redigera båtar med Konva.js. Komponenten inkluderar professionell Adobe-stil toolbar och komplett save/load-funktionalitet.

## 🎯 Funktioner

### ✅ **Komplett båtvisualisering:**
- Realistisk båtform med mjuka radier
- Säkerhetsmarginal som skalas korrekt
- Zoom, text-skalning och responsiv design

### ✅ **Save/Load-funktioner:**
- **LocalStorage** - Snabb save/load för tillfällig användning
- **JSON Download** - Permanent säkerhetskopiering
- **Importera från fil** - Ladda befintliga konfigurationer
- **Reset till defaults** - Återställ till ursprungsinställningar

### ✅ **Professionell design:**
- Adobe-inspirerad toolbar med rundade hörn
- Hover-effekter och smooth animations
- Responsiv för alla skärmstorlekar

## 🚀 Hur man använder komponenten

### **1. Grundläggande användning:**

```vue
<template>
  <div>
    <BoatDetailCanvas
      :initialBoatData="myBoatData"
      ref="boatCanvas"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BoatDetailCanvas from '@/components/konva/BoatDetailCanvas.vue'

const boatCanvas = ref(null)

const myBoatData = {
  id: 1,
  name: "Min Båt",
  length: 8.5,
  width: 2.8,
  safety_margin: 0.5,
  current_status: "oplacerad"
  // ... andra båtegenskaper
}
</script>
```

### **2. Programmatisk kontroll:**

```vue
<script setup>
// Spara aktuella inställningar
const saveCurrentConfig = () => {
  if (boatCanvas.value) {
    boatCanvas.value.quickSaveToStorage()
  }
}

// Ladda sparade inställningar
const loadSavedConfig = () => {
  if (boatCanvas.value) {
    boatCanvas.value.quickLoadFromStorage()
  }
}

// Ladda ner som JSON-fil
const downloadConfig = () => {
  if (boatCanvas.value) {
    boatCanvas.value.downloadBoatConfig()
  }
}

// Kontrollera om det finns sparad konfiguration
const checkSavedConfig = () => {
  if (boatCanvas.value) {
    console.log('Har sparad config:', boatCanvas.value.hasSavedConfig)
  }
}

// Zooma och centrera
const zoomAndCenter = () => {
  if (boatCanvas.value) {
    boatCanvas.value.zoomIn()
    boatCanvas.value.centerBoat()
  }
}
</script>
```

### **3. Avancerad konfiguration:**

```vue
<script setup>
// Få tillgång till fullständiga inställningar
const getCompleteSettings = () => {
  if (boatCanvas.value) {
    const settings = boatCanvas.value.saveBoatSettings()
    console.log('Kompletta inställningar:', settings)
    return settings
  }
}

// Ladda specifika inställningar
const loadSpecificSettings = (settings) => {
  if (boatCanvas.value) {
    boatCanvas.value.loadBoatSettings(settings)
  }
}

// Ändra visuellt tillstånd
const changeVisualState = (state) => {
  if (boatCanvas.value) {
    boatCanvas.value.setVisualState(state) // 'kollision_marginal', 'kollision_skrov', etc.
  }
}
</script>
```

## 💾 Save/Load-funktioner

### **LocalStorage (Snabb access):**
- `quickSaveToStorage()` - Sparar till webbläsarens localStorage
- `quickLoadFromStorage()` - Laddar från localStorage
- `hasSavedConfig` - Computed property som visar om det finns sparad config

### **Fil-baserad:**
- `downloadBoatConfig()` - Laddar ner JSON-fil med alla inställningar
- `exportBoatSettings()` - Returnerar inställningar som JSON
- `importBoatSettings(file)` - Laddar inställningar från fil

### **Återställning:**
- `resetBoatToDefaults()` - Återställer alla inställningar till ursprungsläge

## 🎨 Anpassning och Styling

### **CSS-klasser för styling:**
```css
.boat-detail-canvas-container {
  /* Huvudcontainer med rundade hörn */
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.canvas-toolbar {
  /* Adobe-stil toolbar */
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #dee2e6;
}

.toolbar-button {
  /* Professionella knappar */
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}
```

### **Responsiv design:**
Komponenten anpassar sig automatiskt till:
- ✅ Desktop (full funktionalitet)
- ✅ Tablet (kompakt toolbar)
- ✅ Mobile (vertikal layout)

## 🔧 Tekniska detaljer

### **Exponerade funktioner:**
```typescript
interface BoatDetailCanvasRef {
  // Data
  boatData: Ref<BoatData>
  boatPosition: Ref<{x: number, y: number}>
  boatRotation: Ref<number>

  // Save/Load
  saveBoatSettings(): BoatSettings
  loadBoatSettings(settings: BoatSettings): void
  quickSaveToStorage(): void
  quickLoadFromStorage(): void
  downloadBoatConfig(): void
  hasSavedConfig: ComputedRef<boolean>

  // Canvas kontroll
  zoomIn(): void
  zoomOut(): void
  centerBoat(): void

  // Visuell kontroll
  setVisualState(state: string): void
  resetVisualState(): void
}
```

### **BoatSettings-format:**
```typescript
interface BoatSettings {
  boatData: BoatData
  visualSettings: {
    currentState: string | null
    showBoatName: boolean
    showOwner: boolean
    showRegistration: boolean
  }
  canvasSettings: {
    zoomLevel: number
    manualZoomOverride: number | null
    centerPosition: {x: number, y: number}
  }
}
```

## 📁 Projektstruktur för återanvändning

```
src/
├── components/
│   ├── konva/
│   │   ├── BoatDetailCanvas.vue     # ← Huvudkomponent
│   │   ├── StandardToolbox.vue      # Återanvändbar toolbar-layout
│   │   └── StandardToolboxStyles.vue # CSS-stilar
│   └── ...
├── types/
│   └── konva/
│       └── index.ts                 # TypeScript-definitioner
└── assets/
    └── data/
        ├── boats.json              # Båtdata
        └── customers.json          # Kunddata
```

## 🎯 Användningsfall

### **1. Båtdetaljsida:**
```vue
<!-- I BoatDetail.vue -->
<BoatDetailCanvas :initialBoatData="boat" />
```

### **2. Fristående test-sida:**
```vue
<!-- I BoatCanvasTest.vue -->
<BoatDetailCanvas :initialBoatData="testBoat" />
```

### **3. Båt-konfigurator:**
```vue
<!-- Ny komponent för båtkonfiguration -->
<template>
  <div class="boat-configurator">
    <BoatDetailCanvas
      :initialBoatData="currentBoat"
      ref="canvas"
    />
    <div class="config-panel">
      <button @click="saveConfig">Spara konfiguration</button>
      <button @click="loadConfig">Ladda konfiguration</button>
    </div>
  </div>
</template>
```

## 🏆 Fördelar med denna approach

### ✅ **Återanvändbar:**
- Drop-in komponent som fungerar överallt
- Ingen extern konfiguration krävs
- Självständig med egen state-hantering

### ✅ **Komplett:**
- Alla nödvändiga funktioner inkluderade
- Save/load "just works"
- Professionell design från början

### ✅ **Flexibel:**
- Kan integreras i befintliga sidor
- Programmatisk kontroll möjlig
- Anpassningsbar via props och refs

### ✅ **Underhållbar:**
- Klar dokumentation
- TypeScript-stöd
- Modulär arkitektur

---

*Skapad: 2024-01-XX | Uppdaterad: 2024-01-XX | Version: 1.0*
