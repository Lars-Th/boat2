<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/composables/useNotifications'
import { Building2, User } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import StatusNotification from '@/components/custom/StatusNotification.vue'
import { useCustomerStorage} from '@/storages/CustomerStorage'
import { useContactStorage, type Contact } from '@/storages/contactStorage'
import ContactPersonsTable from '../components/custom/ContactPersonsTable.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BreadcrumbItem {
  label: string
  to?: string | { name: string; params?: Record<string, any> }
  isCurrentPage?: boolean
}

const route = useRoute()
const router = useRouter()
const { success: notificationSuccess, error: notificationError, confirm } = useNotifications()
const customerStore = useCustomerStorage()
const contactStore = useContactStorage()

// =============================================================================
// REACTIVE DATA USING SEPARATED STORES
// =============================================================================

// Get contact person data
const contact = computed(() => contactStore.getContactById(Number(route.params.id)))

// Get the customer this contact belongs to
const customer = computed(() => {
  if (!contact.value) return null
  return customerStore.getCustomerById(contact.value.customerId)
})

// Get other contacts from the same customer
const relatedContacts = computed(() => {
  if (!contact.value) return []
  return contactStore.getContactsByCustomerId(contact.value.customerId)
    .filter(c => c.id !== contact.value?.id)
})

// Get main contact for this customer
const customerMainContact = computed(() => {
  if (!contact.value) return null
  return contactStore.getMainContactByCustomerId(contact.value.customerId)
})

// Functional breadcrumbs
const breadcrumbs = computed((): BreadcrumbItem[] => [
  { label: 'Home', to: '/' },
  { label: 'Kontaktpersoner', to: '/contacts' },
  { label: contact.value?.name || 'Kontaktdetaljer', isCurrentPage: true }
])

// Action buttons
const actionButtons = computed(() => [
  {
    label: 'Spara nu',
    onClick: saveChanges,
    disabled: !hasChanges.value || contactStore.loading,
    class: 'text-xs h-8'
  },
  {
    label: 'Återställ',
    onClick: resetChanges,
    disabled: !hasChanges.value || contactStore.loading,
    variant: 'outline' as const,
    class: 'text-xs h-8'
  },
  {
    label: 'Tillbaka till kontaktlista',
    onClick: goBack,
    variant: 'outline' as const,
    class: 'text-xs h-8'
  },
  {
    label: 'Visa kund',
    onClick: viewCustomer,
    variant: 'outline' as const,
    class: 'text-xs h-8'
  }
])

const editedContact = ref<Contact | null>(contact.value ? { ...contact.value } : null)
const hasChanges = ref(false)
const showSaveConfirmation = ref(false)
const showEditDialog = ref(false)
const dialogEditedContact = ref<Contact | null>(null)

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

onMounted(() => {
  if (!contact.value) {
    router.push('/contacts')
  } else {
    editedContact.value = { ...contact.value }
  }
})

// =============================================================================
// NAVIGATION METHODS
// =============================================================================

const goBack = () => {
  router.push('/contacts')
}

const viewCustomer = () => {
  if (customer.value) {
    router.push(`/customers/${customer.value.id}`)
  }
}

// =============================================================================
// CONTACT DATA MANAGEMENT
// =============================================================================

const handleFieldChange = () => {
  hasChanges.value = true
}

const saveChanges = async () => {
  try {
    if (editedContact.value && contact.value) {
      // Basic validation
      if (!editedContact.value.name || editedContact.value.name.trim() === '') {
        notificationError('Valideringsfel', 'Namn är obligatoriskt.')
        return
      }

      if (editedContact.value.email && editedContact.value.email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(editedContact.value.email)) {
          notificationError('Valideringsfel', 'E-postadress har felaktigt format.')
          return
        }
      }

      // Update contact using contact store
      const result = await contactStore.updateContact(editedContact.value)
      
      if (result.success) {
        hasChanges.value = false
        showSaveConfirmation.value = true
        notificationSuccess('Ändringarna sparade', 'Kontaktuppgifterna har uppdaterats framgångsrikt.')
        
        setTimeout(() => {
          showSaveConfirmation.value = false
        }, 4000)
      } else {
        notificationError('Fel vid sparande', result.error || 'Kunde inte spara ändringarna.')
      }
    }
  } catch {
    notificationError('Fel vid sparande', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const resetChanges = () => {
  if (contact.value) {
    editedContact.value = { ...contact.value }
    hasChanges.value = false
    showSaveConfirmation.value = true
    
    setTimeout(() => {
      showSaveConfirmation.value = false
    }, 3000)
  }
}

const handleFieldBlur = (fieldName: string) => {
  // Basic validation on blur
  if (fieldName === 'name' && editedContact.value) {
    if (!editedContact.value.name || editedContact.value.name.trim() === '') {
      // Field is empty, but we'll handle this in save validation
    }
  }
  
  if (fieldName === 'email' && editedContact.value?.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editedContact.value.email)) {
      // Invalid email format, but we'll handle this in save validation
    }
  }
}

// =============================================================================
// CONTACT ACTIONS
// =============================================================================

const setAsMainContact = async () => {
  if (!contact.value || !customer.value) return
  
  try {
    const result = await contactStore.setMainContact(customer.value.id, contact.value.id)
    
    if (result.success) {
      notificationSuccess('Huvudkontakt angiven', `${contact.value.name} har angetts som huvudkontakt för ${customer.value.companyName}.`)
    } else {
      notificationError('Fel vid uppdatering', result.error || 'Kunde inte ange huvudkontakt.')
    }
  } catch {
    notificationError('Fel vid uppdatering', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const deleteContact = async () => {
  if (!contact.value || !customer.value) return
  
  const confirmed = await confirm(
    'Bekräfta borttagning',
    `Är du säker på att du vill ta bort kontaktpersonen ${contact.value.name}? Denna åtgärd kan inte ångras.`
  )
  
  if (confirmed) {
    try {
      const result = await contactStore.removeContact(contact.value.id)
      
      if (result.success) {
        notificationSuccess('Kontakt borttagen', `${contact.value.name} har tagits bort.`)
        router.push('/contacts')
      } else {
        notificationError('Fel vid borttagning', result.error || 'Kunde inte ta bort kontakten.')
      }
    } catch {
      notificationError('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.')
    }
  }
}

// =============================================================================
// CONTACT TABLE HANDLERS
// =============================================================================

const handleUpdateRelatedContact = async (contactData: Contact) => {
  try {
    const result = await contactStore.updateContact(contactData)
    
    if (result.success) {
      notificationSuccess('Kontakt uppdaterad', 'Kontaktpersonen har uppdaterats framgångsrikt.')
    } else {
      notificationError('Fel vid uppdatering', result.error || 'Kunde inte uppdatera kontaktpersonen.')
    }
  } catch {
    notificationError('Fel vid uppdatering', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const handleDeleteRelatedContact = async (contactId: number) => {
  try {
    const result = await contactStore.removeContact(contactId)
    
    if (result.success) {
      notificationSuccess('Kontakt borttagen', 'Kontaktpersonen har tagits bort framgångsrikt.')
    } else {
      notificationError('Fel vid borttagning', result.error || 'Kunde inte ta bort kontaktpersonen.')
    }
  } catch {
    notificationError('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const handleSetMainContactForRelated = async (contactId: number) => {
  if (!customer.value) return
  
  try {
    const result = await contactStore.setMainContact(customer.value.id, contactId)
    
    if (result.success) {
      notificationSuccess('Huvudkontakt angiven', 'Huvudkontakten har uppdaterats framgångsrikt.')
    } else {
      notificationError('Fel vid uppdatering', result.error || 'Kunde inte ange huvudkontakt.')
    }
  } catch {
    notificationError('Fel vid uppdatering', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const handleEditRelatedContact = (contactToEdit: Contact) => {
  dialogEditedContact.value = { ...contactToEdit }
  showEditDialog.value = true
}

// =============================================================================
// COMPUTED PROPERTIES FOR DISPLAY
// =============================================================================

// Dialog methods
const closeEditDialog = () => {
  showEditDialog.value = false
  dialogEditedContact.value = null
}

const saveDialogChanges = async () => {
  if (!dialogEditedContact.value) return
  
  try {
    // Basic validation
    if (!dialogEditedContact.value.name || dialogEditedContact.value.name.trim() === '') {
      notificationError('Valideringsfel', 'Namn är obligatoriskt.')
      return
    }

    if (dialogEditedContact.value.email && dialogEditedContact.value.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(dialogEditedContact.value.email)) {
        notificationError('Valideringsfel', 'E-postadress har felaktigt format.')
        return
      }
    }

    // Update contact using contact store
    const result = await contactStore.updateContact(dialogEditedContact.value)
    
    if (result.success) {
      notificationSuccess('Kontakt uppdaterad', 'Kontaktuppgifterna har uppdaterats framgångsrikt.')
      closeEditDialog()
      // Update the main form as well
      if (editedContact.value) {
        editedContact.value = { ...dialogEditedContact.value }
      }
    } else {
      notificationError('Fel vid sparande', result.error || 'Kunde inte spara ändringarna.')
    }
  } catch {
    notificationError('Fel vid sparande', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const contactStats = computed(() => [
  {
    label: 'Status',
    value: contact.value?.status || 'Okänd'
  },
  {
    label: 'Typ',
    value: contact.value?.isMainContact ? 'Huvudkontakt' : 'Kontakt'
  },
  {
    label: 'Företag',
    value: customer.value?.companyName || 'Okänt'
  },
  {
    label: 'Andra kontakter',
    value: relatedContacts.value.length.toString()
  }
])

// =============================================================================
// WATCHERS
// =============================================================================

// Watch for changes in the contact data
import { watch } from 'vue'

watch(contact, (newContact) => {
  if (newContact && !editedContact.value) {
    editedContact.value = { ...newContact }
  }
}, { immediate: true })

const sendEmail = () => {
  if (contact.value?.email) {
    window.location.href = `mailto:${contact.value.email}`
  }
}

const makePhoneCall = () => {
  if (contact.value?.phone) {
    window.location.href = `tel:${contact.value.phone}`
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Store Error Display -->
    <div
      v-if="customerStore.error || contactStore.error"
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded"
    >
      <div class="text-red-800">
        {{ customerStore.error || contactStore.error }}
      </div>
      <button 
        class="mt-2 text-sm text-red-600 hover:text-red-800" 
        @click="customerStore.clearError(); contactStore.clearError()"
      >
        Stäng
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-if="customerStore.loading || contactStore.loading"
      class="text-center py-8"
    >
      <div class="text-gray-600">
        Laddar kontaktdata...
      </div>
    </div>

    <!-- Contact Not Found -->
    <div
      v-else-if="!contact"
      class="text-center py-8"
    >
      <div class="text-gray-600">
        Kontaktpersonen kunde inte hittas.
      </div>
      <button 
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        @click="goBack"
      >
        Tillbaka till kontaktlista
      </button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Save Confirmation -->
      <StatusNotification
        v-if="showSaveConfirmation"
        type="success"
        title="Ändringarna sparade"
        message="Kontaktuppgifterna har uppdaterats framgångsrikt."
        :show="showSaveConfirmation"
        @close="showSaveConfirmation = false"
      />

      <!-- Standard Header -->
      <StandardHeader
        :title="contact.name"
        :breadcrumbs="breadcrumbs"
        :description="`Kontaktdetaljer för ${contact.name} på ${customer?.companyName || 'Okänt företag'}`"
        :show-stats="true"
        :stats="contactStats"
        :action-buttons="actionButtons"
      />

      <!-- Main Content Tabs -->
      <div class="px-6">
        <Tabs
          default-value="general"
          class="w-full"
        >
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="general">
              <User class="w-4 h-4 mr-2" />
              Allmänt
            </TabsTrigger>
            <TabsTrigger value="company">
              <Building2 class="w-4 h-4 mr-2" />
              Företag
            </TabsTrigger>
          </TabsList>

          <!-- General Tab -->
          <TabsContent
            value="general"
            class="space-y-6"
          >
            <div
              v-if="editedContact"
              class="bg-white p-6 rounded-lg border"
            >
              <h3 class="text-lg font-semibold mb-4">
                Kontaktinformation
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Name -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Fullständigt namn *
                  </label>
                  <input
                    v-model="editedContact.name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ange fullständigt namn"
                    @input="handleFieldChange"
                    @blur="handleFieldBlur('name')"
                  >
                </div>

                <!-- Email -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    E-postadress
                  </label>
                  <input
                    v-model="editedContact.email"
                    type="email"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="namn@företag.se"
                    @input="handleFieldChange"
                    @blur="handleFieldBlur('email')"
                  >
                </div>

                <!-- Phone -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Telefonnummer
                  </label>
                  <input
                    v-model="editedContact.phone"
                    type="tel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="070-123 45 67"
                    @input="handleFieldChange"
                  >
                </div>

                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    v-model="editedContact.status"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    @change="handleFieldChange"
                  >
                    <option value="Aktiv">
                      Aktiv
                    </option>
                    <option value="Inaktiv">
                      Inaktiv
                    </option>
                  </select>
                </div>
              </div>

              <!-- Main Contact Toggle -->
              <div class="mt-6">
                <div class="flex items-center space-x-3">
                  <input
                    id="isMainContact"
                    v-model="editedContact.isMainContact"
                    type="checkbox"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    @change="handleFieldChange"
                  >
                  <label
                    for="isMainContact"
                    class="text-sm font-medium text-gray-700"
                  >
                    Huvudkontakt för företaget
                  </label>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  Endast en huvudkontakt per företag är tillåten
                </p>
              </div>
            </div>
          </TabsContent>

          <!-- Company Tab -->
          <TabsContent
            value="company"
            class="space-y-6"
          >
            <div class="bg-white p-6 rounded-lg border">
              <h3 class="text-lg font-semibold mb-4">
                Företagsinformation
              </h3>
              
              <div
                v-if="customer"
                class="space-y-4"
              >
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Företagsnamn</label>
                    <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                      {{ customer.companyName }}
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Ort</label>
                    <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                      {{ customer.city }}
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                      <span :class="customer.status === 'Aktiv' ? 'text-green-600' : 'text-red-600'">
                        {{ customer.status }}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Kundnummer</label>
                    <div class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                      {{ customer.customerNumber }}
                    </div>
                  </div>
                </div>

                <div class="mt-6">
                  <button
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    @click="viewCustomer"
                  >
                    Visa fullständig kundinformation
                  </button>
                </div>
              </div>
              
              <div
                v-else
                class="text-gray-500"
              >
                Företagsinformation kunde inte laddas.
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white p-6 rounded-lg border">
              <h3 class="text-lg font-semibold mb-4">
                Snabbåtgärder
              </h3>
              
              <div class="flex flex-wrap gap-3">
                <button
                  v-if="contact && !contact.isMainContact"
                  class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  @click="setAsMainContact"
                >
                  Ange som huvudkontakt
                </button>
                
                <button
                  v-if="contact"
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  @click="sendEmail"
                >
                  Skicka e-post
                </button>
                
                <button
                  v-if="contact"
                  class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  @click="makePhoneCall"
                >
                  Ring upp
                </button>
                
                <button
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  @click="deleteContact"
                >
                  Ta bort kontakt
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <!-- Save Actions Bar - Always Visible -->
        <div
          v-if="hasChanges"
          class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              <span class="text-sm font-medium text-yellow-800">Du har osparade ändringar</span>
            </div>
            <div class="flex space-x-3">
              <button
                :disabled="contactStore.loading"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                @click="resetChanges"
              >
                Återställ
              </button>
              <button
                :disabled="contactStore.loading"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                @click="saveChanges"
              >
                <span v-if="contactStore.loading">Sparar...</span>
                <span v-else>Spara ändringar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Related Contacts Section - Always Visible -->
      <div class="mt-8 bg-white border-t">
        <div class="px-6 py-6">
          <h3 class="text-lg font-semibold mb-4">
            Relaterade kontakter
          </h3>
          
          <div v-if="relatedContacts.length > 0">
            <TooltipProvider>
              <ContactPersonsTable
                :contact-persons="relatedContacts"
                :main-contact="customerMainContact"
                @update-contact="handleUpdateRelatedContact"
                @delete-contact="handleDeleteRelatedContact"
                @set-main-contact="handleSetMainContactForRelated"
                @edit-contact="handleEditRelatedContact"
              />
            </TooltipProvider>
          </div>
          
          <div
            v-else
            class="text-gray-500 text-center py-8"
          >
            Inga andra kontakter för detta företag.
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Dialog -->
  <Dialog
    :open="showEditDialog"
    @close="closeEditDialog"
  >
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Redigera kontakt</DialogTitle>
        <DialogDescription>Ändra kontaktinformation</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <label
            for="name"
            class="text-right"
          >
            Namn
          </label>
          <input
            id="name"
            v-model="dialogEditedContact!.name"
            type="text"
            class="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ange fullständigt namn"
          >
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <label
            for="email"
            class="text-right"
          >
            E-postadress
          </label>
          <input
            id="email"
            v-model="dialogEditedContact!.email"
            type="email"
            class="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="namn@företag.se"
          >
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <label
            for="phone"
            class="text-right"
          >
            Telefonnummer
          </label>
          <input
            id="phone"
            v-model="dialogEditedContact!.phone"
            type="tel"
            class="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="070-123 45 67"
          >
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <label
            for="status"
            class="text-right"
          >
            Status
          </label>
          <select
            id="status"
            v-model="dialogEditedContact!.status"
            class="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Aktiv">
              Aktiv
            </option>
            <option value="Inaktiv">
              Inaktiv
            </option>
          </select>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <label
            for="isMainContact"
            class="text-right"
          >
            Huvudkontakt
          </label>
          <div class="col-span-3 flex items-center">
            <input
              id="isMainContact"
              v-model="dialogEditedContact!.isMainContact"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
            <label
              for="isMainContact"
              class="ml-2 text-sm text-gray-700"
            >
              Ange som huvudkontakt för företaget
            </label>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button
          type="submit"
          @click="saveDialogChanges"
        >
          Spara
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template> 