# UI-komponentriktlinjer för Stadsmissionen-projektet

## 📋 Övergripande principer

Detta dokument säkerställer konsistent användning av UI-komponenter och textstorlekar i hela projektet för att bibehålla en enhetlig användarupplevelse.

## 🎯 Huvudregler

### 1. Prioritetsordning för komponenter

**REGEL:** Använd alltid komponenter i följande prioritetsordning:

1. **Första valet:** shadcn/ui komponenter från `@/components/ui/`
2. **Andra valet:** Anpassade shared komponenter från `@/components/shared/`
3. **Sista utvägen:** Skapa nya komponenter (endast efter godkännande)

### 2. Textstorlekar måste matcha shared-komponenter

**KRITISK REGEL:** När du använder shadcn/ui komponenter ska de ha samma textstorlekar som motsvarande element i shared-komponenterna.

## 📐 Standardiserade textstorlekar

### Grundläggande textklasser (enligt shared-komponenter)

| Användningsområde | CSS-klass | Pixel-storlek | Användning |
|-------------------|-----------|---------------|------------|
| **Mycket små labels** | `text-[10px]` | 10px | Field labels, metadata |
| **Små texter** | `text-xs` | 12px | Table headers, table cells, kompakt info |
| **Normal text** | `text-sm` | 14px | Buttons, normal body text, headers |
| **Responsiv text** | `md:text-xs` | 12px @ md+ | Responsive fields |
| **Responsiv normal** | `md:text-sm` | 14px @ md+ | Responsive normal text |

### Specifika komponentstorlekar

#### Labels
```css
/* För field labels */
class="text-[10px] font-medium text-foreground/80"

/* För normala labels */
class="text-sm font-medium"
```

#### Headers och titlar
```css
/* Små section headers */
class="text-sm font-semibold text-foreground/80"

/* Normala headers */
class="text-sm font-medium"
```

#### Tabeller
```css
/* Table headers */
class="text-xs"

/* Table cells */
class="text-xs"

/* Bold table cells (namn, företag) */
class="text-xs font-bold"
```

#### Input-fält
```css
/* Kompakta input */
class="h-8 text-xs"

/* Normala input med responsivitet */
class="h-8 md:text-xs"

/* Responsiva input */
class="text-base md:text-sm"
```

#### Buttons
```css
/* Standard button text */
class="text-sm font-medium"
```

## 🔧 Praktiska riktlinjer

### Använda shadcn/ui komponenter korrekt

#### ✅ KORREKT användning av Button
```vue
<template>
  <!-- Matchar shared-komponenternas text-sm -->
  <Button class="text-sm font-medium" size="sm">
    Spara
  </Button>
</template>
```

#### ❌ FELAKTIG användning
```vue
<template>
  <!-- Använder inte samma textstorlek som shared -->
  <Button class="text-base">
    Spara
  </Button>
</template>
```

#### ✅ KORREKT användning av Input
```vue
<template>
  <!-- Matchar shared-komponenternas storlek -->
  <div class="space-y-1">
    <Label class="text-[10px] font-medium text-foreground/80">
      Namn
    </Label>
    <Input class="h-8 md:text-xs" />
  </div>
</template>
```

#### ✅ KORREKT användning av Card
```vue
<template>
  <Card>
    <CardHeader>
      <!-- Matchar shared header-storlek -->
      <CardTitle class="text-sm font-semibold text-foreground/80">
        Grundläggande information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Innehåll med konsistenta textstorlekar -->
      <p class="text-xs">Detta är innehållet</p>
    </CardContent>
  </Card>
</template>
```

### Import-mönster

#### ✅ KORREKT import av shadcn/ui
```typescript
// Importera från UI-komponenter
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
```

#### ✅ KORREKT import av shared-komponenter
```typescript
// Importera shared-komponenter när de finns
import ListPage from '@/components/shared/ListPage.vue'
import DetailPage from '@/components/shared/DetailPage.vue'
import DataTable from '@/components/shared/DataTable.vue'
```

## 📊 Komponentmappning

### När ska man använda vilken komponent?

| Behov | Första val (shadcn/ui) | Andra val (shared) | Anpassning |
|-------|------------------------|-------------------|------------|
| **Lista med data** | - | `ListPage.vue` | Används direkt |
| **Detaljvy** | - | `DetailPage.vue` | Används direkt |
| **Tabell** | `Table` + komponenter | `DataTable.vue` | Lägg till `text-xs` |
| **Button** | `Button` | - | Lägg till `text-sm font-medium` |
| **Input-fält** | `Input` | - | Lägg till `h-8 md:text-xs` |
| **Labels** | `Label` | - | Lägg till `text-[10px] font-medium text-foreground/80` |
| **Cards** | `Card` + sub-komponenter | - | Anpassa titlar till `text-sm font-semibold` |

## 🎨 Responsivitet och storlekar

### Responsiva textklasser
```css
/* För fält som ska vara mindre på desktop */
class="text-base md:text-xs"

/* För normal responsiv text */
class="text-base md:text-sm"

/* För labels som ska vara små */
class="text-[10px] font-medium"
```

### Button-storlekar
```css
/* Kompakt button (matchar shared) */
<Button size="sm" class="h-8 text-sm font-medium">

/* Normal button */
<Button size="default" class="h-9 text-sm font-medium">

/* Stor button */
<Button size="lg" class="h-10 text-sm font-medium">
```

### Input-höjder
```css
/* Kompakt (matchar shared) */
class="h-8"

/* Normal */
class="h-9"

/* Stor */
class="h-10"
```

## 🔍 Kvalitetskontroll

### Checklist för nya komponenter

- [ ] Använder shadcn/ui komponenter som första val
- [ ] Textstorlekar matchar shared-komponenterna
- [ ] Responsivitet implementerad korrekt (`md:text-xs` etc.)
- [ ] Labels använder `text-[10px] font-medium text-foreground/80`
- [ ] Headers använder `text-sm font-semibold text-foreground/80`
- [ ] Table-element använder `text-xs`
- [ ] Buttons använder `text-sm font-medium`
- [ ] Input-fält har rätt höjd (`h-8` för kompakt)

### Vanliga fel att undvika

#### ❌ Fel textstorlekar
```vue
<!-- ANVÄND INTE -->
<Label class="text-base">Label</Label>
<Button class="text-lg">Button</Button>
<Input class="text-lg" />
```

#### ✅ Korrekta textstorlekar
```vue
<!-- ANVÄND DETTA -->
<Label class="text-[10px] font-medium text-foreground/80">Label</Label>
<Button class="text-sm font-medium">Button</Button>
<Input class="h-8 md:text-xs" />
```

#### ❌ Inkonsistenta höjder
```vue
<!-- ANVÄND INTE -->
<Input class="h-12" />
<Button class="h-12">Button</Button>
```

#### ✅ Konsistenta höjder
```vue
<!-- ANVÄND DETTA -->
<Input class="h-8" />
<Button size="sm" class="h-8">Button</Button>
```

## 📁 Tillgängliga shadcn/ui komponenter

### Formulär och input
- `Button` - Knappar
- `Input` - Textfält
- `Textarea` - Textområden
- `Label` - Etiketter
- `Select` - Dropdown-menyer
- `Checkbox` - Kryssrutor
- `RadioGroup` - Radioknappar
- `Switch` - Växlare

### Layout och struktur
- `Card` + sub-komponenter - Kort
- `Dialog` + sub-komponenter - Modaler
- `Sheet` + sub-komponenter - Sidopaneler
- `Tabs` + sub-komponenter - Flikar
- `Accordion` + sub-komponenter - Expanderbara sektioner

### Navigation och meny
- `DropdownMenu` + sub-komponenter - Dropdown-menyer
- `ContextMenu` + sub-komponenter - Högerklick-menyer
- `NavigationMenu` + sub-komponenter - Navigationsmenyer
- `Breadcrumb` + sub-komponenter - Brödsmulor

### Data och feedback
- `Table` + sub-komponenter - Tabeller
- `Badge` - Märken
- `Alert` + sub-komponenter - Varningar
- `Toast` - Notifikationer
- `Progress` - Förloppsindikator
- `Skeleton` - Laddningsskelett

### Avancerade komponenter
- `Calendar` + sub-komponenter - Kalendrar
- `Combobox` + sub-komponenter - Sökbara dropdown
- `Command` + sub-komponenter - Kommandopaletter
- `Popover` + sub-komponenter - Popover
- `Tooltip` + sub-komponenter - Tooltips

## 🚀 Best practices

### 1. Konsistens först
Textstorlekar och spacing ska vara identiska med shared-komponenterna.

### 2. Använd befintliga varianter
Modifiera inte shadcn/ui komponenternas grundläggande styling utan lägg till klasser.

### 3. Responsivitet
Använd alltid responsiva klasser för textbreadth (`md:text-xs`, `md:text-sm`).

### 4. Semantisk korrekthet
Använd rätt HTML-element och ARIA-attribut via shadcn/ui komponenterna.

### 5. Performance
Återanvänd komponenter istället för att skapa nya.

## ⚠️ Viktiga påminnelser

1. **Textstorlekar måste matcha** - Detta är kritiskt för användarupplevelsen
2. **shadcn/ui först** - Använd alltid befintliga UI-komponenter när möjligt
3. **Shared-komponenter som backup** - Använd shared när shadcn/ui inte räcker
4. **Fråga innan nya komponenter** - Skapa inte nya komponenter utan godkännande
5. **Testa responsivitet** - Kontrollera att komponenter fungerar på alla skärmstorlekar

---

**Kom ihåg:** Målet är en konsistent och professionell användarupplevelse genom hela applikationen!
