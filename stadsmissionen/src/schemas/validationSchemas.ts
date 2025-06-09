// Validation schemas for consistent data validation across the application

export const activityValidationSchema = {
  namn: { 
    rules: ['required'], 
    displayName: 'Aktivitetsnamn' 
  },
  beskrivning: { 
    rules: [], 
    displayName: 'Beskrivning' 
  },
  startDatum: { 
    rules: ['required'], 
    displayName: 'Startdatum' 
  },
  startTid: { 
    rules: ['required'], 
    displayName: 'Starttid' 
  },
  varaktighet: { 
    rules: ['required', 'numeric'], 
    displayName: 'Varaktighet' 
  },
  plats: { 
    rules: [], 
    displayName: 'Plats' 
  },
  enhet: { 
    rules: ['required'], 
    displayName: 'Enhet' 
  }
}

export const participantValidationSchema = {
  fornamn: { 
    rules: ['required'], 
    displayName: 'Förnamn' 
  },
  efternamn: { 
    rules: ['required'], 
    displayName: 'Efternamn' 
  },
  personnummer: { 
    rules: [], 
    displayName: 'Personnummer' 
  },
  telefon: { 
    rules: ['phone'], 
    displayName: 'Telefon' 
  },
  epost: { 
    rules: ['email'], 
    displayName: 'E-post' 
  },
  adress: { 
    rules: [], 
    displayName: 'Adress' 
  },
  postnummer: { 
    rules: ['postalCode'], 
    displayName: 'Postnummer' 
  },
  ort: { 
    rules: [], 
    displayName: 'Ort' 
  }
}

export const userValidationSchema = {
  namn: { 
    rules: ['required'], 
    displayName: 'Namn' 
  },
  epost: { 
    rules: ['required', 'email'], 
    displayName: 'E-post' 
  },
  losenord: { 
    rules: ['required'], 
    displayName: 'Lösenord' 
  },
  roller: { 
    rules: ['required'], 
    displayName: 'Roller' 
  },
  enheter: { 
    rules: ['required'], 
    displayName: 'Enheter' 
  },
  organisationId: { 
    rules: ['required'], 
    displayName: 'Organisation' 
  }
}

export const organizationValidationSchema = {
  namn: { 
    rules: ['required'], 
    displayName: 'Organisationsnamn' 
  },
  'kontaktuppgifter.epost': { 
    rules: ['email'], 
    displayName: 'E-post' 
  },
  'kontaktuppgifter.telefon': { 
    rules: ['phone'], 
    displayName: 'Telefon' 
  },
  'kontaktuppgifter.postnummer': { 
    rules: ['postalCode'], 
    displayName: 'Postnummer' 
  },
  'kontaktuppgifter.webbplats': { 
    rules: ['website'], 
    displayName: 'Webbplats' 
  }
}

export const activityTemplateValidationSchema = {
  namn: { 
    rules: ['required'], 
    displayName: 'Mallnamn' 
  },
  beskrivning: { 
    rules: ['required'], 
    displayName: 'Beskrivning' 
  },
  malltyp: { 
    rules: ['required'], 
    displayName: 'Malltyp' 
  },
  standardVaraktighet: { 
    rules: ['numeric'], 
    displayName: 'Standard varaktighet' 
  }
}

export const participantGroupValidationSchema = {
  namn: { 
    rules: ['required'], 
    displayName: 'Gruppnamn' 
  },
  beskrivning: { 
    rules: [], 
    displayName: 'Beskrivning' 
  },
  enheter: { 
    rules: ['required'], 
    displayName: 'Enheter' 
  }
}

export const loginValidationSchema = {
  epost: { 
    rules: ['required', 'email'], 
    displayName: 'E-post' 
  },
  losenord: { 
    rules: ['required'], 
    displayName: 'Lösenord' 
  }
}

// Custom validation rules for specific business logic
export const customValidationRules = {
  personnummer: (value: unknown): string | null => {
    if (!value) return null
    const str = String(value).replace(/\D/g, '')
    
    // Swedish personal number format: YYYYMMDDXXXX or YYMMDDXXXX
    if (str.length !== 10 && str.length !== 12) {
      return 'Personnummer måste vara 10 eller 12 siffror'
    }
    
    // Basic date validation for YYMMDD or YYYYMMDD
    const dateStr = str.length === 12 ? str.substring(0, 8) : '20' + str.substring(0, 6)
    const year = parseInt(dateStr.substring(0, 4))
    const month = parseInt(dateStr.substring(4, 6))
    const day = parseInt(dateStr.substring(6, 8))
    
    if (month < 1 || month > 12) {
      return 'Ogiltigt månadstal i personnummer'
    }
    
    if (day < 1 || day > 31) {
      return 'Ogiltigt datumstal i personnummer'
    }
    
    const currentYear = new Date().getFullYear()
    if (year < 1900 || year > currentYear) {
      return 'Ogiltigt årtal i personnummer'
    }
    
    return null
  },

  activityTime: (value: unknown): string | null => {
    if (!value) return null
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(String(value))) {
      return 'Tid måste ha formatet HH:MM (t.ex. 14:30)'
    }
    return null
  },

  activityDuration: (value: unknown): string | null => {
    if (!value) return null
    const duration = Number(value)
    if (isNaN(duration) || duration <= 0 || duration > 1440) {
      return 'Varaktighet måste vara mellan 1 och 1440 minuter'
    }
    return null
  },

  futureDate: (value: unknown): string | null => {
    if (!value) return null
    const date = new Date(String(value))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) {
      return 'Datum kan inte vara i det förflutna'
    }
    return null
  },

  maxParticipants: (value: unknown): string | null => {
    if (!value) return null
    const num = Number(value)
    if (isNaN(num) || num < 1 || num > 1000) {
      return 'Max deltagare måste vara mellan 1 och 1000'
    }
    return null
  }
}

// Type-safe validation schema type
export interface ValidationSchema {
  [fieldName: string]: {
    rules: string[]
    displayName: string
  }
}

// Helper function to validate nested object properties
export const validateNestedProperty = (
  obj: Record<string, unknown>, 
  path: string
): unknown => {
  return path.split('.').reduce((current: unknown, key: string): unknown => {
    return current && typeof current === 'object' && current !== null ? 
      (current as Record<string, unknown>)[key] : undefined
  }, obj as unknown)
} 