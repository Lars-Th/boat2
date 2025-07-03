# Konva.js Boat Storage System Installation Guide

## Step 1: Install Dependencies

```bash
npm install konva vue-konva
npm install --save-dev @types/konva @types/geojson
```

## Step 2: File Structure Setup

Create the following directory structure in your `src` folder:

```
src/
├── components/
│   └── drawing/
├── composables/
├── services/
├── types/
└── views/
```

## Step 3: Copy Implementation Files

### Types
- Copy `types/konva.ts` to `src/types/konva.ts`

### Composables
- Copy `composables/useKonvaCanvas.ts` to `src/composables/useKonvaCanvas.ts`
- Copy `composables/useBoatPlacement.ts` to `src/composables/useBoatPlacement.ts`
- Copy `composables/useCollisionDetection.ts` to `src/composables/useCollisionDetection.ts`

### Services
- Copy `services/konva-storage.service.ts` to `src/services/konva-storage.service.ts`
- Copy `services/placement.service.ts` to `src/services/placement.service.ts`

### Components
- Copy `components/KonvaCanvas.vue` to `src/components/drawing/KonvaCanvas.vue`

### Views
- Copy `views/BoatPlacementManager.vue` to `src/views/BoatPlacementManager.vue`

## Step 4: Update Router

Add the routes from `router-additions.ts` to your existing router configuration:

```typescript
// In your routes.ts file
import { boatStorageRoutes } from './konva-implementation-files/router-additions';

// Add to your existing routes array
const routes = [
  // ... your existing routes
  ...boatStorageRoutes
];
```

## Step 5: Update Navigation

Add the navigation items from `router-additions.ts` to your navigation system:

```typescript
// In your navigation.ts file
import { boatStorageNavigation } from './konva-implementation-files/router-additions';

// Add to your navigation items
const navigationItems = [
  // ... your existing navigation
  boatStorageNavigation
];
```

## Step 6: Update Existing Types (if needed)

Ensure your existing `types/entities.ts` includes the following interfaces:

```typescript
export interface BoatData {
  id: number;
  name: string;
  length: number;
  width: number;
  safety_margin: number;
  weight: number;
  konva_shape_json: string;
  current_status: string;
  current_placement_id: number | null;
  notes?: string;
}

export interface StorageUnit {
  id: number;
  name: string;
  unit_type: 'warehouse' | 'dock';
  shape_geometry: string; // GeoJSON string
  level_count: number;
}

export interface PlacementData {
  id?: number;
  boat_id: number;
  storage_unit_id: number;
  x_coordinate: number;
  y_coordinate: number;
  rotation_angle: number;
  reserved: boolean;
  placed: boolean;
}
```

## Step 7: Test the Installation

1. Start your development server:
```bash
npm run dev
```

2. Navigate to `/batlager/placement` to test the boat placement manager

3. Verify that:
   - Konva canvas loads without errors
   - Boats load from your JSON data
   - Drag and drop functionality works
   - Collision detection shows different colors
   - Zoom controls work

## Step 8: Customization

### Canvas Configuration
Modify the `config` object in `KonvaCanvas.vue` to adjust:
- Canvas dimensions
- Grid size
- Default zoom level
- Collision detection sensitivity

### Styling
Customize the CSS in the Vue components to match your design system.

### Data Integration
Update the service methods to connect to your actual API endpoints instead of loading from static JSON files.

## Troubleshooting

### Common Issues

1. **Konva not found**: Make sure you installed the dependencies correctly
2. **Type errors**: Ensure all type files are in the correct locations
3. **Canvas not rendering**: Check that the container element has proper dimensions
4. **Performance issues**: Consider implementing the caching strategies mentioned in the implementation plan

### Performance Optimization

For large numbers of boats (100+), consider:
- Enabling Konva caching: `group.cache()`
- Virtualizing the boat inventory list
- Implementing level-of-detail rendering

## Next Steps

1. **Phase 2**: Implement the storage design tools (WarehouseDesigner.vue, MarinaDesigner.vue)
2. **Phase 3**: Add the warehouse and marina management views
3. **Phase 4**: Integrate with your map system
4. **Phase 5**: Add analytics and reporting features

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all files are in the correct locations
3. Ensure your existing data structure matches the expected interfaces
4. Test with a smaller dataset first

The implementation leverages the existing [Konva.js seat reservation example](https://konvajs.org/docs/sandbox/Seats_Reservation.html) patterns for optimal performance and user experience.
