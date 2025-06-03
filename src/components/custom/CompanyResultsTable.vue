<script setup lang="ts">
import { computed } from 'vue'
import { useProspectorStore } from '@/storages/prospectorStore'
import DataTable from '@/components/custom/DataTable.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Users, DollarSign, MapPin, Phone, ExternalLink } from 'lucide-vue-next'

const prospectorStore = useProspectorStore()

// Computed properties
const searchResults = computed(() => prospectorStore.searchResults)
const hasResults = computed(() => prospectorStore.hasResults)
const isLoading = computed(() => prospectorStore.isLoading)

// Table columns configuration
const columns = computed(() => [
  {
    key: 'name',
    label: 'Company Name',
    sortable: true,
    width: '20%'
  },
  {
    key: 'organisationNumber',
    label: 'Org. Number',
    sortable: true,
    width: '12%'
  },
  {
    key: 'employees',
    label: 'Employees',
    sortable: true,
    width: '10%',
    type: 'badge' as const,
    badgeVariant: (value: number) => {
      if (value < 10) return 'secondary'
      if (value < 50) return 'default'
      if (value < 250) return 'outline'
      return 'destructive'
    }
  },
  {
    key: 'turnOver',
    label: 'Turnover',
    sortable: true,
    width: '12%'
  },
  {
    key: 'city',
    label: 'City',
    sortable: true,
    width: '12%'
  },
  {
    key: 'legalEntity',
    label: 'Legal Form',
    sortable: true,
    width: '12%',
    type: 'badge' as const,
    badgeVariant: () => 'outline'
  },
  {
    key: 'actions',
    label: 'Actions',
    width: '12%',
    type: 'actions' as const
  }
])

// Format currency
const formatCurrency = (value: number): string => {
  if (!value || value === 0) return '-'
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

// Format employee count
const formatEmployees = (value: number): string => {
  if (!value || value === 0) return '-'
  return value.toString()
}

// Process data for display
const processedData = computed(() => {
  return searchResults.value.map(company => ({
    ...company,
    turnOver: formatCurrency(company.turnOver),
    employees: formatEmployees(company.employees),
    // Add any additional processing here
  }))
})

// Event handlers
const handleRowClick = (company: any) => {
  console.log('Company selected:', company)
  // Could open a detailed view or modal
}

const handleViewDetails = (company: any, event: Event) => {
  event.stopPropagation()
  console.log('View details for:', company)
  // Implementation for viewing company details
}

const handleCreateLead = (company: any, event: Event) => {
  event.stopPropagation()
  console.log('Create lead for:', company)
  // Implementation for creating a lead from company data
}

const clearResults = () => {
  prospectorStore.clearResults()
}
</script>

<template>
  <div class="space-y-4">
    <!-- Empty State -->
    <div v-if="!hasResults && !isLoading" class="text-center py-12">
      <div class="mx-auto bg-muted rounded-full w-16 h-16 flex items-center justify-center mb-4">
        <Building class="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-semibold text-muted-foreground mb-2">
        No Companies Found
      </h3>
      <p class="text-sm text-muted-foreground max-w-md mx-auto">
        Use the AI chat assistant on the left to search for companies. 
        Describe what you're looking for and I'll help you find matching businesses.
      </p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="text-center py-12">
      <div class="mx-auto bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mb-4">
        <div class="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h3 class="text-lg font-semibold mb-2">
        Searching Companies...
      </h3>
      <p class="text-sm text-muted-foreground">
        Please wait while we find companies matching your criteria.
      </p>
    </div>

    <!-- Results Table -->
    <div v-else class="space-y-4">
      <!-- Results Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold">
            Search Results
          </h3>
          <Badge variant="secondary">
            {{ searchResults.length }} companies
          </Badge>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          @click="clearResults"
          class="flex items-center gap-2"
        >
          Clear Results
        </Button>
      </div>

      <!-- Data Table -->
      <DataTable
        :data="processedData"
        :columns="columns"
        :items-per-page="20"
        :search-fields="['name', 'city', 'organisationNumber']"
        filter-field="legalEntity"
        :filter-options="[
          { value: 'all', label: 'All Legal Forms' },
          { value: 'AB', label: 'Aktiebolag (AB)' },
          { value: 'HB', label: 'Handelsbolag (HB)' },
          { value: 'KB', label: 'Kommanditbolag (KB)' },
          { value: 'EF', label: 'Enskild Firma (EF)' }
        ]"
        @row-click="handleRowClick"
        class="border rounded-lg"
      >
        <!-- Custom actions column -->
        <template #cell-actions="{ item }">
          <div class="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              @click="handleViewDetails(item, $event)"
              class="h-8 px-2"
            >
              <ExternalLink class="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              @click="handleCreateLead(item, $event)"
              class="h-8 px-2"
            >
              <Users class="h-3 w-3" />
            </Button>
          </div>
        </template>

        <!-- Custom cell rendering for specific columns -->
        <template #cell-name="{ item }">
          <div class="space-y-1">
            <div class="font-medium">{{ item.name }}</div>
            <div v-if="item.description" class="text-xs text-muted-foreground line-clamp-1">
              {{ item.description }}
            </div>
          </div>
        </template>

        <template #cell-city="{ item }">
          <div class="flex items-center gap-1">
            <MapPin class="h-3 w-3 text-muted-foreground" />
            <span class="text-sm">{{ item.city }}</span>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 