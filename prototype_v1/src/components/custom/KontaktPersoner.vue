<template>
  <div>
    <!-- Kontaktpersoner sektion header -->
    <div class="mt-12">
      <Separator class="mb-6" />
      <div class="flex items-center justify-between mb-6 px-6">
        <h2 class="text-lg font-semibold">
          Kontaktpersoner
        </h2>
        <div class="flex items-center space-x-4">
          <!-- View Mode Toggle -->
          <div class="flex space-x-2">
            <Button
              :variant="viewMode === 'cards' ? 'default' : 'outline'"
              size="sm"
              class="text-xs h-8"
              @click="viewMode = 'cards'"
            >
              <LayoutGrid class="w-3 h-3 mr-1" />
              Kort
            </Button>
            <Button
              :variant="viewMode === 'list' ? 'default' : 'outline'"
              size="sm"
              class="text-xs h-8"
              @click="viewMode = 'list'"
            >
              <List class="w-3 h-3 mr-1" />
              Lista
            </Button>
          </div>
          
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
        </div>
      </div>
    </div>

    <!-- Card View -->
    <div
      v-if="viewMode === 'cards'"
      class="px-6"
    >
      <div
        v-if="contactPersons.length === 0"
        class="text-center py-8"
      >
        <p class="text-muted-foreground text-sm">
          Inga kontaktpersoner registrerade.
        </p>
      </div>
      
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Card
          v-for="person in contactPersons"
          :key="person.id"
          class="hover:shadow-md transition-shadow"
        >
          <CardHeader class="pb-3">
            <div class="flex justify-between items-start">
              <CardTitle class="text-sm">
                {{ person.name }}
              </CardTitle>
              <Badge 
                v-if="person.isMainContact" 
                variant="secondary" 
                class="text-xs px-2 py-0 bg-green-100 text-green-700 border border-green-200"
              >
                <Star class="h-3 w-3 mr-1 text-green-600 fill-green-600" />
                Huvudkontakt
              </Badge>
            </div>
            <CardDescription class="text-xs">
              {{ person.company || 'Inget företag angivet' }}
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="text-xs space-y-1">
              <p><strong>Företag:</strong> {{ person.company || 'Ej specificerat' }}</p>
              <p>
                <strong>Telefon:</strong> 
                <a
                  v-if="person.phone"
                  :href="`tel:${person.phone}`"
                  class="text-blue-600 hover:underline ml-1"
                >
                  {{ person.phone }}
                </a>
                <span
                  v-else
                  class="text-gray-500 ml-1"
                >Ej angivet</span>
              </p>
              <p>
                <strong>E-post:</strong> 
                <a
                  :href="`mailto:${person.email}`"
                  class="text-blue-600 hover:underline ml-1"
                >
                  {{ person.email }}
                </a>
              </p>
            </div>
            <div class="flex space-x-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                class="flex-1 text-xs h-7"
                @click="editContactPerson(person)"
              >
                <Edit class="w-3 h-3 mr-1" />
                Ändra
              </Button>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    variant="outline"
                    size="sm"
                    class="text-xs h-7"
                    @click="sendEmail(person.email)"
                  >
                    <Mail class="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skicka e-post</p>
                </TooltipContent>
              </Tooltip>
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <Button
                        variant="outline"
                        size="sm"
                        class="text-xs h-7 text-red-600 hover:text-red-800"
                        :disabled="person.isMainContact"
                        :class="{ 'opacity-50 cursor-not-allowed': person.isMainContact }"
                      >
                        <Trash2 class="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{{ person.isMainContact ? 'Kan inte ta bort huvudkontakt' : 'Ta bort kontaktperson' }}</p>
                    </TooltipContent>
                  </Tooltip>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ta bort kontaktperson</AlertDialogTitle>
                    <AlertDialogDescription>
                      Är du säker på att du vill ta bort {{ person.name }} från kontaktlistan? 
                      Denna åtgärd kan inte ångras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel class="text-xs h-8">
                      Avbryt
                    </AlertDialogCancel>
                    <AlertDialogAction 
                      class="text-xs h-8 bg-red-600 hover:bg-red-700"
                      @click="deleteContactPerson(person.id, person.name)"
                    >
                      Ta bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- List View - Kontaktpersonstabell - full bredd som kundlistan -->
    <TooltipProvider v-if="viewMode === 'list'">
      <div class="border-t border-gray-200">
        <Table>
          <TableHeader class="bg-gray-100 border-t border-gray-300">
            <TableRow>
              <TableHead class="bg-gray-100 text-xs">
                Namn
              </TableHead>
              <TableHead class="bg-gray-100 text-xs">
                Företag
              </TableHead>
              <TableHead class="bg-gray-100 text-xs">
                Telefon
              </TableHead>
              <TableHead class="bg-gray-100 text-xs">
                Huvudkontakt
              </TableHead>
              <TableHead class="bg-gray-100 text-xs text-right">
                Åtgärder
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="person in contactPersons" 
              :key="person.id" 
              class="hover:bg-gray-50"
            >
              <TableCell class="text-xs font-medium text-slate-700">
                {{ person.name }}
              </TableCell>
              <TableCell class="text-xs">
                {{ person.company }}
              </TableCell>
              <TableCell class="text-xs">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <a
                      :href="`tel:${person.phone}`"
                      class="text-blue-600 hover:underline"
                    >
                      {{ person.phone }}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ring {{ person.name }}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell class="text-xs">
                <Badge 
                  v-if="person.isMainContact" 
                  variant="secondary" 
                  class="text-xs px-2 py-0 bg-green-100 text-green-700 border border-green-200"
                >
                  <Star class="h-3 w-3 mr-1 text-green-600 fill-green-600" />
                  Ja
                </Badge>
                <span
                  v-else
                  class="text-xs text-gray-500"
                >-</span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex justify-end space-x-2">
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        class="p-1 text-green-600 hover:text-green-800"
                        @click="editContactPerson(person)"
                      >
                        <Edit class="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ändra {{ person.name }}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <button
                        class="p-1 text-blue-600 hover:text-blue-800"
                        @click="sendEmail(person.email)"
                      >
                        <Mail class="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Skicka e-post till {{ person.name }}</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <AlertDialog>
                    <AlertDialogTrigger as-child>
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            class="p-1 text-red-600 hover:text-red-800"
                            :disabled="person.isMainContact"
                            :class="{ 'opacity-50 cursor-not-allowed': person.isMainContact }"
                          >
                            <Trash2 class="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{{ person.isMainContact ? 'Kan inte ta bort huvudkontakt' : `Ta bort ${person.name}` }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Ta bort kontaktperson</AlertDialogTitle>
                        <AlertDialogDescription>
                          Är du säker på att du vill ta bort {{ person.name }} från kontaktlistan? 
                          Denna åtgärd kan inte ångras.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel class="text-xs h-8">
                          Avbryt
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          class="text-xs h-8 bg-red-600 hover:bg-red-700"
                          @click="deleteContactPerson(person.id, person.name)"
                        >
                          Ta bort
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div class="border-b border-gray-300" />
      </div>
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Plus, Mail, Trash2, Star, LayoutGrid, List, Edit } from 'lucide-vue-next'
import type { Contact } from '@/storages/contactStorage'
import { useNotifications } from '@/composables/useNotifications'
import { useValidation, type ValidationSchema } from '@/composables/useValidation'
import FormField from '@/components/ui/FormField.vue'

interface Props {
  contactPersons: Contact[]
}

defineProps<Props>()

const emit = defineEmits<{
  'add-contact': [contact: Omit<Contact, 'id' | 'customerId'>]
  'delete-contact': [id: number, name: string]
  'send-email': [email: string]
  'edit-contact': [person: Contact]
}>()

// View mode state
const viewMode = ref<'cards' | 'list'>('list')

// Notification and validation systems
const { success, error } = useNotifications()
const { validateAll, validateField, touchField, getError, isRequired, clearErrors } = useValidation()

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

const sendEmail = (email: string) => {
  emit('send-email', email)
}

const deleteContactPerson = (id: number, name: string) => {
  emit('delete-contact', id, name)
}

const editContactPerson = (person: Contact) => {
  emit('edit-contact', person)
}
</script> 