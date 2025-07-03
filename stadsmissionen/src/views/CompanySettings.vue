<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DetailPage from '@/components/shared/DetailPage.vue';
import { Building2, FileText, Globe, Mail, MapPin, Phone, Settings } from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Import company data
import companiesData from '@/assets/data/companies.json';

const { unsavedChanges, success } = useToast();

// State
const company = ref<any>(null);
const hasUnsavedChanges = ref(false);
const loading = ref(false);

// Get company data (assuming first/only company in array is the current company)
const companyData = computed(() => {
  return companiesData[0] || null;
});

// Form fields for main content
const mainFields = [
  { key: 'display_name', label: 'Visningsnamn', type: 'text' as const },
  { key: 'legal_name', label: 'Juridiskt namn', type: 'text' as const },
  { key: 'org_number', label: 'Organisationsnummer', type: 'text' as const },
  { key: 'vat_number', label: 'Momsregistreringsnummer', type: 'text' as const },
  { key: 'business_description', label: 'Verksamhetsbeskrivning', type: 'textarea' as const },
  { key: 'founded_year', label: 'Grundat år', type: 'number' as const },
  { key: 'invoice_prefix', label: 'Fakturaprefix', type: 'text' as const },
  {
    key: 'default_currency',
    label: 'Standardvaluta',
    type: 'select' as const,
    options: [
      { value: 'SEK', label: 'SEK - Svenska kronor' },
      { value: 'EUR', label: 'EUR - Euro' },
      { value: 'USD', label: 'USD - US Dollar' },
      { value: 'NOK', label: 'NOK - Norska kronor' },
      { value: 'DKK', label: 'DKK - Danska kronor' },
    ],
  },
  {
    key: 'timezone',
    label: 'Tidszon',
    type: 'select' as const,
    options: [
      { value: 'Europe/Stockholm', label: 'Europa/Stockholm (CET/CEST)' },
      { value: 'Europe/Oslo', label: 'Europa/Oslo (CET/CEST)' },
      { value: 'Europe/Copenhagen', label: 'Europa/Köpenhamn (CET/CEST)' },
      { value: 'UTC', label: 'UTC (Koordinerad universell tid)' },
    ],
  },
  { key: 'business_hours', label: 'Öppettider', type: 'text' as const },
];

// Sidebar fields for contact and address info
const sidebarFields = [
  { key: 'logo_url', label: 'Logotyp URL', type: 'text' as const },
  { key: 'website', label: 'Webbplats', type: 'text' as const },
  { key: 'contact_email', label: 'Kontakt e-post', type: 'text' as const },
  { key: 'contact_phone', label: 'Kontakt telefon', type: 'text' as const },
  { key: 'street', label: 'Gatuadress', type: 'text' as const },
  { key: 'postal_code', label: 'Postnummer', type: 'text' as const },
  { key: 'city', label: 'Stad', type: 'text' as const },
  { key: 'country', label: 'Land', type: 'text' as const },
  { key: 'latitude', label: 'Latitud', type: 'number' as const },
  { key: 'longitude', label: 'Longitud', type: 'number' as const },
  { key: 'created_at', label: 'Skapad', type: 'date' as const },
  { key: 'updated_at', label: 'Uppdaterad', type: 'date' as const },
];

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Start', to: '/home' },
  { label: 'Inställningar', to: '/settings' },
  { label: 'Företagsinställningar', to: '', isCurrentPage: true },
]);

// Stats
const stats = computed(() => [
  {
    label: 'Grundat år',
    value: company.value?.founded_year?.toString() || '-',
    icon: Building2,
  },
  {
    label: 'Organisationsnummer',
    value: company.value?.org_number || '-',
    icon: FileText,
  },
  {
    label: 'Standardvaluta',
    value: company.value?.default_currency || '-',
    icon: Globe,
  },
  {
    label: 'Tidszon',
    value: company.value?.timezone || '-',
    icon: Settings,
  },
]);

// Initialize company data
onMounted(() => {
  if (companyData.value) {
    company.value = { ...companyData.value };
  } else {
    // No company data found
    console.error('Ingen företagsinformation hittades');
  }
});

// Event handlers
const handleSave = () => {
  console.log('Spara företagsinställningar:', company.value);

  // Here you would typically save to API
  // For now, we'll just show a success message
  success('Företagsinställningar sparade', 'Inställningarna har uppdaterats framgångsrikt');
  hasUnsavedChanges.value = false;

  // Update the updated_at timestamp
  if (company.value) {
    company.value.updated_at = new Date().toISOString();
  }
};

const handleBack = () => {
  const navigateBack = () => {
    // Go back to settings or home
    window.history.length > 1 ? window.history.back() : (window.location.href = '/settings');
  };

  if (hasUnsavedChanges.value) {
    unsavedChanges(
      () => {
        // Save first, then navigate
        handleSave();
        navigateBack();
      },
      () => {
        // Ignore changes and navigate
        navigateBack();
      }
    );
  } else {
    navigateBack();
  }
};

const handleDiscardChanges = () => {
  if (companyData.value) {
    company.value = { ...companyData.value };
    hasUnsavedChanges.value = false;
  }
};

const handleFieldChange = (key: string, value: unknown) => {
  if (company.value) {
    company.value[key] = value;
    hasUnsavedChanges.value = true;

    // If logo URL is changed, emit event for header update
    if (key === 'logo_url') {
      // We could emit a global event here or use a store
      // For now, we'll store in localStorage for the header to pick up
      localStorage.setItem('company_logo_url', value as string);
      window.dispatchEvent(new CustomEvent('company-logo-updated', { detail: value }));
    }
  }
};
</script>

<template>
  <div v-if="company">
    <DetailPage
      :title="`Företagsinställningar: ${company.display_name}`"
      :data="company"
      :readonly="false"
      :has-unsaved-changes="hasUnsavedChanges"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
      :main-fields="mainFields"
      :sidebar-fields="sidebarFields"
      @save="handleSave"
      @back="handleBack"
      @discard-changes="handleDiscardChanges"
      @field-change="handleFieldChange"
    >
      <!-- Custom main content slot with additional company info -->
      <template #main-content="{ data, readonly }">
        <!-- Company Basic Info -->
        <div class="bg-background rounded-lg border p-4 mb-4">
          <h3 class="text-sm font-semibold flex items-center text-foreground/80 mb-3 gap-2">
            <Building2 class="h-4 w-4" />
            Grundläggande företagsinformation
          </h3>

          <!-- Logo Preview -->
          <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <label class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 block">
              Logotyp förhandsvisning
            </label>
            <div class="flex items-center gap-3">
              <div
                class="w-16 h-16 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center overflow-hidden"
              >
                <img
                  v-if="data.logo_url"
                  :src="data.logo_url"
                  :alt="`${data.display_name} logotyp`"
                  class="max-w-full max-h-full object-contain"
                  @error="$event.target.style.display = 'none'"
                />
                <Building2 v-else class="h-8 w-8 text-gray-400" />
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400">
                <p v-if="data.logo_url">Logotyp laddad från: {{ data.logo_url }}</p>
                <p v-else>Ingen logotyp inställd</p>
                <p class="text-blue-600 dark:text-blue-400 mt-1">
                  💡 Logotypen används automatiskt i navigationens header
                </p>
              </div>
            </div>
          </div>

          <!-- Form fields grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 gap-x-4">
            <div v-for="field in mainFields" :key="field.key" class="space-y-1">
              <label class="text-[10px] font-medium text-foreground/80">{{ field.label }}</label>
              <input
                v-if="field.type === 'text'"
                :value="(data[field.key] ?? '').toString()"
                :readonly="readonly"
                class="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @input="handleFieldChange(field.key, ($event.target as HTMLInputElement).value)"
              />
              <input
                v-else-if="field.type === 'number'"
                :value="Number(data[field.key] ?? 0)"
                :readonly="readonly"
                type="number"
                class="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @input="
                  handleFieldChange(field.key, Number(($event.target as HTMLInputElement).value))
                "
              />
              <textarea
                v-else-if="field.type === 'textarea'"
                :value="(data[field.key] ?? '').toString()"
                :readonly="readonly"
                rows="3"
                class="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @input="handleFieldChange(field.key, ($event.target as HTMLTextAreaElement).value)"
              />
              <select
                v-else-if="field.type === 'select'"
                :value="data[field.key]"
                :disabled="readonly"
                class="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @change="handleFieldChange(field.key, ($event.target as HTMLSelectElement).value)"
              >
                <option value="">Välj alternativ...</option>
                <option v-for="option in field.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="bg-background rounded-lg border p-4">
          <h3 class="text-sm font-semibold flex items-center text-foreground/80 mb-3 gap-2">
            <Phone class="h-4 w-4" />
            Kontakt- och adressinformation
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 gap-x-4">
            <div class="space-y-1">
              <label class="text-[10px] font-medium text-foreground/80">Kontakt e-post</label>
              <input
                :value="(data.contact_email ?? '').toString()"
                :readonly="readonly"
                type="email"
                class="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @input="
                  handleFieldChange('contact_email', ($event.target as HTMLInputElement).value)
                "
              />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-medium text-foreground/80">Kontakt telefon</label>
              <input
                :value="(data.contact_phone ?? '').toString()"
                :readonly="readonly"
                type="tel"
                class="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @input="
                  handleFieldChange('contact_phone', ($event.target as HTMLInputElement).value)
                "
              />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-medium text-foreground/80">Webbplats</label>
              <input
                :value="(data.website ?? '').toString()"
                :readonly="readonly"
                type="url"
                class="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @input="handleFieldChange('website', ($event.target as HTMLInputElement).value)"
              />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-medium text-foreground/80">Logotyp URL</label>
              <input
                :value="(data.logo_url ?? '').toString()"
                :readonly="readonly"
                type="url"
                placeholder="https://example.com/logo.png"
                class="w-full h-8 px-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                @input="handleFieldChange('logo_url', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
      </template>

      <!-- Custom sidebar content -->
      <template #sidebar-content="{ data }">
        <!-- Address Information -->
        <div class="bg-background rounded-lg border p-4 mb-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-foreground">
            <MapPin class="h-4 w-4" />
            Adressinformation
          </h3>

          <div class="space-y-2 text-xs">
            <div>
              <span class="text-secondary-foreground font-medium">Gatuadress:</span>
              <p class="text-secondary-foreground">{{ data.street || '-' }}</p>
            </div>
            <div>
              <span class="text-secondary-foreground font-medium">Postnummer:</span>
              <p class="text-secondary-foreground">{{ data.postal_code || '-' }}</p>
            </div>
            <div>
              <span class="text-secondary-foreground font-medium">Stad:</span>
              <p class="text-secondary-foreground">{{ data.city || '-' }}</p>
            </div>
            <div>
              <span class="text-secondary-foreground font-medium">Land:</span>
              <p class="text-secondary-foreground">{{ data.country || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- Technical Information -->
        <div class="bg-background rounded-lg border p-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2 text-secondary-foreground">
            <Settings class="h-4 w-4" />
            Teknisk information
          </h3>

          <div class="space-y-2 text-xs">
            <div>
              <span class="text-secondary-foreground font-medium">Latitud:</span>
              <p class="text-secondary-foreground">{{ data.latitude || '-' }}</p>
            </div>
            <div>
              <span class="text-secondary-foreground font-medium">Longitud:</span>
              <p class="text-secondary-foreground">{{ data.longitude || '-' }}</p>
            </div>
            <div>
              <span class="text-secondary-foreground font-medium">Skapad:</span>
              <p class="text-secondary-foreground">
                {{ data.created_at ? new Date(data.created_at).toLocaleDateString('sv-SE') : '-' }}
              </p>
            </div>
            <div>
              <span class="text-secondary-foreground font-medium">Uppdaterad:</span>
              <p class="text-secondary-foreground">
                {{ data.updated_at ? new Date(data.updated_at).toLocaleDateString('sv-SE') : '-' }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </DetailPage>
  </div>
  <div v-else class="flex items-center justify-center h-64">
    <p class="text-gray-500">Företagsinformation kunde inte laddas</p>
  </div>
</template>
