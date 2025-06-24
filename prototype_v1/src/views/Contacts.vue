<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStorage } from '@/storages/CustomerStorage'
import { useContactStorage } from '@/storages/contactStorage'
import { Plus } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import ActionBar from '@/components/custom/ActionBar.vue'
import DataTable from '@/components/custom/DataTable.vue'

const router = useRouter()
const customerStore = useCustomerStorage()
const contactStore = useContactStorage()

// =============================================================================
// COMPUTED DATA USING SEPARATED STORES
// =============================================================================

// Get all contact persons with their customer information
const allContactPersonsWithCustomers = computed(() => {
  return contactStore.contacts.map(contact => {
    const customer = customerStore.getCustomerById(contact.customerId)
    return {
      ...contact,
      customerName: customer?.companyName || 'Okänd kund',
      customerCity: customer?.city || '',
      customerStatus: customer?.status || 'Okänd',
      title: '', // Add default title since it's not in the contact interface
      department: '' // Add default department since it's not in the contact interface
    }
  })
})

// Functional breadcrumbs
const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: `Kontaktpersoner (${contactStore.totalContacts})`, isCurrentPage: true }
]

// Column configuration for the data table
const columns = [
  {
    key: 'name',
    label: 'Fullständigt namn',
    sortable: true
  },
  {
    key: 'title',
    label: 'Titel',
    sortable: true
  },
  {
    key: 'customerName',
    label: 'Företag',
    sortable: true
  },
  {
    key: 'phone',
    label: 'Telefon',
    sortable: false
  },
  {
    key: 'email',
    label: 'E-post',
    sortable: false
  },
  {
    key: 'isMainContact',
    label: 'Status',
    sortable: true,
    type: 'badge' as const,
    badgeVariant: (status: string) => status === 'Huvudkontakt' ? 'default' : 'secondary'
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
    type: 'actions' as const,
    align: 'right' as const
  }
]

// Filter options for the search bar
const filterOptions = [
  { value: 'true', label: 'Huvudkontakter' },
  { value: 'false', label: 'Kontakter' }
]

// Action buttons configuration
const actionButtons = [
  {
    label: 'Lägg till ny kontakt',
    icon: Plus,
    onClick: addNewContact,
    class: 'text-xs h-8'
  }
]

// Transform contact persons data for table display
const transformedContacts = computed(() => {
  return allContactPersonsWithCustomers.value.map(contact => ({
    ...contact,
    // Transform isMainContact boolean to string for filtering
    isMainContactFilter: contact.isMainContact.toString(),
    // Transform for display
    isMainContact: contact.isMainContact ? 'Huvudkontakt' : 'Kontakt'
  }))
})

// =============================================================================
// ENHANCED STATISTICS USING SEPARATED STORES
// =============================================================================

const stats = computed(() => [
  {
    label: 'Totalt kontakter',
    value: contactStore.totalContacts.toString()
  },
  {
    label: 'Huvudkontakter',
    value: contactStore.mainContacts.length.toString()
  },
  {
    label: 'Kunder med kontakter',
    value: new Set(contactStore.contacts.map(cp => cp.customerId)).size.toString()
  },
  {
    label: 'Kunder utan huvudkontakt',
    value: customersWithoutMainContact.value.length.toString()
  }
])

// =============================================================================
// ACTION METHODS
// =============================================================================

function addNewContact() {
  // TODO: Navigate to new contact form or open modal
  console.log('Add new contact')
}

async function viewContactDetails(contact: any) {
  // Navigate to the contact details page
  router.push(`/contacts/${contact.id}`)
}

function sendEmail(contact: any) {
  window.location.href = `mailto:${contact.email}`
}

async function deleteContact(contact: any) {
  try {
    const result = await contactStore.removeContact(contact.id)
    
    if (result.success) {
      console.log('Contact deleted successfully')
    } else {
      console.error('Failed to delete contact:', result.error)
    }
  } catch (error) {
    console.error('Error deleting contact:', error)
  }
}

// =============================================================================
// ENHANCED FILTERING LOGIC
// =============================================================================

// Get contacts by department (using company as department since department field doesn't exist)
const contactsByDepartment = computed(() => {
  const departments = new Map()
  contactStore.contacts.forEach(contact => {
    const dept = contact.company || 'Okänd'
    if (!departments.has(dept)) {
      departments.set(dept, [])
    }
    departments.get(dept).push(contact)
  })
  return departments
})

// Get customers missing main contacts
const customersWithoutMainContact = computed(() => {
  return customerStore.customers.filter(customer => {
    const mainContact = contactStore.getMainContactByCustomerId(customer.id)
    return !mainContact
  })
})
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

    <!-- Main Content -->
    <div v-else>
      <!-- Standard Header with Enhanced Statistics -->
      <StandardHeader
        title="Kontaktpersoner"
        :breadcrumbs="breadcrumbs"
        description="Hantera alla kontaktpersoner och deras företagsrelationer"
        :show-stats="true"
        :stats="stats"
      />

      <!-- Data Table with Search and Filter Bar -->
      <DataTable
        :data="transformedContacts"
        :columns="columns"
        :search-fields="['name', 'customerName', 'phone', 'email', 'title', 'department']"
        filter-field="isMainContactFilter"
        :filter-options="filterOptions"
        :on-row-click="viewContactDetails"
        :on-send-email="sendEmail"
        :on-delete="deleteContact"
        delete-confirm-message="Är du säker på att du vill radera denna kontaktperson?"
      >
        <template #filters="{ searchQuery, statusFilter, filterOptions, updateSearchQuery, updateStatusFilter }">
          <ActionBar
            :action-buttons="actionButtons"
            :search-query="searchQuery"
            :status-filter="statusFilter"
            search-placeholder="Sök på namn, företag, telefon, e-post eller avdelning..."
            :filter-options="filterOptions"
            @update:search-query="updateSearchQuery"
            @update:status-filter="updateStatusFilter"
          />
        </template>
      </DataTable>

      <!-- Additional Analysis Panels -->
      <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
        <!-- Department Distribution -->
        <div class="bg-white p-4 rounded-lg border">
          <h3 class="text-sm font-medium text-gray-500 mb-3">
            Kontakter per företag
          </h3>
          <div class="space-y-2">
            <div 
              v-for="[department, contacts] in contactsByDepartment" 
              :key="department"
              class="flex justify-between text-xs"
            >
              <span>{{ department }}:</span>
              <span class="font-medium">{{ contacts.length }}</span>
            </div>
          </div>
        </div>

        <!-- Customers Missing Main Contact -->
        <div class="bg-white p-4 rounded-lg border">
          <h3 class="text-sm font-medium text-gray-500 mb-3">
            Kunder utan huvudkontakt
          </h3>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            <div 
              v-for="customer in customersWithoutMainContact" 
              :key="customer.id"
              class="text-xs"
            >
              <button 
                class="text-red-600 hover:text-red-800 hover:underline"
                @click="router.push(`/customers/${customer.id}`)"
              >
                {{ customer.companyName }}
              </button>
            </div>
            <div
              v-if="customersWithoutMainContact.length === 0"
              class="text-xs text-gray-500"
            >
              Alla kunder har huvudkontakt
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white p-4 rounded-lg border">
          <h3 class="text-sm font-medium text-gray-500 mb-3">
            Snabbåtgärder
          </h3>
          <div class="space-y-2">
            <button 
              :disabled="contactStore.loading"
              class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 disabled:opacity-50 block w-full"
              @click="contactStore.fetchContacts()"
            >
              Uppdatera kontaktdata
            </button>
            <button 
              class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 block w-full"
              @click="router.push('/customers')"
            >
              Visa kundlista
            </button>
            <button 
              class="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200 block w-full"
              @click="contactStore.resetStore()"
            >
              Återställ filter
            </button>
          </div>
        </div>
      </div>

      <!-- Relationship Insights -->
      <div class="mt-6 px-6">
        <div class="bg-blue-50 p-4 rounded-lg">
          <h3 class="text-sm font-semibold text-blue-900 mb-2">
            Relationsinformation
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-blue-700">
            <div>
              <div class="font-medium">
                Genomsnittligt antal kontakter per kund:
              </div>
              <div>{{ customerStore.totalCustomers > 0 ? (contactStore.totalContacts / customerStore.totalCustomers).toFixed(1) : '0' }}</div>
            </div>
            <div>
              <div class="font-medium">
                Företag med flest kontakter:
              </div>
              <div>
                {{ customerStore.customers.length > 0 ? customerStore.customers.reduce((max, customer) => {
                  const contactCount = contactStore.getContactCountByCustomerId(customer.id)
                  const maxContactCount = contactStore.getContactCountByCustomerId(max.id)
                  return contactCount > maxContactCount ? customer : max
                }).companyName : 'Ingen' }}
              </div>
            </div>
            <div>
              <div class="font-medium">
                Senast uppdaterad:
              </div>
              <div>{{ contactStore.lastUpdated ? new Date(contactStore.lastUpdated).toLocaleDateString('sv-SE') : 'Okänd' }}</div>
            </div>
            <div>
              <div class="font-medium">
                Aktiv datakvalitet:
              </div>
              <div>{{ customersWithoutMainContact.length === 0 ? '✅ Bra' : '⚠️ Behöver åtgärd' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 