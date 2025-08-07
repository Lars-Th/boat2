<template>
  <div class="relative">
    <!-- Header -->
    <StandardHeader
      title="Översikt"
      :breadcrumbs="[
        { label: 'Hem', to: '/' },
        { label: 'Översikt', isCurrentPage: true }
      ]"
      :stats="headerStats"
      :show-stats="true"
    />

    <!-- Changes notification bar -->
    <div v-if="hasUnsavedChanges" class="mx-4 mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <span class="text-yellow-800 font-medium">
            Du har {{ Object.keys(locationChanges).length }} osparade ändringar av markörer
          </span>
        </div>
        <div class="flex gap-2">
          <button
            @click="resetChanges"
            class="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Återställ
          </button>
          <button
            @click="saveChanges"
            :disabled="isSaving"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {{ isSaving ? 'Sparar...' : 'Spara ändringar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Relocate mode notification -->
    <div v-if="isRelocateMode" class="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"></path>
          </svg>
          <span class="text-blue-800 font-medium">
            {{ relocateMode === 'add' ? 'Klicka på kartan för att lägga till ny lagringsplats' : `Klicka på kartan för att flytta "${relocateTargetName}"` }}
          </span>
        </div>
        <button
          @click="cancelRelocate"
          class="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Avbryt
        </button>
      </div>
    </div>

    <!-- Highlight mode notification -->
    <div v-if="isHighlightMode" class="mx-4 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          <span class="text-green-800 font-medium">
            En lagringsplats är markerad på kartan - andra platser visas gråtonade
          </span>
        </div>
        <button
          @click="clearHighlight"
          class="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Rensa markering
        </button>
      </div>
    </div>

    <!-- Map Content -->
        <div class="mx-4 mt-4">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <!-- Storage List Panel - Narrower -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="p-3 border-b border-gray-200">
              <h3 class="text-base font-semibold text-gray-900 mb-2">Lagringsplatser</h3>
              <button
                @click="startAddNewStorage"
                :disabled="isRelocateMode"
                class="w-full px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Lägg till ny
              </button>
            </div>
            <!-- Flexible height container with proper scrolling -->
            <div class="max-h-[calc(100vh-300px)] min-h-[400px] overflow-y-auto">
              <div class="p-3 space-y-2">
                <div v-for="location in combinedStorageData" :key="location.id"
                     class="p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-gray-900 text-xs truncate">{{ location.name }}</h4>
                      <p class="text-xs text-gray-600 mt-1">{{ location.Type }}</p>
                      <p class="text-xs text-gray-500 mt-1 truncate">{{ location.Lat.toFixed(3) }}, {{ location.Long.toFixed(3) }}</p>
                    </div>
                    <div class="flex flex-col items-end space-y-1 flex-shrink-0">
                      <div class="w-2 h-2 rounded-full"
                           :class="location.Type === 'Brygga' ? 'bg-green-500' : location.Type === 'Ny' ? 'bg-orange-500' : 'bg-red-500'"></div>
                      <div class="flex space-x-1">
                        <button
                          @click="highlightLocationOnMap(location.id, location.name)"
                          :disabled="isRelocateMode"
                          class="text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          Visa på karta
                        </button>
                        <button
                          @click="startRelocate(location.id, location.name)"
                          :disabled="isRelocateMode"
                          class="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          Flytta
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Map Container - Takes more space -->
        <div class="lg:col-span-4">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <!-- Map header -->
            <div class="p-6 border-b border-gray-200">
              <h2 class="text-xl font-semibold text-gray-900 mb-2">Interaktiv karta</h2>
              <p class="text-gray-600 text-sm">
                {{ companiesData[0]?.display_name }} - {{ companiesData[0]?.city }} • {{ currentStyleName }}
              </p>
            </div>

            <!-- Instructions Panel -->
            <div class="px-6 py-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-200">
              <div class="flex items-center text-sm">
                <div class="flex-shrink-0 mr-3">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 616 0z"></path>
                  </svg>
                </div>
                <div class="text-blue-800">
                  <strong>🗺️ Kartvy aktiv</strong> som standard •
                  <strong>📋 Använd listan</strong> för att hantera lagringsplatser •
                  <strong>🎯 Klicka "Flytta"</strong> för att flytta markörer
                </div>
              </div>
            </div>

        <!-- Map container -->
        <div class="relative">
          <div
            ref="mapContainer"
            class="w-full h-[600px] md:h-[700px] lg:h-[800px]"
            style="min-height: 600px;"
          />

          <!-- Style Switcher -->
          <div class="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border">
            <h4 class="font-semibold mb-2 text-gray-800 text-sm">Kartvy</h4>
            <div class="space-y-2">
              <label class="flex items-center text-sm">
                <input
                  type="radio"
                  value="streets"
                  v-model="selectedStyle"
                  @change="changeMapStyle"
                  class="mr-2"
                />
                <span class="text-gray-700">🗺️ Gatukarta</span>
              </label>
              <label class="flex items-center text-sm">
                <input
                  type="radio"
                  value="satellite"
                  v-model="selectedStyle"
                  @change="changeMapStyle"
                  class="mr-2"
                />
                <span class="text-gray-700">🛰️ Satellitvy</span>
              </label>
              <label class="flex items-center text-sm">
                <input
                  type="radio"
                  value="hybrid"
                  v-model="selectedStyle"
                  @change="changeMapStyle"
                  class="mr-2"
                />
                <span class="text-gray-700">🌍 Hybrid</span>
              </label>
            </div>
          </div>

          <!-- Legend -->
          <div class="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
            <h4 class="font-semibold mb-3 text-gray-800">Kartförklaring</h4>
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <div class="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span class="text-gray-700">Bryggor</span>
              </div>
              <div class="flex items-center">
                <div class="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                <span class="text-gray-700">Lager</span>
              </div>
              <div class="flex items-center">
                <div class="w-4 h-4 bg-orange-500 rounded-full mr-3"></div>
                <span class="text-gray-700">Nya platser</span>
              </div>
              <div class="flex items-center">
                <div class="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                <span class="text-gray-700">Inaktiva (vid flytt)</span>
              </div>
            </div>
          </div>

          <!-- Loading overlay -->
          <div
            class="absolute inset-0 bg-gray-100 flex items-center justify-center"
            :class="{ 'hidden': map }"
          >
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p class="text-gray-600">Laddar karta...</p>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Map, NavigationControl, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useToast } from '@/composables/useToast';

// Components
import StandardHeader from '@/components/layout/StandardHeader.vue';

// Import data (enligt DataHandlingGuidelines.md)
import companiesData from '@/assets/data/companies.json';
import storageUnitsData from '@/assets/data/storageUnits.json';
import boatsData from '@/assets/data/boats.json';

const route = useRoute();
const mapContainer = ref<HTMLElement>();
const map = ref<Map>();
const selectedStyle = ref('streets'); // Default to street map
const markers = ref<any[]>([]);
const { addToast } = useToast();

// Change tracking state
const locationChanges = ref<Record<string, { id: number; lat: number; lng: number; type: 'storage' }>>({});
const hasUnsavedChanges = computed(() => Object.keys(locationChanges.value).length > 0);
const isSaving = ref(false);

// Relocate mode state
const relocateMode = ref<'add' | 'relocate' | null>(null);
const relocateTargetId = ref<number | null>(null);
const relocateTargetName = ref<string>('');
const isRelocateMode = computed(() => relocateMode.value !== null);

// Highlight mode state
const highlightedLocationId = ref<number | null>(null);
const isHighlightMode = computed(() => highlightedLocationId.value !== null);

// Track marker position changes
const trackLocationChange = (id: number, lat: number, lng: number, type: 'storage') => {
  const key = `storage-${id}`;
  locationChanges.value[key] = { id, lat, lng, type };
};

// Reset all changes
const resetChanges = () => {
  locationChanges.value = {};
  // Clear and re-add all markers to restore original positions
  clearAllMarkers();
  addAllMarkers();
  addToast({
    title: 'Ändringar återställda',
    message: 'Alla markörer har återställts till sina ursprungliga positioner',
    type: 'success'
  });
};

// Save changes to JSON files (simulated)
const saveChanges = async () => {
  if (!hasUnsavedChanges.value) return;

  isSaving.value = true;

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In a real app, you would send the changes to your backend API
    console.log('Saving changes:', locationChanges.value);

    const changesCount = Object.keys(locationChanges.value).length;

    // Update local data with new positions
    Object.values(locationChanges.value).forEach(change => {
      const location = combinedStorageData.value.find(l => l.id === change.id);
      if (location) {
        location.Lat = change.lat;
        location.Long = change.lng;
      }
    });

    // Reset changes after successful save
    locationChanges.value = {};

    // Refresh marker colors to remove gray state
    refreshMarkerColors();

    addToast({
      title: 'Ändringar sparade',
      message: `${changesCount} ändringar har sparats`,
      type: 'success'
    });

  } catch (error) {
    console.error('Failed to save changes:', error);
    addToast({
      title: 'Fel vid sparande',
      message: 'Ändringar kunde inte sparas. Försök igen.',
      type: 'error'
    });
  } finally {
    isSaving.value = false;
  }
};

// Relocate functions
const cancelRelocate = () => {
  relocateMode.value = null;
  relocateTargetId.value = null;
  relocateTargetName.value = '';

  // Clear any highlighting
  highlightedLocationId.value = null;

  // Refresh markers to restore original colors
  refreshMarkerColors();

  addToast({
    title: 'Flytt avbruten',
    message: 'Återgick till normalläge',
    type: 'info'
  });
};

const startRelocate = (locationId: number, locationName: string) => {
  relocateMode.value = 'relocate';
  relocateTargetId.value = locationId;
  relocateTargetName.value = locationName;

  // Clear any highlighting
  highlightedLocationId.value = null;

  // Refresh markers to gray out others
  refreshMarkerColors();

  addToast({
    title: 'Flyttläge aktiverat',
    message: `Klicka på kartan för att flytta "${locationName}"`,
    type: 'info'
  });
};

const startAddNewStorage = () => {
  relocateMode.value = 'add';
  relocateTargetId.value = null;
  relocateTargetName.value = '';

  // Clear any highlighting
  highlightedLocationId.value = null;

  // Refresh markers to gray out others
  refreshMarkerColors();

  addToast({
    title: 'Lägg till ny plats',
    message: 'Klicka på kartan för att lägga till en ny lagringsplats',
    type: 'info'
  });
};

// Highlight functions
const highlightLocationOnMap = (locationId: number, locationName: string) => {
  // Clear any existing relocate mode
  relocateMode.value = null;
  relocateTargetId.value = null;
  relocateTargetName.value = '';

  // Set highlight
  highlightedLocationId.value = locationId;

  // Refresh markers to apply highlighting
  refreshMarkerColors();

  // Center map on the highlighted location
  const location = combinedStorageData.value.find(l => l.id === locationId);
  if (location && map.value) {
    map.value.flyTo({
      center: [location.Long, location.Lat],
      zoom: 17,
      duration: 1000
    });

    // Open the popup for the highlighted marker after animation
    setTimeout(() => {
      const highlightedMarker = markers.value.find(m =>
        m.getElement().dataset['locationId'] === locationId.toString()
      );
      if (highlightedMarker) {
        highlightedMarker.togglePopup();
      }
    }, 1100);
  }

  addToast({
    title: 'Plats markerad',
    message: `"${locationName}" är nu markerad på kartan`,
    type: 'info'
  });
};

const clearHighlight = () => {
  highlightedLocationId.value = null;
  refreshMarkerColors();

  addToast({
    title: 'Markering borttagen',
    message: 'Alla platser visas nu i normalläge',
    type: 'info'
  });
};

// Map style configurations
const mapStyles = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellitvy'
  },
  streets: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'Gatukarta'
  },
  hybrid: {
    url: 'https://api.maptiler.com/maps/hybrid/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
    name: 'Hybrid (satellit + vägar)'
  }
};

const currentStyleName = computed(() => {
  return mapStyles[selectedStyle.value as keyof typeof mapStyles]?.name || 'Okänd stil';
});

// Map new storage data structure to old format for compatibility
const combinedStorageData = computed(() => {
  return storageUnitsData.map((unit: any) => ({
    id: unit.id,
    name: unit.name,
    Type: unit.unit_type === 'dock' ? 'Brygga' : 'Lager',
    Lat: unit.latitude,
    Long: unit.longitude,
    Height: unit.length,
    width: unit.width,
    Comment: `${unit.unit_type === 'dock' ? 'Brygga' : 'Lager'} med ${unit.level_count} våningar`
  }));
});

// Statistics for header
const headerStats = computed(() => {
  const totalBoats = boatsData.length;
  const totalBryggor = combinedStorageData.value.filter(l => l.Type === 'Brygga').length;
  const totalLager = combinedStorageData.value.filter(l => l.Type === 'Lager').length;

  return [
    {
      label: 'Båtar totalt',
      value: totalBoats,
      variant: 'default' as const,
      color: 'text-blue-600'
    },
    {
      label: 'Bryggor',
      value: totalBryggor,
      variant: 'secondary' as const,
      color: 'text-green-600'
    },
    {
      label: 'Lager',
      value: totalLager,
      variant: 'secondary' as const,
      color: 'text-orange-600'
    }
  ];
});

// Helper functions for colors and styling
const getDockColor = (status: string): string => {
  switch (status) {
    case 'operational': return '#10b981'; // Green
    case 'maintenance': return '#f59e0b'; // Orange
    case 'seasonal': return '#06b6d4'; // Cyan
    default: return '#6b7280'; // Gray
  }
};

const getWarehouseColor = (status: string): string => {
  switch (status) {
    case 'available': return '#dc2626'; // Red
    case 'full': return '#7c2d12'; // Dark red
    case 'maintenance': return '#f59e0b'; // Orange
    default: return '#6b7280'; // Gray
  }
};

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'operational':
    case 'available': return 'bg-green-100 text-green-800';
    case 'full': return 'bg-red-100 text-red-800';
    case 'maintenance': return 'bg-orange-100 text-orange-800';
    case 'seasonal': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Function to clear all markers from the map
const clearAllMarkers = () => {
  if (!map.value) return;
  markers.value.forEach(marker => marker.remove());
  markers.value = [];
};

// Function to add all markers to the map
const addAllMarkers = () => {
  if (!map.value) return;

  // Add all storage location markers
  combinedStorageData.value.forEach(location => {
    addStorageLocationMarker(location);
  });
};



// Function to add specific storage location marker
const addStorageLocationMarker = (location: any) => {
  if (!map.value) return;

  const isDock = location.Type === 'Brygga';
  const isNewLocation = location.Type === 'Ny';

    // Determine marker color based on relocation mode, highlighting, and unsaved changes
  let markerColor;
  let scale = isDock ? 1.1 : 1.0;

  if ((isRelocateMode.value && relocateTargetId.value !== location.id) ||
      (hasUnsavedChanges.value && !isRelocateMode.value) ||
      (isHighlightMode.value && highlightedLocationId.value !== location.id)) {
    // Gray out other markers during relocation OR when there are unsaved changes OR during highlighting
    markerColor = '#9ca3af'; // Gray color
    scale = 0.8; // Slightly smaller
  } else if (isNewLocation) {
    markerColor = '#f59e0b'; // Orange for new locations
  } else if (isDock) {
    markerColor = '#10b981'; // Green for docks
  } else {
    markerColor = '#dc2626'; // Red for warehouses
  }

  // If this is the highlighted location, make it slightly bigger and add a pulse effect
  if (isHighlightMode.value && highlightedLocationId.value === location.id) {
    scale = isDock ? 1.3 : 1.2;
  }

  const titleColor = isNewLocation ? 'text-orange-700' : (isDock ? 'text-green-700' : 'text-red-700');

  const locationMarker = new Marker({
    color: markerColor,
    scale: scale
  })
    .setLngLat([location.Long, location.Lat])
    .setPopup(
      new Popup({ offset: 25 })
        .setHTML(`
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1 ${titleColor}">${location.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${location.Type}</p>
            <div class="text-sm space-y-1">
              <p><strong>Dimensioner:</strong> H: ${location.Height}m, B: ${location.width}m</p>
              <p><strong>Position:</strong> ${location.Lat.toFixed(4)}, ${location.Long.toFixed(4)}</p>
              <p><strong>Detaljer:</strong> ${location.Comment}</p>
              ${relocateTargetId.value === location.id ? '<p class="text-blue-600 font-semibold mt-2">🎯 Denna plats flyttas</p>' : ''}
              ${highlightedLocationId.value === location.id ? '<p class="text-green-600 font-semibold mt-2">👁️ Denna plats är markerad</p>' : ''}
            </div>
            ${relocateTargetId.value !== location.id && !isRelocateMode.value ? `
              <div class="mt-3">
                <button onclick="window.startRelocateFromPopup(${location.id}, '${location.name}')"
                        class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
                  Flytta denna plats
                </button>
              </div>
            ` : ''}
          </div>
        `)
    )
    .addTo(map.value);

  // Add data attribute to marker for identification
  locationMarker.getElement().dataset['locationId'] = location.id.toString();

  // Add pulse animation to highlighted marker
  if (isHighlightMode.value && highlightedLocationId.value === location.id) {
    const markerElement = locationMarker.getElement();
    markerElement.style.animation = 'pulse 2s infinite';
    markerElement.classList.add('highlighted-marker');
  }

  markers.value.push(locationMarker);

  return locationMarker;
};



// Function to handle adding new pins when map is clicked
const addNewPin = (coordinates: [number, number]) => {
  if (relocateMode.value === 'add') {
    // Add new storage location
    const newId = Math.max(...combinedStorageData.value.map(l => l.id)) + 1;
    const newLocation = {
      id: newId,
      name: `Ny lagringsplats ${newId}`,
      Type: 'Ny' as const,
      Lat: coordinates[1],
      Long: coordinates[0],
      Height: 0,
      width: 0,
      Comment: 'Nyskapad lagringsplats - uppdatera detaljer'
    };

    // Add to data
    // Note: Since combinedStorageData is now computed, we need to update the source data
    // For now, we'll track as a change instead of directly modifying
    // In a real app, this would be handled by the API

    // Add marker
    const newMarker = addStorageLocationMarker(newLocation);

        // Track as change
    trackLocationChange(newId, coordinates[1], coordinates[0], 'storage');

    // Exit add mode
    relocateMode.value = null;

    // Keep markers gray until changes are saved - don't refresh colors yet

    // Show success message
    addToast({
      title: 'Ny plats tillagd',
      message: `"${newLocation.name}" har lagts till på kartan`,
      type: 'success'
    });

    // Open popup to show details
    setTimeout(() => {
      const newMarker = markers.value.find(m =>
        m.getElement().dataset['locationId'] === newLocation.id.toString()
      );
      if (newMarker) {
        newMarker.togglePopup();
      }
    }, 300);

  } else if (relocateMode.value === 'relocate' && relocateTargetId.value) {
    // Relocate existing storage location
    const location = combinedStorageData.value.find(l => l.id === relocateTargetId.value);
    if (location) {
      // Update position
      location.Lat = coordinates[1];
      location.Long = coordinates[0];

      // Track as change
      trackLocationChange(location.id, coordinates[1], coordinates[0], 'storage');

      // Update marker
      const existingMarker = markers.value.find(m =>
        m.getElement().dataset['locationId'] === location.id.toString()
      );
      if (existingMarker) {
        existingMarker.setLngLat(coordinates);
      }

      // Exit relocate mode
      relocateMode.value = null;
      relocateTargetId.value = null;

      // Keep markers gray until changes are saved - don't refresh colors yet

      // Show success message
      addToast({
        title: 'Plats flyttad',
        message: `"${location.name}" har flyttats till ny position`,
        type: 'success'
      });
    }
  }
};

// Function to remove a specific marker
const removeMarker = (lng: number, lat: number) => {
  const markerIndex = markers.value.findIndex(marker => {
    const markerLngLat = marker.getLngLat();
    return Math.abs(markerLngLat.lng - lng) < 0.0001 && Math.abs(markerLngLat.lat - lat) < 0.0001;
  });

  if (markerIndex !== -1) {
    const marker = markers.value[markerIndex];
    marker.remove();
    markers.value.splice(markerIndex, 1);
  }
};

// Function to refresh all marker colors based on relocation mode
const refreshMarkerColors = () => {
  if (!map.value) return;

  // Clear and re-add all markers with updated colors
  clearAllMarkers();
  addAllMarkers();
};

// Make functions available globally for popup buttons
(window as any).removeMarker = removeMarker;
(window as any).startRelocateFromPopup = (locationId: number, locationName: string) => {
  startRelocate(locationId, locationName);
};

// Function to focus on a specific location
const handleLocationFocus = () => {
  const { focus, name } = route.query;
  if (focus && map.value) {
    const focusId = parseInt(focus.toString());
    const locationToFocus = combinedStorageData.value.find(loc => loc.id === focusId);

    if (locationToFocus) {
      // Clear existing markers first
      clearAllMarkers();

      // Add all markers
      addAllMarkers();

      // Highlight the specific location
      highlightLocationOnMap(focusId, name?.toString() || locationToFocus.name);

      // Show success message
      addToast({
        title: 'Navigerat till plats',
        message: `Visar "${name || locationToFocus.name}" på kartan`,
        type: 'success'
      });
    }
  }
};

// Function to initialize MapLibre map
const initializeMapLibre = () => {
  if (!mapContainer.value) return;

  const company = companiesData[0];
  if (!company) return;

  // Clear previous map
  if (map.value) {
    map.value.remove();
  }

  // Initialize the map with selected style
  const styleConfig = mapStyles[selectedStyle.value as keyof typeof mapStyles];
  let mapStyle;

  if (selectedStyle.value === 'satellite' || selectedStyle.value === 'streets') {
    mapStyle = {
      version: 8,
      sources: {
        'raster-tiles': {
          type: 'raster',
          tiles: [(styleConfig as any).url],
          tileSize: 256,
          attribution: selectedStyle.value === 'satellite'
            ? '© Esri, Maxar, Earthstar Geographics'
            : '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'background',
          type: 'raster',
          source: 'raster-tiles',
          minzoom: 0,
          maxzoom: 22
        }
      ]
    };
  } else {
    mapStyle = (styleConfig as any).url;
  }

  map.value = new Map({
    container: mapContainer.value,
    style: mapStyle as any,
    center: [company.longitude, company.latitude],
    zoom: 15,
    pitch: 0,
    bearing: 0
  });

  // Add navigation controls
  map.value.addControl(new NavigationControl(), 'top-right');

  // Add click event for new pins
  map.value.on('click', (e) => {
    const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    addNewPin(coordinates);
  });

  // Handle location focus after map loads
  map.value.on('styledata', () => {
    setTimeout(() => {
      // Check if there's a specific location to focus on
      const { focus } = route.query;
      if (focus) {
        // If focusing on specific location, handle that
        handleLocationFocus();
      } else {
        // Otherwise, show all storage location pins
        clearAllMarkers();
        addAllMarkers();
      }
    }, 100);
  });
};

// Function to change map style
const changeMapStyle = () => {
  initializeMapLibre();
};

onMounted(() => {
  // Initialize with street map as default
  initializeMapLibre();
});

// Watch for route changes to handle deep linking to specific locations
watch(() => route.query, () => {
  if (map.value && markers.value.length > 0) {
    handleLocationFocus();
  }
}, { deep: true });
</script>

<style scoped>
/* Ensure the map container has proper styling */
.maplibregl-map {
  border-radius: 0;
}

/* Custom popup styling */
:deep(.maplibregl-popup-content) {
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

:deep(.maplibregl-popup-tip) {
  border-top-color: white;
}

/* Style for radio buttons */
input[type="radio"] {
  accent-color: #3b82f6;
}

/* Pulse animation for focused markers */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Highlighted marker styling */
:deep(.highlighted-marker) {
  filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
  z-index: 1000 !important;
}
</style>
