<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Välkommen till Stadsmissionen</h1>
        <p class="text-gray-600">
          Utforska vårt område med interaktiv karta. Använd listan för att navigera till specifika platser eller klicka på kartan för att lägga till nya platser.
        </p>
      </div>

            <!-- Changes notification bar -->
      <div v-if="hasUnsavedChanges" class="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
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
      <div v-if="isRelocateMode" class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
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

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Storage List Panel -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Lagringsplatser</h3>
              <button
                @click="startAddNewStorage"
                :disabled="isRelocateMode"
                class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Lägg till ny plats
              </button>
            </div>
            <div class="max-h-96 overflow-y-auto">
              <div class="p-4 space-y-3">
                <div v-for="location in combinedStorageData" :key="location.id"
                     class="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h4 class="font-medium text-gray-900 text-sm">{{ location.name }}</h4>
                      <p class="text-xs text-gray-600 mt-1">{{ location.Type }}</p>
                      <p class="text-xs text-gray-500 mt-1">{{ location.Lat.toFixed(4) }}, {{ location.Long.toFixed(4) }}</p>
                    </div>
                                        <div class="flex items-center space-x-1">
                      <div class="w-3 h-3 rounded-full"
                           :class="location.Type === 'Brygga' ? 'bg-green-500' : location.Type === 'Ny' ? 'bg-orange-500' : 'bg-red-500'"></div>
                      <button
                        @click="startRelocate(location.id, location.name)"
                        :disabled="isRelocateMode"
                        class="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
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

        <!-- Map Container -->
        <div class="lg:col-span-3">
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
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
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
            class="w-full h-96 md:h-[500px] lg:h-[600px]"
            style="min-height: 400px;"
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
                <div class="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <span class="text-gray-700">Företag</span>
              </div>
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

        <!-- Map info -->
        <div class="p-6 bg-gray-50">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Kontaktinformation</h3>
              <p class="text-gray-600">
                <strong>Telefon:</strong> {{ companiesData[0]?.contact_phone }}<br>
                <strong>Email:</strong> {{ companiesData[0]?.contact_email }}<br>
                <strong>Webbplats:</strong>
                <a
                  :href="companiesData[0]?.website"
                  target="_blank"
                  class="text-blue-600 hover:underline"
                >
                  {{ companiesData[0]?.website }}
                </a>
              </p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Bryggor</h3>
              <p class="text-gray-600">
                <strong>Totalt:</strong> {{ combinedStorageData.filter(l => l.Type === 'Brygga').length }} bryggor<br>
                <strong>Bryggplatser:</strong> {{ combinedStorageData.filter(l => l.Type === 'Brygga').reduce((total, dock) => total + parseInt(dock.Comment.match(/(\d+)\s+platser/)?.[1] || '0'), 0) }} st<br>
                <strong>Tillgängliga:</strong> {{ combinedStorageData.filter(l => l.Type === 'Brygga' && l.Comment.includes('Service') === false).length }} st<br>
                <strong>Service:</strong> {{ combinedStorageData.filter(l => l.Type === 'Brygga' && l.Comment.includes('Service')).length }} st
              </p>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 mb-2">Lager</h3>
              <p class="text-gray-600">
                <strong>Totalt:</strong> {{ combinedStorageData.filter(l => l.Type === 'Lager').length }} lager<br>
                <strong>Kapacitet:</strong> {{ combinedStorageData.filter(l => l.Type === 'Lager').reduce((total, w) => total + parseInt(w.Comment.match(/(\d+)\s+båtar|(\d+)\s+platser/)?.[1] || w.Comment.match(/(\d+)\s+båtar|(\d+)\s+platser/)?.[2] || '0'), 0) }} enheter<br>
                <strong>Inomhus:</strong> {{ combinedStorageData.filter(l => l.Type === 'Lager' && l.Comment.includes('Inomhus')).length }} st<br>
                <strong>Utomhus:</strong> {{ combinedStorageData.filter(l => l.Type === 'Lager' && (l.Comment.includes('Utomhus') || l.Comment.includes('Trailer'))).length }} st
              </p>
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

// Import company data
import companiesData from '@/assets/data/companies.json';
import combinedStorageData from '@/assets/data/combinedStorage.json';

const route = useRoute();
const mapContainer = ref<HTMLElement>();
const map = ref<Map>();
const selectedStyle = ref('streets'); // Default to street map
const markers = ref<any[]>([]);
const { addToast } = useToast();

// Change tracking state
const locationChanges = ref<Record<string, { id: number; lat: number; lng: number; type: 'company' | 'storage' }>>({});
const hasUnsavedChanges = computed(() => Object.keys(locationChanges.value).length > 0);
const isSaving = ref(false);

// Relocate mode state
const relocateMode = ref<'add' | 'relocate' | null>(null);
const relocateTargetId = ref<number | null>(null);
const relocateTargetName = ref<string>('');
const isRelocateMode = computed(() => relocateMode.value !== null);

// Track marker position changes
const trackLocationChange = (id: number, lat: number, lng: number, type: 'company' | 'storage') => {
  const key = `${type}-${id}`;
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

    // In a real implementation, this would make API calls to update the JSON files
    // For now, we'll simulate successful saves and update our local data

    const changesCount = Object.keys(locationChanges.value).length;

    // Update local data with new positions
    Object.values(locationChanges.value).forEach(change => {
      if (change.type === 'company') {
        const company = companiesData.find(c => c.id === change.id);
        if (company) {
          company.latitude = change.lat;
          company.longitude = change.lng;
        }
      } else if (change.type === 'storage') {
        const location = combinedStorageData.find(l => l.id === change.id);
        if (location) {
          location.Lat = change.lat;
          location.Long = change.lng;
        }
      }
    });

    // Clear changes
    locationChanges.value = {};

    addToast({
      title: 'Ändringar sparade',
      message: `${changesCount} markörer har uppdaterats med nya positioner`,
      type: 'success'
    });

  } catch (error) {
    addToast({
      title: 'Fel vid sparande',
      message: 'Kunde inte spara ändringarna. Försök igen.',
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

  addToast({
    title: 'Lägg till ny plats',
    message: 'Klicka på kartan för att lägga till en ny lagringsplats',
    type: 'info'
  });
};

// Handle map click when in relocate mode
const handleMapClick = (coordinates: [number, number]) => {
  if (relocateMode.value === 'add') {
    // Add new storage location
    addNewStorageLocation(coordinates);
  } else if (relocateMode.value === 'relocate' && relocateTargetId.value) {
    // Relocate existing marker
    relocateExistingMarker(relocateTargetId.value, coordinates);
  }
};

// Add new storage location
const addNewStorageLocation = (coordinates: [number, number]) => {
  const newId = Math.max(...combinedStorageData.map(l => l.id)) + 1;
  const newLocation = {
    id: newId,
    name: `Ny lagringsplats ${newId}`,
    Type: 'Ny',
    Lat: coordinates[1],
    Long: coordinates[0],
    Height: 0,
    width: 20,
    Comment: 'Ny lagringsplats - uppdatera detaljer'
  };

  // Add to data
  combinedStorageData.push(newLocation);

  // Add marker to map
  addStorageLocationMarker(newLocation);

  // Track change
  trackLocationChange(newId, coordinates[1], coordinates[0], 'storage');

  // Exit relocate mode
  cancelRelocate();

  addToast({
    title: 'Ny plats tillagd',
    message: `"${newLocation.name}" har lagts till på kartan`,
    type: 'success'
  });
};

// Relocate existing marker
const relocateExistingMarker = (locationId: number, coordinates: [number, number]) => {
  // Find the marker
  const marker = findMarkerByTypeAndId('storage', locationId);
  if (marker) {
    // Move the marker
    marker.setLngLat(coordinates);

    // Track the change
    trackLocationChange(locationId, coordinates[1], coordinates[0], 'storage');

    // Update popup
    const location = combinedStorageData.find(l => l.id === locationId);
    if (location) {
      const isDock = location.Type === 'Brygga';
      const titleColor = isDock ? 'text-green-700' : 'text-red-700';

      marker.setPopup(
        new Popup({ offset: 25 })
          .setHTML(`
            <div class="p-4">
              <h3 class="font-semibold text-lg mb-1 ${titleColor}">${location.name}</h3>
              <p class="text-sm text-gray-600 mb-2">${location.Type}</p>
              <div class="text-sm space-y-1">
                <p><strong>Dimensioner:</strong> H: ${location.Height}m, B: ${location.width}m</p>
                <p><strong>Position:</strong> ${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}</p>
                <p><strong>Detaljer:</strong> ${location.Comment}</p>
              </div>
              <div class="mt-2 text-xs text-orange-600">
                ⚠️ Position ändrad - kom ihåg att spara
              </div>
              <div class="mt-3 flex gap-2">
                <button onclick="window.startRelocateFromPopup(${location.id}, '${location.name}')"
                        class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
                  Flytta igen
                </button>
              </div>
            </div>
          `)
      );
    }
  }

  // Exit relocate mode
  cancelRelocate();

  addToast({
    title: 'Plats flyttad',
    message: `"${relocateTargetName.value}" har flyttats till ny position`,
    type: 'success'
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

  // Add company marker
  addCompanyMarker();

  // Add all storage location markers
  combinedStorageData.forEach(location => {
    addStorageLocationMarker(location);
  });
};

// Function to add company marker only
const addCompanyMarker = () => {
  if (!map.value) return;

  const company = companiesData[0];
  if (!company) return;

  const companyMarker = new Marker({
    color: '#3b82f6', // Blue color
    scale: 1.3
  })
    .setLngLat([company.longitude, company.latitude])
    .setPopup(
      new Popup({ offset: 25 })
        .setHTML(`
          <div class="p-4">
            <h3 class="font-semibold text-lg mb-1 text-blue-700">${company.display_name}</h3>
            <p class="text-sm text-gray-600 mb-2">${company.legal_name}</p>
            <p class="text-sm">
              <strong>Adress:</strong><br>
              ${company.street}<br>
              ${company.postal_code} ${company.city}<br>
              ${company.country}
            </p>
            <p class="text-sm mt-2">
              <strong>Kontakt:</strong><br>
              Tel: ${company.contact_phone}<br>
              Email: ${company.contact_email}
            </p>
            <p class="text-sm mt-2 text-gray-500">
              <strong>Position:</strong> ${company.latitude.toFixed(6)}, ${company.longitude.toFixed(6)}
            </p>
          </div>
        `)
    )
    .addTo(map.value);

    // Company marker doesn't need drag functionality

  // Add data attribute to marker for identification
  companyMarker.getElement().dataset['companyId'] = company.id.toString();
  markers.value.push(companyMarker);
};

// Function to add specific storage location marker
const addStorageLocationMarker = (location: any) => {
  if (!map.value) return;

  const isDock = location.Type === 'Brygga';
  const isNew = location.Type === 'Ny';
  let markerColor, titleColor;

  if (isDock) {
    markerColor = '#10b981'; // Green for docks
    titleColor = 'text-green-700';
  } else if (isNew) {
    markerColor = '#f59e0b'; // Orange for new locations
    titleColor = 'text-orange-700';
  } else {
    markerColor = '#dc2626'; // Red for warehouses
    titleColor = 'text-red-700';
  }

  const locationMarker = new Marker({
    color: markerColor,
    scale: isDock ? 1.1 : 1.0
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
              <p><strong>Position:</strong> ${location.Lat.toFixed(6)}, ${location.Long.toFixed(6)}</p>
              <p><strong>Detaljer:</strong> ${location.Comment}</p>
            </div>
            <div class="mt-3 flex gap-2">
              <button onclick="window.startRelocateFromPopup(${location.id}, '${location.name}')"
                      class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
                Flytta
              </button>
            </div>
          </div>
        `)
    )
    .addTo(map.value);

    // Storage markers use click-to-relocate instead of dragging

  // Add data attribute to marker for identification
  locationMarker.getElement().dataset['locationId'] = location.id.toString();
  markers.value.push(locationMarker);

  return locationMarker;
};

// Removed addNewPin and removeMarker functions since we only drag existing markers

// Function to focus on a specific location
const handleLocationFocus = async () => {
  const { lat, lng, zoom, focus, name } = route.query;

  if (lat && lng && map.value) {
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const zoomLevel = zoom ? parseInt(zoom as string) : 17;

    // Center map and add markers
    map.value.setCenter([longitude, latitude]);
    map.value.setZoom(zoomLevel);

    // Add the specific location marker if focus ID is provided
    if (focus) {
      const focusId = parseInt(focus.toString());
      const locationToFocus = combinedStorageData.find(loc => loc.id === focusId);

      if (locationToFocus) {
        // Clear all existing markers
        clearAllMarkers();

        // Add the focused location marker
        const newMarker = addStorageLocationMarker(locationToFocus);

        if (newMarker) {
          // Open popup for the focused marker
          setTimeout(() => {
            newMarker.togglePopup();
          }, 500);

          // Add a pulse effect to the marker
          const markerElement = newMarker.getElement();
          markerElement.style.animation = 'pulse 2s infinite';

          // Remove animation after 6 seconds
          setTimeout(() => {
            markerElement.style.animation = '';
          }, 6000);
        }
      }
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

  // Add click event for relocate/add functionality
  map.value.on('click', (e) => {
    if (isRelocateMode.value) {
      const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      handleMapClick(coordinates);
    }
  });

  // Handle location focus after map loads
  map.value.on('styledata', () => {
    setTimeout(() => {
      handleLocationFocus();
    }, 100);
  });

  // Add all markers after map loads
  map.value.on('load', () => {
    addAllMarkers();
  });
};

// Function to change map style
const changeMapStyle = () => {
  // Store current marker positions before clearing
  const currentPositions: Record<string, {lat: number, lng: number}> = {};

    markers.value.forEach(marker => {
    const element = marker.getElement();
    const locationId = element.dataset['locationId'];
    const companyId = element.dataset['companyId'];
    const lngLat = marker.getLngLat();

    if (locationId) {
      currentPositions[`storage-${locationId}`] = {
        lat: lngLat.lat,
        lng: lngLat.lng
      };
    } else if (companyId) {
      currentPositions[`company-${companyId}`] = {
        lat: lngLat.lat,
        lng: lngLat.lng
      };
    }
  });

  initializeMapLibre();

  // After the map loads, update positions with any changes
  if (map.value) {
    map.value.on('load', () => {
      // Apply stored positions to newly created markers
      Object.entries(currentPositions).forEach(([key, pos]) => {
        const changeKey = key as keyof typeof locationChanges.value;
        if (locationChanges.value[changeKey]) {
          // Use the tracked change position instead
          const change = locationChanges.value[changeKey];
          const marker = findMarkerByTypeAndId(change.type, change.id);
          if (marker) {
            marker.setLngLat([change.lng, change.lat]);
          }
        }
      });
    });
  }
};

// Helper function to find marker by type and ID
const findMarkerByTypeAndId = (type: 'company' | 'storage', id: number) => {
  return markers.value.find(marker => {
    const element = marker.getElement();
    const locationId = element.dataset['locationId'];
    const companyId = element.dataset['companyId'];

    if (type === 'company' && companyId && parseInt(companyId) === id) {
      return true;
    } else if (type === 'storage' && locationId && parseInt(locationId) === id) {
      return true;
    }

    return false;
  });
};

onMounted(() => {
  // Initialize with street map as default
  initializeMapLibre();

  // Make relocate function available globally for popup buttons
  (window as any).startRelocateFromPopup = startRelocate;
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
</style>
