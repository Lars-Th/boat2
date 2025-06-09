<template>
  <div class="w-full">
    <!-- Standard Header -->
    <StandardHeader
      title="Custom Components"
      :breadcrumbs="[
        { label: 'Home', to: '/' },
        { label: 'Custom Components', isCurrentPage: true }
      ]"
    />

    <div class="p-6 space-y-6">
      <!-- Header message -->
      <div class="text-center">
        <h2 class="text-2xl font-semibold text-gray-800 mb-4">
          Det här är alla våra färdiga komponenter utifrån shadcn
        </h2>
        
        <!-- Component list - always visible -->
        <div class="mb-4">
          <h3 class="text-sm font-medium text-gray-700 mb-3">
            Component List
          </h3>
          <div class="p-4 rounded-lg max-w-4xl mx-auto">
            <ul class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <li 
                v-for="(comp, index) in components" 
                :key="index" 
                :class="{ 
                  'font-bold text-whit': index + 1 === currentPage,
                  'text-gray-600 hover:text-blue-600 hover:bg-blue-50': index + 1 !== currentPage
                }"
                class="cursor-pointer p-2 rounded transition-colors text-sm"
                @click="goToPage(index + 1)"
              >
                {{ index + 1 }}. {{ comp.name }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Pagination controls -->
        <div class="flex items-center justify-center gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            :disabled="currentPage === 1"
            @click="previousPage"
          >
            <ChevronLeft class="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div class="flex gap-1">
            <Button
              v-for="page in visiblePages"
              :key="page"
              variant="outline"
              size="sm"
              class="w-8 h-8"
              :class="{ 'bg-primary text-primary-foreground': page === currentPage }"
              @click="goToPage(page)"
            >
              {{ page }}
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            :disabled="currentPage === totalComponents"
            @click="nextPage"
          >
            Next
            <ChevronRight class="h-4 w-4 ml-1" />
          </Button>
        </div>

        <!-- Component counter -->
        <div class="text-sm text-gray-500 mb-4">
          Component {{ currentPage }} of {{ totalComponents }}
        </div>
      </div>

      <!-- Debug info -->
      <div class="text-xs text-gray-400 text-center">
        Total components: {{ totalComponents }}, Current page: {{ currentPage }}
      </div>

      <!-- Current component display -->
      <div
        v-if="currentComponent"
        class="space-y-6"
      >
        <div class="text-center">
          <h3 class="text-xl font-medium text-gray-700 mb-4">
            {{ currentComponent.name }}
          </h3>
        </div>

        <!-- Component showcase with error boundary -->
        <div class="border p-0 bg-white shadow-sm min-h-[10px]">
          <div
            v-if="renderError"
            class="text-center text-red-500 py-8"
          >
            <p>Error rendering component: {{ currentComponent.name }}</p>
            <p class="text-sm">
              {{ renderError }}
            </p>
            <Button
              class="mt-2"
              @click="clearError"
            >
              Try Again
            </Button>
          </div>
          <div v-else>
            <TooltipProvider>
              <component 
                :is="currentComponent.component" 
                v-bind="currentComponent.props || {}"
                @vue:error="handleComponentError"
              />
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-center text-gray-500 py-8"
      >
        <p>No component available for page {{ currentPage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'

// Import all custom components
import ActivationForm from '@/components/custom/ActivationForm.vue'
import ContactPersonsTable from '@/components/custom/ContactPersonsTable.vue'
import TabAllmant from '@/components/custom/TabAllmant.vue'
import DataTable from '@/components/custom/DataTable.vue'
import ActionBar from '@/components/custom/ActionBar.vue'
import StatusNotification from '@/components/custom/StatusNotification.vue'
import TabBesok from '@/components/custom/TabBesok.vue'
import TabFaktura from '@/components/custom/TabFaktura.vue'
import SearchAndFilter from '@/components/custom/SearchAndFilter.vue'
import CompanyResultsTable from '@/components/custom/CompanyResultsTable.vue'
import DashboardCard from '@/components/custom/DashboardCard.vue'
import TitleBreadcrumbs from '@/components/custom/TitleBreadcrumbs.vue'
import TitleAnalytics from '@/components/custom/TitleAnalytics.vue'
import AddContactDialog from '@/components/custom/AddContactDialog.vue'
import KontaktPersoner from '@/components/custom/KontaktPersoner.vue'

// Mock data for components that need props
const mockTableColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', type: 'badge', sortable: false }
]

const mockTableData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' }
]

// Mock Customer data for tab components
const mockCustomer = {
  id: 1,
  name: 'John Doe',
  city: 'Stockholm',
  phone: '070-123 45 67',
  companyName: 'Demo Company AB',
  status: 'Aktiv' as const,
  email: 'john@democompany.se',
  customerNumber: 'KU-001',
  organizationNumber: '556123-4567',
  referenceNumber: 'REF-001',
  streetAddress: 'Demogatan 1',
  postalCode: '11122',
  country: 'Sverige',
  billingStreetAddress: 'Demogatan 1',
  billingPostalCode: '11122',
  billingCity: 'Stockholm',
  billingCountry: 'Sverige',
  switchboardNumber: '08-123 45 67',
  companyEmail: 'info@democompany.se',
  website: 'www.democompany.se',
  companyNotes: 'Demo customer for component showcase',
  companyType: 'Kund' as const
}

// Mock stats for analytics components
const mockStats = [
  { value: 42, label: 'Total Items', color: 'text-blue-600' },
  { value: 28, label: 'Active', color: 'text-green-600' },
  { value: 14, label: 'Inactive', color: 'text-orange-600' }
]

// Mock breadcrumbs for demonstration
const mockBreadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Demo', to: '/demo' },
  { label: 'Page Title', isCurrentPage: true }
]

const mockCompleteHeaderBreadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Demo', to: '/demo' },
  { label: 'Components', to: '/custom-components' },
  { label: 'Complete Header', isCurrentPage: true }
]

// Component definitions with mock props
const components = [
  { 
    name: 'ActivationForm', 
    component: ActivationForm
  },
  { 
    name: 'ContactPersonsTable', 
    component: ContactPersonsTable,
    props: {
      contactPersons: [
        { 
          id: 1, 
          name: 'Anna Andersson', 
          title: 'IT-chef', 
          email: 'anna.andersson@democompany.se', 
          phone: '070-123 45 67',
          department: 'IT',
          isMainContact: true,
          customerId: 1
        },
        { 
          id: 2, 
          name: 'Erik Svensson', 
          title: 'Ekonomichef', 
          email: 'erik.svensson@democompany.se', 
          phone: '070-234 56 78',
          department: 'Ekonomi',
          isMainContact: false,
          customerId: 1
        },
        { 
          id: 3, 
          name: 'Maria Larsson', 
          title: 'Inköpschef', 
          email: 'maria.larsson@democompany.se', 
          phone: '070-345 67 89',
          department: 'Inköp',
          isMainContact: false,
          customerId: 1
        }
      ]
    }
  },
  { 
    name: 'TabAllmant', 
    component: TabAllmant,
    props: {
      editedCustomer: mockCustomer,
      errors: {}
    }
  },
  { 
    name: 'DataTable', 
    component: DataTable,
    props: {
      columns: mockTableColumns,
      data: mockTableData,
      searchable: true,
      filterable: true
    }
  },
  { 
    name: 'ActionBar', 
    component: ActionBar,
    props: {
      searchQuery: '',
      statusFilter: '',
      searchPlaceholder: 'Search components...',
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ],
      actionButtons: [
        {
          label: 'Add Component',
          icon: 'Plus',
          onClick: () => console.log('Add component clicked'),
          class: 'text-xs h-8'
        }
      ]
    }
  },
  { 
    name: 'StatusNotification', 
    component: StatusNotification,
    props: {
      message: 'This is a demo notification',
      type: 'success'
    }
  },
  { 
    name: 'TabBesok', 
    component: TabBesok,
    props: {
      editedCustomer: mockCustomer
    }
  },
  { 
    name: 'TabFaktura', 
    component: TabFaktura,
    props: {
      editedCustomer: mockCustomer
    }
  },
  { 
    name: 'SearchAndFilter', 
    component: SearchAndFilter,
    props: {
      actionButtons: [
        { 
          label: 'Add New Item', 
          icon: 'Plus', 
          onClick: () => console.log('Add clicked'),
          class: 'text-xs h-8'
        }
      ],
      searchQuery: '',
      statusFilter: '',
      searchPlaceholder: 'Search for items...',
      filterOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  },
  { 
    name: 'CompanyResultsTable', 
    component: CompanyResultsTable
    // No props needed - uses prospector store internally
  },
  { 
    name: 'DashboardCard', 
    component: DashboardCard,
    props: {
      title: 'Demo Card',
      description: 'This is a demo dashboard card',
      value: '123',
      badge: { text: '+12%', variant: 'secondary' }
    }
  },
  { 
    name: 'TitleBreadcrumbs', 
    component: TitleBreadcrumbs,
    props: {
      title: 'Demo Page Title',
      breadcrumbs: mockBreadcrumbs,
      description: 'This demonstrates functional breadcrumbs with clickable navigation'
    }
  },
  { 
    name: 'TitleAnalytics', 
    component: TitleAnalytics,
    props: {
      showStats: true,
      stats: mockStats
    }
  },
  { 
    name: 'StandardHeader', 
    component: StandardHeader,
    props: {
      title: 'Complete Header Demo',
      breadcrumbs: mockCompleteHeaderBreadcrumbs,
      description: 'This demonstrates the full header with functional breadcrumbs and analytics',
      showStats: true,
      stats: mockStats
    }
  },
  { 
    name: 'AddContactDialog', 
    component: AddContactDialog,
    props: {
      // Add any necessary props here
    }
  },
  { 
    name: 'KontaktPersoner', 
    component: KontaktPersoner,
    props: {
      contactPersons: [
        { 
          id: 1, 
          name: 'Anna Andersson', 
          title: 'IT-chef', 
          email: 'anna.andersson@democompany.se', 
          phone: '070-123 45 67',
          department: 'IT',
          isMainContact: true,
          customerId: 1
        },
        { 
          id: 2, 
          name: 'Erik Svensson', 
          title: 'Ekonomichef', 
          email: 'erik.svensson@democompany.se', 
          phone: '070-234 56 78',
          department: 'Ekonomi',
          isMainContact: false,
          customerId: 1
        },
        { 
          id: 3, 
          name: 'Maria Larsson', 
          title: 'Inköpschef', 
          email: 'maria.larsson@democompany.se', 
          phone: '070-345 67 89',
          department: 'Inköp',
          isMainContact: false,
          customerId: 1
        }
      ]
    }
  }
]

// Reactive state
const currentPage = ref(1)
const renderError = ref('')
const totalComponents = computed(() => components.length)

// Current component to display
const currentComponent = computed(() => {
  const index = currentPage.value - 1
  if (index >= 0 && index < components.length) {
    return components[index]
  }
  return null
})

// Error handling
const handleComponentError = (error: any) => {
  console.error('Component render error:', error)
  renderError.value = error.message || 'Unknown error'
}

const clearError = () => {
  renderError.value = ''
}

onErrorCaptured((error) => {
  console.error('Captured error:', error)
  renderError.value = error.message || 'Unknown error'
  return false
})

// Visible page numbers for pagination
const visiblePages = computed(() => {
  const total = totalComponents.value
  const current = currentPage.value
  const maxVisible = 5
  
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = Math.min(total, start + maxVisible - 1)
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// Navigation functions
const goToPage = (page: number) => {
  renderError.value = '' // Clear any previous errors
  if (page >= 1 && page <= totalComponents.value) {
    console.log(`Navigating to page ${page}, component: ${components[page - 1]?.name}`)
    currentPage.value = page
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    goToPage(currentPage.value - 1)
  }
}

const nextPage = () => {
  if (currentPage.value < totalComponents.value) {
    goToPage(currentPage.value + 1)
  }
}

onMounted(() => {
  // Initialize with first component
  console.log(`Mounted with ${totalComponents.value} components`)
  currentPage.value = 1
})
</script>

<style scoped>
/* Custom styles if needed */
</style> 