# Boat Storage System Implementation Plan

## Executive Summary

This plan outlines the implementation of a comprehensive boat storage management system using **Konva.js** for the drawing engine, leveraging the existing data structure in `src/assets/data/`. The system will provide professional CAD-like functionality with elegant, intuitive interfaces for both storage design and boat placement management.

## Current Data Structure Analysis

### Existing Assets (Strong Foundation)
- **Boats**: Complete with Konva shape JSON, dimensions, status tracking, seasonal scheduling
- **Storage Units**: Geometric shapes (Polygon/LineString), multi-level support, connectivity mapping
- **Placements**: Coordinate-based positioning with rotation and reservation states
- **Scheduling**: Pickup/delivery tracking with status management
- **Combined Storage**: Unified view of all storage locations with geographical coordinates

### Key Strengths
✅ **Konva.js Integration Ready**: Boats already have `konva_shape_json` data
✅ **Geometric Foundation**: Storage units use GeoJSON for complex shapes
✅ **Dual Allocation Support**: `location_status` handles lager_brygga scenarios
✅ **Rotation & Positioning**: Placements support full 360° rotation
✅ **Status Tracking**: Comprehensive boat status system (i_lager, vid_brygga, oplacerad)

## Implementation Architecture

### Phase 1: Foundation & Core Drawing Engine (Weeks 1-3)

#### 1.1 Konva.js Integration
```typescript
// New file: src/components/drawing/KonvaCanvas.vue
// Core drawing canvas with:
- Konva Stage and Layer management
- Zoom and pan controls with smooth transitions
- Grid system with snap-to-grid functionality
- Selection and transformation tools
- Undo/redo system
```

#### 1.2 Data Service Layer
```typescript
// New file: src/services/storage.service.ts
// Enhanced data management:
- Parse existing GeoJSON shapes from storageUnits.json
- Convert boat konva_shape_json to Konva objects
- Placement calculation with safety margins
- Collision detection service
- Real-time data synchronization
```

#### 1.3 Core Types Extension
```typescript
// Extend existing types in src/types/
interface KonvaBoatShape {
  konvaObject: Konva.Rect | Konva.Group;
  boatData: BoatData;
  placement: PlacementData;
  isColliding: boolean;
  visualState: 'normal' | 'selected' | 'dragging' | 'collision';
}

interface StorageLayout {
  storageUnit: StorageUnit;
  konvaShapes: Konva.Shape[];
  boats: KonvaBoatShape[];
  restrictionZones: Konva.Shape[];
  levels: WarehouseLevel[];
}
```

### Phase 2: Storage Design Tool (Weeks 4-6)

#### 2.1 Warehouse Design Interface
```vue
<!-- New file: src/views/WarehouseDesigner.vue -->
<template>
  <div class="warehouse-designer">
    <DesignToolbar />
    <KonvaCanvas
      :storage-unit="selectedWarehouse"
      :mode="'design'"
      @shape-created="handleShapeCreated"
      @restriction-zone-added="handleRestrictionZone"
    />
    <PropertiesPanel />
  </div>
</template>
```

**Features:**
- **Multi-level visualization**: Warehouse levels as separate Konva layers
- **Restriction zones**: Pillars, equipment areas as non-interactive shapes
- **Scalable drawing**: Auto-zoom with real-world scale accuracy
- **Shape tools**: Rectangle, polygon, circle for complex layouts
- **Snap-to-grid**: Professional CAD-like precision

#### 2.2 Marina Design Interface
```vue
<!-- New file: src/views/MarinaDesigner.vue -->
<template>
  <div class="marina-designer">
    <DesignToolbar />
    <KonvaCanvas
      :storage-unit="selectedDock"
      :mode="'design'"
      @dock-section-created="handleDockSection"
      @connection-point-added="handleConnectionPoint"
    />
    <ConnectionPanel />
  </div>
</template>
```

**Features:**
- **Linear dock representation**: Use existing LineString geometry
- **Connection points**: Land, dock-to-dock, water terminus markers
- **Berth spacing**: Automatic berth marking with adjustable spacing
- **Depth visualization**: Color-coded depth indicators

### Phase 3: Boat Placement Engine (Weeks 7-9)

#### 3.1 Intelligent Placement Algorithm
```typescript
// New file: src/services/placement.service.ts
class PlacementService {
  findOptimalPlacement(
    boat: BoatData,
    storageUnit: StorageUnit,
    constraints: PlacementConstraints
  ): PlacementSuggestion[] {
    // Use existing placement data and dimensional matching
    // Implement safety margin calculation
    // Consider rotation for optimal fit
    // Return ranked suggestions
  }

  detectCollisions(
    placement: PlacementData,
    existingPlacements: PlacementData[]
  ): CollisionResult {
    // Visual collision detection with color coding
    // Different colors for collision severity
    // Real-time updates during drag operations
  }
}
```

#### 3.2 Drag & Drop Interface
```vue
<!-- New file: src/views/BoatPlacementManager.vue -->
<template>
  <div class="boat-placement-manager">
    <BoatInventory
      :boats="unplacedBoats"
      @boat-drag-start="handleBoatDragStart"
    />
    <KonvaCanvas
      :storage-unit="selectedStorage"
      :mode="'placement'"
      :placements="existingPlacements"
      @boat-dropped="handleBoatDropped"
      @boat-moved="handleBoatMoved"
    />
    <PlacementSidebar />
  </div>
</template>
```

**Features:**
- **Drag from inventory**: Boats draggable from sidebar to canvas
- **Live collision feedback**: Color changes during drag
- **Rotation handles**: Click and drag to rotate boats
- **Placement suggestions**: Smart suggestions based on dimensions
- **Dual allocation handling**: Support for lager_brygga boats

### Phase 4: Båtlager Menu System (Weeks 10-12)

#### 4.1 Navigation Enhancement
```typescript
// Update src/router/routes.ts
const boatStorageRoutes = [
  {
    path: '/batlager',
    name: 'BoatStorage',
    component: () => import('@/views/BoatStorageOverview.vue'),
    children: [
      {
        path: 'lager',
        name: 'WarehouseManagement',
        component: () => import('@/views/WarehouseManagement.vue')
      },
      {
        path: 'bryggor',
        name: 'MarinaManagement',
        component: () => import('@/views/MarinaManagement.vue')
      }
    ]
  }
];
```

#### 4.2 Storage Management Views
```vue
<!-- New file: src/views/WarehouseManagement.vue -->
<template>
  <div class="warehouse-management">
    <div class="layout-grid">
      <WarehouseSelector
        :warehouses="warehouseData"
        @warehouse-selected="loadWarehouse"
      />
      <KonvaCanvas
        :storage-unit="selectedWarehouse"
        :boats="warehousePlacements"
        :mode="'management'"
        @boat-status-changed="handleStatusChange"
      />
      <BoatStatusPanel
        :boats="warehousePlacements"
        @filter-changed="filterBoats"
      />
    </div>
  </div>
</template>
```

**Key Features:**
- **Status visualization**: Color-coded boat states (physically present, reserved, absent)
- **Transfer interface**: Drag boats between storage locations
- **Seasonal workflow**: Automated seasonal migration tools
- **Search integration**: Boat-centric search with customer context

### Phase 5: Advanced Features (Weeks 13-15)

#### 5.1 Map Integration
```typescript
// New file: src/components/mapping/StorageMapSync.vue
// Integration with existing map system
- Synchronize storage locations with overview map
- Click-to-zoom from map to storage detail
- Real-time status updates on map markers
- Geographical context for storage selection
```

#### 5.2 Seasonal Management
```typescript
// New file: src/services/seasonal.service.ts
class SeasonalService {
  async planSeasonalMigration(boats: BoatData[]): Promise<MigrationPlan> {
    // Use existing boatSchedule.json data
    // Automated scheduling for lager_brygga boats
    // Optimize transfer batches
    // Generate work orders
  }
}
```

#### 5.3 Reporting & Analytics
```vue
<!-- New file: src/views/StorageAnalytics.vue -->
<template>
  <div class="storage-analytics">
    <CapacityCharts :data="storageUtilization" />
    <SeasonalTrends :data="seasonalData" />
    <CustomerAnalytics :data="customerData" />
  </div>
</template>
```

## Technical Implementation Details

### Konva.js Configuration
```typescript
// src/composables/useKonvaCanvas.ts
export function useKonvaCanvas(canvasId: string) {
  const stage = new Konva.Stage({
    container: canvasId,
    width: window.innerWidth,
    height: window.innerHeight,
    draggable: true,
    scaleX: 1,
    scaleY: 1,
  });

  const layer = new Konva.Layer();
  stage.add(layer);

  // Grid system
  const gridLayer = new Konva.Layer();
  stage.add(gridLayer);

  return {
    stage,
    layer,
    gridLayer,
    addBoat,
    removeBoat,
    updateBoatPosition,
    handleCollisionDetection,
    exportToImage,
    saveLayout
  };
}
```

### Data Flow Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Existing Data  │ => │  Service Layer   │ => │   Konva Canvas  │
│  (JSON Assets)  │    │  (Processing)    │    │   (Rendering)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  boats.json     │    │  Placement       │    │  Interactive    │
│  storageUnits   │    │  Algorithm       │    │  Boat Shapes    │
│  placements     │    │  Collision       │    │  Drag & Drop    │
│  schedule       │    │  Detection       │    │  Visual States  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Performance Optimizations
1. **Lazy Loading**: Load storage units on-demand
2. **Virtual Scrolling**: For large boat inventories
3. **Layer Management**: Separate layers for different object types
4. **Caching**: Cache Konva shapes for frequently accessed boats
5. **Batch Operations**: Group placement updates for performance

## Integration Points

### Existing System Integration
- **Navigation**: Extend existing NavigationSidebar.vue
- **Authentication**: Use existing useAuth composable
- **Data Services**: Extend existing API client structure
- **UI Components**: Leverage existing shadcn/ui components
- **Toast System**: Use existing toast notifications

### New Dependencies
```json
{
  "konva": "^9.2.0",
  "vue-konva": "^3.0.2",
  "@types/konva": "^9.2.0"
}
```

## Success Metrics

### Technical Metrics
- **Performance**: <100ms render time for 100+ boats
- **Accuracy**: Sub-centimeter placement precision
- **Responsiveness**: Smooth 60fps interactions
- **Reliability**: 99.9% uptime for storage operations

### User Experience Metrics
- **Efficiency**: 50% reduction in placement time
- **Accuracy**: 90% reduction in placement errors
- **Adoption**: 100% user adoption within 3 months
- **Satisfaction**: >4.5/5 user satisfaction rating

## Risk Mitigation

### Technical Risks
1. **Konva.js Learning Curve**: Allocate time for team training
2. **Performance with Large Datasets**: Implement virtualization early
3. **Browser Compatibility**: Test across all target browsers
4. **Mobile Responsiveness**: Plan touch-friendly interfaces

### Business Risks
1. **User Adoption**: Extensive user testing and feedback loops
2. **Data Migration**: Careful planning for existing data integration
3. **Training Requirements**: Comprehensive user documentation
4. **Seasonal Disruption**: Implement during off-season

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 1** | 3 weeks | Core drawing engine, data integration |
| **Phase 2** | 3 weeks | Storage design tools (warehouse/marina) |
| **Phase 3** | 3 weeks | Boat placement engine with drag-drop |
| **Phase 4** | 3 weeks | Båtlager menu system and management |
| **Phase 5** | 3 weeks | Advanced features and optimizations |

**Total Timeline: 15 weeks (3.75 months)**

## Next Steps

1. **Week 1**: Set up development environment and install Konva.js
2. **Week 1**: Create basic KonvaCanvas component with existing boat data
3. **Week 2**: Implement storage unit visualization using GeoJSON data
4. **Week 2**: Build placement service using existing placements.json
5. **Week 3**: Create drag-drop interface for boat placement

This plan leverages the excellent existing data structure while providing a clear path to the advanced CAD-like functionality outlined in the requirements. The phased approach ensures steady progress with regular deliverables and user feedback opportunities.
