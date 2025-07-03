<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Tooltip System Demo
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Standardiserat tooltip-system med shadcn/ui komponenter och Lucide-ikoner
        </p>
      </div>

      <!-- Quick Tooltips Section -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Quick Tooltips</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Info Tooltip -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Info Tooltip</h3>
            <QuickTooltip
              text="Detta är en informativ tooltip som ger användaren hjälpsam information"
            >
              <Button variant="outline" size="sm">
                <Info :size="16" class="mr-2" />
                Hover för info
              </Button>
            </QuickTooltip>
          </div>

          <!-- Warning Tooltip -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Warning Tooltip</h3>
            <QuickTooltip text="Varning! Denna åtgärd kan inte ångras" type="warning">
              <Button variant="outline" size="sm">
                <AlertTriangle :size="16" class="mr-2" />
                Hover för varning
              </Button>
            </QuickTooltip>
          </div>

          <!-- Error Tooltip -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Error Tooltip</h3>
            <QuickTooltip
              text="Ett fel uppstod. Kontrollera din inmatning och försök igen"
              type="error"
            >
              <Button variant="outline" size="sm">
                <AlertCircle :size="16" class="mr-2" />
                Hover för fel
              </Button>
            </QuickTooltip>
          </div>

          <!-- Success Tooltip -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Success Tooltip</h3>
            <QuickTooltip text="Åtgärden genomfördes framgångsrikt!" type="success">
              <Button variant="outline" size="sm">
                <CheckCircle :size="16" class="mr-2" />
                Hover för success
              </Button>
            </QuickTooltip>
          </div>

          <!-- Help Tooltip -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Help Tooltip</h3>
            <QuickTooltip text="Behöver du hjälp? Klicka här för mer information" type="help">
              <Button variant="outline" size="sm">
                <HelpCircle :size="16" class="mr-2" />
                Hover för hjälp
              </Button>
            </QuickTooltip>
          </div>

          <!-- Position Examples -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Positioner</h3>
            <div class="flex flex-wrap gap-2">
              <QuickTooltip text="Tooltip ovanför" position="top">
                <Button variant="ghost" size="sm">Top</Button>
              </QuickTooltip>
              <QuickTooltip text="Tooltip under" position="bottom">
                <Button variant="ghost" size="sm">Bottom</Button>
              </QuickTooltip>
              <QuickTooltip text="Tooltip till vänster" position="left">
                <Button variant="ghost" size="sm">Left</Button>
              </QuickTooltip>
              <QuickTooltip text="Tooltip till höger" position="right">
                <Button variant="ghost" size="sm">Right</Button>
              </QuickTooltip>
            </div>
          </div>
        </div>
      </section>

      <!-- Enhanced Tooltips Section -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          Enhanced Tooltips
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Default Enhanced Tooltip -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Standard Enhanced</h3>
            <EnhancedTooltip
              content="Detta är en förbättrad tooltip med ikon och bättre formatering för längre text som behöver mer utrymme"
              type="info"
              size="md"
            >
              <template #trigger>
                <Button variant="outline">
                  <Info :size="16" class="mr-2" />
                  Enhanced Tooltip
                </Button>
              </template>
            </EnhancedTooltip>
          </div>

          <!-- Custom Content Tooltip -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Custom Content</h3>
            <EnhancedTooltip content="" type="help" size="lg">
              <template #trigger>
                <Button variant="outline">
                  <Lightbulb :size="16" class="mr-2" />
                  Custom Content
                </Button>
              </template>
              <template #content>
                <div class="space-y-2">
                  <h4 class="font-semibold text-purple-100">Pro Tips!</h4>
                  <ul class="text-sm space-y-1 text-purple-200">
                    <li>• Använd Ctrl+S för att spara</li>
                    <li>• Tryck Esc för att avbryta</li>
                    <li>• Hover för mer info</li>
                  </ul>
                </div>
              </template>
            </EnhancedTooltip>
          </div>
        </div>
      </section>

      <!-- Icon Button Examples -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          Ikon-knappar med Tooltips
        </h2>
        <div
          class="flex flex-wrap gap-4 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <!-- Save -->
          <QuickTooltip text="Spara dokument (Ctrl+S)">
            <Button variant="ghost" size="icon">
              <Save :size="18" />
            </Button>
          </QuickTooltip>

          <!-- Edit -->
          <QuickTooltip text="Redigera objekt">
            <Button variant="ghost" size="icon">
              <Edit :size="18" />
            </Button>
          </QuickTooltip>

          <!-- Delete -->
          <QuickTooltip text="Radera objekt (kan inte ångras)" type="error">
            <Button variant="ghost" size="icon">
              <Trash2 :size="18" />
            </Button>
          </QuickTooltip>

          <!-- Settings -->
          <QuickTooltip text="Öppna inställningar">
            <Button variant="ghost" size="icon">
              <Settings :size="18" />
            </Button>
          </QuickTooltip>

          <!-- Copy -->
          <QuickTooltip text="Kopiera till urklipp" type="success">
            <Button variant="ghost" size="icon">
              <Copy :size="18" />
            </Button>
          </QuickTooltip>

          <!-- Download -->
          <QuickTooltip text="Ladda ner fil">
            <Button variant="ghost" size="icon">
              <Download :size="18" />
            </Button>
          </QuickTooltip>

          <!-- Upload -->
          <QuickTooltip text="Ladda upp fil" type="info">
            <Button variant="ghost" size="icon">
              <Upload :size="18" />
            </Button>
          </QuickTooltip>

          <!-- Search -->
          <QuickTooltip text="Sök (Ctrl+F)">
            <Button variant="ghost" size="icon">
              <Search :size="18" />
            </Button>
          </QuickTooltip>
        </div>
      </section>

      <!-- Configuration Demo -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">Konfiguration</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Delay Inställningar</h3>
            <div class="space-y-3">
              <QuickTooltip text="Snabb tooltip (100ms delay)" :delay="100">
                <Button variant="outline" size="sm">Snabb (100ms)</Button>
              </QuickTooltip>
              <QuickTooltip text="Normal tooltip (200ms delay)" :delay="200">
                <Button variant="outline" size="sm">Normal (200ms)</Button>
              </QuickTooltip>
              <QuickTooltip text="Långsam tooltip (500ms delay)" :delay="500">
                <Button variant="outline" size="sm">Långsam (500ms)</Button>
              </QuickTooltip>
            </div>
          </div>

          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-3 text-gray-900 dark:text-gray-100">Storlekar</h3>
            <div class="space-y-3">
              <EnhancedTooltip content="Liten tooltip med kompakt text" size="sm">
                <template #trigger>
                  <Button variant="outline" size="sm">Liten (sm)</Button>
                </template>
              </EnhancedTooltip>

              <EnhancedTooltip
                content="Medium tooltip med normal textstorlek och spacing"
                size="md"
              >
                <template #trigger>
                  <Button variant="outline" size="sm">Medium (md)</Button>
                </template>
              </EnhancedTooltip>

              <EnhancedTooltip
                content="Stor tooltip med större text och generöst med whitespace för viktiga meddelanden"
                size="lg"
              >
                <template #trigger>
                  <Button variant="outline" size="sm">Stor (lg)</Button>
                </template>
              </EnhancedTooltip>
            </div>
          </div>
        </div>
      </section>

      <!-- Real Usage Examples -->
      <section class="mb-12">
        <h2 class="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
          Verkliga användningsfall
        </h2>
        <div class="space-y-6">
          <!-- Form with tooltips -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-4 text-gray-900 dark:text-gray-100">
              Formulär med hjälptext
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  E-postadress
                  <QuickTooltip
                    text="Ange en giltig e-postadress. Vi skickar aldrig spam!"
                    type="info"
                  >
                    <HelpCircle :size="14" class="text-gray-400 hover:text-gray-600" />
                  </QuickTooltip>
                </label>
                <input
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="din@email.com"
                />
              </div>

              <div>
                <label
                  class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Lösenord
                  <QuickTooltip
                    text="Minst 8 tecken, inkludera både bokstäver och siffror"
                    type="warning"
                  >
                    <AlertTriangle :size="14" class="text-yellow-500" />
                  </QuickTooltip>
                </label>
                <input
                  type="password"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <!-- Status indicators -->
          <div
            class="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <h3 class="font-medium mb-4 text-gray-900 dark:text-gray-100">Status-indikatorer</h3>
            <div class="flex flex-wrap gap-4">
              <QuickTooltip text="System körs normalt. Senast uppdaterad: 10:30" type="success">
                <div
                  class="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full"
                >
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  Online
                </div>
              </QuickTooltip>

              <QuickTooltip text="Uppdatering pågår. Beräknad tid: 5 minuter" type="warning">
                <div
                  class="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full"
                >
                  <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  Uppdaterar
                </div>
              </QuickTooltip>

              <QuickTooltip text="Anslutningsfel upptäckt. Försöker återansluta..." type="error">
                <div
                  class="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full"
                >
                  <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                  Offline
                </div>
              </QuickTooltip>
            </div>
          </div>
        </div>
      </section>

      <!-- Tooltip Stats -->
      <section class="mb-8">
        <div
          class="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <h3 class="font-medium mb-2 text-blue-900 dark:text-blue-100">Tooltip System Status</h3>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            Aktiva tooltips: {{ activeTooltipCount }} | Konfiguration:
            {{ tooltipConfig.defaultPosition }} position, {{ tooltipConfig.defaultDelay }}ms delay
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import QuickTooltip from '@/components/common/QuickTooltip.vue';
import EnhancedTooltip from '@/components/common/EnhancedTooltip.vue';
import { useTooltip } from '@/composables/useTooltip';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Edit,
  HelpCircle,
  Info,
  Lightbulb,
  Save,
  Search,
  Settings,
  Trash2,
  Upload,
} from 'lucide-vue-next';

const { config: tooltipConfig, getActiveTooltipCount } = useTooltip();

// Reactive stats
const activeTooltipCount = computed(() => getActiveTooltipCount());
</script>
