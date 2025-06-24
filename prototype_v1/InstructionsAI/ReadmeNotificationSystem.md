# Notifikations- och Valideringssystem

Detta dokument beskriver det omfattande notifikations- och valideringssystemet som implementerats i Vue.js-applikationen. Systemet består av två huvudkomponenter som arbetar tillsammans för att skapa en professionell användarupplevelse.

## 📋 Innehållsförteckning

1. [Notifikationssystem](#notifikationssystem)
2. [Valideringssystem](#valideringssystem)
3. [Integration mellan systemen](#integration-mellan-systemen)
4. [Implementeringsguide](#implementeringsguide)
5. [API-referens](#api-referens)
6. [Bästa praxis](#bästa-praxis)
7. [Exempel och användning](#exempel-och-användning)

---

## 🔔 Notifikationssystem

### Översikt
Ett avancerat notifikationssystem som stöder olika typer av meddelanden, kontextuell hantering och automatisk rensning.

### Funktioner
- **Fyra notifikationstyper**: Success, Error, Warning, Info
- **Kontextuell hantering**: Lokala vs globala notifikationer
- **Automatisk rensning**: Lokala notifikationer försvinner vid sidnavigering
- **Bekräftelsedialoger**: Interaktiva bekräftelser med anpassningsbara knappar
- **Visuell feedback**: Färgkodade ikoner och animationer
- **Stackning**: Flera notifikationer visas vertikalt

### Arkitektur

#### Kärnkomponenter
```
src/composables/useNotifications.js    # Huvudlogik och state management
src/composables/useToast.js           # Enkel wrapper för bakåtkompatibilitet
src/components/ui/Toast.vue           # Enskild notifikationskomponent
src/components/ui/ToastContainer.vue  # Container för alla notifikationer
```

#### Notifikationstyper
- **Success** 🟢: Framgångsrika operationer
- **Error** 🔴: Fel och problem
- **Warning** 🟡: Varningar och uppmärksamhet
- **Info** 🔵: Informativa meddelanden

#### Kontextuell hantering
- **Lokala notifikationer**: Försvinner vid sidnavigering (varningar, temporära meddelanden)
- **Globala notifikationer**: Kvarstår tills användaren stänger dem (viktiga bekräftelser)

---

## ✅ Valideringssystem

### Översikt
Ett omfattande valideringssystem med visuella indikatorer, tooltips och realtidsvalidering.

### Funktioner
- **Visuella indikatorer**: Röda asterisker för obligatoriska fält
- **Tooltips**: Hjälpsamma förklaringar för varje fält
- **Realtidsvalidering**: Validering vid fältändring och blur
- **Felmeddelanden**: Tydliga, användarspecifika felmeddelanden
- **Visuell feedback**: Röda ramar och ikoner för fel
- **Flexibel konfiguration**: Schema-baserad validering

### Arkitektur

#### Kärnkomponenter
```
src/composables/useValidation.js      # Valideringslogik och regler
src/components/ui/FormField.vue       # Återanvändbar fältkomponent
```

#### Valideringsregler
- **required**: Obligatoriska fält
- **email**: Giltig e-postadress
- **phone**: Telefonnummer (siffror, mellanslag, bindestreck)
- **organizationNumber**: Svenskt organisationsnummer (556123-4567)
- **postalCode**: 5-siffrigt postnummer
- **website**: Giltig webbadress

#### FormField-komponenten
```vue
<FormField
  label="E-postadress"
  field-name="email"
  :required="true"
  :error="getError('email')"
  tooltip="Ange en giltig e-postadress"
>
  <Input v-model="formData.email" />
</FormField>
```

---

## 🔗 Integration mellan systemen

### Hur systemen arbetar tillsammans

1. **Valideringsfel** → **Error-notifikationer**
2. **Framgångsrik validering** → **Success-notifikationer**
3. **Osparade ändringar** → **Warning-notifikationer**
4. **Bekräftelser** → **Confirm-dialoger**

### Exempel på integration
```javascript
const saveForm = () => {
  // Validera formulär
  const isValid = validateAll(formData.value, validationSchema)
  
  if (!isValid) {
    // Visa valideringsfel
    error('Valideringsfel', 'Kontrollera att alla fält är korrekt ifyllda.')
    return
  }
  
  // Spara data
  try {
    // API-anrop här...
    globalSuccess('Sparat!', 'Dina ändringar har sparats.')
  } catch (err) {
    error('Fel', 'Kunde inte spara ändringar.')
  }
}
```

---

## 🛠 Implementeringsguide

### Steg 1: Grundläggande setup

#### Installera i App.vue
```vue
<template>
  <div id="app">
    <!-- Din app-innehåll -->
    <RouterView />
    
    <!-- Notifikationscontainer -->
    <ToastContainer />
  </div>
</template>

<script setup>
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>
```

### Steg 2: Använd notifikationer

```javascript
import { useNotifications } from '@/composables/useNotifications'

const { success, error, warning, info, confirm } = useNotifications()

// Enkla notifikationer
success('Titel', 'Meddelande')
error('Fel', 'Något gick fel')
warning('Varning', 'Kontrollera detta')
info('Info', 'Bra att veta')

// Bekräftelsedialog
const confirmed = await confirm(
  'Ta bort kund',
  'Är du säker på att du vill ta bort denna kund?',
  {
    confirmText: 'Ta bort',
    cancelText: 'Avbryt',
    confirmVariant: 'destructive'
  }
)
```

### Steg 3: Implementera validering

#### Skapa valideringsschema
```javascript
const validationSchema = {
  email: {
    rules: ['required', 'email'],
    displayName: 'E-postadress'
  },
  phone: {
    rules: ['phone'],
    displayName: 'Telefonnummer'
  }
}
```

#### Använd validering i komponenter
```javascript
import { useValidation } from '@/composables/useValidation'

const {
  validateAll,
  validateField,
  touchField,
  hasError,
  getError,
  isRequired
} = useValidation()

// Validera enskilt fält
const handleFieldBlur = (fieldName) => {
  touchField(fieldName)
  validateField(
    fieldName,
    formData.value[fieldName],
    validationSchema[fieldName].rules,
    validationSchema[fieldName].displayName
  )
}

// Validera hela formuläret
const submitForm = () => {
  const isValid = validateAll(formData.value, validationSchema)
  if (!isValid) {
    error('Valideringsfel', 'Kontrollera alla fält.')
    return
  }
  // Fortsätt med sparande...
}
```

---

## 📚 API-referens

### useNotifications

#### Metoder
```javascript
// Lokala notifikationer (försvinner vid navigering)
success(title, message)
error(title, message)
warning(title, message)
info(title, message)

// Globala notifikationer (kvarstår)
globalSuccess(title, message)
globalError(title, message)
globalWarning(title, message)
globalInfo(title, message)

// Bekräftelsedialog
confirm(title, message, options)

// Hantering
clearLocalNotificationsOfType(type)
clearAllNotifications()
```

#### Confirm-alternativ
```javascript
{
  confirmText: 'OK',           // Text på bekräftelseknapp
  cancelText: 'Avbryt',        // Text på avbryt-knapp
  confirmVariant: 'default'    // 'default' | 'destructive'
}
```

### useValidation

#### Metoder
```javascript
// Validering
validateField(fieldName, value, rules, displayName)
validateAll(data, schema)

// State management
touchField(fieldName)
clearErrors()
clearFieldError(fieldName)

// Getters
hasError(fieldName)
getError(fieldName)
isRequired(fieldName, schema)
hasAnyErrors        // computed
allErrors          // computed
```

#### Valideringsregler
```javascript
'required'           // Obligatoriskt fält
'email'             // Giltig e-postadress
'phone'             // Telefonnummer
'organizationNumber' // Svenskt org.nr (556123-4567)
'postalCode'        // 5-siffrigt postnummer
'website'           // Giltig webbadress
```

### FormField

#### Props
```javascript
{
  label: string,           // Fältets label
  fieldName: string,       // Unikt namn för fältet
  required?: boolean,      // Om fältet är obligatoriskt
  error?: string | null,   // Felmeddelande
  tooltip?: string,        // Tooltip-text
  description?: string     // Beskrivning under fältet
}
```

---

## 💡 Bästa praxis

### Notifikationer

#### ✅ Gör så här
- Använd **lokala** notifikationer för temporära meddelanden
- Använd **globala** notifikationer för viktiga bekräftelser
- Skriv tydliga, användarspecifika meddelanden
- Använd rätt typ för rätt situation

#### ❌ Undvik detta
- Överanvänd notifikationer
- Visa tekniska felmeddelanden för användare
- Använd globala notifikationer för allt

### Validering

#### ✅ Gör så här
- Markera obligatoriska fält med asterisker
- Ge hjälpsamma tooltips
- Validera vid blur för bättre UX
- Skriv tydliga felmeddelanden

#### ❌ Undvik detta
- Validera vid varje tangenttryckning
- Visa fel innan användaren är klar
- Använd tekniska felmeddelanden

### Integration

#### ✅ Gör så här
- Kombinera validering med notifikationer
- Använd lokala varningar för osparade ändringar
- Visa globala bekräftelser för viktiga operationer
- Rensa valideringsfel efter framgångsrik sparning

---

## 🎯 Exempel och användning

### Komplett formulärexempel

```vue
<script setup>
import { ref } from 'vue'
import { useValidation } from '@/composables/useValidation'
import { useNotifications } from '@/composables/useNotifications'
import FormField from '@/components/ui/FormField.vue'

const { validateAll, touchField, hasError, getError, isRequired } = useValidation()
const { success, error, warning } = useNotifications()

const formData = ref({
  name: '',
  email: '',
  phone: ''
})

const validationSchema = {
  name: {
    rules: ['required'],
    displayName: 'Namn'
  },
  email: {
    rules: ['required', 'email'],
    displayName: 'E-postadress'
  },
  phone: {
    rules: ['phone'],
    displayName: 'Telefonnummer'
  }
}

const hasChanges = ref(false)

const handleFieldChange = (fieldName) => {
  if (!hasChanges.value) {
    hasChanges.value = true
    warning('Osparade ändringar', 'Kom ihåg att spara dina ändringar')
  }
}

const handleFieldBlur = (fieldName) => {
  touchField(fieldName)
  validateField(
    fieldName,
    formData.value[fieldName],
    validationSchema[fieldName].rules,
    validationSchema[fieldName].displayName
  )
}

const saveForm = () => {
  const isValid = validateAll(formData.value, validationSchema)
  
  if (!isValid) {
    Object.keys(validationSchema).forEach(touchField)
    error('Valideringsfel', 'Kontrollera att alla fält är korrekt ifyllda.')
    return
  }

  // Spara data
  success('Sparat!', 'Formuläret har sparats framgångsrikt.')
  hasChanges.value = false
}
</script>

<template>
  <form @submit.prevent="saveForm">
    <FormField
      label="Namn"
      field-name="name"
      :required="isRequired('name', validationSchema)"
      :error="getError('name')"
      tooltip="Ange ditt fullständiga namn"
    >
      <Input
        v-model="formData.name"
        @input="() => handleFieldChange('name')"
        @blur="() => handleFieldBlur('name')"
        :class="hasError('name') ? 'border-red-300' : ''"
      />
    </FormField>

    <FormField
      label="E-postadress"
      field-name="email"
      :required="isRequired('email', validationSchema)"
      :error="getError('email')"
      tooltip="Ange en giltig e-postadress"
    >
      <Input
        v-model="formData.email"
        @input="() => handleFieldChange('email')"
        @blur="() => handleFieldBlur('email')"
        type="email"
        :class="hasError('email') ? 'border-red-300' : ''"
      />
    </FormField>

    <Button type="submit" :disabled="!hasChanges">
      Spara
    </Button>
  </form>
</template>
```

### Kunddetaljer med full integration

Se `src/components/views/CustomerDetails.vue` för ett komplett exempel på hur notifikations- och valideringssystemet används tillsammans i en riktig applikation.

### Demo och testning

- **Notifikationsdemo**: `/demo` - Testa alla notifikationstyper
- **Valideringsdemo**: `/validation-demo` - Testa valideringssystemet

---

## 🔧 Teknisk implementation

### Filstruktur
```
src/
├── composables/
│   ├── useNotifications.js    # Notifikationslogik
│   ├── useToast.js           # Bakåtkompatibilitet
│   └── useValidation.js      # Valideringslogik
├── components/ui/
│   ├── Toast.vue             # Enskild notifikation
│   ├── ToastContainer.vue    # Notifikationscontainer
│   └── FormField.vue         # Valideringsfält
└── components/views/
    ├── CustomerDetails.vue   # Komplett exempel
    ├── NotificationDemo.vue  # Notifikationsdemo
    └── ValidationDemo.vue    # Valideringsdemo
```

### State management
- **Notifikationer**: Reaktiv array med automatisk rensning
- **Validering**: Reaktiva objekt för fel och touched-state
- **Router integration**: Automatisk rensning vid sidnavigering

### Styling
- **Tailwind CSS**: Konsekvent styling
- **Färgkodning**: Semantiska färger för olika typer
- **Animationer**: Smooth in/out-animationer
- **Responsiv design**: Fungerar på alla skärmstorlekar

---

## 📈 Framtida förbättringar

### Planerade funktioner
- [ ] Undo-funktionalitet för notifikationer
- [ ] Bulk-validering för stora formulär
- [ ] Anpassade valideringsregler per projekt
- [ ] Internationalisering (i18n) för felmeddelanden
- [ ] Accessibility-förbättringar
- [ ] Offline-stöd för validering

### Möjliga utökningar
- [ ] Toast-positionering (top, bottom, corners)
- [ ] Ljudnotifikationer
- [ ] Push-notifikationer
- [ ] E-postvalidering med API
- [ ] Async-validering
- [ ] Formulärautosparning

---

Detta system ger en professionell och användarvänlig upplevelse för alla formulär och användarinteraktioner i applikationen. Genom att kombinera tydlig validering med informativa notifikationer skapas en robust grund för användarinteraktion. 