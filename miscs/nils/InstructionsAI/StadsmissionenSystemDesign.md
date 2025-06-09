# Stadsmissionens Stöd-/Uppföljningssystem - Systemdesign

## 🎯 Systemöversikt

Detta dokument beskriver hur Stadsmissionens stöd-/uppföljningssystem kan utvecklas som en utbyggnad av det befintliga MoxMaster-systemet, med fokus på deltagarregistrering, aktivitetshantering och rapportering.

## 🏗️ Arkitektur & Multi-tenant Design

### Multi-tenant Struktur
```typescript
// Tenant-baserad datamodell
export interface Tenant {
  id: number
  name: string // "Stadsmissionen Stockholm", "Stadsmissionen Göteborg"
  slug: string // "stockholm", "goteborg"
  settings: TenantSettings
  isActive: boolean
  createdAt: string
}

export interface TenantSettings {
  requireBankID: boolean
  enableQRCodes: boolean
  defaultLanguage: 'sv' | 'en' | 'ar' | 'so'
  gdprRetentionDays: number
  exportFormats: ('csv' | 'json' | 'xml')[]
}
```

## 📊 Datamodell - Entiteter & Relationer

### 1. Deltagarregister (Huvudentitet)

```typescript
export interface Participant {
  id: number
  tenantId: number // Multi-tenant koppling
  
  // Obligatoriska fält (★)
  personnummer: string // ★ Krypterat/hashat
  fornamn: string // ★
  efternamn: string // ★
  
  // Grundläggande information
  fodelsedag: string
  kon: 'Man' | 'Kvinna' | 'Annat' | 'Vill ej ange'
  
  // Kontaktuppgifter
  telefon?: string
  email?: string
  adress?: string
  postnummer?: string
  ort?: string
  
  // Status & metadata
  aktiv: boolean // ★
  registreradDatum: string
  senastUppdaterad: string
  
  // Målsman/anhörig-kopplingar
  arMalsman: boolean
  harMalsman: boolean
  
  // GDPR & samtycke
  gdprSamtycke: boolean
  gdprSamtyckeDatum?: string
  
  // Kategorisering
  deltagartyp: 'Barn' | 'Vuxen' | 'Volontar' | 'Personal'
  specialBehov?: string
  anteckningar?: string
}
```

### 2. Målsman/Anhörig-relationer

```typescript
export interface GuardianRelation {
  id: number
  tenantId: number
  
  guardianId: number // Participant.id (målsman)
  dependentId: number // Participant.id (barn/anhörig)
  
  relationstyp: 'Vardnadshavare' | 'Syskon' | 'Annan_anhorig'
  aktiv: boolean
  skapadDatum: string
}
```

### 3. Aktivitetstyper (Master-lista)

```typescript
export interface ActivityType {
  id: number
  namn: string
  beskrivning: string
  kategori: 'Fritidsgard' | 'Utbildning' | 'Stod' | 'Kultur' | 'Sport' | 'Annat'
  
  // Standardinställningar
  kravNarvaro: boolean
  kravAnteckningar: boolean
  maxDeltagare?: number
  minAlder?: number
  maxAlder?: number
  
  aktiv: boolean
}
```

### 4. Gruppaktiviteter

```typescript
export interface GroupActivity {
  id: number
  tenantId: number
  
  namn: string
  beskrivning?: string
  aktivitetstypId: number // Koppling till ActivityType
  
  // Typ-specifika inställningar
  typ: 'Lopande' | 'Tillfallen'
  
  // Metadata & regler
  kravNarvaro: boolean
  kravAnteckningar: boolean
  kravBankID: boolean
  
  // QR-kod integration
  qrKodAktiv: boolean
  qrKod?: string // Genererad QR-kod för incheckning
  
  // Schemaläggning (för Tillfällen)
  startDatum?: string
  slutDatum?: string
  veckodag?: string
  starttid?: string
  sluttid?: string
  
  // Status
  aktiv: boolean
  skapadDatum: string
  skapadAv: number // User.id
}
```

### 5. Närvaro & Deltagande

```typescript
export interface Attendance {
  id: number
  tenantId: number
  
  gruppaktivitetId: number
  deltagarId: number
  
  // Närvarodata
  datum: string
  checkinTid?: string
  checkoutTid?: string
  
  // Registreringsmetod
  registreringstyp: 'Manuell' | 'QR_kod' | 'BankID'
  
  // Status
  narvaro: 'Hadir' | 'Franvarande' | 'Sen' | 'Tidig_avgang'
  
  // Anteckningar
  anteckningar?: string
  registreradAv: number // User.id
  registreradDatum: string
}
```

### 6. Pin-mätning (Anonyma besökare)

```typescript
export interface AnonymousAttendance {
  id: number
  tenantId: number
  gruppaktivitetId: number
  
  datum: string
  antalPersoner: number
  aldersgrupp?: 'Barn' | 'Ungdom' | 'Vuxen' | 'Aldre'
  
  anteckningar?: string
  registreradAv: number
  registreradDatum: string
}
```

## 🏪 Storage-arkitektur

### ParticipantStorage.ts
```typescript
export const useParticipantStorage = defineStore('participant', {
  state: () => ({
    participants: [] as Participant[],
    guardianRelations: [] as GuardianRelation[],
    currentTenantId: 1 // Hämtas från auth/session
  }),
  
  getters: {
    // Tenant-filtrerade getters
    tenantParticipants: (state) => 
      state.participants.filter(p => p.tenantId === state.currentTenantId),
    
    activeParticipants: (state) => 
      state.participants.filter(p => p.aktiv && p.tenantId === state.currentTenantId),
    
    // Målsman-relationer
    getGuardiansByDependentId: (state) => (dependentId: number) =>
      state.guardianRelations
        .filter(r => r.dependentId === dependentId && r.aktiv)
        .map(r => state.participants.find(p => p.id === r.guardianId))
        .filter(Boolean),
    
    getDependentsByGuardianId: (state) => (guardianId: number) =>
      state.guardianRelations
        .filter(r => r.guardianId === guardianId && r.aktiv)
        .map(r => state.participants.find(p => p.id === r.dependentId))
        .filter(Boolean),
    
    // Kategorisering
    getParticipantsByType: (state) => (type: Participant['deltagartyp']) =>
      state.participants.filter(p => 
        p.deltagartyp === type && 
        p.aktiv && 
        p.tenantId === state.currentTenantId
      ),
    
    // GDPR-compliance
    participantsNeedingGDPRRenewal: (state) => {
      const cutoffDate = new Date()
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 2) // 2 år tillbaka
      
      return state.participants.filter(p => 
        p.tenantId === state.currentTenantId &&
        p.gdprSamtyckeDatum && 
        new Date(p.gdprSamtyckeDatum) < cutoffDate
      )
    }
  },
  
  actions: {
    // CRUD med tenant-awareness
    addParticipant(participant: Omit<Participant, 'id' | 'tenantId'>) {
      this.participants.push({
        ...participant,
        id: Date.now(),
        tenantId: this.currentTenantId,
        registreradDatum: new Date().toISOString(),
        senastUppdaterad: new Date().toISOString()
      })
    },
    
    // Målsman-relationer
    addGuardianRelation(guardianId: number, dependentId: number, type: GuardianRelation['relationstyp']) {
      this.guardianRelations.push({
        id: Date.now(),
        tenantId: this.currentTenantId,
        guardianId,
        dependentId,
        relationstyp: type,
        aktiv: true,
        skapadDatum: new Date().toISOString()
      })
    },
    
    // GDPR-hantering
    renewGDPRConsent(participantId: number) {
      const participant = this.participants.find(p => p.id === participantId)
      if (participant) {
        participant.gdprSamtycke = true
        participant.gdprSamtyckeDatum = new Date().toISOString()
        participant.senastUppdaterad = new Date().toISOString()
      }
    },
    
    // Anonymisering (GDPR-radering)
    anonymizeParticipant(participantId: number) {
      const participant = this.participants.find(p => p.id === participantId)
      if (participant) {
        participant.personnummer = `ANONYM_${Date.now()}`
        participant.fornamn = 'Anonymiserad'
        participant.efternamn = 'Deltagare'
        participant.telefon = undefined
        participant.email = undefined
        participant.adress = undefined
        participant.aktiv = false
        participant.senastUppdaterad = new Date().toISOString()
      }
    }
  }
})
```

### ActivityStorage.ts
```typescript
export const useActivityStorage = defineStore('activity', {
  state: () => ({
    activityTypes: [] as ActivityType[],
    groupActivities: [] as GroupActivity[],
    attendance: [] as Attendance[],
    anonymousAttendance: [] as AnonymousAttendance[],
    currentTenantId: 1
  }),
  
  getters: {
    // Tenant-filtrerade aktiviteter
    tenantGroupActivities: (state) =>
      state.groupActivities.filter(ga => ga.tenantId === state.currentTenantId),
    
    activeGroupActivities: (state) =>
      state.groupActivities.filter(ga => 
        ga.aktiv && ga.tenantId === state.currentTenantId
      ),
    
    // Typ-specifika getters
    lopandeActivities: (state) =>
      state.groupActivities.filter(ga => 
        ga.typ === 'Lopande' && 
        ga.aktiv && 
        ga.tenantId === state.currentTenantId
      ),
    
    tillfallenActivities: (state) =>
      state.groupActivities.filter(ga => 
        ga.typ === 'Tillfallen' && 
        ga.aktiv && 
        ga.tenantId === state.currentTenantId
      ),
    
    // Närvaro-statistik
    getAttendanceByActivity: (state) => (activityId: number) =>
      state.attendance.filter(a => a.gruppaktivitetId === activityId),
    
    getAttendanceByParticipant: (state) => (participantId: number) =>
      state.attendance.filter(a => a.deltagarId === participantId),
    
    // QR-kod aktiviteter
    qrEnabledActivities: (state) =>
      state.groupActivities.filter(ga => 
        ga.qrKodAktiv && 
        ga.aktiv && 
        ga.tenantId === state.currentTenantId
      )
  },
  
  actions: {
    // Skapa gruppaktivitet med QR-kod
    addGroupActivity(activity: Omit<GroupActivity, 'id' | 'tenantId' | 'qrKod'>) {
      const newActivity: GroupActivity = {
        ...activity,
        id: Date.now(),
        tenantId: this.currentTenantId,
        qrKod: activity.qrKodAktiv ? this.generateQRCode() : undefined,
        skapadDatum: new Date().toISOString()
      }
      
      this.groupActivities.push(newActivity)
      return newActivity
    },
    
    // QR-kod generering
    generateQRCode(): string {
      return `SM_${this.currentTenantId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    
    // Närvaro-registrering
    registerAttendance(attendance: Omit<Attendance, 'id' | 'tenantId'>) {
      this.attendance.push({
        ...attendance,
        id: Date.now(),
        tenantId: this.currentTenantId,
        registreradDatum: new Date().toISOString()
      })
    },
    
    // QR-kod incheckning
    checkInWithQR(qrCode: string, participantId: number, userId: number) {
      const activity = this.groupActivities.find(ga => ga.qrKod === qrCode)
      if (!activity) {
        throw new Error('Ogiltig QR-kod')
      }
      
      this.registerAttendance({
        gruppaktivitetId: activity.id,
        deltagarId: participantId,
        datum: new Date().toISOString().split('T')[0],
        checkinTid: new Date().toTimeString().split(' ')[0],
        registreringstyp: 'QR_kod',
        narvaro: 'Hadir',
        registreradAv: userId
      })
    },
    
    // Pin-mätning för anonyma besökare
    registerAnonymousAttendance(data: Omit<AnonymousAttendance, 'id' | 'tenantId'>) {
      this.anonymousAttendance.push({
        ...data,
        id: Date.now(),
        tenantId: this.currentTenantId,
        registreradDatum: new Date().toISOString()
      })
    }
  }
})
```

## 📱 Vyer & Komponenter

### 1. Deltagarregister-vy
```vue
<!-- ParticipantRegistry.vue -->
<template>
  <PageLayout
    title="Deltagarregister"
    breadcrumbs="Hem / Deltagarregister"
    :show-stats="true"
    :stats="participantStats"
  >
    <SearchAndFilter
      v-model:search="searchTerm"
      :filters="participantFilters"
      @add-new="showAddParticipantDialog = true"
    />
    
    <DataTable
      :data="filteredParticipants"
      :columns="participantColumns"
      @row-click="viewParticipantDetails"
    />
    
    <!-- GDPR-varningar -->
    <Alert v-if="gdprWarnings.length > 0" variant="warning">
      {{ gdprWarnings.length }} deltagare behöver förnya GDPR-samtycke
    </Alert>
  </PageLayout>
</template>
```

### 2. Aktivitetshantering
```vue
<!-- ActivityManagement.vue -->
<template>
  <PageLayout
    title="Aktivitetshantering"
    breadcrumbs="Hem / Aktiviteter"
  >
    <Tabs default-value="lopande">
      <TabsList>
        <TabsTrigger value="lopande">Löpande aktiviteter</TabsTrigger>
        <TabsTrigger value="tillfallen">Tillfällen</TabsTrigger>
        <TabsTrigger value="qr-koder">QR-koder</TabsTrigger>
      </TabsList>
      
      <TabsContent value="lopande">
        <ActivityGrid 
          :activities="lopandeActivities"
          type="lopande"
          @register-attendance="handleAttendanceRegistration"
        />
      </TabsContent>
      
      <TabsContent value="tillfallen">
        <ActivityCalendar 
          :activities="tillfallenActivities"
          @schedule-session="handleSessionScheduling"
        />
      </TabsContent>
      
      <TabsContent value="qr-koder">
        <QRCodeManager 
          :activities="qrEnabledActivities"
          @generate-qr="generateActivityQR"
        />
      </TabsContent>
    </Tabs>
  </PageLayout>
</template>
```

### 3. Närvaroregistrering
```vue
<!-- AttendanceRegistration.vue -->
<template>
  <PageLayout
    title="Närvaroregistrering"
    breadcrumbs="Hem / Närvaro"
  >
    <Card>
      <CardHeader>
        <CardTitle>{{ selectedActivity?.namn }}</CardTitle>
        <CardDescription>
          {{ formatDate(today) }} - {{ selectedActivity?.typ }}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <!-- QR-kod scanner -->
        <div v-if="selectedActivity?.qrKodAktiv" class="mb-6">
          <QRScanner @scan="handleQRScan" />
        </div>
        
        <!-- Manuell registrering -->
        <ParticipantSelector
          v-model="selectedParticipants"
          :participants="availableParticipants"
          multiple
        />
        
        <!-- Pin-mätning -->
        <div class="mt-6">
          <Label>Anonyma besökare (pin-mätning)</Label>
          <Input
            v-model.number="anonymousCount"
            type="number"
            placeholder="Antal personer"
          />
        </div>
      </CardContent>
      
      <CardFooter>
        <Button @click="saveAttendance">
          Spara närvaro
        </Button>
      </CardFooter>
    </Card>
  </PageLayout>
</template>
```

## 📊 Rapportering & Export

### ReportingStorage.ts
```typescript
export const useReportingStorage = defineStore('reporting', {
  state: () => ({
    currentTenantId: 1
  }),
  
  getters: {
    // KPI-beräkningar
    monthlyStats: (state) => {
      const participantStorage = useParticipantStorage()
      const activityStorage = useActivityStorage()
      
      return {
        uniqueParticipants: participantStorage.activeParticipants.length,
        totalSessions: activityStorage.tenantGroupActivities.length,
        attendanceHours: activityStorage.attendance.length * 2, // Genomsnitt 2h/session
        anonymousVisitors: activityStorage.anonymousAttendance
          .reduce((sum, a) => sum + a.antalPersoner, 0)
      }
    },
    
    // Export-data för Qlik Sense
    exportData: (state) => ({
      participants: useParticipantStorage().tenantParticipants,
      activities: useActivityStorage().tenantGroupActivities,
      attendance: useActivityStorage().attendance,
      anonymousAttendance: useActivityStorage().anonymousAttendance,
      generatedAt: new Date().toISOString(),
      tenantId: state.currentTenantId
    })
  },
  
  actions: {
    // Export till olika format
    async exportToCSV() {
      const data = this.exportData
      // CSV-konvertering och nedladdning
    },
    
    async exportToJSON() {
      const data = this.exportData
      // JSON-export för Qlik Sense API
    },
    
    // Schemalagd export till Qlik Sense
    async scheduleQlikExport() {
      // API-anrop till Qlik Sense med exportData
    }
  }
})
```

## 🔐 Säkerhet & GDPR

### 1. Multi-tenant Säkerhet
- Alla queries filtreras på `tenantId`
- Användarroller begränsade per tenant
- Krypterad lagring av personnummer

### 2. GDPR-compliance
- Automatisk påminnelse om samtycke-förnyelse
- Anonymiseringsfunktion
- Dataportabilitet (export av persondata)
- Rätt till radering

### 3. BankID Integration
```typescript
// BankID-verifiering för känsliga operationer
export interface BankIDVerification {
  participantId: number
  bankIdResult: {
    personalNumber: string
    name: string
    verified: boolean
    timestamp: string
  }
}
```

## 🚀 Implementation Roadmap

### Fas 1: Grundläggande MVP (4-6 veckor)
- [ ] Deltagarregister med CRUD
- [ ] Grundläggande aktivitetshantering
- [ ] Enkel närvaroregistrering
- [ ] Multi-tenant struktur

### Fas 2: QR & Automation (3-4 veckor)
- [ ] QR-kod generering och scanning
- [ ] Automatisk närvaroregistrering
- [ ] Pin-mätning för anonyma besökare

### Fas 3: Rapportering (2-3 veckor)
- [ ] KPI-dashboard
- [ ] Export-funktionalitet
- [ ] Qlik Sense integration

### Fas 4: Avancerade funktioner (4-5 veckor)
- [ ] BankID-integration
- [ ] GDPR-automatisering
- [ ] Avancerad rapportering
- [ ] Mobile app för QR-scanning

Detta system bygger vidare på den befintliga MoxMaster-arkitekturen och kan implementeras stegvis utan att störa nuvarande funktionalitet. 