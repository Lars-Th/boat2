import { ref, computed } from 'vue'

// Type definitions
export type ValidationRule = 'required' | 'email' | 'phone' | 'organizationNumber' | 'postalCode' | 'website'

export interface FieldConfig {
  rules: ValidationRule[]
  displayName?: string
}

export interface ValidationSchema {
  [fieldName: string]: FieldConfig
}

export interface ValidationErrors {
  [fieldName: string]: string | null
}

export interface TouchedFields {
  [fieldName: string]: boolean
}

export type ValidationRuleFunction = (_value: string | number | null | undefined, _fieldName: string) => string | null

// Global state för validering
const errors = ref<ValidationErrors>({})
const touchedFields = ref<TouchedFields>({})

export function useValidation() {
  // Valideringsregler
  const validationRules: Record<ValidationRule, ValidationRuleFunction> = {
    required: (value: string | number | null | undefined, fieldName: string): string | null => {
      if (!value || value.toString().trim() === '') {
        return `${fieldName} är obligatoriskt`
      }
      return null
    },

    email: (value: string | number | null | undefined, fieldName: string): string | null => {
      if (!value) return null // Om inte required kommer det fångas av required-regeln
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value.toString())) {
        return `${fieldName} måste vara en giltig e-postadress`
      }
      return null
    },

    phone: (value: string | number | null | undefined, fieldName: string): string | null => {
      if (!value) return null
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(value.toString())) {
        return `${fieldName} får endast innehålla siffror, mellanslag och bindestreck`
      }
      return null
    },

    organizationNumber: (value: string | number | null | undefined, fieldName: string): string | null => {
      if (!value) return null
      const orgRegex = /^\d{6}-\d{4}$/
      if (!orgRegex.test(value.toString())) {
        return `${fieldName} måste ha formatet 556123-4567`
      }
      return null
    },

    postalCode: (value: string | number | null | undefined, fieldName: string): string | null => {
      if (!value) return null
      const postalRegex = /^\d{5}$/
      if (!postalRegex.test(value.toString())) {
        return `${fieldName} måste vara 5 siffror`
      }
      return null
    },

    website: (value: string | number | null | undefined, fieldName: string): string | null => {
      if (!value) return null
      const urlRegex = /^https?:\/\/.+\..+/
      if (!urlRegex.test(value.toString())) {
        return `${fieldName} måste vara en giltig webbadress som börjar med http:// eller https://`
      }
      return null
    }
  }

  // Validera ett enskilt fält
  const validateField = (
    fieldName: string, 
    value: string | number | null | undefined, 
    rules: ValidationRule[], 
    displayName?: string
  ): boolean => {
    const fieldDisplayName = displayName || fieldName

    // Rensa tidigare fel för detta fält
    errors.value[fieldName] = null

    // Kör igenom alla regler för fältet
    for (const rule of rules) {
      if (validationRules[rule]) {
        const error = validationRules[rule](value, fieldDisplayName)
        if (error) {
          errors.value[fieldName] = error
          break // Avbryt vid första felet
        }
      }
    }

    return !errors.value[fieldName]
  }

  // Validera alla fält enligt schema
  const validateAll = (data: Record<string, unknown>, schema: ValidationSchema): boolean => {
    let isValid = true

    Object.keys(schema).forEach(fieldName => {
      const fieldConfig = schema[fieldName]
      const value = data[fieldName]
      
      touchedFields.value[fieldName] = true
      
      const fieldIsValid = validateField(
        fieldName,
        value as string | number | null | undefined,
        fieldConfig.rules,
        fieldConfig.displayName
      )
      
      if (!fieldIsValid) {
        isValid = false
      }
    })

    return isValid
  }

  // Markera fält som "touched"
  const touchField = (fieldName: string): void => {
    touchedFields.value[fieldName] = true
  }

  // Kontrollera om fält har fel
  const hasError = (fieldName: string): boolean => {
    return touchedFields.value[fieldName] && !!errors.value[fieldName]
  }

  // Hämta felmeddelande för fält
  const getError = (fieldName: string): string | null => {
    return hasError(fieldName) ? errors.value[fieldName] : null
  }

  // Kontrollera om fält är obligatoriskt
  const isRequired = (fieldName: string, schema: ValidationSchema): boolean => {
    return schema[fieldName]?.rules?.includes('required') || false
  }

  // Rensa alla fel
  const clearErrors = (): void => {
    errors.value = {}
    touchedFields.value = {}
  }

  // Rensa fel för specifikt fält
  const clearFieldError = (fieldName: string): void => {
    errors.value[fieldName] = null
    touchedFields.value[fieldName] = false
  }

  // Computed properties
  const hasAnyErrors = computed(() => {
    return Object.values(errors.value).some(error => error !== null)
  })

  const allErrors = computed(() => {
    return Object.entries(errors.value)
      .filter(([, error]) => error !== null)
      .reduce((acc: ValidationErrors, [field, error]) => {
        acc[field] = error
        return acc
      }, {})
  })

  return {
    // Validering
    validateField,
    validateAll,
    
    // State management
    touchField,
    clearErrors,
    clearFieldError,
    
    // Getters
    hasError,
    getError,
    isRequired,
    hasAnyErrors,
    allErrors
  }
} 