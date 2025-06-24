<script setup lang="ts">
import { computed, ref, watch } from 'vue';
// import { useRouter } from 'vue-router'
import PageLayout from '@/components/layout/PageLayout.vue';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  Check,
  Download,
  Eye,
  Loader2,
  Palette,
  RotateCcw,
  Save,
} from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Use API service and composables (prepared for future theme API integration)
import { useApiList } from '@/composables/useApi';
import _api from '@/api';

// Define theme type for API integration
interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
}

// Fetch themes using API services (mock implementation for now)
// TODO: Replace with actual theme API when available
const {
  data: _themesData, // Currently unused - will be used when theme API is implemented
  loading: themesLoading,
  error: themesError,
  refresh: refreshThemes,
} = useApiList<Theme>(() => Promise.resolve({ data: [], success: true }), {
  cacheKey: 'themes',
});

// Loading and error states
const isLoading = computed(() => themesLoading.value);
const hasError = computed(() => themesError.value !== null);

// Refresh function for error recovery
const handleRefresh = async () => {
  await refreshThemes();
};

// Standard themes (could be loaded from API in the future)
const standardThemes = ref([
  {
    id: 'stadsmission-blue',
    name: 'Stadsmission Blå',
    description: 'Klassisk blå färgpalett för Stadsmissionen',
    preview: '#2563eb',
    colors: {
      primary: '#2563eb',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'stadsmission-green',
    name: 'Stadsmission Grön',
    description: 'Naturinspirerad grön färgpalett',
    preview: '#059669',
    colors: {
      primary: '#059669',
      secondary: '#64748b',
      accent: '#10b981',
      background: '#ffffff',
      surface: '#f0fdf4',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#dcfce7',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'stadsmission-purple',
    name: 'Stadsmission Lila',
    description: 'Modern lila färgpalett',
    preview: '#7c3aed',
    colors: {
      primary: '#7c3aed',
      secondary: '#64748b',
      accent: '#a855f7',
      background: '#ffffff',
      surface: '#faf5ff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e9d5ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  {
    id: 'dark-mode',
    name: 'Mörkt tema',
    description: 'Mörk färgpalett för bättre synlighet',
    preview: '#1f2937',
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#60a5fa',
      background: '#111827',
      surface: '#1f2937',
      text: '#f9fafb',
      textMuted: '#9ca3af',
      border: '#374151',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
]);

// Current theme state
const currentTheme = ref('stadsmission-blue');
const customColors = ref({
  primary: '#2563eb',
  secondary: '#64748b',
  accent: '#0ea5e9',
  background: '#ffffff',
  surface: '#f8fafc',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
});

// Color definitions with descriptions
interface ColorDefinition {
  key: keyof typeof customColors.value;
  label: string;
  description: string;
  category: 'brand' | 'layout' | 'content' | 'status';
}

const colorDefinitions: ColorDefinition[] = [
  {
    key: 'primary',
    label: 'Primärfärg',
    description: 'Huvudfärg för knappar, länkar och viktiga element',
    category: 'brand',
  },
  {
    key: 'secondary',
    label: 'Sekundärfärg',
    description: 'Kompletterande färg för mindre viktiga element',
    category: 'brand',
  },
  {
    key: 'accent',
    label: 'Accentfärg',
    description: 'Färg för att framhäva specifika element',
    category: 'brand',
  },
  {
    key: 'background',
    label: 'Bakgrundsfärg',
    description: 'Huvudbakgrund för hela applikationen',
    category: 'layout',
  },
  {
    key: 'surface',
    label: 'Ytfärg',
    description: 'Bakgrund för kort, modaler och upphöjda element',
    category: 'layout',
  },
  {
    key: 'text',
    label: 'Textfärg',
    description: 'Huvudfärg för all text',
    category: 'content',
  },
  {
    key: 'textMuted',
    label: 'Dämpad textfärg',
    description: 'Färg för mindre viktig text och beskrivningar',
    category: 'content',
  },
  {
    key: 'border',
    label: 'Kantfärg',
    description: 'Färg för ramar och avgränsningar',
    category: 'layout',
  },
  {
    key: 'success',
    label: 'Framgångsfärg',
    description: 'Färg för positiva meddelanden och status',
    category: 'status',
  },
  {
    key: 'warning',
    label: 'Varningsfärg',
    description: 'Färg för varningar och uppmärksamhet',
    category: 'status',
  },
  {
    key: 'error',
    label: 'Felfärg',
    description: 'Färg för fel och negativa meddelanden',
    category: 'status',
  },
];

// Get current theme colors
const activeColors = computed(() => {
  if (currentTheme.value === 'custom') {
    return customColors.value;
  }
  const theme = standardThemes.value.find(t => t.id === currentTheme.value);
  return theme?.colors ?? standardThemes.value[0]?.colors ?? {};
});

// Apply theme to CSS variables
const applyTheme = (colors: Record<string, string>) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
};

// Watch for theme changes and apply them
watch(
  activeColors,
  newColors => {
    applyTheme(newColors);
  },
  { immediate: true }
);

// Theme actions
const selectStandardTheme = (themeId: string) => {
  currentTheme.value = themeId;
  if (themeId !== 'custom') {
    const theme = standardThemes.value.find(t => t.id === themeId);
    if (theme) {
      customColors.value = { ...theme.colors };
    }
  }
};

const switchToCustom = () => {
  currentTheme.value = 'custom';
};

const resetToDefault = () => {
  selectStandardTheme('stadsmission-blue');
};

const { success, error } = useToast();

const saveTheme = async () => {
  try {
    // TODO: Replace with actual API call when theme API is implemented
    // await _api.themes.save({
    //   id: currentTheme.value,
    //   colors: activeColors.value,
    // });

    // For now, save to localStorage
    localStorage.setItem(
      'stadsmission-theme',
      JSON.stringify({
        id: currentTheme.value,
        colors: activeColors.value,
      })
    );
    success('Tema sparat', 'Ditt anpassade tema har sparats framgångsrikt');
  } catch (e) {
    console.error('Failed to save theme:', e);
    error('Sparning misslyckades', 'Ett fel uppstod när temat skulle sparas');
  }
};

const exportTheme = () => {
  const themeData = {
    name: 'Anpassat tema',
    colors: activeColors.value,
    exportDate: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'stadsmission-tema.json';
  a.click();
  URL.revokeObjectURL(url);
};

// Group colors by category
const colorsByCategory = computed(() => {
  const categories: Record<string, ColorDefinition[]> = {
    brand: [],
    layout: [],
    content: [],
    status: [],
  };

  colorDefinitions.forEach(def => {
    categories[def.category]?.push(def);
  });

  return categories;
});

// Load saved theme on mount
const loadSavedTheme = () => {
  const saved = localStorage.getItem('stadsmission-theme');
  if (saved) {
    try {
      const themeData = JSON.parse(saved) as Record<string, unknown>;
      currentTheme.value = themeData['id'] as string;
      if (themeData['id'] === 'custom') {
        const colors = themeData['colors'] as Record<string, string>;
        if (colors && typeof colors === 'object') {
          customColors.value = {
            primary: colors['primary'] ?? '#3b82f6',
            secondary: colors['secondary'] ?? '#64748b',
            accent: colors['accent'] ?? '#8b5cf6',
            background: colors['background'] ?? '#ffffff',
            surface: colors['surface'] ?? '#f8fafc',
            text: colors['text'] ?? '#1e293b',
            textMuted: colors['textMuted'] ?? '#64748b',
            border: colors['border'] ?? '#e2e8f0',
            success: colors['success'] ?? '#10b981',
            warning: colors['warning'] ?? '#f59e0b',
            error: colors['error'] ?? '#ef4444',
          };
        }
      }
    } catch (e) {
      console.error('Failed to load saved theme:', e);
    }
  }
};

// Initialize
loadSavedTheme();
</script>

<template>
  <PageLayout
    title="Temahantering"
    breadcrumbs="Dashboard / Administration / Inställningar / Teman"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center space-y-4">
        <Loader2 class="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p class="text-muted-foreground">Laddar temainställningar...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center space-y-4">
        <AlertCircle class="h-8 w-8 mx-auto text-destructive" />
        <div>
          <h3 class="font-semibold text-lg mb-2">Kunde inte ladda temainställningar</h3>
          <p class="text-muted-foreground mb-4">
            Ett fel uppstod när temainställningarna skulle hämtas.
          </p>
          <Button class="gap-2" @click="handleRefresh">
            <Loader2 class="h-4 w-4" />
            Försök igen
          </Button>
        </div>
      </div>
    </div>

    <div v-else class="max-w-7xl mx-auto space-y-6">
      <!-- Header Actions -->
      <div class="flex justify-between items-center px-6">
        <div>
          <h2 class="text-lg font-semibold">Anpassa utseende och färger</h2>
          <p class="text-sm text-muted-foreground">Välj ett standardtema eller skapa ditt eget</p>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" class="gap-2" @click="exportTheme">
            <Download class="h-4 w-4" />
            Exportera
          </Button>
          <Button variant="outline" class="gap-2" @click="resetToDefault">
            <RotateCcw class="h-4 w-4" />
            Återställ
          </Button>
          <Button class="gap-2" @click="saveTheme">
            <Save class="h-4 w-4" />
            Spara tema
          </Button>
        </div>
      </div>

      <Tabs default-value="themes" class="w-full">
        <TabsList class="mx-6">
          <TabsTrigger value="themes">Standardteman</TabsTrigger>
          <TabsTrigger value="custom">Anpassa färger</TabsTrigger>
          <TabsTrigger value="preview">Förhandsgranskning</TabsTrigger>
        </TabsList>

        <!-- Standard Themes Tab -->
        <TabsContent value="themes" class="space-y-6">
          <Card class="mx-6">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Palette class="h-5 w-5" />
                Välj standardtema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  v-for="theme in standardThemes"
                  :key="theme.id"
                  class="relative cursor-pointer group"
                  @click="selectStandardTheme(theme.id)"
                >
                  <div
                    class="border-2 rounded-lg p-4 transition-all"
                    :class="
                      currentTheme === theme.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    "
                  >
                    <!-- Theme preview -->
                    <div class="flex items-center gap-3 mb-3">
                      <div
                        class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        :style="{ backgroundColor: theme.preview }"
                      />
                      <div class="flex-1">
                        <h3 class="font-medium text-sm">
                          {{ theme.name }}
                        </h3>
                        <p class="text-xs text-muted-foreground">
                          {{ theme.description }}
                        </p>
                      </div>
                      <Check v-if="currentTheme === theme.id" class="h-5 w-5 text-primary" />
                    </div>

                    <!-- Color palette preview -->
                    <div class="flex gap-1">
                      <div
                        v-for="(color, key) in theme.colors"
                        :key="key"
                        class="w-4 h-4 rounded border border-white/50"
                        :style="{ backgroundColor: color }"
                        :title="key"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Custom Colors Tab -->
        <TabsContent value="custom" class="space-y-6">
          <div class="mx-6 space-y-6">
            <!-- Brand Colors -->
            <Card>
              <CardHeader>
                <CardTitle>Varumärkesfärger</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    v-for="colorDef in colorsByCategory['brand']"
                    :key="colorDef.key"
                    class="space-y-2"
                  >
                    <Label :for="colorDef.key">{{ colorDef.label }}</Label>
                    <div class="flex gap-2">
                      <Input
                        :id="colorDef.key"
                        v-model="customColors[colorDef.key]"
                        type="color"
                        class="w-16 h-10 p-1 cursor-pointer"
                        @input="switchToCustom"
                      />
                      <Input
                        v-model="customColors[colorDef.key]"
                        type="text"
                        class="flex-1 font-mono text-sm"
                        @input="switchToCustom"
                      />
                    </div>
                    <p class="text-xs text-muted-foreground">
                      {{ colorDef.description }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Layout Colors -->
            <Card>
              <CardHeader>
                <CardTitle>Layout och bakgrunder</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    v-for="colorDef in colorsByCategory['layout']"
                    :key="colorDef.key"
                    class="space-y-2"
                  >
                    <Label :for="colorDef.key">{{ colorDef.label }}</Label>
                    <div class="flex gap-2">
                      <Input
                        :id="colorDef.key"
                        v-model="customColors[colorDef.key]"
                        type="color"
                        class="w-16 h-10 p-1 cursor-pointer"
                        @input="switchToCustom"
                      />
                      <Input
                        v-model="customColors[colorDef.key]"
                        type="text"
                        class="flex-1 font-mono text-sm"
                        @input="switchToCustom"
                      />
                    </div>
                    <p class="text-xs text-muted-foreground">
                      {{ colorDef.description }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Content Colors -->
            <Card>
              <CardHeader>
                <CardTitle>Text och innehåll</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    v-for="colorDef in colorsByCategory['content']"
                    :key="colorDef.key"
                    class="space-y-2"
                  >
                    <Label :for="colorDef.key">{{ colorDef.label }}</Label>
                    <div class="flex gap-2">
                      <Input
                        :id="colorDef.key"
                        v-model="customColors[colorDef.key]"
                        type="color"
                        class="w-16 h-10 p-1 cursor-pointer"
                        @input="switchToCustom"
                      />
                      <Input
                        v-model="customColors[colorDef.key]"
                        type="text"
                        class="flex-1 font-mono text-sm"
                        @input="switchToCustom"
                      />
                    </div>
                    <p class="text-xs text-muted-foreground">
                      {{ colorDef.description }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Status Colors -->
            <Card>
              <CardHeader>
                <CardTitle>Status och meddelanden</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    v-for="colorDef in colorsByCategory['status']"
                    :key="colorDef.key"
                    class="space-y-2"
                  >
                    <Label :for="colorDef.key">{{ colorDef.label }}</Label>
                    <div class="flex gap-2">
                      <Input
                        :id="colorDef.key"
                        v-model="customColors[colorDef.key]"
                        type="color"
                        class="w-16 h-10 p-1 cursor-pointer"
                        @input="switchToCustom"
                      />
                      <Input
                        v-model="customColors[colorDef.key]"
                        type="text"
                        class="flex-1 font-mono text-sm"
                        @input="switchToCustom"
                      />
                    </div>
                    <p class="text-xs text-muted-foreground">
                      {{ colorDef.description }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <!-- Preview Tab -->
        <TabsContent value="preview" class="space-y-6">
          <div class="mx-6 space-y-6">
            <!-- UI Elements Preview -->
            <Card>
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <Eye class="h-5 w-5" />
                  Förhandsgranskning av UI-element
                </CardTitle>
              </CardHeader>
              <CardContent class="space-y-8">
                <!-- Buttons -->
                <div class="space-y-4">
                  <h3 class="font-medium">Knappar</h3>
                  <div class="flex flex-wrap gap-3">
                    <Button>Primär knapp</Button>
                    <Button variant="secondary">Sekundär knapp</Button>
                    <Button variant="outline">Outline knapp</Button>
                    <Button variant="ghost">Ghost knapp</Button>
                    <Button variant="destructive">Destructive knapp</Button>
                  </div>
                </div>

                <Separator />

                <!-- Badges -->
                <div class="space-y-4">
                  <h3 class="font-medium">Badges och status</h3>
                  <div class="flex flex-wrap gap-3">
                    <Badge>Standard badge</Badge>
                    <Badge variant="secondary">Sekundär badge</Badge>
                    <Badge variant="outline">Outline badge</Badge>
                    <Badge variant="destructive">Destructive badge</Badge>
                  </div>
                </div>

                <Separator />

                <!-- Cards -->
                <div class="space-y-4">
                  <h3 class="font-medium">Kort och ytor</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Exempelkort</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p class="text-sm text-muted-foreground">
                          Detta är ett exempel på hur kort ser ut med det valda temat.
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Statistik</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div class="text-2xl font-bold">1,234</div>
                        <p class="text-xs text-muted-foreground">Totalt antal</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Status</CardTitle>
                      </CardHeader>
                      <CardContent class="space-y-2">
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full bg-green-500" />
                          <span class="text-sm">Aktiv</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full bg-yellow-500" />
                          <span class="text-sm">Väntar</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <!-- Form Elements -->
                <div class="space-y-4">
                  <h3 class="font-medium">Formulärelement</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <Label>Textfält</Label>
                      <Input placeholder="Skriv något här..." />
                    </div>
                    <div class="space-y-2">
                      <Label>Switch</Label>
                      <div class="flex items-center gap-2">
                        <Switch />
                        <span class="text-sm">Aktivera funktion</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <!-- Text Examples -->
                <div class="space-y-4">
                  <h3 class="font-medium">Textexempel</h3>
                  <div class="space-y-2">
                    <h1 class="text-2xl font-bold">Huvudrubrik (H1)</h1>
                    <h2 class="text-xl font-semibold">Underrubrik (H2)</h2>
                    <h3 class="text-lg font-medium">Mindre rubrik (H3)</h3>
                    <p class="text-base">Normal brödtext med standardfärg.</p>
                    <p class="text-sm text-muted-foreground">
                      Mindre text med dämpad färg för beskrivningar.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </PageLayout>
</template>

<style lang="scss" scoped>
/* Custom styles for theme preview */
.theme-preview {
  transition: all 0.2s ease-in-out;
}

.theme-preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
