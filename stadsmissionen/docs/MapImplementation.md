# MapLibre Map Implementation Documentation

## Overview

The Stadsmissionen application now features an interactive map on the home page using MapLibre GL JS. The map displays the company's main location in Loftahammar, Sweden, and is designed to be extended with warehouse and dock locations.

## Architecture

### Technology Stack
- **MapLibre GL JS**: Open-source mapping library (alternative to Google Maps)
- **CartoDB Basemap**: Free, clean basemap style
- **Vue 3 Composition API**: For reactive state management
- **TypeScript**: For type safety

### File Structure
```
src/views/Placeholder.vue - Main map implementation (home page)
src/assets/data/companies.json - Company location data
docs/MapImplementation.md - This documentation
```

## Current Implementation

### Map Features
1. **Company Location Marker**: Blue pin showing the main office
2. **Interactive Popup**: Company information on marker click
3. **Navigation Controls**: Zoom in/out buttons
4. **Responsive Design**: Adapts to different screen sizes
5. **Loading State**: Smooth loading experience

### Data Source
The map uses data from `src/assets/data/companies.json`:
```json
{
  "latitude": 57.903367,
  "longitude": 16.697517,
  "display_name": "Marincenter",
  "city": "Loftahammar"
}
```

### Map Configuration
- **Center**: Company coordinates (Loftahammar)
- **Zoom Level**: 14 (good detail level)
- **Style**: CartoDB Positron (clean, minimal)
- **Controls**: Navigation controls enabled

## Code Structure

### Key Components

#### Map Initialization
```typescript
map.value = new Map({
  container: mapContainer.value,
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [company.longitude, company.latitude],
  zoom: 14,
  pitch: 0,
  bearing: 0
});
```

#### Marker Creation
```typescript
new Marker({
  color: '#3b82f6', // Blue color
  scale: 1.2
})
.setLngLat([company.longitude, company.latitude])
.setPopup(popup)
.addTo(map.value);
```

## Extending the Map

### Adding Warehouse and Dock Pins

To add warehouse and dock locations, you'll need to:

#### 1. Create Data Files
Create data files similar to companies.json:

```json
// src/assets/data/warehouses.json
[
  {
    "id": 1,
    "name": "Lager 1",
    "type": "warehouse",
    "latitude": 57.904000,
    "longitude": 16.698000,
    "capacity": "100 båtar",
    "status": "available"
  }
]

// src/assets/data/docks.json
[
  {
    "id": 1,
    "name": "Brygga A",
    "type": "dock",
    "latitude": 57.903500,
    "longitude": 16.697000,
    "berths": 20,
    "status": "operational"
  }
]
```

#### 2. Update Map Component
```typescript
// Import additional data
import warehousesData from '@/assets/data/warehouses.json';
import docksData from '@/assets/data/docks.json';

// Add markers for warehouses
warehousesData.forEach(warehouse => {
  new Marker({
    color: '#ef4444', // Red for warehouses
    scale: 1.0
  })
  .setLngLat([warehouse.longitude, warehouse.latitude])
  .setPopup(
    new Popup({ offset: 25 })
      .setHTML(`
        <div class="p-3">
          <h3 class="font-semibold">${warehouse.name}</h3>
          <p class="text-sm">Kapacitet: ${warehouse.capacity}</p>
          <p class="text-sm">Status: ${warehouse.status}</p>
        </div>
      `)
  )
  .addTo(map.value);
});

// Add markers for docks
docksData.forEach(dock => {
  new Marker({
    color: '#10b981', // Green for docks
    scale: 1.0
  })
  .setLngLat([dock.longitude, dock.latitude])
  .setPopup(
    new Popup({ offset: 25 })
      .setHTML(`
        <div class="p-3">
          <h3 class="font-semibold">${dock.name}</h3>
          <p class="text-sm">Bryggor: ${dock.berths}</p>
          <p class="text-sm">Status: ${dock.status}</p>
        </div>
      `)
  )
  .addTo(map.value);
});
```

#### 3. Add Legend
```vue
<!-- Add to template -->
<div class="absolute top-4 left-4 bg-white p-3 rounded shadow-lg">
  <h4 class="font-semibold mb-2">Förklaring</h4>
  <div class="space-y-1 text-sm">
    <div class="flex items-center">
      <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
      <span>Huvudkontor</span>
    </div>
    <div class="flex items-center">
      <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
      <span>Lager</span>
    </div>
    <div class="flex items-center">
      <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
      <span>Bryggor</span>
    </div>
  </div>
</div>
```

### Advanced Features

#### Clustering
For many markers, add clustering:
```typescript
// Install maplibre-gl-clusterer
// yarn add maplibre-gl-clusterer

import { Clusterer } from 'maplibre-gl-clusterer';

const clusterer = new Clusterer(map.value, {
  radius: 60,
  maxZoom: 14,
  minZoom: 8
});
```

#### Layers and Filtering
Add toggleable layers:
```typescript
// Add layer toggle functionality
const showWarehouses = ref(true);
const showDocks = ref(true);

// Update markers based on visibility
const updateMarkers = () => {
  // Clear existing markers
  markers.forEach(marker => marker.remove());

  // Add markers based on filters
  if (showWarehouses.value) {
    addWarehouseMarkers();
  }
  if (showDocks.value) {
    addDockMarkers();
  }
};
```

## Styling and Customization

### Custom Marker Icons
Replace default pins with custom icons:
```typescript
// Create custom marker element
const el = document.createElement('div');
el.className = 'custom-marker';
el.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24">
    <!-- Custom SVG icon -->
  </svg>
`;

new Marker({ element: el })
  .setLngLat([lng, lat])
  .addTo(map.value);
```

### Alternative Map Styles
CartoDB offers several free styles:
- `positron-gl-style` (current, light)
- `dark-matter-gl-style` (dark theme)
- `voyager-gl-style` (colorful)

Example:
```typescript
style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
```

## Performance Considerations

### Loading Large Datasets
For many markers (>100), consider:
1. **Clustering**: Group nearby markers
2. **Lazy Loading**: Load markers when zooming in
3. **Viewport Filtering**: Only show markers in current view

### Memory Management
```typescript
// Clean up when component unmounts
onUnmounted(() => {
  if (map.value) {
    map.value.remove();
  }
});
```

## Benefits of MapLibre

### Advantages over Google Maps
1. **No API Key Required**: For basic functionality
2. **No Billing**: Completely free
3. **Open Source**: Full control and customization
4. **Offline Capable**: Can work without internet
5. **Vector Tiles**: Smooth scaling and rotation

### Suitable for Business Use
- No usage limits
- No Terms of Service restrictions
- No Google branding requirements
- Full control over data and privacy

## Future Enhancements

### Planned Features
1. **Real-time Updates**: Live status of warehouses/docks
2. **Route Planning**: Directions to locations
3. **Capacity Visualization**: Color-coded availability
4. **Search and Filter**: Find specific locations
5. **Mobile Optimization**: Touch-friendly controls

### Integration Points
- Connect with boat storage system
- Link to customer locations
- Integration with schedule data
- Notification system for capacity changes

## Troubleshooting

### Common Issues

#### Map Not Loading
- Check internet connection
- Verify CartoDB style URL
- Check browser console for errors

#### Markers Not Showing
- Verify coordinate format (longitude, latitude)
- Check data file imports
- Ensure map is fully loaded before adding markers

#### Performance Issues
- Reduce number of markers
- Implement clustering
- Use lower zoom levels for overview

### Browser Compatibility
MapLibre GL JS requires:
- Chrome 47+
- Firefox 45+
- Safari 10+
- Edge 16+

## Conclusion

The MapLibre implementation provides a solid foundation for displaying company locations with room for extensive customization. The clean, professional interface integrates well with the existing Vue.js architecture and provides a good user experience.

The map is ready to be extended with warehouse and dock locations, making it a valuable tool for visualizing the company's physical infrastructure and helping users navigate to different facilities.
