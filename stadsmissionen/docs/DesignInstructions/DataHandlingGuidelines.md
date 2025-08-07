# Datahanteringsriktlinjer för Stadsmissionen-projektet

## Övergripande principer

Detta dokument beskriver de grundläggande reglerna för hur data ska hanteras i Stadsmissionen-projektet för att säkerställa konsistens och undvika fel.

## 📋 Grundregler för datahantering

### 1. JSON-filer som enda datakälla

**REGEL:** All data ska alltid hämtas från JSON-filerna i `src/assets/data/` katalogen.

**FÖRKLARING:** JSON-filerna fungerar som mockdata som simulerar riktiga databastabeller. I ett senare skede kommer dessa att ersättas med faktiska API-anrop till en databas.

### 2. Tillgängliga datafiler

Följande JSON-filer finns tillgängliga i `src/assets/data/`:

#### Aktiva datafiler
- `boats.json` - Båtinformation och specifikationer
- `customers.json` - Kundinformation
- `companies.json` - Settings för företaget som använder systemet
- `users.json` - Användardata (Denna får aldrig röras)
- `storageUnits.json` - Förvaringsenhetsinformation
- `boatPlacements.json` - Båtplaceringsdata
- `combinedStorage.json` - Kombinerad förvaringsinformation, lager eller brygga
- `storageRestrictions.json` - Kopplas till Lager (combinedStorage.json).Visar begränsningsytor i lager
- `storageFloors.json` - Kopplas till Lager (combinedStorage.json). visar olika våningar i lagret
- `customerContacts.json` - Kundkontaktinformation
- `permissionGroups.json` - Behörighetsgrupper (Denna får aldrig röras)
- `placements.json` - Båtarnas placeringsinformation


### 3. Hantering av saknade fält eller nya datafiler

**REGEL:** Om data saknas eller nya fält behövs:

1. **Informera först** - Säg eller fråga innan du skapar nya fält eller filer
2. **Skapa nya JSON-filer** vid behov i `src/assets/data/`
3. **Utöka befintliga JSON-filer** med nya fält om nödvändigt
4. **Dokumentera ändringar** - Förklara vad som lagts till och varför

**Exempel på kommunikation:**
```
"Jag behöver lägga till ett 'maintenance_status' fält i boats.json
för att hantera underhållsstatus. Ska jag göra det?"
```

### 4. Förbud mot hårdkodad mockdata

**ABSOLUT FÖRBUD:** Skriv aldrig mockdata direkt i komponenter eller views (`src/views/`).

**VARFÖR:**
- Skapar förvirring om vad som är riktig data vs testdata
- Gör det svårt att senare migrera till riktig databas
- Ökar risken för fel och inkonsistens

**FELAKTIGT exempel:**
```vue
<!-- DETTA ÄR FÖRBJUDET -->
<template>
  <div>
    <div v-for="boat in boats" :key="boat.id">
      {{ boat.name }}
    </div>
  </div>
</template>

<script setup>
// ALDRIG göra så här:
const boats = [
  { id: 1, name: "Båt 1" },
  { id: 2, name: "Båt 2" }
]
</script>
```

**KORREKT exempel:**
```vue
<!-- KORREKT sätt -->
<template>
  <div>
    <div v-for="boat in boats" :key="boat.id">
      {{ boat.name }}
    </div>
  </div>
</template>

<script setup>
import boatsData from '@/assets/data/boats.json'

const boats = boatsData
</script>
```

## 🔄 Arbetsflöde för datahantering

### Steg 1: Kontrollera befintliga datafiler
Innan du börjar arbeta, kontrollera vilka datafiler som finns och vilka fält de innehåller.

### Steg 2: Identifiera databehov
Om data saknas, identifiera:
- Vilken typ av data som behövs
- Vilken fil som bör innehålla datan
- Vilka fält som behöver läggas till

### Steg 3: Kommunicera ändringar
Informera alltid om planerade ändringar:
- "Jag behöver skapa en ny fil: `maintenance.json` för underhållsdata"
- "Jag vill lägga till fältet `lastInspection` i `boats.json`"

### Steg 4: Implementera ändringar
Skapa eller uppdatera JSON-filer enligt behov.

### Steg 5: Uppdatera komponenter
Uppdatera komponenter för att använda den nya/uppdaterade datan.

## 📁 Filstruktur för data

```
src/assets/data/
├── boats.json              # Båtinformation
├── customers.json          # Kundinformation
├── companies.json          # Företagsdata
├── users.json             # Användardata
├── storageUnits.json      # Förvaringsenheter
├── boatPlacements.json    # Båtplaceringar
├── combinedStorage.json   # Kombinerad förvaring
├── storageRestrictions.json # Förvaringsbegränsningar
├── storageFloors.json     # Våningsplaner
├── customerContacts.json  # Kundkontakter
├── permissionGroups.json  # Behörighetsgrupper
├── placements.json        # Placeringsdata
└── [nya filer vid behov]
```

## ⚠️ Viktiga påminnelser

1. **Aldrig hårdkoda data** i komponenter eller views
2. **Alltid fråga först** innan du skapar nya datafiler eller fält
3. **Använd JSON-filer** som den enda källan för mockdata
4. **Tänk på framtiden** - dessa filer kommer att ersättas med API-anrop
5. **Håll data konsistent** mellan olika filer

## 🎯 Syfte med dessa riktlinjer

Dessa riktlinjer säkerställer:
- **Konsistens** i datahantering
- **Enkel migration** till riktig databas senare
- **Undvikande av fel** och missförstånd
- **Tydlig separation** mellan mockdata och komponentlogik
- **Bättre kodkvalitet** och underhållbarhet

---

**Kom ihåg:** Följ alltid dessa riktlinjer för att undvika problem och säkerställa en smidig utvecklingsprocess!
