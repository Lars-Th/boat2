<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ref, computed, onMounted } from 'vue'
import { useProspectorService, type Company } from '@/composables/useProspectorService'
import { LayoutGrid, List, Database, Globe } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import DataTable from '@/components/custom/DataTable.vue'

// Use the API service
const prospectorService = useProspectorService()

// Breadcrumbs
const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Prospector', isCurrentPage: true }
]

const companies = ref<Company[]>([])
const viewMode = ref<'cards' | 'list'>('cards')
const apiMode = ref<'production' | 'development'>(prospectorService.getApiMode())

// Computed properties
const filteredCompanies = computed(() => companies.value)
const totalCompanies = computed(() => companies.value.length)

// View mode button variants
const cardViewVariant = computed(() => viewMode.value === 'cards' ? 'default' : 'outline')
const listViewVariant = computed(() => viewMode.value === 'list' ? 'default' : 'outline')

// API mode button variants
const productionVariant = computed(() => apiMode.value === 'production' ? 'default' : 'outline')
const developmentVariant = computed(() => apiMode.value === 'development' ? 'default' : 'outline')

// Column configuration for list view
const columns = [
  {
    key: 'name',
    label: 'Företag',
    sortable: true
  },
  {
    key: 'city',
    label: 'Ort', 
    sortable: true
  },
  {
    key: 'branch',
    label: 'Bransch',
    sortable: true
  },
  {
    key: 'employees',
    label: 'Anställda',
    sortable: true
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    type: 'badge' as const,
    badgeVariant: (status: string) => status === 'Active' ? 'default' : 'secondary'
  }
]

// Stats for StandardHeader
const stats = computed(() => [
  {
    label: 'Totalt företag',
    value: totalCompanies.value.toString()
  },
  {
    label: 'Aktiva',
    value: filteredCompanies.value.filter(c => c.status === 'Active').length.toString(),
    color: 'text-green-600'
  },
  {
    label: 'Datakälla',
    value: apiMode.value === 'production' ? 'Produktion' : 'Utveckling',
    color: apiMode.value === 'production' ? 'text-blue-600' : 'text-orange-600'
  }
])

// Search companies function called on mount
const loadCompanies = async () => {
  try {
    const response = await prospectorService.searchCompanies()
    companies.value = response.companies
  } catch (err: any) {
    console.error('Failed to fetch companies:', err)
  }
}

// Switch API mode
const switchApiMode = async (mode: 'production' | 'development') => {
  apiMode.value = mode
  prospectorService.setApiMode(mode)
  // Reload companies with new mode
  await loadCompanies()
    }

// Load companies on mount
onMounted(() => {
  loadCompanies()
})

// Simple view function for DataTable
const viewCompanyDetails = (company: Company) => {
  console.log('View company details:', company.name)
}
</script>

<template>
  <div class="w-full">
    <!-- Standard Header -->
    <StandardHeader
      title="Prospector"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- Loading spinner -->
    <div
      v-if="prospectorService.isLoading.value"
      class="flex justify-center py-8"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>

    <!-- Error handling -->
    <div
      v-if="prospectorService.error.value"
      class="text-center py-8"
    >
      <p class="text-red-500">
        {{ prospectorService.error.value }}
      </p>
      <Button
        variant="outline"
        class="mt-2"
        @click="loadCompanies"
      >
        Försök igen
      </Button>
    </div>

    <!-- Main content container -->
    <div class="px-6 mt-6">
      <!-- View Mode Toggle and API Mode Switch -->
      <div class="flex justify-between items-center mb-4">
        <div class="flex space-x-4">
          <!-- View Mode Toggle -->
          <div class="flex space-x-2">
            <Button
              :variant="cardViewVariant"
              size="sm"
              @click="viewMode = 'cards'"
            >
              <LayoutGrid class="w-4 h-4 mr-2" />
              Kort
            </Button>
            <Button
              :variant="listViewVariant"
              size="sm"
              @click="viewMode = 'list'"
            >
              <List class="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>

          <!-- API Mode Switch -->
          <div class="flex space-x-2 ml-4">
            <Button
              :variant="productionVariant"
              size="sm"
              :disabled="prospectorService.isLoading.value"
              @click="switchApiMode('production')"
            >
              <Globe class="w-4 h-4 mr-2" />
              Produktion
            </Button>
            <Button
              :variant="developmentVariant"
              size="sm"
              :disabled="prospectorService.isLoading.value"
              @click="switchApiMode('development')"
            >
              <Database class="w-4 h-4 mr-2" />
              Utveckling
            </Button>
          </div>
        </div>
        
        <div class="text-sm text-muted-foreground">
          {{ filteredCompanies.length }} företag hittade
        </div>
      </div>

      <!-- Card View Results -->
      <div v-if="!prospectorService.isLoading.value && !prospectorService.error.value && viewMode === 'cards'">
        <div
          v-if="filteredCompanies.length === 0"
          class="text-center py-8"
        >
          <p class="text-muted-foreground">
            Inga företag hittades.
          </p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <Card
            v-for="company in filteredCompanies"
            :key="company.id"
            class="hover:shadow-md transition-shadow"
          >
            <CardHeader class="pb-3">
              <div class="flex justify-between items-start">
                <CardTitle class="text-lg">
                  {{ company.name }}
                </CardTitle>
                <Badge :variant="company.status === 'Active' ? 'default' : 'secondary'">
                  {{ company.status }}
                </Badge>
              </div>
              <CardDescription>{{ company.branch }}</CardDescription>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="text-sm">
                <p><strong>Adress:</strong> {{ company.address }}</p>
                <p><strong>Ort:</strong> {{ company.city }}</p>
                <p><strong>Anställda:</strong> {{ company.employees }}</p>
                <p><strong>Grundat:</strong> {{ company.founded }}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- List View Results -->
    <div v-if="!prospectorService.isLoading.value && !prospectorService.error.value && viewMode === 'list'">
      <DataTable
        :data="filteredCompanies"
        :columns="columns"
        :search-fields="['name', 'city', 'branch']"
        :on-row-click="viewCompanyDetails"
      />
    </div>
  </div>
</template>

<style scoped>
/* Component-specific styles if needed */
</style> 