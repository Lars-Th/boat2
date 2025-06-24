<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus } from 'lucide-vue-next'
import { useNotifications } from '@/composables/useNotifications'
import { useValidation, type ValidationSchema } from '@/composables/useValidation'
import FormField from '@/components/ui/FormField.vue'
import type { Contact } from '@/storages/contactStorage'

const emit = defineEmits<{
  'add-contact': [contact: Omit<Contact, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>]
}>()

// Notification and validation systems
const { success, error } = useNotifications()
const { validateAll, validateField, touchField, clearErrors, getError, isRequired } = useValidation()

// Validation schema for new contact
const validationSchema: ValidationSchema = {
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

// Dialog för ny kontaktperson
const showAddContactDialog = ref(false)
const newContact = ref({
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'Aktiv' as const,
  isMainContact: false
})

const addContactPerson = () => {
  clearErrors()
  showAddContactDialog.value = true
}

const handleFieldBlur = (fieldName: string) => {
  touchField(fieldName)
  if (validationSchema[fieldName as keyof typeof validationSchema]) {
    const config = validationSchema[fieldName as keyof typeof validationSchema]
    const value = newContact.value[fieldName as keyof typeof newContact.value]
    // Only validate string/number values, skip boolean values
    if (typeof value !== 'boolean') {
      validateField(
        fieldName,
        value,
        config.rules,
        config.displayName
      )
    }
  }
}

const saveNewContact = () => {
  const isValid = validateAll(newContact.value, validationSchema)
  
  if (!isValid) {
    Object.keys(validationSchema).forEach(touchField)
    error('Valideringsfel', 'Kontrollera att alla obligatoriska fält är korrekt ifyllda.')
    return
  }

  emit('add-contact', { ...newContact.value })
  
  // Återställ formuläret
  newContact.value = {
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'Aktiv' as const,
    isMainContact: false
  }
  
  clearErrors()
  showAddContactDialog.value = false
  success('Kontaktperson tillagd', 'Den nya kontaktpersonen har lagts till framgångsrikt.')
}
</script>

<template>
  <Dialog v-model:open="showAddContactDialog">
    <DialogTrigger as-child>
      <Button
        class="text-xs h-8"
        @click="addContactPerson"
      >
        <Plus class="h-3 w-3 mr-1" />
        Lägg till kontaktperson
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Lägg till ny kontaktperson</DialogTitle>
        <DialogDescription>
          Fyll i informationen för den nya kontaktpersonen.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <FormField
          label="Namn"
          field-name="name"
          :required="isRequired('name', validationSchema)"
          :error="getError('name')"
          tooltip="Ange kontaktpersonens fullständiga namn"
        >
          <Input
            id="contact-name"
            v-model="newContact.name"
            class="text-xs h-8"
            style="font-size: 12px;"
            placeholder="Förnamn Efternamn"
            @blur="handleFieldBlur('name')"
          />
        </FormField>

        <FormField
          label="Företag"
          field-name="company"
          :error="getError('company')"
          tooltip="Vilket företag kontaktpersonen arbetar för"
        >
          <Input
            id="contact-company"
            v-model="newContact.company"
            class="text-xs h-8"
            style="font-size: 12px;"
            placeholder="Företagsnamn"
            @blur="handleFieldBlur('company')"
          />
        </FormField>

        <FormField
          label="Telefonnummer"
          field-name="phone"
          :error="getError('phone')"
          tooltip="Kontaktpersonens direktnummer eller mobilnummer"
        >
          <Input
            id="contact-phone"
            v-model="newContact.phone"
            class="text-xs h-8"
            style="font-size: 12px;"
            placeholder="070-123 45 67"
            @blur="handleFieldBlur('phone')"
          />
        </FormField>

        <FormField
          label="E-postadress"
          field-name="email"
          :required="isRequired('email', validationSchema)"
          :error="getError('email')"
          tooltip="Kontaktpersonens e-postadress"
        >
          <Input
            id="contact-email"
            v-model="newContact.email"
            type="email"
            class="text-xs h-8"
            style="font-size: 12px;"
            placeholder="namn@företag.se"
            @blur="handleFieldBlur('email')"
          />
        </FormField>

        <div class="grid grid-cols-4 items-center gap-4">
          <Label
            for="contact-main"
            class="text-right text-xs"
          >Huvudkontakt</Label>
          <div class="col-span-3 flex items-center space-x-2">
            <Switch
              id="contact-main"
              v-model:checked="newContact.isMainContact"
            />
            <Label
              for="contact-main"
              class="text-xs text-gray-600"
            >
              Sätt som huvudkontakt
            </Label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="submit"
          class="text-xs h-8"
          @click="saveNewContact"
        >
          Spara kontaktperson
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template> 