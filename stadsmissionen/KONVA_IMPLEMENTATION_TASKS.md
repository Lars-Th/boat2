# Konva Båtlager Implementation - Task Checklist

## 📋 Projektöversikt
Implementation av professionellt CAD-liknande båtlagersystem med Konva.js i Vue.js applikation "Stadsmissionen" som körs på localhost:5175. Projektet har redan komplett datastruktur (boats.json, storageUnits.json, placements.json) och en fungerande HTML-prototyp som visar exakt hur funktionaliteten ska fungera.

### 🔄 Ny Stegvis Approach (Reviderad 2024-01-XX)
**Problem med original plan:** För komplex med flera lager samtidigt i samma canvas.
**Ny strategi:** EN komponent åt gången, EN canvas åt gången, stegvis byggande.

**Steg 1:** Båtdetalj Canvas - Visa EN båt med alla egenskaper och redigering
**Steg 2:** Lager Designer - Rita och designa lager + begränsningsytor
**Steg 3:** Båtplacering Manager - Kombinera båtar och lager för placement
**Steg 4-5:** Integration, polish och avancerade funktioner

Denna approach är enklare, mer testbar och ger bättre användarupplevelse.

### 🏗️ Befintlig Projektstruktur
- **Vue.js applikation** med TypeScript och Tailwind CSS
- **Shadcn/ui komponentbibliotek** för professionell design
- **JSON-baserad datalagring** i `/src/assets/data/`
- **MapLibre implementation** för kartfunktionalitet (se MapImplementation.md)
- **Komplett routing och navigation** system
- **Responsive design** som fungerar på alla enheter

### 🎯 Mål (BASERAT PÅ KRAV-DOKUMENT)
Skapa ett professionellt CAD-liknande interface för båtplacering med:
- **Drag & drop funktionalitet** - Direkt från HTML-prototyp
- **Real-time kollisionsdetektion** - Färgkodning (grön/gul/röd)
- **SVG-baserade båtrepresentationer** - Exakta dimensioner
- **Integration med befintlig JSON-datastruktur** - Använd befintliga fält
- **Export och import funktioner** - PNG, JSON, PDF-rapporter
- **Restriction Zones** - Begränsningsområden med drag/resize
- **Multi-Level Storage** - Våningsystem för mindre båtar
- **Båtlager Menu System** - Lager vs Bryggor views
- **Seasonal Workflow** - Vinter/sommar migration
- **Customer Integration** - Koppla till befintlig kunddatabas

---

## Phase 1: Steg 1 - Båtdetalj Canvas (Vecka 1-2)

### 🔧 Installation & Dependencies
- [x] **Installera Konva dependencies** ✅
  ```bash
  npm install konva vue-konva @types/konva
  ```
- [x] **Verifiera package.json updates** ✅
  - [x] Kontrollera att alla packages är installerade
  - [x] Testa att Konva importeras korrekt

### 📁 Project Structure Setup
- [x] **Skapa Konva-specifika directories** ✅
  - [x] `/src/components/konva/`
  - [x] `/src/composables/konva/`
  - [x] `/src/services/konva/`
  - [x] `/src/types/konva/`

### 🛠️ TypeScript Interfaces (EXACT MATCH MED VERKLIG DATA)
- [x] **Skapa `/src/types/konva/index.ts`** ✅
  - [x] Alla interfaces som matchar exakt JSON-strukturen
  - [x] Linter-säkra exports och imports
  - [x] GeoJSON type definitions
  - [x] Konva-specifika type extensions

### 🎨 Båt SVG & Styling Service ✅
- [x] **Skapa `/src/services/konva/boat-svg.service.ts`** ✅
  - [x] Kopiera SVG paths från HTML-prototyp
  - [x] Implementera `stateStyles` konfiguration (4 tillstånd)
  - [x] Skapa `applyBoatStyle()` funktion
  - [x] Exportera `HULL_PATH`, `MARGIN_PATH`, `HULL_VB`, `MARGIN_VB`
  - [x] Implementera `parseKonvaShapeJson()` för befintlig konva_shape_json
  - [x] Skapa `generateKonvaShapeJson()` för att spara tillbaka

### 🎨 Standardiserat Toolbox Design System ✅ **NEW**
- [x] **Skapa `/src/components/konva/StandardToolbox.vue`** ✅
  - [x] Adobe-inspirerad professionell toolbar design
  - [x] Återanvändbar layout med slots för innehåll
  - [x] Responsiv design för alla skärmstorlekar
- [x] **Skapa `/src/components/konva/StandardToolboxStyles.vue`** ✅
  - [x] Komplett CSS-bibliotek för alla toolbar-element
  - [x] Gradienter, skuggor och hover-effekter
  - [x] Färgkodade tillstånd för visuell feedback
- [x] **Skapa `/docs/StandardizedToolboxDesign.md`** ✅
  - [x] Komplett dokumentation för designsystemet
  - [x] Användningsexempel och CSS-referens
  - [x] Implementation checklist för nya komponenter
- [x] **Skapa `/src/components/konva/ExampleStandardToolbox.vue`** ✅
  - [x] Exempelkomponent som visar hur man använder systemet
  - [x] Alla toolbar-element och interaktioner
  - [x] Template för framtida Konva-komponenter

### 🚤 Steg 1A: Båtdetalj Canvas Komponent ✅
- [x] **Skapa `/src/components/konva/BoatDetailCanvas.vue`** ✅
  - [x] Enkel canvas som visar EN båt
  - [x] Toolbar för att redigera båt properties (längd, bredd, marginal)
  - [x] Rotation kontroller (vänster/höger)
  - [x] Zoom kontroller (+/-)
  - [x] Real-time dimensionsuppdatering
  - [x] Spara ändringar till boats.json
  - [x] **BONUS: Skapade Standardiserat Toolbox Design System** 🎨

### 🚤 Steg 1B: Integrera med BoatDetail.vue
- [ ] **Uppdatera `/src/views/BoatDetail.vue`**
  - [ ] Lägg till BoatDetailCanvas komponent
  - [ ] Passa båtdata till canvas
  - [ ] Hantera ändringar från canvas
  - [ ] Visa canvas i ett fint kort/panel

### 🚤 Steg 1C: Grundläggande Båt Funktionalitet
- [ ] **Implementera båt-rendering**
  - [ ] Använd verkliga dimensioner från boats.json
  - [ ] Visa båt med SVG paths (hull + margin)
  - [ ] Färgkodning baserat på status
  - [ ] Centered text med båtnamn
  - [ ] Hover effekter och tooltips

### 🚤 Steg 1D: Båt-redigering
- [ ] **Implementera redigering**
  - [ ] Drag för att flytta båt i canvas
  - [ ] Rotation handles
  - [ ] Resize för dimensioner
  - [ ] Dubbelklick för att växla state
  - [ ] Spara ändringar automatiskt

---

## Phase 2: Steg 2 - Lager/Brygga Designer (Vecka 2-3)

### 🏗️ Steg 2A: Lager Canvas Komponent
- [ ] **Skapa `/src/components/konva/StorageDesigner.vue`**
  - [ ] Tom canvas för att designa lager
  - [ ] Toolbar för att välja lagertyp (warehouse/dock)
  - [ ] Rita rektanglar för lager
  - [ ] Definiera dimensioner (längd x bredd)
  - [ ] Namnge lager
  - [ ] Spara till storageUnits.json

### 🏗️ Steg 2B: Begränsningsytor
- [ ] **Implementera Restriction Zones**
  - [ ] Rita rektanglar för begränsningsytor
  - [ ] Olika typer: pelare, gångar, serviceytor
  - [ ] Färgkodning för olika typer
  - [ ] Drag & drop för att flytta zoner
  - [ ] Resize handles för att ändra storlek
  - [ ] Spara till restrictionZones.json

### 🏗️ Steg 2C: Våningsystem
- [ ] **Implementera Multi-Level Storage**
  - [ ] Level selector för warehouses
  - [ ] Visa kapacitet per våning
  - [ ] Olika restriktioner per level
  - [ ] Vertical space visualization
  - [ ] Spara till warehouseLevels.json

### 🏗️ Steg 2D: Integrera med befintliga vyer
- [ ] **Uppdatera Storage Views**
  - [ ] Lägg till StorageDesigner i StorageLocationDetail.vue
  - [ ] Visa befintliga lager med redigeringsmöjlighet
  - [ ] Import/export funktionalitet
  - [ ] Validering av lager-dimensioner

---

## Phase 3: Steg 3 - Båtplacering Manager (Vecka 3-4)

### 🎯 Steg 3A: Placement Canvas
- [ ] **Skapa `/src/components/konva/BoatPlacementCanvas.vue`**
  - [ ] Visa ETT specifikt lager åt gången
  - [ ] Visa alla begränsningsytor för det lagret
  - [ ] Drag & drop båtar från sidopanel
  - [ ] Kollisionsdetektion med färgkodning
  - [ ] Spara placements till placements.json

### 🎯 Steg 3B: Kollisionsdetektion
- [ ] **Implementera `/src/composables/konva/useCollisionDetection.ts`**
  - [ ] Hull vs hull kollisioner
  - [ ] Margin vs restriction zone kollisioner
  - [ ] Real-time färgkodning (grön/orange/röd)
  - [ ] Performance optimering med throttling
  - [ ] Ljudnotifikationer vid kollision

### 🎯 Steg 3C: Placement Manager View
- [ ] **Skapa `/src/views/BoatPlacementManager.vue`**
  - [ ] Tre-panel layout (båtar, canvas, detaljer)
  - [ ] Vänster: Lista oplacerade båtar
  - [ ] Mitten: Placement canvas för valt lager
  - [ ] Höger: Detaljer och kontroller
  - [ ] Lager-selector dropdown
  - [ ] Search och filter funktionalitet

### 🎯 Steg 3D: Advanced Placement Features
- [ ] **Intelligent placement**
  - [ ] Auto-placement algoritm
  - [ ] Suggestion system
  - [ ] Optimal space utilization
  - [ ] Rotation optimization
  - [ ] Bulk placement för flera båtar

---

## Phase 4: Steg 4 - Integration & Polish (Vecka 4-5)

### 🔄 Steg 4A: Data Services
- [ ] **Skapa `/src/services/konva/konva-storage.service.ts`**
  - [ ] Integrera med alla JSON-filer
  - [ ] CRUD operationer för båtar, lager, placements
  - [ ] GeoJSON parsing för shape_geometry
  - [ ] Backup och versionshantering
  - [ ] Real-time sync mellan komponenter

### 🔄 Steg 4B: Navigation Integration
- [ ] **Uppdatera routing**
  - [ ] Lägg till routes för alla nya vyer
  - [ ] Breadcrumb navigation
  - [ ] Deep linking support
  - [ ] Route guards för permissions
  - [ ] Update NavigationSidebar med "Båtlager" menu

### 🔄 Steg 4C: Export & Import
- [ ] **Implementera export funktioner**
  - [ ] PNG export av canvas
  - [ ] PDF rapporter med båtlistor
  - [ ] JSON export av layout
  - [ ] Excel export för kapacitetsplanering
  - [ ] Import från andra system

### 🔄 Steg 4D: Notifications & Workflow
- [ ] **Seasonal Workflow**
  - [ ] Automatisk vinter/sommar migration
  - [ ] Notification system för kunder
  - [ ] Bulk move funktionalitet
  - [ ] Calendar integration
  - [ ] SMS/Email notifications

---

## Phase 5: Steg 5 - Advanced Features (Vecka 5-6)

### 🎨 Steg 5A: UI/UX Förbättringar
- [ ] **Polish användargränssnitt**
  - [ ] Smooth animationer
  - [ ] Hover effects och tooltips
  - [ ] Keyboard shortcuts
  - [ ] Right-click context menus
  - [ ] Responsive design för alla skärmstorlekar

### 🎨 Steg 5B: Advanced Canvas Features
- [ ] **Avancerade funktioner**
  - [ ] Layers system för olika element
  - [ ] Snap-to-grid funktionalitet
  - [ ] Ruler och measurements
  - [ ] Mini-map för stora lager
  - [ ] History och undo/redo

### 🎨 Steg 5C: Performance & Optimization
- [ ] **Optimera prestanda**
  - [ ] Lazy loading av stora datasets
  - [ ] Virtualization för många båtar
  - [ ] Canvas caching
  - [ ] Memory leak prevention
  - [ ] Mobile optimization

### 🎨 Steg 5D: Testing & Documentation
- [ ] **Kvalitetssäkring**
  - [ ] Unit tests för alla services
  - [ ] Integration tests för komponenter
  - [ ] E2E tests för användarflöden
  - [ ] Performance benchmarks
  - [ ] Användardokumentation

---

## Phase 6: Data Integration (Vecka 6-7)

### 📦 JSON Data Integration
- [ ] **Integrera med befintliga data**
  - [ ] Mappa `boats.json` till Konva format
  - [ ] Konvertera `storageUnits.json` GeoJSON till Konva shapes
  - [ ] Integrera `placements.json` med placement system
  - [ ] Skapa backup & restore funktionalitet

### 🔄 Real-time Updates
- [ ] **Implementera reaktiv data**
  - [ ] Vue reactivity för båt positions
  - [ ] Automatisk sparning av ändringar
  - [ ] Undo/Redo funktionalitet

---

## Phase 7: Advanced Features (Vecka 7-8)

### 🎨 UI/UX Enhancements
- [ ] **Förbättra användarupplevelse**
  - [ ] Snygga animationer för båt placering
  - [ ] Hover effects och tooltips
  - [ ] Keyboard shortcuts
  - [ ] Right-click context menu

### 📤 Export & Import
- [ ] **Implementera export funktioner**
  - [ ] PNG export av canvas
  - [ ] PDF export med båt lista
  - [ ] JSON export av layout
  - [ ] Import från andra format

### 🔍 Search & Filter
- [ ] **Sök och filter funktionalitet**
  - [ ] Sök båtar efter namn/ID
  - [ ] Filtrera efter storlek
  - [ ] Visa endast kollisioner
  - [ ] Highlighting av sökresultat

---

## Phase 8: Testing & Optimization (Vecka 8-9)

### 🧪 Unit Tests
- [ ] **Skapa tests för services**
  - [ ] Test `boat-svg.service.ts`
  - [ ] Test `konva-storage.service.ts`
  - [ ] Test `placement.service.ts`

### 🔧 Integration Tests
- [ ] **Testa komponenter**
  - [ ] Test `KonvaCanvas.vue`
  - [ ] Test `BoatPlacementManager.vue`
  - [ ] Test kollisionsdetektion

### ⚡ Performance Optimization
- [ ] **Optimera prestanda**
  - [ ] Lazy loading av båtar
  - [ ] Virtualisering för stora datasets
  - [ ] Throttling av collision detection
  - [ ] Memory leak prevention

---

## Phase 9: Documentation & Deployment (Vecka 9-10)

### 📚 Documentation
- [ ] **Skapa användarguide**
  - [ ] How-to guide för båt placering
  - [ ] Troubleshooting guide
  - [ ] API documentation

### 🚀 Deployment
- [ ] **Förbered för produktion**
  - [ ] Build optimization
  - [ ] Environment configuration
  - [ ] Performance monitoring setup

---

## 🔧 Technical Implementation Notes

### SVG Paths från Prototyp:
```javascript
// Kopiera exakt från HTML-prototyp
const HULL_PATH = "M2,8.373V63.627C2,67.147,5.76,70,10.4,70h113.58a9.823,9.823,0,0,0,6.128-2.015l34.122-27.627a5.317,5.317,0,0,0,0-8.715L130.106,4.015A9.823,9.823,0,0,0,123.978,2H10.4C5.76,2,2,4.853,2,8.373Z";
const MARGIN_PATH = "M2,10.5V84.231c0,4.7,4.466,8.5,9.975,8.5h134.9a10.853,10.853,0,0,0,7.278-2.689l40.526-36.864a7.617,7.617,0,0,0,0-11.629L154.152,4.689A10.853,10.853,0,0,0,146.874,2H11.975C6.466,2,2,5.807,2,10.5Z";

// ViewBox dimensioner för skalning
const HULL_VB = { w: 166.498, h: 70 };
const MARGIN_VB = { w: 196.375, h: 91.734 };

// Konvertering konstanter
const PX_PER_M = 10; // Pixlar per meter
const areaM = { w: 145, h: 75 }; // Lagerområde i meter
```

### Färgschema från Prototyp:
```javascript
const stateStyles = {
  new: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#27d07c', strokeWidth: 1, dash: [5,5], fill: '#E9FBF3' }
  },
  placed: {
    hull: { stroke: '#A8A8A8', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#A8A8A8', strokeWidth: 1, dash: [5,5], fill: '#F5F5F8' }
  },
  marginCollision: {
    hull: { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
    margin: { stroke: '#902C00', strokeWidth: 1, dash: [5,5], fill: '#FAEDED' }
  },
  hullCollision: {
    hull: { stroke: '#902C00', strokeWidth: 2, fill: '#FAEDED' },
    margin: { stroke: '#902C00', strokeWidth: 1, dash: [5,5], fill: '#FAEDED' }
  }
};
```

### Kollisionsalgoritm från Prototyp:
```javascript
// Kontrollera kollisioner mellan båtar och zoner
const checkCollisions = (boat) => {
  const rectHull = boat.hullPath.getClientRect({ relativeTo: layer });
  const rectMargin = boat.marginPath.getClientRect({ relativeTo: layer });
  let cHull = false;
  let cMarg = false;

  // 1) Hull-vs-hull för alla båtar
  for (let other of boats) {
    if (other === boat) continue;
    const otherHullRect = other.hullPath.getClientRect({ relativeTo: layer });
    if (Konva.Util.haveIntersection(rectHull, otherHullRect)) {
      cHull = true;
      break;
    }
  }

  // 2) Zon-kollisioner med förbjudna områden
  for (let zone of restrictedZones) {
    const zoneRect = zone.getClientRect({ relativeTo: layer });
    if (Konva.Util.haveIntersection(rectHull, zoneRect)) {
      cHull = true;
    }
    if (!boat.data.placed && Konva.Util.haveIntersection(rectMargin, zoneRect)) {
      cMarg = true;
    }
  }

  return { hullCollision: cHull, marginCollision: cMarg };
};
```

### TypeScript Interfaces (KOMPLETT FÖR LINTER-SÄKERHET):
```typescript
// /src/types/konva/index.ts
import type { GeoJSONGeometry } from 'geojson';

// Boat Data Interface (exakt match med boats.json)
export interface BoatData {
  id: number;
  customer_id: number;
  name: string;
  length: number;
  width: number;
  safety_margin: number;
  weight: number;
  konva_shape_json: string;
  current_status: 'i_lager' | 'vid_brygga' | 'oplacerad' | 'service';
  location_status: 'lager' | 'brygga' | 'lager_brygga';
  current_placement_id: number | null;
  move_to_storage_date: string | null;
  move_from_storage_date: string | null;
  move_to_brygga_date: string | null;
  move_from_brygga_date: string | null;
  service_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  sms_notifications: boolean;
  email_notifications: boolean;
}

// Storage Unit Interface (exakt match med storageUnits.json)
export interface StorageUnit {
  id: number;
  name: string;
  unit_type: 'warehouse' | 'dock';
  shape_geometry: string; // GeoJSON som sträng
  level_count: number;
  is_connected_to_land: boolean;
  connected_unit_id: number | null;
  latitude: number;
  longitude: number;
}

// Placement Interface (exakt match med placements.json)
export interface PlacementData {
  id: number;
  boat_id: number;
  storage_unit_id: number;
  warehouse_level_id: number | null;
  x_coordinate: number;
  y_coordinate: number;
  rotation_angle: number;
  reserved: boolean;
  placed: boolean;
  reserved_date: string;
  placed_date: string | null;
}

// Warehouse Interface (exakt match med warehouses.json)
export interface WarehouseData {
  id: number;
  name: string;
  type: 'indoor_storage' | 'outdoor_storage' | 'covered_storage' | 'trailer_storage';
  latitude: number;
  longitude: number;
  capacity: string;
  status: 'available' | 'full' | 'maintenance';
  size: string;
  services: string[];
  boat_types: string;
}

// Dock Interface (exakt match med docks.json)
export interface DockData {
  id: number;
  name: string;
  type: 'main_dock' | 'guest_dock' | 'small_boat_dock' | 'service_dock' | 'winter_dock';
  latitude: number;
  longitude: number;
  berths: number;
  status: 'operational' | 'maintenance' | 'seasonal';
  capacity: string;
  services: string[];
  depth: string;
  season: string;
}

// Konva-specifika interfaces
export interface KonvaBoatConfig {
  id: number;
  boatData: BoatData;
  placementData: PlacementData | null;
  konvaGroup: Konva.Group;
  hullPath: Konva.Path;
  marginPath: Konva.Path;
  transformer: Konva.Transformer;
  isActive: boolean;
  isInvalid: boolean;
}

export interface KonvaStorageConfig {
  id: number;
  storageUnit: StorageUnit;
  konvaShape: Konva.Shape;
  konvaGroup: Konva.Group;
  restrictedZones: Konva.Shape[];
}

export interface CollisionResult {
  hullCollision: boolean;
  marginCollision: boolean;
  collidingBoats: number[];
  collidingZones: number[];
}

export interface KonvaCanvasConfig {
  width: number;
  height: number;
  scale: number;
  dragBoundFunc: (pos: Konva.Vector2d) => Konva.Vector2d;
  pixelsPerMeter: number;
  areaMeters: { width: number; height: number };
}

// Enum för båtstatus
export enum BoatStatus {
  I_LAGER = 'i_lager',
  VID_BRYGGA = 'vid_brygga',
  OPLACERAD = 'oplacerad',
  SERVICE = 'service'
}

export enum LocationStatus {
  LAGER = 'lager',
  BRYGGA = 'brygga',
  LAGER_BRYGGA = 'lager_brygga'
}

// Parsed Konva Shape (från konva_shape_json)
export interface ParsedKonvaShape {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

// GeoJSON Parser för shape_geometry
export interface ParsedGeoJSON {
  type: 'Polygon' | 'LineString' | 'Point';
  coordinates: number[][][] | number[][] | number[];
}

// Konva Layer Types
export interface KonvaLayers {
  background: Konva.Layer;
  storage: Konva.Layer;
  boats: Konva.Layer;
  ui: Konva.Layer;
}

// Export alla types
export type {
  GeoJSONGeometry,
  BoatData,
  StorageUnit,
  PlacementData,
  WarehouseData,
  DockData,
  KonvaBoatConfig,
  KonvaStorageConfig,
  CollisionResult,
  KonvaCanvasConfig,
  ParsedKonvaShape,
  ParsedGeoJSON,
  KonvaLayers
};
```

---

## 📋 Complete Reference Materials

### 🚤 HTML Prototyp (KOMPLETT REFERENS)
Denna HTML-prototyp visar exakt hur systemet ska fungera och innehåller alla tekniska detaljer:

```html
<!doctype html>
<html lang="sv">
<head>
  <meta charset="utf-8" />
  <title>Båtlager – placera & redigera med kollisioner</title>
  <style>
    html,body{margin:0;height:100%;font-family:system-ui,sans-serif}
    #toolbar{display:flex;gap:12px;align-items:center;padding:8px;background:#f4f4f4;border-bottom:1px solid #ccc;user-select:none;}
    #canvas{width:100%;height:calc(100% - 50px);background:#fafafa;cursor:crosshair;}
    label{font-size:14px;margin-right:8px}
    input[type=number]{width:60px;padding:2px 4px;font-size:14px;margin-right:12px}
    button{padding:4px 8px;font-size:16px}
  </style>
</head>
<body>
  <div id="toolbar">
    <label>Längd (m): <input id="lenInput" type="number" min="1" step="0.1" value="5"></label>
    <label>Bredd (m): <input id="beamInput" type="number" min="0.1" step="0.1" value="2"></label>
    <label>Marginal (m): <input id="marginInput" type="number" min="0" step="0.1" value="0.5"></label>
    <button id="addBoat">Skapa båt</button>
    <button id="rotateLeft">⟲</button>
    <button id="rotateRight">⟳</button>
    <button id="zoomOut">-</button>
    <button id="zoomIn">+</button>
  </div>
  <div id="canvas"></div>

  <script src="https://unpkg.com/konva@9/konva.min.js"></script>
  <script>
  // Konfigurerbara stilar per state
  const stateStyles = {
    new: {
      hull:   { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
      margin: { stroke: '#27d07c', strokeWidth: 1, dash: [5,5], fill: '#E9FBF3' }
    },
    placed: {
      hull:   { stroke: '#A8A8A8', strokeWidth: 2, fill: '#fff' },
      margin: { stroke: '#A8A8A8', strokeWidth: 1, dash: [5,5], fill: '#F5F5F8' }
    },
    marginCollision: {
      hull:   { stroke: '#27d07c', strokeWidth: 2, fill: '#fff' },
      margin: { stroke: '#902C00', strokeWidth: 1, dash: [5,5], fill: '#FAEDED' }
    },
    hullCollision: {
      hull:   { stroke: '#902C00', strokeWidth: 2, fill: '#FAEDED' },
      margin: { stroke: '#902C00', strokeWidth: 1, dash: [5,5], fill: '#FAEDED' }
    }
  };

  // SVG-path och viewBox
  const HULL_PATH   = `M2,8.373V63.627C2,67.147,5.76,70,10.4,70h113.58a9.823,9.823,0,0,0,6.128-2.015l34.122-27.627a5.317,5.317,0,0,0,0-8.715L130.106,4.015A9.823,9.823,0,0,0,123.978,2H10.4C5.76,2,2,4.853,2,8.373Z`;
  const MARGIN_PATH = `M2,10.5V84.231c0,4.7,4.466,8.5,9.975,8.5h134.9a10.853,10.853,0,0,0,7.278-2.689l40.526-36.864a7.617,7.617,0,0,0,0-11.629L154.152,4.689A10.853,10.853,0,0,0,146.874,2H11.975C6.466,2,2,5.807,2,10.5Z`;
  const HULL_VB   = { w:166.498, h:70 };
  const MARGIN_VB = { w:196.375, h:91.734 };
  const PX_PER_M  = 10;
  const areaM     = { w:145, h:75 };

  // DOM
  const lenInput    = document.getElementById('lenInput');
  const beamInput   = document.getElementById('beamInput');
  const marginInput = document.getElementById('marginInput');
  const addBoatBtn  = document.getElementById('addBoat');
  const rotateLeft  = document.getElementById('rotateLeft');
  const rotateRight = document.getElementById('rotateRight');
  const zoomInBtn   = document.getElementById('zoomIn');
  const zoomOutBtn  = document.getElementById('zoomOut');

  class BoatCanvas {
    constructor(container) {
      this.stage = new Konva.Stage({ container, width: areaM.w*PX_PER_M, height: areaM.h*PX_PER_M });
      this.layer = new Konva.Layer();
      this.stage.add(this.layer);
      // lokalram
      this.layer.add(new Konva.Rect({ x:0, y:0, width: areaM.w*PX_PER_M, height: areaM.h*PX_PER_M, stroke:'#888', strokeWidth:2, listening:false }));
      // begränsningszoner
      const zones = [ {x:20,y:10,w:30,h:20}, {x:80,y:50,w:40,h:15} ];
      this.zones = zones.map(z => {
        const rect = new Konva.Rect({ x:z.x*PX_PER_M, y:z.y*PX_PER_M, width:z.w*PX_PER_M, height:z.h*PX_PER_M, stroke:'red', dash:[4,4], listening:false });
        this.layer.add(rect);
        return rect;
      });
      this.boats = [];
      this.newBoat = null;
      this.activeBoat = null;
      this.setup();
    }

    setup() {
      addBoatBtn.onclick = () => {
        if (this.newBoat) return;
        const data = {
          length: +lenInput.value,
          beam:   +beamInput.value,
          margin: +marginInput.value,
          x: areaM.w/2,
          y: areaM.h/2,
          placed: false,
          rotation: 0
        };
        const boat = this.createBoat(data);
        this.newBoat = boat;
        this.setActive(boat);
      };

      this.stage.on('dblclick', e => {
        const grp = e.target.getParent();
        const boat = this.boats.find(b => b.group === grp);
        if (boat && boat.data.placed) {
          // tillbaka till redigering
          boat.data.placed = false;
          boat.invalid = false;
          boat.group.draggable(true);
          this.applyStyle(boat, 'new');
          this.newBoat = boat;
          this.setActive(boat);
        } else if (this.newBoat && !this.newBoat.invalid) {
          // placera ny båt
          this.placeBoat(this.newBoat);
        }
      });

      rotateLeft.onclick  = () => this.rotateActive(-15);
      rotateRight.onclick = () => this.rotateActive(15);
      zoomInBtn.onclick   = () => { const s = this.stage.scaleX() + 0.1; this.stage.scale({x:s,y:s}); this.stage.batchDraw(); };
      zoomOutBtn.onclick  = () => { const s = this.stage.scaleX() - 0.1; this.stage.scale({x:s,y:s}); this.stage.batchDraw(); };
      lenInput.oninput    = () => this.resizeActive();
      beamInput.oninput   = () => this.resizeActive();
      marginInput.oninput = () => this.resizeActive();
    }

    createBoat(data) {
      const g = new Konva.Group({
        x: data.x * PX_PER_M,
        y: data.y * PX_PER_M,
        draggable: true,
        dragBoundFunc: pos => this.bound(pos, data)
      });
      const marginPath = new Konva.Path({ data: MARGIN_PATH, strokeScaleEnabled: false, ...stateStyles.new.margin });
      const hullPath   = new Konva.Path({ data: HULL_PATH,   strokeScaleEnabled: false, ...stateStyles.new.hull });
      g.add(marginPath, hullPath);

      const tr = new Konva.Transformer({
        nodes: [g],
        enabledAnchors: ['top-left','top-center','top-right','middle-right','bottom-right','bottom-center','bottom-left','middle-left'],
        ignoreStroke: true,
        keepRatio: false
      });
      this.layer.add(tr);

      const boat = { data, group: g, marginPath, hullPath, tr, invalid: false };
      this.boats.push(boat);
      this.layer.add(g);
      // bind update on drag & transform
      g.on('dragmove transform', () => this.update(boat));
      this.update(boat);
      return boat;
    }

    setActive(boat) {
      if (this.activeBoat && this.activeBoat !== boat) {
        this.activeBoat.tr.hide();
      }
      this.activeBoat = boat;
      boat.tr.show();
      boat.group.moveToTop();
      boat.tr.moveToTop();
      this.stage.batchDraw();
    }

    placeBoat(boat) {
      boat.data.placed = true;
      this.applyStyle(boat, 'placed');
      boat.group.draggable(false);
      boat.tr.hide();
      this.newBoat = null;
      this.activeBoat = null;
    }

    rotateActive(angle) {
      if (!this.activeBoat) return;
      this.activeBoat.group.rotate(angle);
      this.update(this.activeBoat);
    }

    resizeActive() {
      if (!this.activeBoat) return;
      const d = this.activeBoat.data;
      d.length = +lenInput.value;
      d.beam   = +beamInput.value;
      d.margin = +marginInput.value;
      this.update(this.activeBoat);
    }

    bound(pos, data) {
      const M = data.margin * PX_PER_M;
      const L = data.length * PX_PER_M + M * 2;
      const B = data.beam   * PX_PER_M + M * 2;
      const halfW = L / 2;
      const halfH = B / 2;
      const maxX = areaM.w * PX_PER_M - halfW;
      const maxY = areaM.h * PX_PER_M - halfH;
      return {
        x: Math.min(Math.max(pos.x, halfW), maxX),
        y: Math.min(Math.max(pos.y, halfH), maxY)
      };
    }

    update(boat) {
      // apply transformer scale → data
      const scale = boat.group.scale();
      if (scale.x !== 1 || scale.y !== 1) {
        boat.data.length *= scale.x;
        boat.data.beam   *= scale.y;
        boat.group.scale({ x: 1, y: 1 });
        if (this.activeBoat === boat) {
          lenInput.value  = boat.data.length.toFixed(1);
          beamInput.value = boat.data.beam.toFixed(1);
        }
      }
      // update data position & rotation
      boat.data.x = boat.group.x() / PX_PER_M;
      boat.data.y = boat.group.y() / PX_PER_M;
      boat.data.rotation = boat.group.rotation();

      // redraw paths
      const L = boat.data.length * PX_PER_M;
      const B = boat.data.beam   * PX_PER_M;
      const M = boat.data.margin * PX_PER_M;
      boat.hullPath.scale({ x: L / HULL_VB.w, y: B / HULL_VB.h });
      boat.hullPath.offset({ x: HULL_VB.w / 2, y: HULL_VB.h / 2 });
      boat.marginPath.scale({ x: (L + 2*M) / MARGIN_VB.w, y: (B + 2*M) / MARGIN_VB.h });
      boat.marginPath.offset({ x: MARGIN_VB.w / 2, y: MARGIN_VB.h / 2 });

      // collision detection
      const rectHull   = boat.hullPath.getClientRect({ relativeTo: this.layer });
      const rectMargin = boat.marginPath.getClientRect({ relativeTo: this.layer });
      let cHull = false;
      let cMarg = false;

      // 1) hull-vs-hull for any boats
      for (let o of this.boats) {
        if (o === boat) continue;
        const oHullRect = o.hullPath.getClientRect({ relativeTo: this.layer });
        if (Konva.Util.haveIntersection(rectHull, oHullRect)) {
          cHull = true;
          break;
        }
        // margin-vs-margin if both placed
        if (boat.data.placed && o.data.placed) {
          const oMargRect = o.marginPath.getClientRect({ relativeTo: this.layer });
          if (Konva.Util.haveIntersection(rectMargin, oMargRect)) {
            cMarg = true;
          }
        }
      }
      // 2) zone collisions
      for (let z of this.zones) {
        const zoneRect = z.getClientRect({ relativeTo: this.layer });
        // hull collision with zone
        if (Konva.Util.haveIntersection(rectHull, zoneRect)) {
          cHull = true;
        }
        // margin collision: only for unplaced boat
        if (!boat.data.placed && Konva.Util.haveIntersection(rectMargin, zoneRect)) {
          cMarg = true;
        }
      }

      // apply state based on collisions
      if (cHull) {
        this.applyStyle(boat, 'hullCollision');
        boat.invalid = true;
      } else if (cMarg) {
        this.applyStyle(boat, 'marginCollision');
        boat.invalid = false;
      } else if (boat.data.placed) {
        this.applyStyle(boat, 'placed');
        boat.invalid = false;
      } else {
        this.applyStyle(boat, 'new');
        boat.invalid = false;
      }

      boat.tr.forceUpdate();
      this.stage.batchDraw();
    }

    applyStyle(boat, state) {
      const s = stateStyles[state];
      boat.hullPath.stroke(s.hull.stroke).fill(s.hull.fill).strokeWidth(s.hull.strokeWidth);
      boat.marginPath.stroke(s.margin.stroke).fill(s.margin.fill).strokeWidth(s.margin.strokeWidth).dash(s.margin.dash || []);
    }
  }

  // init
  new BoatCanvas(document.getElementById('canvas'));
  </script>
</body>
</html>
```

### 🗺️ MapLibre Implementation (från docs/MapImplementation.md)

Projektet har redan en komplett MapLibre-implementation som kan användas som referens:

**Befintlig Kartfunktionalitet:**
- Interaktiv karta på startsidan med företagets position
- MapLibre GL JS för professionell kartvisning
- CartoDB Positron basemap (gratis och snabb)
- Responsive design som fungerar på alla enheter
- Popup-fönster med företagsinformation

**Teknisk Setup:**
```javascript
// Karta initieras med företagets koordinater
map.value = new Map({
  container: mapContainer.value,
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [company.longitude, company.latitude],
  zoom: 14
});

// Marker för företagets position
new Marker({
  color: '#3b82f6',
  scale: 1.2
}).setLngLat([company.longitude, company.latitude])
  .addTo(map.value);
```

**Användning för Båtlager:**
Kartfunktionaliteten kan utökas för att visa:
- Lagerplatser och bryggor
- Färgkodade markeringar för kapacitet
- Klickbara markeringar som leder till Konva-editorn
- Övergripande vy över alla lageranläggningar

**Integrationsfördelar:**
- Ingen Google Maps API-kostnad
- Fullständig kontroll över data
- Offline-kapacitet
 - Smidig integration med befintlig Vue.js-arkitektur

### 📊 Befintlig Datastruktur (VERKLIG DATA)

Projektet har redan en sofistikerad datastruktur som Konva-implementationen ska integrera med:

**`/src/assets/data/boats.json`** - Båtdata med komplett Konva-integration:
```json
{
  "id": 1,
  "customer_id": 1,
  "name": "Serenity",
  "length": 8.5,
  "width": 2.8,
  "safety_margin": 0.5,
  "weight": 1200,
  "konva_shape_json": "{\"x\":0,\"y\":0,\"width\":85,\"height\":28,\"fill\":\"#ffffff\",\"stroke\":\"#000000\",\"strokeWidth\":2}",
  "current_status": "i_lager",
  "location_status": "lager",
  "current_placement_id": 1,
  "move_to_storage_date": "2024-10-15T10:00:00Z",
  "move_from_storage_date": "2024-04-15T10:00:00Z",
  "move_to_brygga_date": "2024-04-20T08:00:00Z",
  "move_from_brygga_date": "2024-10-10T16:00:00Z",
  "service_date": "2024-02-05T09:00:00Z",
  "notes": "Stamkund sedan 2020. Föredrar tidig säsongstart.",
  "sms_notifications": true,
  "email_notifications": true
}
```

**`/src/assets/data/storageUnits.json`** - Lagringsenheter med GeoJSON geometri:
```json
{
  "id": 1,
  "name": "Huvudlager A",
  "unit_type": "warehouse",
  "shape_geometry": "{\"type\":\"Polygon\",\"coordinates\":[[[11.9740,57.7085],[11.9750,57.7085],[11.9750,57.7095],[11.9740,57.7095],[11.9740,57.7085]]]}",
  "level_count": 3,
  "is_connected_to_land": true,
  "connected_unit_id": null,
  "latitude": 57.709,
  "longitude": 11.9745
}
```

**`/src/assets/data/placements.json`** - Avancerad placeringsdata:
```json
{
  "id": 1,
  "boat_id": 1,
  "storage_unit_id": 2,
  "warehouse_level_id": null,
  "x_coordinate": 15.5,
  "y_coordinate": 8.2,
  "rotation_angle": 0.0,
  "reserved": false,
  "placed": true,
  "reserved_date": "2024-01-15T08:30:00Z",
  "placed_date": "2024-01-16T10:15:00Z"
}
```

**`/src/assets/data/warehouses.json`** - Detaljerad lagerinformation:
```json
{
  "id": 1,
  "name": "Båthall Nord",
  "type": "indoor_storage",
  "latitude": 57.904500,
  "longitude": 16.697600,
  "capacity": "120 båtar",
  "status": "available",
  "size": "2000 m²",
  "services": ["Kran", "El", "Säkerhet", "Vinterservice"],
  "boat_types": "Alla storlekar upp till 12m"
}
```

**`/src/assets/data/docks.json`** - Bryggdata med serviceinformation:
```json
{
  "id": 1,
  "name": "Huvudbrygga A",
  "type": "main_dock",
  "latitude": 57.902800,
  "longitude": 16.696800,
  "berths": 25,
  "status": "operational",
  "capacity": "Större båtar (8-15m)",
  "services": ["El", "Vatten", "Avfall"],
  "depth": "3.5m",
  "season": "Maj - Oktober"
}
```

**Kritiska Integrationspunkter:**
- `konva_shape_json` innehåller redan Konva-objektets properties (komplett!)
- `shape_geometry` innehåller GeoJSON som konverteras till Konva-shapes
- `current_status` och `location_status` hanterar båtens tillstånd
- `placements.json` har exakta x/y-koordinater och rotation
- Dubletthantering via `reserved` och `placed` flaggor
- Tidsbaserad spårning med ISO-8601 datumformat
 - Integrerad notification system (SMS/email)

### 🔧 Potentiella Datamodifieringar

Baserat på BoatStorageSystemRequirements.md kan dessa tillägg behövas:

**Restriction Zones (Nya JSON-struktur):**
```json
// /src/assets/data/restrictionZones.json
{
  "id": 1,
  "warehouse_id": 1,
  "name": "Pelare område",
  "x_coordinate": 25.0,
  "y_coordinate": 15.0,
  "width": 5.0,
  "height": 3.0,
  "type": "pillar",
  "description": "Bärande pelare - ingen placering"
}
```

**Multi-Level Storage (Utöka warehouseLevels.json):**
```json
// Befintlig warehouseLevels.json kan behöva utökas med:
{
  "max_boat_weight": 2000,
  "max_boat_length": 8.0,
  "available_spaces": 25,
  "occupied_spaces": 18
}
```

**Seasonal Workflow (Utöka boats.json):**
```json
// Befintliga datum-fält i boats.json är redan perfekta:
// move_to_storage_date, move_from_storage_date,
// move_to_brygga_date, move_from_brygga_date
// Inga ändringar behövs!
```

### 🧩 Befintlig Komponentstruktur

Projektet har redan en omfattande komponentbibliotek som kan användas för Konva-implementationen:

**Layout Komponenter:**
- `NavigationSidebar.vue` - Huvudnavigation med "Båtlager" meny
- `StandardHeader.vue` - Standardheader för alla sidor
- `PageLayout.vue` - Grundlayout med responsive design

**Shared Komponenter:**
- `DataTable.vue` - Tabellkomponent för båtlistor
- `DetailPage.vue` - Detaljsida för båtinformation
- `ListPage.vue` - Listkomponent för båtöversikter
- `PaginationControls.vue` - Paginering för stora datasets

**UI Komponenter (Shadcn/ui):**
- `Button.vue` - Knappar för toolbar
- `Input.vue` - Inputfält för längd, bredd, marginal
- `Dialog.vue` - Dialogfönster för båtinställningar
- `Tooltip.vue` - Tooltips för hjälptext
- `Toast.vue` - Notifikationer för åtgärder

**Befintliga Views:**
- `Dashboard.vue` - Startsida med MapLibre-karta
- `BoatList.vue` - Lista över alla båtar
- `BoatDetail.vue` - Detaljvy för enskild båt
- `StorageLocationList.vue` - Lista över lagerplatser
- `StorageLocationDetail.vue` - Detaljvy för lagerplats

**Composables:**
- `useApi.ts` - API-integration för JSON-data
- `useAuth.ts` - Autentisering och behörigheter
- `useToast.ts` - Notifikationssystem
- `useTooltip.ts` - Tooltip-funktionalitet

**Fördelar för Konva-implementation:**
- Konsekvent designspråk med Tailwind CSS
- Återanvändbar komponentstruktur
- Befintlig routing och navigation
- Integrerad notifikationssystem
 - Professionell UI-komponentbibliotek

### 🚀 Quick Start Guide

**1. Kontrollera att projektet körs:**
```bash
cd /Users/lt/Documents/Repo/e-dock/Moxmaster/stadsmissionen
npm run dev
# Applikationen ska nu köra på localhost:5175
```

**2. Installera Konva-dependencies:**
```bash
npm install konva vue-konva @types/konva
```

**3. Verifiera installation:**
```javascript
// Testa i browser console på localhost:5175
import Konva from 'konva';
console.log(Konva.version); // Ska visa version nummer
```

**4. Börja med första komponenten:**
- Skapa `/src/components/konva/KonvaCanvas.vue`
- Kopiera logik från HTML-prototyp
- Integrera med befintlig Vue.js-arkitektur

**5. Nästa steg:**
- Följ task-listan från Phase 1
- Använd befintliga komponenter och styling
- Integrera med JSON-datastrukturen

### 🏗️ Arkitektur Översikt

**Konva Layer Structure:**
```
Stage (Root)
├── Background Layer (Grid, boundaries)
├── Storage Layer (Storage units, zones)
├── Boat Layer (Boat shapes med collision detection)
└── UI Layer (Selection handles, tooltips)
```

**Vue.js Integration:**
```
BoatPlacementManager.vue (Main view)
├── KonvaCanvas.vue (Canvas component)
├── KonvaToolbar.vue (Controls)
├── BoatInspector.vue (Details panel)
└── BoatInventory.vue (Left sidebar)
```

**Data Flow:**
```
JSON Files → Services → Composables → Components → Konva Objects
```

**Key Integration Points:**
- `konva_shape_json` field för att spara Konva object state
- GeoJSON → Konva shape conversion för storage units
- Vue reactivity för real-time updates
- Shadcn/ui komponenter för konsekvent design

---

## 🎯 Success Criteria

### Funktionalitet
- [ ] **Grundläggande placering fungerar** - Kan skapa och placera båtar
- [ ] **Kollisionsdetektion fungerar** - Färgkodning (grön/gul/röd)
- [ ] **Redigering fungerar** - Kan redigera placerade båtar via dubbelklick
- [ ] **Data integration fungerar** - Sparar till alla JSON-filer med TypeScript säkerhet
- [ ] **Export fungerar** - Kan exportera layout som PNG, JSON, PDF
- [ ] **Restriction Zones fungerar** - Kan skapa och redigera begränsningsområden
- [ ] **Multi-Level Storage fungerar** - Våningsystem för warehouses
- [ ] **Båtlager Menu System fungerar** - Warehouse vs Marina views
- [ ] **Seasonal Workflow fungerar** - Automatisk vinter/sommar migration
- [ ] **Customer Integration fungerar** - Kopplat till befintlig kunddatabas
- [ ] **Search & Filter fungerar** - Kan söka båtar och filtrera
- [ ] **Notifications fungerar** - SMS/email integration för customer updates

### Prestanda
- [ ] **<100ms** - Kollisionsdetektion response time
- [ ] **<2s** - Initial loading time
- [ ] **<16ms** - Smooth 60fps animations
- [ ] **<50MB** - Memory usage för 1000 båtar

### Användarupplevelse
- [ ] **Intuitiv** - Användare förstår interface utan träning
- [ ] **Responsiv** - Fungerar på alla skärmstorlekar
- [ ] **Tillgänglig** - Följer WCAG guidelines
- [ ] **Snabb** - Inga märkbara delays i interaktioner

---

 ## 📝 Task Progress Tracking

  **Total Tasks:** 95 (omorganiserat) + 20 (Design System)
 **Completed:** 45 (Foundation + Steg 1A + Design System klart)
 **In Progress:** 0
 **Remaining:** 70

 **Progress:** 39%

 **Current Phase:** Steg 1A + Design System - KLART ✅
 **Next Milestone:** Steg 2 - StorageDesigner.vue (med standardiserad design)
 **Current Focus:** ETT lager åt gången, KONSEKVENT designspråk

 **MAJOR MILESTONE:** 🎨 **Skapade standardiserat Adobe-stil toolbox design system!**
 - Alla framtida Konva-komponenter kan använda samma professionella design
 - Komplett dokumentation och exempelkomponenter
 - Återanvändbar och skalbar arkitektur

 ---

 ## 🔧 Troubleshooting & Tips

 ### Vanliga Problem & Lösningar

 **Konva importerar inte korrekt:**
 ```bash
 # Kontrollera att alla dependencies är installerade
 npm ls konva vue-konva @types/konva

 # Reinstallera om nödvändigt
 npm uninstall konva vue-konva @types/konva
 npm install konva vue-konva @types/konva
 ```

 **SVG paths skalas inte korrekt:**
 ```javascript
 // Använd viewBox proportioner från prototyp
 const scaleX = targetWidth / HULL_VB.w;
 const scaleY = targetHeight / HULL_VB.h;
 path.scale({ x: scaleX, y: scaleY });
 ```

 **Kollisionsdetektion prestanda:**
 ```javascript
 // Använd throttling för bättre prestanda
 const throttledUpdate = throttle(updateCollisions, 16); // 60fps
 ```

 **Vue reactivity problem:**
 ```javascript
 // Använd shallowRef för Konva objekt
 const konvaObjects = shallowRef([]);
 ```

 ### Utvecklingstips

 **1. Starta med prototyp-logik:**
 - Kopiera exakt funktionalitet från HTML-prototyp
 - Konvertera till Vue.js steg för steg
 - Behåll samma färgschema och interaktioner

 **2. Använd befintlig arkitektur:**
 - Följ samma mönster som andra Views
 - Återanvänd Shadcn/ui komponenter
 - Integrera med befintlig routing

 **3. Testning:**
 - Testa med stora datasets (>100 båtar)
 - Kontrollera prestanda på olika enheter
 - Verifiera kollisionsdetektion noggrannhet

 **4. Data integration:**
 - Börja med statisk JSON-data
 - Lägg till persistering senare
 - Bevara befintlig datastruktur

 ### Resurser

 **Konva.js Dokumentation:**
 - https://konvajs.org/docs/
 - https://github.com/konvajs/vue-konva

 **Vue.js Composables:**
 - https://vueuse.org/
 - https://vuejs.org/guide/reusability/composables.html

 **Shadcn/ui Komponenter:**
 - https://ui.shadcn.com/docs/components

 ---

 ## 📋 Implementation Checklist Summary

 ## 🚀 Quick Start Guide - Steg 1

 **Mål:** Skapa BoatDetailCanvas.vue som visar EN båt med full redigeringsmöjlighet.

 **Nästa steg:**
 1. **Skapa `/src/components/konva/BoatDetailCanvas.vue`**
    - Enkel Konva Stage med bara EN båt
    - Toolbar med length, width, margin inputs
    - Rotation buttons (vänster/höger)
    - Zoom controls (+/-)

 2. **Integrera med BoatDetail.vue**
    - Lägg till BoatDetailCanvas som ny sektion
    - Passa in båtdata från route params
    - Spara ändringar tillbaka till boats.json

 3. **Test med befintlig båt**
    - Navigera till `/boat/1` (Serenity)
    - Se båt renderad med verkliga dimensioner
    - Testa redigering och spara

 **Fördelar med denna approach:**
 - ✅ Enkel att bygga och testa
 - ✅ Klar feedback på varje båt
 - ✅ Använder befintlig routing
 - ✅ Inga komplexa multi-lager problem

 ---

 ## 🎯 Implementation Strategy Summary

 ### ✅ **Klart (Foundation)**
 - [x] Konva dependencies installerade
 - [x] TypeScript interfaces definierade
 - [x] SVG boat service implementerad
 - [x] Directory struktur skapad

 ### 🔄 **Pågående (Steg 1 - Båtdetalj Canvas)**
 - [ ] BoatDetailCanvas.vue komponent
 - [ ] Integration med BoatDetail.vue
 - [ ] Toolbar för båt-redigering
 - [ ] Spara ändringar till JSON

 ### 📅 **Kommande Steg**
 **Steg 2:** StorageDesigner.vue för lager och begränsningsytor
 **Steg 3:** BoatPlacementCanvas.vue för att kombinera båtar + lager
 **Steg 4-5:** Polish, export, advanced features

 ### 🎯 **Framgångsfaktorer**
 - **EN komponent åt gången** - Ingen förvirring med multiple lager
 - **Stegvis byggande** - Varje steg bygger på föregående
 - **Enkel testning** - Lätt att verifiera funktionalitet
 - **Använd befintlig UI** - Integrera med BoatDetail.vue och NavigationSidebar

 ### 🔧 **Tekniska Fördelar**
 - **HTML-prototyp som grund** - Fungerande collision detection och SVG boats
 - **Befintlig datastruktur** - Redan konva_shape_json och GeoJSON support
 - **TypeScript-säkerhet** - Inga runtime errors, full type safety
 - **Vue.js integration** - Smidig integration med befintlig arkitektur

 ---

 *Dokumentet uppdaterat: 2024-01-XX*
 *Nästa Review: Efter Steg 1 completion*
 *Current Focus: EN båt i taget, EN canvas åt gången*
 *Total Implementation Time: 5-6 veckor (reviderat)*
