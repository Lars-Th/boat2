# Stadsmissionen Båtlager - Warehouse Management System

Ett omfattande warehouse management system för Stadsmissionen som hanterar båtlagring, bryggplacering och reservationer.

## 🚤 Funktioner

### Huvudfunktioner
- **Båtlager Management** - Fullständig hantering av båtars placering i lager och bryggor
- **Drag & Drop Interface** - Intuitivt gränssnitt för att placera båtar med mus
- **Status Management** - Hantering av båtstatusar: oplacerad, placerad, reserverad
- **Kollisionsdetektion** - Automatisk detektion av kollisioner mellan båtar och begränsningar
- **Rotation Controls** - Rotera båtar i 22.5-graders steg
- **Interactive Tooltips** - Hover-information med direkta kontroller för statusändringar

### Visualisering
- **Realtidscanvas** - Powered by Konva.js för smooth interaktioner
- **Färgkodning** - Tydlig visuell indikation av båtstatusar
- **Zoom & Pan** - Navigera stora lagerområden enkelt
- **Grid System** - Strukturerat rutnät för exakt placering

### Data Management
- **JSON-baserad data** - All data lagras i strukturerade JSON-filer
- **Reactive Updates** - Realtidsuppdateringar av alla vyer
- **Kapacitetshantering** - Automatisk räkning av båtar per lagerområde

## 🛠️ Teknisk Stack

- **Frontend**: Vue.js 3 (Composition API)
- **TypeScript**: Fullständig typning
- **Canvas**: Konva.js för interaktiv grafik
- **UI**: Shadcn/ui komponenter + Tailwind CSS
- **Icons**: Lucide Vue icons
- **Build Tool**: Vite
- **Styling**: Tailwind CSS

## 📦 Installation

1. **Klona repot**:
   ```bash
   git clone https://github.com/Lars-Th/boat2.git
   cd boat2
   ```

2. **Installera dependencies**:
   ```bash
   npm install
   # eller
   yarn install
   ```

3. **Starta development server**:
   ```bash
   npm run dev
   # eller
   yarn dev
   ```

4. **Öppna i webbläsare**:
   ```
   http://localhost:5173
   ```

## 🏗️ Projektstruktur

```
src/
├── views/
│   ├── BoatLager2.vue      # Huvudkomponent för warehouse management
│   ├── BoatDetail.vue      # Detaljvy för enskilda båtar
│   └── ...
├── components/
│   ├── konva/              # Konva.js-baserade komponenter
│   ├── shared/             # Delade UI-komponenter
│   └── ui/                 # Shadcn/ui komponenter
├── assets/
│   └── data/               # JSON-datafiler
│       ├── boats.json
│       ├── boatPlacements.json
│       ├── combinedStorage.json
│       └── ...
├── router/
├── types/
└── utils/
```

## 📊 Datamodell

### Båtstatus
- **oplacerad** 🟢 - Båt som kan flyttas (grön färg)
- **placerad** 🔵 - Båt som är fysiskt placerad (blå färg)
- **reserverad** ⚪ - Reserverad plats (grå färg, streckad)

### Lagringstyper
- **lager** - Inomhuslagring
- **brygga** - Utomhusbrygga
- **lager_brygga** - Kombinerad lagring

### Kollisionsdetektion
- **hull_collision** 🔴 - Båtkropp överlappar
- **margin_collision** 🟡 - Säkerhetsmarginaler överlappar

## 🎮 Användning

### Placera Båtar
1. Dra en båt från listan till vänster
2. Släpp på önskad position i lagret
3. Båten får automatiskt vald status (placerad/reserverad)

### Ändra Status
- **Klicka på båt**: Växla mellan placerad ↔ oplacerad
- **Tooltip-knappar**: Direkta statusändringar via hover-menyn
- **Toolbar**: Massändringar för alla oplacerade båtar

### Rotera Båtar
1. Klicka på en placerad båt för att markera den
2. Använd rotation-knapparna i toolbar
3. Båten roteras i 22.5-graders steg

### Hantera Kollisioner
- Röda färger indikerar kollisioner under drag
- Båtar kan fortfarande placeras trots kollisioner
- Visuell feedback hjälper till att undvika problem

## 🔧 Development

### Kör tester
```bash
npm run test
```

### Build för production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## 📝 Design Guidelines

Se `docs/DesignInstructions/` för detaljerade riktlinjer om:
- UI-komponentanvändning
- Datahantering
- Färgscheman
- TypeScript-patterns

## 🤝 Bidrag

Detta är ett internt projekt för Stadsmissionen. För ändringar och förbättringar, kontakta utvecklingsteamet.

## 📄 Licens

Privat projekt - Stadsmissionen

---

**Utvecklat för Stadsmissionen's båtlagerhantering**
*Ett komplett warehouse management system med fokus på användarvänlighet och effektivitet*
