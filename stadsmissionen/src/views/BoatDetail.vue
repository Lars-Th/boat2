<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';
import { useApiItem } from '@/composables/useApi';
import api from '@/api';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import { ArrowLeft, ChevronRight, Home, Save } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const { success, error, promise } = useToast();

const loading = ref(false);
const customers = ref<any[]>([]);

const isNew = computed(() => route.params['id'] === 'new');
const boatId = computed(() => route.params['id'] as string);

// Fetch boat data (only if not creating new)
const {
  data: boat,
  loading: isLoading,
  error: boatError,
  refresh: refreshBoat,
} = useApiItem(() => (isNew.value ? null : api.boats.getById(boatId.value)), {
  cacheKey: `boat-${boatId.value}`,
  enabled: computed(() => !isNew.value),
});

// Form state
const form = ref({
  boatType: '',
  customerId: '',
  length: undefined as number | undefined,
  width: undefined as number | undefined,
  safetyMargin: undefined as number | undefined,
  launchDate: '',
  haul_outDate: '',
  status: 'unplaced',
  location: 'lager',
  comments: '',
});

// Watch for boat data changes and populate form
watch(
  boat,
  newBoat => {
    if (newBoat && !isNew.value) {
      form.value = {
        boatType: newBoat.boatType ?? '',
        customerId: newBoat.customerId?.toString() ?? '',
        length: newBoat.length ?? undefined,
        width: newBoat.width ?? undefined,
        safetyMargin: newBoat.safetyMargin ?? undefined,
        launchDate: newBoat.launchDate ?? '',
        haul_outDate: newBoat.haul_outDate ?? '',
        status: newBoat.status ?? 'unplaced',
        location: newBoat.location ?? 'lager',
        comments: newBoat.comments ?? '',
      };
    }
  },
  { immediate: true }
);

// Load customers on mount
const loadCustomers = async () => {
  try {
    const customersResponse = await api.customers.getAll();
    if (customersResponse.success && customersResponse.data) {
      customers.value = customersResponse.data;
    }
  } catch (err) {
    console.error('Error loading customers:', err);
    error('Fel vid laddning', 'Kunde inte ladda kunddata.');
  }
};

// Load customers immediately
loadCustomers();

// Computed properties for SVG boat visualization
const boatSvgStyle = computed(() => {
  if (!form.value.length || !form.value.width) return {};

  // Scale factor for visualization (max 200px)
  const maxSize = 200;
  const scale = Math.min(maxSize / Math.max(form.value.length, form.value.width), 20);

  const width = form.value.length * scale;
  const height = form.value.width * scale;

  return {
    width: `${width}px`,
    height: `${height}px`,
  };
});

const safetyMarginSvgStyle = computed(() => {
  if (!form.value.length || !form.value.width || !form.value.safetyMargin) return {};

  const maxSize = 200;
  const scale = Math.min(maxSize / Math.max(form.value.length, form.value.width), 20);

  const totalWidth = (form.value.length + form.value.safetyMargin * 2) * scale;
  const totalHeight = (form.value.width + form.value.safetyMargin * 2) * scale;

  return {
    width: `${totalWidth}px`,
    height: `${totalHeight}px`,
  };
});

const totalLength = computed(() => {
  if (!form.value.length || !form.value.safetyMargin) return 0;
  return Number((form.value.length + form.value.safetyMargin * 2).toFixed(1));
});

const totalWidth = computed(() => {
  if (!form.value.width || !form.value.safetyMargin) return 0;
  return Number((form.value.width + form.value.safetyMargin * 2).toFixed(1));
});

const boatArea = computed(() => {
  if (!form.value.length || !form.value.width) return 0;
  return Number((form.value.length * form.value.width).toFixed(1));
});

const totalArea = computed(() => {
  if (!totalLength.value || !totalWidth.value) return 0;
  return Number((totalLength.value * totalWidth.value).toFixed(1));
});

// Setup breadcrumbs
const breadcrumbs = computed(() => {
  if (isNew.value) return 'Dashboard / Båtar / Ny Båt';
  return `Dashboard / Båtar / ${boat.value?.boatType ?? 'Båtdetaljer'}`;
});

const pageTitle = computed(() => {
  if (isNew.value) return 'Lägg till ny båt';
  return 'Redigera båt';
});

const pageDescription = computed(() => {
  if (isNew.value) return 'Fyll i båtinformation nedan';
  return `Redigera information för ${boat.value?.boatType ?? 'båt'}`;
});

const goBack = () => {
  router.push('/boats/list');
};

const saveBoat = async () => {
  if (!form.value.boatType || !form.value.customerId) {
    error('Obligatoriska fält', 'Båttyp och kund måste fyllas i.');
    return;
  }

  loading.value = true;

  try {
    const boatData = {
      boatType: form.value.boatType,
      customerId: parseInt(form.value.customerId),
      length: form.value.length ?? 0,
      width: form.value.width ?? 0,
      safetyMargin: form.value.safetyMargin ?? 0,
      launchDate: form.value.launchDate ?? null,
      haul_outDate: form.value.haul_outDate ?? null,
      status: form.value.status,
      location: form.value.location,
      comments: form.value.comments || '',
    };

    if (isNew.value) {
      const response = await promise(api.boats.create(boatData), {
        loading: 'Skapar båt...',
        success: 'Båt skapad framgångsrikt!',
        error: 'Ett fel uppstod när båten skulle skapas.',
      });

      if (response.success) {
        // Redirect back to list after successful creation
        router.push('/boats/list');
      }
    } else {
      const response = await promise(api.boats.update(boatId.value, boatData), {
        loading: 'Uppdaterar båt...',
        success: 'Båt uppdaterad framgångsrikt!',
        error: 'Ett fel uppstod när båten skulle uppdateras.',
      });

      if (response.success) {
        // Refresh the boat data to show updated values
        await refreshBoat();
        // Redirect back to list after successful update
        router.push('/boats/list');
      }
    }
  } catch (err) {
    console.error('Error saving boat:', err);
    error('Fel vid sparande', 'Ett oväntat fel uppstod.');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header with same structure as lists -->
    <div class="bg-white border-b">
      <div class="px-6 py-4">
        <!-- Breadcrumbs -->
        <nav class="flex mb-4" aria-label="Breadcrumb">
          <ol class="inline-flex items-center space-x-1 md:space-x-3">
            <li class="inline-flex items-center">
              <router-link
                to="/overview"
                class="text-gray-700 hover:text-blue-600 inline-flex items-center text-sm"
              >
                <Home class="w-3 h-3 mr-1" />
                Hem
              </router-link>
            </li>
            <li>
              <div class="flex items-center">
                <ChevronRight class="w-3 h-3 text-gray-400" />
                <router-link
                  to="/boats/list"
                  class="ml-1 text-gray-700 hover:text-blue-600 md:ml-2 text-sm"
                >
                  Båtar
                </router-link>
              </div>
            </li>
            <li aria-current="page">
              <div class="flex items-center">
                <ChevronRight class="w-3 h-3 text-gray-400" />
                <span class="ml-1 text-gray-500 md:ml-2 text-sm">
                  {{ isNew ? 'Ny båt' : boat?.boatType || 'Båtdetaljer' }}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <!-- Header with actions -->
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-xl font-semibold text-gray-900">
              {{ pageTitle }}
            </h1>
            <p class="text-gray-600 mt-1 text-sm">
              {{ pageDescription }}
            </p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="gap-2 text-xs font-semibold" @click="goBack">
              <ArrowLeft class="w-4 h-4" />
              Tillbaka
            </Button>
            <Button
              size="sm"
              :disabled="loading"
              class="gap-2 text-xs font-semibold"
              @click="saveBoat"
            >
              <Save class="w-4 h-4" />
              {{ loading ? 'Sparar...' : 'Spara' }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p class="text-muted-foreground">Laddar båt...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="boatError && !isNew" class="flex items-center justify-center py-12">
      <div class="text-center">
        <p class="text-destructive mb-2">Ett fel uppstod vid laddning av båt</p>
        <Button variant="outline" @click="goBack">Tillbaka till båtar</Button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="px-6 py-6">
      <!-- Form -->
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <form class="space-y-4" @submit.prevent="saveBoat">
          <!-- Grundläggande information -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Grundläggande information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label for="boatType" class="block text-xs font-medium text-gray-700 mb-1">
                  Båttyp *
                </label>
                <Input
                  id="boatType"
                  v-model="form.boatType"
                  placeholder="t.ex. Segelbåt, Motorbåt, Kajak"
                  size="sm"
                  class="text-xs"
                  required
                />
              </div>

              <div>
                <label for="customer" class="block text-xs font-medium text-gray-700 mb-1">
                  Kund *
                </label>
                <Select v-model="form.customerId" required>
                  <SelectTrigger size="sm" class="text-xs">
                    <SelectValue placeholder="Välj kund" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="customer in customers"
                      :key="customer.CustomerID"
                      :value="customer.CustomerID.toString()"
                    >
                      {{ customer.CompanyName }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Mått -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Mått</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label for="length" class="block text-xs font-medium text-gray-700 mb-1">
                  Längd (m)
                </label>
                <Input
                  id="length"
                  v-model.number="form.length"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  size="sm"
                  class="text-xs"
                />
              </div>

              <div>
                <label for="width" class="block text-xs font-medium text-gray-700 mb-1">
                  Bredd (m)
                </label>
                <Input
                  id="width"
                  v-model.number="form.width"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  size="sm"
                  class="text-xs"
                />
              </div>

              <div>
                <label for="safetyMargin" class="block text-xs font-medium text-gray-700 mb-1">
                  Säkerhetsmarginal (m)
                </label>
                <Input
                  id="safetyMargin"
                  v-model.number="form.safetyMargin"
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  size="sm"
                  class="text-xs"
                />
              </div>
            </div>
          </div>

          <!-- Båtsiluett -->
          <div v-if="form.length && form.width">
            <h3 class="text-sm font-medium text-gray-900 mb-3">Båtsiluett</h3>
            <div class="bg-gray-50 rounded-lg p-4">
              <div class="flex flex-col items-center space-y-3">
                <!-- Båtvisualisering -->
                <div class="relative flex flex-col items-center justify-center py-8">
                  <div class="relative flex items-center justify-center">
                    <!-- Säkerhetsmarginal SVG (bakgrund) -->
                    <img
                      v-if="form.safetyMargin && form.safetyMargin > 0"
                      src="/src/assets/images/Boat_safty.svg"
                      alt="Säkerhetsmarginal"
                      class="absolute"
                      :style="safetyMarginSvgStyle"
                    />

                    <!-- Huvudbåt SVG -->
                    <div class="relative">
                      <img
                        src="/src/assets/images/Boat_main.svg"
                        alt="Båt"
                        class="relative z-10"
                        :style="boatSvgStyle"
                      />

                      <!-- Båtdetaljer overlay -->
                      <div class="absolute inset-0 flex items-center justify-center z-20">
                        <div class="text-gray-800 text-xs font-medium text-center">
                          <div>{{ form.boatType || 'Båt' }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Måttlinjer -->
                  <div class="mt-4 flex justify-center">
                    <div class="text-xs text-gray-600 bg-white px-2 py-1 rounded border shadow-sm">
                      {{ form.length }}m × {{ form.width }}m
                      <span v-if="form.safetyMargin && form.safetyMargin > 0">
                        (+ {{ form.safetyMargin }}m marginal)
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Information -->
                <div class="text-center space-y-1">
                  <div class="text-xs text-gray-600">
                    <strong>Båtens mått:</strong>
                    {{ form.length }}m × {{ form.width }}m
                  </div>
                  <div
                    v-if="form.safetyMargin && form.safetyMargin > 0"
                    class="text-xs text-gray-600"
                  >
                    <strong>Med säkerhetsmarginal:</strong>
                    {{ totalLength }}m × {{ totalWidth }}m
                  </div>
                  <div class="text-xs text-gray-600">
                    <strong>Total yta:</strong>
                    {{ boatArea }} m²
                    <span v-if="form.safetyMargin && form.safetyMargin > 0">
                      ({{ totalArea }} m² med marginal)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Datum -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Datum</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label for="launchDate" class="block text-xs font-medium text-gray-700 mb-1">
                  Isättningsdatum
                </label>
                <Input
                  id="launchDate"
                  v-model="form.launchDate"
                  type="date"
                  size="sm"
                  class="text-xs"
                />
              </div>

              <div>
                <label for="haul_outDate" class="block text-xs font-medium text-gray-700 mb-1">
                  Upptagningsdatum
                </label>
                <Input
                  id="haul_outDate"
                  v-model="form.haul_outDate"
                  type="date"
                  size="sm"
                  class="text-xs"
                />
              </div>
            </div>
          </div>

          <!-- Placering -->
          <div>
            <h3 class="text-sm font-medium text-gray-900 mb-3">Placering</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label for="status" class="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select v-model="form.status">
                  <SelectTrigger size="sm" class="text-xs">
                    <SelectValue placeholder="Välj status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placed">Placerad</SelectItem>
                    <SelectItem value="unplaced">Oplacerad</SelectItem>
                    <SelectItem value="in-water">I sjön</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label for="location" class="block text-xs font-medium text-gray-700 mb-1">
                  Plats
                </label>
                <Select v-model="form.location">
                  <SelectTrigger size="sm" class="text-xs">
                    <SelectValue placeholder="Välj plats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brygga">Brygga</SelectItem>
                    <SelectItem value="lager">Lager</SelectItem>
                    <SelectItem value="both">Båda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Kommentarer -->
          <div>
            <label for="comments" class="block text-xs font-medium text-gray-700 mb-1">
              Kommentarer
            </label>
            <Textarea
              id="comments"
              v-model="form.comments"
              placeholder="Lägg till kommentarer om båten..."
              rows="2"
              class="text-xs"
            />
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
