# Tooltip System Documentation

Standardiserat tooltip-system för Stadsmissionen applikationen, byggt med
shadcn/ui och Lucide-ikoner.

## 📍 Översikt

Tooltip-systemet ger en enhetlig och elegant måltipsfunktionalitet genom hela
applikationen. Det är byggt med Vue 3, TypeScript och shadcn/ui komponenter för
att säkerställa konsistens och användarvänlighet.

## 🏗️ Arkitektur

### Komponenter

```
src/
├── composables/
│   └── useTooltip.ts           # Tooltip composable med konfiguration
├── components/
│   └── common/
│       ├── EnhancedTooltip.vue # Avancerad tooltip med ikoner och custom content
│       └── QuickTooltip.vue    # Enkel tooltip för snabb användning
└── views/
    └── TooltipDemo.vue         # Demo-sida med exempel
```

### Navigation

Tooltip-systemet kan nås via:

- **URL**: `/tooltip-demo`
- **Navigation**: Development → Komponenter → Tooltip System
- **Ikon**: MessageCircle (Lucide)

## 🚀 Snabbstart

### 1. Quick Tooltip (Enkel användning)

```vue
<template>
  <QuickTooltip text="Detta är en hjälpsam tooltip">
    <Button>Hover mig</Button>
  </QuickTooltip>
</template>

<script setup>
  import QuickTooltip from '@/components/common/QuickTooltip.vue';
  import { Button } from '@/components/ui/button';
</script>
```

### 2. Enhanced Tooltip (Avancerad användning)

```vue
<template>
  <EnhancedTooltip
    content="Mer detaljerad information med ikoner"
    type="info"
    size="md"
    position="top"
  >
    <template #trigger>
      <Button>
        <Info :size="16" class="mr-2" />
        Avancerad Tooltip
      </Button>
    </template>
  </EnhancedTooltip>
</template>

<script setup>
  import EnhancedTooltip from '@/components/common/EnhancedTooltip.vue';
  import { Button } from '@/components/ui/button';
  import { Info } from 'lucide-vue-next';
</script>
```

## 📋 API Referens

### QuickTooltip Props

| Prop       | Typ           | Default  | Beskrivning                                                           |
| ---------- | ------------- | -------- | --------------------------------------------------------------------- |
| `text`     | `string`      | -        | Tooltip-texten som visas                                              |
| `type`     | `TooltipType` | `'info'` | Tooltip-typ (`'info'`, `'warning'`, `'error'`, `'success'`, `'help'`) |
| `position` | `Position`    | `'top'`  | Position (`'top'`, `'bottom'`, `'left'`, `'right'`)                   |
| `delay`    | `number`      | `200`    | Delay innan tooltip visas (ms)                                        |
| `disabled` | `boolean`     | `false`  | Inaktivera tooltip                                                    |

### EnhancedTooltip Props

| Prop          | Typ           | Default   | Beskrivning                          |
| ------------- | ------------- | --------- | ------------------------------------ |
| `content`     | `string`      | -         | Tooltip-innehåll                     |
| `type`        | `TooltipType` | `'info'`  | Tooltip-typ med färgschema           |
| `position`    | `Position`    | `'top'`   | Position relativt trigger            |
| `size`        | `TooltipSize` | `'md'`    | Storlek (`'sm'`, `'md'`, `'lg'`)     |
| `delay`       | `number`      | `200`     | Delay innan visning                  |
| `showArrow`   | `boolean`     | `true`    | Visa pil mot trigger                 |
| `maxWidth`    | `string`      | `'280px'` | Max bredd på tooltip                 |
| `interactive` | `boolean`     | `false`   | Låt användare interagera med tooltip |
| `disabled`    | `boolean`     | `false`   | Inaktivera tooltip                   |

### Tooltip Typer

```typescript
type TooltipType = 'info' | 'warning' | 'error' | 'success' | 'help';
```

#### Typ-specifika färgscheman:

- **info**: Blå - för allmän information
- **warning**: Gul - för varningar
- **error**: Röd - för fel och kritiska meddelanden
- **success**: Grön - för framgångsrika åtgärder
- **help**: Lila - för hjälp och vägledning

## 🎨 Styling och Teman

### Mörkt/Ljust tema stöd

Tooltip-systemet stöder automatiskt mörkt och ljust tema:

```css
/* Ljust tema */
.tooltip-info {
  background: rgb(239 246 255); /* blue-50 */
  color: rgb(30 58 138); /* blue-900 */
  border: rgb(191 219 254); /* blue-200 */
}

/* Mörkt tema */
.dark .tooltip-info {
  background: rgb(23 37 84); /* blue-950 */
  color: rgb(219 234 254); /* blue-100 */
  border: rgb(30 64 175); /* blue-800 */
}
```

### Anpassade stilar

```vue
<EnhancedTooltip
  content="Custom tooltip"
  max-width="400px"
  :class="['custom-tooltip-class']"
>
  <template #trigger>
    <Button>Custom Style</Button>
  </template>
</EnhancedTooltip>
```

## 🔧 Konfiguration

### Global konfiguration

```typescript
import { useTooltip } from '@/composables/useTooltip';

const { setConfig } = useTooltip();

// Ändra globala inställningar
setConfig({
  defaultPosition: 'bottom',
  defaultDelay: 300,
  defaultSize: 'lg',
  showArrowByDefault: false,
  maxWidth: '300px',
});
```

### useTooltip Composable

```typescript
const {
  // Konfiguration
  config,
  setConfig,
  resetConfig,

  // Tooltip management
  generateTooltipId,
  createTooltipOptions,
  getTooltipClasses,

  // State tracking
  registerTooltip,
  unregisterTooltip,
  activeTooltips,

  // Utilities
  closeAllTooltips,
  getActiveTooltipCount,

  // Helper methods
  createInfoTooltip,
  createWarningTooltip,
  createErrorTooltip,
  createSuccessTooltip,
  createHelpTooltip,
} = useTooltip();
```

## 💡 Användningsexempel

### 1. Ikon-knappar med tooltips

```vue
<template>
  <div class="toolbar">
    <QuickTooltip text="Spara dokument (Ctrl+S)">
      <Button variant="ghost" size="icon">
        <Save :size="18" />
      </Button>
    </QuickTooltip>

    <QuickTooltip text="Radera objekt (kan inte ångras)" type="error">
      <Button variant="ghost" size="icon">
        <Trash2 :size="18" />
      </Button>
    </QuickTooltip>
  </div>
</template>
```

### 2. Formulär med hjälptext

```vue
<template>
  <div class="form-field">
    <label class="flex items-center gap-2">
      E-postadress
      <QuickTooltip
        text="Ange en giltig e-postadress. Vi skickar aldrig spam!"
        type="info"
      >
        <HelpCircle :size="14" class="text-gray-400" />
      </QuickTooltip>
    </label>
    <input type="email" />
  </div>
</template>
```

### 3. Status-indikatorer

```vue
<template>
  <QuickTooltip
    text="System körs normalt. Senast uppdaterad: 10:30"
    type="success"
  >
    <div class="status-indicator online">
      <div class="status-dot"></div>
      Online
    </div>
  </QuickTooltip>
</template>
```

### 4. Custom innehåll

```vue
<template>
  <EnhancedTooltip content="" type="help" size="lg">
    <template #trigger>
      <Button>Pro Tips</Button>
    </template>
    <template #content>
      <div class="space-y-2">
        <h4 class="font-semibold">Genvägar:</h4>
        <ul class="text-sm space-y-1">
          <li>• Ctrl+S för att spara</li>
          <li>• Esc för att avbryta</li>
          <li>• Ctrl+F för att söka</li>
        </ul>
      </div>
    </template>
  </EnhancedTooltip>
</template>
```

## 🎯 Bästa praxis

### 1. Tooltip-text

- **Var koncis**: Håll texten kort och informativ
- **Var specifik**: Förklara vad som händer eller vad användaren kan förvänta
  sig
- **Använd aktiv röst**: "Spara dokument" istället för "Dokumentet sparas"
- **Inkludera genvägar**: "(Ctrl+S)" för tangentbordsgenvägar

### 2. Positionering

- **Använd 'top' som standard** för de flesta fall
- **Använd 'bottom'** för element nära toppen av skärmen
- **Använd 'left'/'right'** för sidebar-element eller när vertikalt utrymme är
  begränsat

### 3. Typ-val

- **info**: Allmän information, instruktioner
- **warning**: Varningar, viktiga meddelanden
- **error**: Fel, destruktiva åtgärder
- **success**: Bekräftelser, framgångsrika åtgärder
- **help**: Hjälp, tips, vägledning

### 4. Performance

- **Använd QuickTooltip** för enkla text-tooltips
- **Använd EnhancedTooltip** endast när du behöver ikoner eller custom innehåll
- **Aktivera 'interactive'** endast när nödvändigt
- **Sätt rimliga delays** (100-500ms)

## 🔍 Felsökning

### Vanliga problem

1. **Tooltip visas inte**
   - Kontrollera att `disabled` inte är `true`
   - Verifiera att `text` eller `content` är satt
   - Se till att trigger-elementet tar mouse events

2. **Styling fungerar inte**
   - Kontrollera att Tailwind CSS är korrekt konfigurerat
   - Verifiera att dark mode-klasser fungerar
   - Se till att z-index inte blockeras

3. **Performance-problem**
   - Minska antalet aktiva tooltips
   - Öka delay för att minska "flicker"
   - Använd `closeAllTooltips()` vid route-changes

### Debug-information

```vue
<template>
  <div>
    <p>Aktiva tooltips: {{ activeTooltipCount }}</p>
    <p>Konfiguration: {{ JSON.stringify(tooltipConfig) }}</p>
  </div>
</template>

<script setup>
  import { useTooltip } from '@/composables/useTooltip';

  const { config: tooltipConfig, getActiveTooltipCount } = useTooltip();
  const activeTooltipCount = computed(() => getActiveTooltipCount());
</script>
```

## 📦 Dependencies

- `vue` (^3.x)
- `@vueuse/core`
- `reka-ui` (shadcn/ui för Vue)
- `lucide-vue-next`
- `tailwindcss`

## 🔄 Versionshistorik

### v1.0.0

- Initial release
- QuickTooltip och EnhancedTooltip komponenter
- useTooltip composable
- Stöd för 5 tooltip-typer
- Mörkt/ljust tema-stöd
- Demo-sida med exempel

---

## 🤝 Bidrag

För att bidra till tooltip-systemet:

1. Testa dina ändringar på `/tooltip-demo`
2. Uppdatera denna dokumentation vid behov
3. Se till att alla tooltip-typer fungerar i både ljust och mörkt tema
4. Testa med keyboard navigation och skärmläsare för tillgänglighet

---

**Senast uppdaterad**: 2025-01-27 **Version**: 1.0.0 **Ansvarig**: Development
Team
