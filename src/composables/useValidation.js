import { ref, computed } from 'vue'

// Global state för validering
const errors = ref({})
const touchedFields = ref({})

export function useValidation() {
  // Valideringsregler
  const validationRules = {
    required: (value, fieldName) => {
      if (!value || value.toString().trim() === '') {
        return `${fieldName} är obligatoriskt`
      }
      return null
    },

    email: (value, fieldName) => {
      if (!value) return null // Om inte required kommer det fångas av required-regeln
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return `${fieldName} måste vara en giltig e-postadress`
      }
      return null
    },

    phone: (value, fieldName) => {
      if (!value) return null
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(value)) {
        return `${fieldName} får endast innehålla siffror, mellanslag och bindestreck`
      }
      return null
    },

    organizationNumber: (value, fieldName) => {
      if (!value) return null
      const orgRegex = /^\d{6}-\d{4}$/
      if (!orgRegex.test(value)) {
        return `${fieldName} måste ha formatet 556123-4567`
      }
      return null
    },

    postalCode: (value, fieldName) => {
      if (!value) return null
      const postalRegex = /^\d{5}$/
      if (!postalRegex.test(value)) {
        return `${fieldName} måste vara 5 siffror`
      }
      return null
    },

    website: (value, fieldName) => {
      if (!value) return null
      const urlRegex = /^https?:\/\/.+\..+/
      if (!urlRegex.test(value)) {
        return `${fieldName} måste vara en giltig webbadress som börjar med http:// eller https://`
      }
      return null
    }
  }

  // Validera ett enskilt fält
  const validateField = (fieldName, value, rules, displayName) => {
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
  const validateAll = (data, schema) => {
    let isValid = true

    Object.keys(schema).forEach(fieldName => {
      const fieldConfig = schema[fieldName]
      const value = data[fieldName]
      
      touchedFields.value[fieldName] = true
      
      const fieldIsValid = validateField(
        fieldName,
        value,
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
  const touchField = (fieldName) => {
    touchedFields.value[fieldName] = true
  }

  // Kontrollera om fält har fel
  const hasError = (fieldName) => {
    return touchedFields.value[fieldName] && errors.value[fieldName]
  }

  // Hämta felmeddelande för fält
  const getError = (fieldName) => {
    return hasError(fieldName) ? errors.value[fieldName] : null
  }

  // Kontrollera om fält är obligatoriskt
  const isRequired = (fieldName, schema) => {
    return schema[fieldName]?.rules?.includes('required') || false
  }

  // Rensa alla fel
  const clearErrors = () => {
    errors.value = {}
    touchedFields.value = {}
  }

  // Rensa fel för specifikt fält
  const clearFieldError = (fieldName) => {
    errors.value[fieldName] = null
    touchedFields.value[fieldName] = false
  }

  // Computed properties
  const hasAnyErrors = computed(() => {
    return Object.values(errors.value).some(error => error !== null)
  })

  const allErrors = computed(() => {
    return Object.entries(errors.value)
      .filter(([_, error]) => error !== null)
      .reduce((acc, [field, error]) => {
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