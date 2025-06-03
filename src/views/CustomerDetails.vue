<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotifications } from '@/composables/useNotifications'
import { Building2, MapPin, Receipt } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import StatusNotification from '@/components/custom/StatusNotification.vue'
import { useCustomerStorage, type Customer } from '@/storages/CustomerStorage'
import { useContactStorage, type Contact } from '@/storages/contactStorage'

// Import tab components
import TabAllmant from '../components/custom/TabAllmant.vue'
import TabBesok from '../components/custom/TabBesok.vue'
import TabFaktura from '../components/custom/TabFaktura.vue'
import ContactPersonsTable from '../components/custom/ContactPersonsTable.vue'
import AddContactDialog from '../components/custom/AddContactDialog.vue'
import { TooltipProvider } from '@/components/ui/tooltip'

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

// Basic customer data
const customer = computed(() => customerStore.getCustomerById(Number(route.params.id)))

// Contact persons for this customer
const contactPersons = computed(() => 
  contactStore.getContactsByCustomerId(Number(route.params.id))
)

// Main contact for this customer
const mainContact = computed(() => 
  contactStore.getMainContactByCustomerId(Number(route.params.id))
)

// Customer with contact data combined
const customerWithData = computed(() => {
  if (!customer.value) return null
  
  return {
    ...customer.value,
    contactPersons: contactPersons.value,
    mainContact: mainContact.value,
    contactCount: contactPersons.value.length
  }
})

// Functional breadcrumbs with customer name
const breadcrumbs = computed((): BreadcrumbItem[] => [
  { label: 'Home', to: '/' },
  { label: 'Kunder', to: '/customers' },
  { label: customer.value?.companyName || 'Kunddetaljer', isCurrentPage: true }
])

// Action buttons for ActionBar
const actionButtons = computed(() => [
  {
    label: 'Spara nu',
    onClick: saveChanges,
    disabled: !hasChanges.value || customerStore.loading,
    class: 'text-xs h-8'
  },
  {
    label: 'Återställ',
    onClick: resetChanges,
    disabled: !hasChanges.value || customerStore.loading,
    variant: 'outline' as const,
    class: 'text-xs h-8'
  },
  {
    label: 'Tillbaka till kundlista',
    onClick: goBack,
    variant: 'outline' as const,
    class: 'text-xs h-8'
  }
])

const editedCustomer = ref<Customer | null>(customer.value ? { ...customer.value } : null)
const hasChanges = ref(false)
const showSaveConfirmation = ref(false)

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

onMounted(() => {
  if (!customer.value) {
    router.push('/customers')
  } else {
    editedCustomer.value = { ...customer.value }
  }
})

// =============================================================================
// NAVIGATION METHODS
// =============================================================================

const goBack = () => {
  router.push('/customers')
}

// =============================================================================
// CUSTOMER DATA MANAGEMENT
// =============================================================================

// Markera att data har ändrats
const handleFieldChange = () => {
  hasChanges.value = true
}

const saveChanges = async () => {
  try {
    if (editedCustomer.value && customer.value) {
      // Basic validation - check required fields
      if (!editedCustomer.value.companyName || editedCustomer.value.companyName.trim() === '') {
        notificationError('Valideringsfel', 'Företagsnamn är obligatoriskt.')
        return
      }

      // Optional: Basic email validation if email is provided
      if (editedCustomer.value.companyEmail && editedCustomer.value.companyEmail.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(editedCustomer.value.companyEmail)) {
          notificationError('Valideringsfel', 'E-postadress har felaktigt format.')
          return
        }
      }

      // Update customer using customer store
      const result = await customerStore.updateCustomer(editedCustomer.value)
      
      if (result.success) {
        hasChanges.value = false
        showSaveConfirmation.value = true
        notificationSuccess('Ändringarna sparade', 'Kunduppgifterna har uppdaterats framgångsrikt.')
      
        // Dölj bekräftelsen efter 4 sekunder
        setTimeout(() => {
          showSaveConfirmation.value = false
        }, 4000)
      } else {
        notificationError('Fel vid sparande', result.error || 'Kunde inte spara ändringarna.')
      }
    }
  } catch (err) {
    notificationError(
      'Fel vid sparande',
      'Ett oväntat fel inträffade. Försök igen.'
    )
  }
}

const resetChanges = () => {
  if (customer.value) {
    editedCustomer.value = { ...customer.value }
    hasChanges.value = false
    showSaveConfirmation.value = true
    
    // Dölj bekräftelsen efter 3 sekunder
    setTimeout(() => {
      showSaveConfirmation.value = false
    }, 3000)
  }
}

// Handle field blur for validation
const handleFieldBlur = (fieldName: string) => {
  // Basic validation on blur for company name
  if (fieldName === 'companyName' && editedCustomer.value) {
    if (!editedCustomer.value.companyName || editedCustomer.value.companyName.trim() === '') {
      // Field is empty, but we'll handle this in save validation
    }
  }
  
  // Basic email validation on blur
  if (fieldName === 'companyEmail' && editedCustomer.value?.companyEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(editedCustomer.value.companyEmail)) {
      // Invalid email format, but we'll handle this in save validation
    }
  }
}

// =============================================================================
// CONTACT PERSON MANAGEMENT
// =============================================================================

const handleAddContact = async (contactData: Omit<Contact, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>) => {
  if (!customer.value) return
  
  try {
    // Add contact person using contact store
    const result = await contactStore.addContact({
      ...contactData,
      customerId: customer.value.id
    })
    
    if (result.success) {
      notificationSuccess('Kontakt tillagd', 'Kontaktpersonen har lagts till framgångsrikt.')
    } else {
      notificationError('Fel vid tillägg', result.error || 'Kunde inte lägga till kontaktpersonen.')
    }
  } catch (err) {
    notificationError('Fel vid tillägg', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const handleUpdateContact = async (contactData: Contact) => {
  try {
    const result = await contactStore.updateContact(contactData)
    
    if (result.success) {
      notificationSuccess('Kontakt uppdaterad', 'Kontaktpersonen har uppdaterats framgångsrikt.')
    } else {
      notificationError('Fel vid uppdatering', result.error || 'Kunde inte uppdatera kontaktpersonen.')
    }
  } catch (err) {
    notificationError('Fel vid uppdatering', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const handleDeleteContact = async (contactId: number) => {
  try {
    const result = await contactStore.removeContact(contactId)
    
    if (result.success) {
      notificationSuccess('Kontakt borttagen', 'Kontaktpersonen har tagits bort framgångsrikt.')
    } else {
      notificationError('Fel vid borttagning', result.error || 'Kunde inte ta bort kontaktpersonen.')
    }
  } catch (err) {
    notificationError('Fel vid borttagning', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

const handleSetMainContact = async (contactId: number) => {
  if (!customer.value) return
  
  try {
    const result = await contactStore.setMainContact(customer.value.id, contactId)
    
    if (result.success) {
      notificationSuccess('Huvudkontakt angiven', 'Huvudkontakten har uppdaterats framgångsrikt.')
    } else {
      notificationError('Fel vid uppdatering', result.error || 'Kunde inte ange huvudkontakt.')
    }
  } catch (err) {
    notificationError('Fel vid uppdatering', 'Ett oväntat fel inträffade. Försök igen.')
  }
}

// =============================================================================
// COMPUTED PROPERTIES FOR DISPLAY
// =============================================================================

const customerStats = computed(() => [
  {
    label: 'Status',
    value: customer.value?.status || 'Okänd'
  },
  {
    label: 'Typ',
    value: customer.value?.companyType || 'Okänd'
  },
  {
    label: 'Kontaktpersoner',
    value: contactPersons.value.length.toString()
  },
  {
    label: 'Huvudkontakt',
    value: mainContact.value ? 'Ja' : 'Nej'
  }
])

// =============================================================================
// WATCHERS
// =============================================================================

// Watch for changes in the customer data and update editedCustomer
watch(customer, (newCustomer) => {
  if (newCustomer && !editedCustomer.value) {
    editedCustomer.value = { ...newCustomer }
  }
}, { immediate: true })

// =============================================================================
// ERROR HANDLING
// =============================================================================

const clearStoreError = () => {
  customerStore.clearError()
  contactStore.clearError()
}
</script>

<template>
  <div class="w-full">
    <!-- Store Error Display -->
    <div v-if="customerStore.error || contactStore.error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded">
      <div class="text-red-800">{{ customerStore.error || contactStore.error }}</div>
      <button 
        @click="clearStoreError()" 
        class="mt-2 text-sm text-red-600 hover:text-red-800"
      >
        Stäng
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="customerStore.loading || contactStore.loading" class="text-center py-8">
      <div class="text-gray-600">Laddar kunduppgifter...</div>
    </div>

    <!-- Customer Not Found -->
    <div v-else-if="!customer" class="text-center py-8">
      <div class="text-gray-600">Kunden kunde inte hittas.</div>
      <button 
        @click="goBack"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Tillbaka till kundlista
      </button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Save Confirmation -->
      <StatusNotification
        v-if="showSaveConfirmation"
        type="success"
        title="Ändringarna sparade"
        message="Kunduppgifterna har uppdaterats framgångsrikt."
        :show="showSaveConfirmation"
        @close="showSaveConfirmation = false"
      />

      <!-- Standard Header -->
      <StandardHeader
        :title="customer.companyName"
        :breadcrumbs="breadcrumbs"
        :description="`Kunddetaljer för ${customer.companyName} i ${customer.city}`"
        :show-stats="true"
        :stats="customerStats"
        :action-buttons="actionButtons"
      />

      <!-- Main Content Tabs -->
      <div class="px-6">
        <Tabs default-value="general" class="w-full">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="general">
              <Building2 class="w-4 h-4 mr-2" />
              Allmänt
            </TabsTrigger>
            <TabsTrigger value="visits">
              <MapPin class="w-4 h-4 mr-2" />
              Besök
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Receipt class="w-4 h-4 mr-2" />
              Fakturor
            </TabsTrigger>
          </TabsList>

          <!-- General Tab -->
          <TabsContent value="general" class="space-y-6">
            <TabAllmant 
              v-if="editedCustomer"
              :edited-customer="editedCustomer"
              @field-change="handleFieldChange"
              @field-blur="handleFieldBlur"
            />
          </TabsContent>

          <!-- Visits Tab -->
          <TabsContent value="visits" class="space-y-6">
            <TabBesok 
              v-if="editedCustomer"
              :edited-customer="editedCustomer"
              @field-change="handleFieldChange"
            />
          </TabsContent>

          <!-- Invoices Tab -->
          <TabsContent value="invoices" class="space-y-6">
            <TabFaktura 
              v-if="editedCustomer"
              :edited-customer="editedCustomer"
              @field-change="handleFieldChange"
            />
          </TabsContent>
        </Tabs>

        <!-- Save Actions Bar - Always Visible -->
        <div v-if="hasChanges" class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-yellow-800">Du har osparade ändringar</span>
            </div>
            <div class="flex space-x-3">
              <button
                @click="resetChanges"
                :disabled="customerStore.loading"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Återställ
              </button>
              <button
                @click="saveChanges"
                :disabled="customerStore.loading"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <span v-if="customerStore.loading">Sparar...</span>
                <span v-else>Spara ändringar</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Contact Persons Section - Always Visible -->
        <div class="mt-8 bg-white p-6 rounded-lg border">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Kontaktpersoner</h3>
            <AddContactDialog
              :customer-id="customer.id"
              @contact-added="handleAddContact"
            />
          </div>
          
          <TooltipProvider>
            <ContactPersonsTable
              :contact-persons="contactPersons"
              :main-contact="mainContact"
              @update-contact="handleUpdateContact"
              @delete-contact="handleDeleteContact"
              @set-main-contact="handleSetMainContact"
            />
          </TooltipProvider>
        </div>
      </div>
    </div>
  </div>
</template> 