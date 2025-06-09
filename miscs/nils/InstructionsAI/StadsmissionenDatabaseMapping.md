# Stadsmissionens Databas-till-Storage Mappning

## 🗄️ Implementerad Datastruktur → Vue.js Storage

Detta dokument beskriver den faktiska datastrukturen som implementerats i Stadsmissionens Vue.js-system enligt MoxMaster-arkitekturen.

## 📊 Implementerade Entiteter

### 1. ActivityTemplates → ActivityTemplateStorage.ts

**Implementerad struktur:**
```typescript
export interface ActivityTemplate {
  id: string
  namn: string
  beskrivning: string
  malltyp: 'Standard' | 'Samtal' | 'OppetHus'
  aktivitetstyper: string[] // Array av ActivityType IDs
  standardVaraktighet: number // Minuter
  standardPlats?: string
  resultatformular: Question[]
  skapadDatum: string
  skapadAv: string
}

export interface Question {
  id: string
  fraga: string
  typ: 'JaNej' | 'Skala' | 'Kommentar'
  obligatorisk: boolean
  
  // För Ja/Nej frågor
  harKommentar?: boolean
  
  // För Skala-frågor
  skalaMin?: number
  skalaMax?: number
  skalaKommentar?: boolean
}
```

**Malltyper:**
- **Standard**: Bjuda in specifika deltagare, kan vara återkommande
- **Samtal**: Singel- eller gruppsamtal med fokus på dokumentation
- **OppetHus**: Ingen specifik deltagarregistrering, anonymt besöksloggning

### 2. ActivityTypes → ActivityTypeStorage.ts

**Implementerad struktur:**
```typescript
export interface ActivityType {
  ActivityTypeID: string
  Typnamn: string
  Syfte: string
  Beskrivning: string
}
```

**Implementerade aktivitetstyper:**
- Social gemenskap
- ADL-träning
- Bygga yrkesmässiga nätverk
- Språkstöd och integration
- Barn och familj
- Ekonomisk rådgivning
- Hälsa och välbefinnande
- Utbildning och kompetensutveckling
- Kreativitet och kultur
- Individuellt stöd
- Bostadsstöd
- Myndighetsärenden

### 3. OrganizationSettings → OrganizationStorage.ts

**Implementerad struktur:**
```typescript
export interface Organization {
  id: string
  namn: string
  logotyp: string
  aktiv: boolean
  enheter: string[]
  kommentarLabels: {
    kommentar1: string
    kommentar2: string
    kommentar3: string
  }
  kontaktuppgifter: {
    adress: string
    postnummer: string
    ort: string
    telefon: string
    epost: string
    webbplats: string
  }
  skapadDatum: string
  uppdateradDatum: string
}

export interface OrganizationSettings {
  organizations: Organization[]
  currentOrganization: string
  systemSettings: {
    defaultLanguage: string
    dateFormat: string
    timeFormat: string
    currency: string
    timezone: string
  }
  permissions: PermissionSystem
}
```

### 4. Users → UserStorage.ts

**Implementerad struktur:**
```typescript
export interface User {
  id: string
  namn: string
  epost: string
  losenord: string // Krypterat
  roller: string[] // Array av roll-IDs
  organisationId: string
  enheter: string[] // Array av enhetsnamn
  aktiv: boolean
  senastInloggad?: string
  skapadDatum: string
  uppdateradDatum: string
}
```

### 5. Permissions → PermissionStorage.ts

**Implementerat behörighetssystem:**
```typescript
export interface Role {
  id: string
  namn: string
  beskrivning: string
  permissions: string[]
}

export interface PermissionSystem {
  roles: Role[]
  resources: string[]
  actions: string[]
}
```

**Implementerade roller:**
- **Handläggare**: Grundläggande funktioner för daglig verksamhet
- **Enhetsansvarig**: Ansvarig för specifik enhet med utökade rättigheter
- **Administratör**: Administratör för hela organisationen
- **Systemadministratör**: Full systemåtkomst

### 6. ThemeSettings → ThemeStorage.ts

**Implementerad temahantering:**
```typescript
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textMuted: string
  border: string
  success: string
  warning: string
  error: string
}

export interface Theme {
  id: string
  name: string
  description: string
  preview: string
  colors: ThemeColors
}
```

**Implementerade standardteman:**
- Stadsmission Blå (standard)
- Stadsmission Grön
- Stadsmission Lila
- Mörkt tema

## 🏪 Storage-implementationer

### ActivityTemplateStorage.ts
```typescript
import { defineStore } from 'pinia'
import activityTemplatesData from './activityTemplates.json'

export const useActivityTemplateStorage = defineStore('activityTemplate', {
  state: () => ({
    templates: activityTemplatesData as ActivityTemplate[]
  }),
  
  getters: {
    getTemplateById: (state) => (id: string) =>
      state.templates.find(t => t.id === id),
    
    getTemplatesByType: (state) => (malltyp: string) =>
      state.templates.filter(t => t.malltyp === malltyp),
    
    getStandardTemplates: (state) =>
      state.templates.filter(t => t.malltyp === 'Standard'),
    
    getSamtalTemplates: (state) =>
      state.templates.filter(t => t.malltyp === 'Samtal'),
    
    getOppetHusTemplates: (state) =>
      state.templates.filter(t => t.malltyp === 'OppetHus')
  },
  
  actions: {
    addTemplate(template: Omit<ActivityTemplate, 'id' | 'skapadDatum'>) {
      this.templates.push({
        ...template,
        id: `template-${Date.now()}`,
        skapadDatum: new Date().toISOString()
      })
    },
    
    updateTemplate(updated: ActivityTemplate) {
      const index = this.templates.findIndex(t => t.id === updated.id)
      if (index !== -1) {
        this.templates[index] = updated
      }
    },
    
    removeTemplate(id: string) {
      this.templates = this.templates.filter(t => t.id !== id)
    }
  }
})
```

### OrganizationStorage.ts
```typescript
import { defineStore } from 'pinia'
import organizationData from './organizationSettings.json'

export const useOrganizationStorage = defineStore('organization', {
  state: () => ({
    settings: organizationData as OrganizationSettings
  }),
  
  getters: {
    currentOrg: (state) => 
      state.settings.organizations.find(o => o.id === state.settings.currentOrganization),
    
    activeOrganizations: (state) =>
      state.settings.organizations.filter(o => o.aktiv),
    
    getRoleById: (state) => (roleId: string) =>
      state.settings.permissions.roles.find(r => r.id === roleId),
    
    hasPermission: (state) => (userRoles: string[], resource: string, action: string) => {
      const permission = `${resource}.${action}`
      return userRoles.some(roleId => {
        const role = state.settings.permissions.roles.find(r => r.id === roleId)
        return role?.permissions.includes(permission) || role?.permissions.includes('*')
      })
    }
  },
  
  actions: {
    switchOrganization(orgId: string) {
      this.settings.currentOrganization = orgId
    },
    
    updateOrganization(updated: Organization) {
      const index = this.settings.organizations.findIndex(o => o.id === updated.id)
      if (index !== -1) {
        this.settings.organizations[index] = {
          ...updated,
          uppdateradDatum: new Date().toISOString()
        }
      }
    },
    
    addEnhet(orgId: string, enhetNamn: string) {
      const org = this.settings.organizations.find(o => o.id === orgId)
      if (org && !org.enheter.includes(enhetNamn)) {
        org.enheter.push(enhetNamn)
        org.uppdateradDatum = new Date().toISOString()
      }
    },
    
    removeEnhet(orgId: string, enhetNamn: string) {
      const org = this.settings.organizations.find(o => o.id === orgId)
      if (org) {
        org.enheter = org.enheter.filter(e => e !== enhetNamn)
        org.uppdateradDatum = new Date().toISOString()
      }
    }
  }
})
```

### UserStorage.ts
```typescript
import { defineStore } from 'pinia'
import usersData from './users.json'

export const useUserStorage = defineStore('user', {
  state: () => ({
    users: usersData as User[],
    currentUser: null as User | null
  }),
  
  getters: {
    getUserById: (state) => (id: string) =>
      state.users.find(u => u.id === id),
    
    getUsersByOrganization: (state) => (orgId: string) =>
      state.users.filter(u => u.organisationId === orgId),
    
    getActiveUsers: (state) =>
      state.users.filter(u => u.aktiv),
    
    getUsersByRole: (state) => (roleId: string) =>
      state.users.filter(u => u.roller.includes(roleId)),
    
    getUsersByEnhet: (state) => (enhetNamn: string) =>
      state.users.filter(u => u.enheter.includes(enhetNamn))
  },
  
  actions: {
    addUser(user: Omit<User, 'id' | 'skapadDatum' | 'uppdateradDatum'>) {
      this.users.push({
        ...user,
        id: `user-${Date.now()}`,
        skapadDatum: new Date().toISOString(),
        uppdateradDatum: new Date().toISOString()
      })
    },
    
    updateUser(updated: User) {
      const index = this.users.findIndex(u => u.id === updated.id)
      if (index !== -1) {
        this.users[index] = {
          ...updated,
          uppdateradDatum: new Date().toISOString()
        }
      }
    },
    
    removeUser(id: string) {
      this.users = this.users.filter(u => u.id !== id)
    },
    
    setCurrentUser(user: User) {
      this.currentUser = user
      user.senastInloggad = new Date().toISOString()
    }
  }
})
```

### ThemeStorage.ts
```typescript
import { defineStore } from 'pinia'

export const useThemeStorage = defineStore('theme', {
  state: () => ({
    currentTheme: 'stadsmission-blue',
    customColors: {
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
      error: '#ef4444'
    } as ThemeColors
  }),
  
  getters: {
    activeColors: (state) => {
      if (state.currentTheme === 'custom') {
        return state.customColors
      }
      // Return predefined theme colors based on currentTheme
      return getThemeColors(state.currentTheme)
    }
  },
  
  actions: {
    setTheme(themeId: string) {
      this.currentTheme = themeId
      this.applyTheme()
    },
    
    updateCustomColors(colors: Partial<ThemeColors>) {
      this.customColors = { ...this.customColors, ...colors }
      if (this.currentTheme === 'custom') {
        this.applyTheme()
      }
    },
    
    applyTheme() {
      const colors = this.activeColors
      const root = document.documentElement
      Object.entries(colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value)
      })
    },
    
    saveTheme() {
      localStorage.setItem('stadsmission-theme', JSON.stringify({
        id: this.currentTheme,
        colors: this.activeColors
      }))
    },
    
    loadTheme() {
      const saved = localStorage.getItem('stadsmission-theme')
      if (saved) {
        try {
          const themeData = JSON.parse(saved)
          this.currentTheme = themeData.id
          if (themeData.id === 'custom') {
            this.customColors = themeData.colors
          }
          this.applyTheme()
        } catch (e) {
          console.error('Failed to load saved theme:', e)
        }
      }
    }
  }
})
```

## 📋 JSON-datafiler

### activityTemplates.json
```json
[
  {
    "id": "template-1",
    "namn": "Läxhjälp för barn",
    "beskrivning": "Strukturerad läxhjälp för barn i grundskoleåldern",
    "malltyp": "Standard",
    "aktivitetstyper": ["aktivitetstyp-5", "aktivitetstyp-8"],
    "standardVaraktighet": 90,
    "standardPlats": "Studierum A",
    "resultatformular": [
      {
        "id": "q1",
        "fraga": "Hur väl förstod deltagaren dagens material?",
        "typ": "Skala",
        "obligatorisk": true,
        "skalaMin": 1,
        "skalaMax": 4,
        "skalaKommentar": true
      }
    ],
    "skapadDatum": "2025-01-15T10:00:00Z",
    "skapadAv": "admin"
  }
]
```

### activityTypes.json
```json
[
  {
    "ActivityTypeID": "aktivitetstyp-1",
    "Typnamn": "Social gemenskap",
    "Syfte": "Främja social samhörighet och minska isolering",
    "Beskrivning": "Aktiviteter som syftar till att skapa meningsfulla sociala kontakter"
  }
]
```

### organizationSettings.json
```json
{
  "organizations": [
    {
      "id": "org-1",
      "namn": "Östergötlands Stadsmission",
      "logotyp": "/src/assets/images/stadsmissionen-logo.png",
      "aktiv": true,
      "enheter": [
        "Barn och unga",
        "Familjecentral",
        "Ekonomisk rådgivning"
      ],
      "kommentarLabels": {
        "kommentar1": "Särskilda behov",
        "kommentar2": "Familjesituation",
        "kommentar3": "Övriga anteckningar"
      },
      "kontaktuppgifter": {
        "adress": "Storgatan 15",
        "postnummer": "58222",
        "ort": "Linköping",
        "telefon": "013-123456",
        "epost": "info@ostergotlandsstadsmission.se",
        "webbplats": "https://ostergotlandsstadsmission.se"
      }
    }
  ],
  "currentOrganization": "org-1",
  "permissions": {
    "roles": [
      {
        "id": "handlaggare",
        "namn": "Handläggare",
        "beskrivning": "Grundläggande funktioner",
        "permissions": [
          "participants.read",
          "activities.read",
          "attendance.update"
        ]
      }
    ]
  }
}
```

### users.json
```json
[
  {
    "id": "user-1",
    "namn": "Anna Administratör",
    "epost": "anna.admin@ostergotlandsstadsmission.se",
    "losenord": "admin123",
    "roller": ["systemadministrator"],
    "organisationId": "org-1",
    "enheter": [],
    "aktiv": true,
    "senastInloggad": "2025-01-15T09:30:00Z",
    "skapadDatum": "2024-06-01T08:00:00Z",
    "uppdateradDatum": "2025-01-10T14:20:00Z"
  }
]
```

## 🎨 Temahantering

### CSS-variabler för teman
```css
:root {
  /* Stadsmission Blue Theme (default) */
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-accent: #0ea5e9;
  --color-background: #ffffff;
  --color-surface: #f8fafc;
  --color-text: #0f172a;
  --color-textMuted: #64748b;
  --color-border: #e2e8f0;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

### Tema-komponenter
- **StandardThemes**: 4 fördefinierade teman
- **CustomColors**: Anpassningsbara färger i kategorier
- **LivePreview**: Realtidsförhandsgranskning av UI-element
- **Export/Import**: Spara och ladda teman som JSON

## 🔄 Implementerade funktioner

### ✅ Aktivitetsmallsystem
- Tre malltyper: Standard, Samtal, OppetHus
- Resultatformulär-builder med tre frågetyper
- Mallbaserat aktivitetsskapande
- Serie-aktiviteter från mallar

### ✅ Multi-organisationsstöd
- Flera stadsmissioner i samma system
- Organisationsväxling
- Organisationsspecifika enheter och inställningar
- Logotyphantering per organisation

### ✅ Behörighetssystem
- Rollbaserade behörigheter (4 roller)
- Detaljerad behörighetsmatrix
- Organisationsbegränsning
- Enhetsspecifika rättigheter

### ✅ Användarhantering
- Fullständig CRUD för användare
- Rollhantering och enhetskopp​ling
- Organisationstillhörighet
- Statushantering (aktiv/inaktiv)

### ✅ Temahantering
- Standardteman och anpassade färger
- Live-förhandsgranskning
- CSS-variabel-baserat system
- Export/import av teman

### ✅ Systeminställningar
- Tabbaserad interface
- Statistik och översikter
- Dynamiska inställningar
- Konfigurerbara enheter och kommentarsfält

## 🚀 Framtida utbyggnad

### Planerade tillägg:
1. **Deltagarhantering**: Fullständig CRUD med familjerelationer
2. **Aktivitetshantering**: Schemaläggning och närvaroregistrering
3. **Rapportsystem**: Statistik och export-funktioner
4. **QR-kod integration**: För närvaroregistrering
5. **Notifikationssystem**: För påminnelser och uppföljning

Detta dokument reflekterar den faktiska implementationen av Stadsmissionens system och kan användas som referens för fortsatt utveckling och underhåll. 