# Draggable Markers Implementation

## Overview

The map now features draggable markers that allow users to reposition company headquarters and storage facilities (docks and warehouses) by dragging them to new locations. When positions are changed, the system tracks the modifications and provides a save mechanism to persist the changes.

## Features

### Draggable Markers
- **Company Marker** (Blue): Headquarters location can be dragged to new position
- **Dock Markers** (Green): All dock/pier locations are draggable
- **Warehouse Markers** (Red): All storage facility locations are draggable
- **Visual Feedback**: Markers show updated coordinates in popups when moved

### Change Tracking
- System automatically tracks when markers are moved from their original positions
- Yellow notification bar appears showing number of unsaved changes
- Changed markers display a warning message in their popups

### Save/Reset Functionality
- **Save Changes**: Updates the JSON files with new coordinates (simulated in frontend)
- **Reset Changes**: Restores all markers to their original positions
- **Loading States**: Visual feedback during save operations
- **Toast Notifications**: Success/error messages for user feedback

## User Interface

### Change Notification Bar
When markers are moved, a yellow notification bar appears at the top with:
- Count of unsaved changes
- "Återställ" (Reset) button to cancel changes
- "Spara ändringar" (Save Changes) button to persist changes

### Updated Legend
The legend now shows that markers are draggable:
- Företag (dragbar) - Company (draggable)
- Bryggor (dragbara) - Docks (draggable)
- Lager (dragbara) - Warehouses (draggable)

### Marker Popups
Popups now include:
- 6-decimal precision coordinates
- Warning message when position has been changed
- Visual indicator for unsaved changes

## Technical Implementation

### Core Components

#### Change Tracking State
```typescript
const locationChanges = ref<Record<string, {
  id: number;
  lat: number;
  lng: number;
  type: 'company' | 'storage'
}>>({});
```

#### Marker Creation
All markers are created with `draggable: true` option and include:
- Drag event listeners that track position changes
- Data attributes for identification (`companyId` or `locationId`)
- Dynamic popup updates with new coordinates

#### Save System
- Simulates API calls with realistic delay (1.5 seconds)
- Updates local JSON data in memory
- Provides user feedback via toast notifications
- Handles errors gracefully

### Key Functions

- `trackLocationChange()`: Records marker position changes
- `saveChanges()`: Persists changes (simulated)
- `resetChanges()`: Restores original positions
- `addAllMarkers()`: Creates all draggable markers
- `findMarkerByTypeAndId()`: Helper for marker identification

## Backend Integration

### Node.js Script
A `update-locations.js` script is included for real backend implementation:

```javascript
const { updateLocationCoordinates } = require('./update-locations');

// Example usage
const changes = [
  { id: 1, lat: 57.903500, lng: 16.697600, type: 'company' },
  { id: 2, lat: 57.903300, lng: 16.697300, type: 'storage' }
];

updateLocationCoordinates(changes);
```

### API Integration
For production use, the save functionality would call:
```typescript
// Replace simulated save with real API call
const response = await fetch('/api/locations/update', {
  method: 'POST',
  body: JSON.stringify(Object.values(locationChanges.value))
});
```

## File Updates

### Modified Files
- `src/views/Placeholder.vue`: Main map component with draggable functionality
- `src/assets/data/companies.json`: Company location data (latitude/longitude)
- `src/assets/data/combinedStorage.json`: Storage facility data (Lat/Long)

### New Files
- `update-locations.js`: Node.js script for updating JSON files
- `docs/DraggableMarkersImplementation.md`: This documentation

## Data Structure

### Company Data
```json
{
  "id": 1,
  "latitude": 57.903367,
  "longitude": 16.697517,
  // ... other company fields
}
```

### Storage Location Data
```json
{
  "id": 1,
  "name": "Huvudbrygga A",
  "Type": "Brygga",
  "Lat": 57.902800,
  "Long": 16.696800,
  // ... other location fields
}
```

## Usage Instructions

### For Users
1. **Move Markers**: Click and drag any blue, green, or red marker to a new position
2. **View Changes**: Yellow notification bar shows number of unsaved changes
3. **Save Changes**: Click "Spara ändringar" to persist new positions
4. **Reset Changes**: Click "Återställ" to cancel all changes and restore original positions
5. **View Coordinates**: Click on any marker to see its current coordinates

### For Developers
1. **Enable Real Saving**: Replace the simulated save in `saveChanges()` with actual API calls
2. **Backend Integration**: Use the provided `update-locations.js` script as a starting point
3. **Customization**: Modify marker colors, drag behavior, or popup content as needed
4. **Error Handling**: Extend error handling for network issues or validation failures

## Limitations

### Current Implementation
- Changes are only saved to local memory (simulated save)
- No server-side validation of coordinates
- No conflict resolution for concurrent edits
- No audit trail of position changes

### Potential Enhancements
- Real-time collaboration with multiple users
- Undo/redo functionality for position changes
- Coordinate validation (e.g., within reasonable geographic bounds)
- Export/import functionality for bulk position updates
- Integration with external mapping services for address validation

## Browser Compatibility

The draggable markers functionality works in all modern browsers that support:
- MapLibre GL JS
- ES6 features (const/let, arrow functions, async/await)
- CSS3 for styling

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
