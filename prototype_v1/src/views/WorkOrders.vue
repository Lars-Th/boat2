<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkOrderStore } from '@/storages/workOrderStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotifications } from '@/composables/useNotifications'
import { Plus, Search, Filter, Eye, Edit, Trash2 } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import DataTable from '@/components/custom/DataTable.vue'

const router = useRouter()
const workOrderStore = useWorkOrderStore()
const { success, confirm } = useNotifications()

// Breadcrumbs
const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Arbetsorder', isCurrentPage: true }
]

// Filter states
const searchQuery = ref('')
const statusFilter = ref('all')
const priorityFilter = ref('all')
const assignedToFilter = ref('all')

// Event handlers
const handleCreateWorkOrder = () => {
  router.push('/work-orders/new')
}

// Action buttons for ActionBar
const actionButtons = [
  {
    label: 'Ny arbetsorder',
    icon: Plus,
    onClick: handleCreateWorkOrder,
    class: 'text-xs h-8',
    variant: 'default' as const
  }
]

// DataTable columns för arbetsorder
const workOrderColumns = [
  {
    key: 'orderNumber',
    label: 'Ordernummer',
    sortable: true,
    width: '12%'
  },
  {
    key: 'customerName',
    label: 'Kund',
    sortable: true,
    width: '15%'
  },
  {
    key: 'projectName',
    label: 'Projekt',
    sortable: true,
    width: '18%'
  },
  {
    key: 'assignedTo',
    label: 'Tilldelad',
    sortable: true,
    width: '12%'
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    width: '10%',
    type: 'badge' as const,
    badgeVariant: (value: string) => {
      switch (value) {
        case 'Pågående': return 'default'
        case 'Planerad': return 'secondary'
        case 'Avslutad': return 'outline'
        case 'Pausad': return 'destructive'
        default: return 'outline'
      }
    }
  },
  {
    key: 'priority',
    label: 'Prioritet',
    sortable: true,
    width: '8%',
    type: 'badge' as const,
    badgeVariant: (value: string) => {
      switch (value) {
        case 'Hög': return 'destructive'
        case 'Medium': return 'default'
        case 'Låg': return 'secondary'
        default: return 'outline'
      }
    }
  },
  {
    key: 'timeProgress',
    label: 'Tid (h)',
    sortable: false,
    width: '10%',
    type: 'custom' as const
  },
  {
    key: 'dueDate',
    label: 'Förfallodatum',
    sortable: true,
    width: '10%'
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
    width: '5%',
    type: 'actions' as const,
    align: 'right' as const
  }
]

// Computed för filtrerade arbetsorder
const filteredWorkOrders = computed(() => {
  let filtered = workOrderStore.workOrders

  // Textsökning
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order => {
      const assignedToText = Array.isArray(order.assignedTo) 
        ? order.assignedTo.join(' ').toLowerCase()
        : (order.assignedTo as string).toLowerCase()
      
      return order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.projectName.toLowerCase().includes(query) ||
        assignedToText.includes(query) ||
        order.description.toLowerCase().includes(query)
    })
  }

  // Statusfilter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  // Prioritetsfilter
  if (priorityFilter.value !== 'all') {
    filtered = filtered.filter(order => order.priority === priorityFilter.value)
  }

  // Tilldelad filter
  if (assignedToFilter.value !== 'all') {
    filtered = filtered.filter(order => {
      if (Array.isArray(order.assignedTo)) {
        return order.assignedTo.includes(assignedToFilter.value)
      }
      return order.assignedTo === assignedToFilter.value
    })
  }

  return filtered
})

// Transform data för DataTable med tidsprogress
const transformedWorkOrders = computed(() => {
  return filteredWorkOrders.value.map(order => ({
    ...order,
    timeProgress: `${order.actualHours}/${order.estimatedHours}`,
    assignedTo: Array.isArray(order.assignedTo) ? order.assignedTo.join(', ') : order.assignedTo
  }))
})

// Unika värden för filter
const uniqueStatuses = computed(() => 
  [...new Set(workOrderStore.workOrders.map(order => order.status))]
)

const uniquePriorities = computed(() => 
  [...new Set(workOrderStore.workOrders.map(order => order.priority))]
)

const uniqueAssignees = computed(() => {
  const allAssignees = workOrderStore.workOrders.flatMap(order => 
    Array.isArray(order.assignedTo) ? order.assignedTo : [order.assignedTo]
  )
  return [...new Set(allAssignees)]
})

// Statistik
const stats = computed(() => [
  {
    label: 'Totalt antal order',
    value: workOrderStore.totalWorkOrders.toString(),
    change: '+12%',
    trend: 'up' as const
  },
  {
    label: 'Pågående order',
    value: workOrderStore.activeWorkOrders.length.toString(),
    change: '+5%',
    trend: 'up' as const
  },
  {
    label: 'Avslutade denna månad',
    value: workOrderStore.completedWorkOrders.length.toString(),
    change: '+8%',
    trend: 'up' as const
  },
  {
    label: 'Försenade order',
    value: '2',
    change: '-3%',
    trend: 'down' as const
  }
])

const handleViewWorkOrder = (workOrder: any, event: Event) => {
  event.stopPropagation()
  router.push(`/work-orders/${workOrder.id}`)
}

const handleEditWorkOrder = (workOrder: any, event: Event) => {
  event.stopPropagation()
  router.push(`/work-orders/${workOrder.id}`)
}

const handleDeleteWorkOrder = async (workOrder: any, event: Event) => {
  event.stopPropagation()
  
  const confirmed = await confirm(
    'Ta bort arbetsorder',
    `Är du säker på att du vill ta bort arbetsorder ${workOrder.orderNumber}?`,
    {
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      confirmVariant: 'destructive'
    }
  )

  if (confirmed) {
    const success_result = workOrderStore.removeWorkOrder(workOrder.id)
    if (success_result) {
      success('Arbetsorder borttagen', `${workOrder.orderNumber} har tagits bort.`)
    }
  }
}

const handleRowClick = (workOrder: any) => {
  router.push(`/work-orders/${workOrder.id}`)
}

// Clear filters
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = 'all'
  priorityFilter.value = 'all'
  assignedToFilter.value = 'all'
}
</script>

<template>
  <div class="w-full">
    <!-- Standard Header -->
    <StandardHeader
      title="Arbetsorder"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- Custom Action Bar for Work Orders (with complex filters) -->
    <div class="bg-background px-6 py-4 border-b">
      <div class="flex items-center justify-between">
        <!-- Action buttons on the left -->
        <div class="flex items-center gap-2">
          <Button 
            v-for="button in actionButtons" 
            :key="button.label"
            :variant="button.variant || 'default'"
            :class="button.class"
            @click="button.onClick"
          >
            <component
              :is="button.icon"
              v-if="button.icon"
              class="h-3 w-3 mr-1"
            />
            {{ button.label }}
          </Button>
        </div>
        
        <!-- Complex filters on the right -->
        <div class="flex flex-wrap items-center gap-4 p-4 rounded-lg">
          <!-- Sökfält -->
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <Search class="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                v-model="searchQuery"
                placeholder="Sök arbetsorder..."
                class="pl-8 h-8"
                style="font-size: 12px; height: 32px;"
              />
            </div>
          </div>

          <!-- Status filter -->
          <div class="min-w-[120px]">
            <Select v-model="statusFilter">
              <SelectTrigger
                class="text-xs h-8"
                style="height: 32px;"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Alla statusar
                </SelectItem>
                <SelectItem 
                  v-for="status in uniqueStatuses" 
                  :key="status" 
                  :value="status"
                >
                  {{ status }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Prioritet filter -->
          <div class="min-w-[120px]">
            <Select v-model="priorityFilter">
              <SelectTrigger
                class="text-xs h-8"
                style="height: 32px;"
              >
                <SelectValue placeholder="Prioritet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Alla prioriteter
                </SelectItem>
                <SelectItem 
                  v-for="priority in uniquePriorities" 
                  :key="priority" 
                  :value="priority"
                >
                  {{ priority }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Tilldelad filter -->
          <div class="min-w-[140px]">
            <Select v-model="assignedToFilter">
              <SelectTrigger
                class="text-xs h-8"
                style="height: 32px;"
              >
                <SelectValue placeholder="Tilldelad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Alla personer
                </SelectItem>
                <SelectItem 
                  v-for="assignee in uniqueAssignees" 
                  :key="assignee" 
                  :value="assignee"
                >
                  {{ assignee }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- Rensa filter -->
          <Button 
            variant="outline" 
            class="text-xs h-8"
            style="height: 32px;"
            @click="clearFilters"
          >
            <Filter class="h-3 w-3 mr-1" />
            Rensa
          </Button>
        </div>
      </div>
    </div>

    <!-- DataTable för arbetsorder -->
    <DataTable
      :data="transformedWorkOrders"
      :columns="workOrderColumns"
      :items-per-page="10"
      :search-fields="['orderNumber', 'customerName', 'projectName', 'assignedTo']"
      :on-row-click="handleRowClick"
      :on-view="handleViewWorkOrder"
      :on-edit="handleEditWorkOrder"
      :on-delete="handleDeleteWorkOrder"
      delete-confirm-message="Är du säker på att du vill ta bort denna arbetsorder?"
    >
      <!-- Custom slot för tidsprogress -->
      <template #cell-timeProgress="{ value, row }">
        <div class="flex items-center space-x-2">
          <span class="text-xs">{{ value }}</span>
          <div class="w-16 bg-gray-200 rounded-full h-1.5">
            <div 
              class="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              :style="{ width: `${Math.min((row.actualHours / row.estimatedHours) * 100, 100)}%` }"
            />
          </div>
        </div>
      </template>

      <!-- Custom actions -->
      <template #actions="{ row }">
        <div class="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0"
            @click="(e) => handleViewWorkOrder(row, e)"
          >
            <Eye class="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0"
            @click="(e) => handleEditWorkOrder(row, e)"
          >
            <Edit class="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            @click="(e) => handleDeleteWorkOrder(row, e)"
          >
            <Trash2 class="h-3 w-3" />
          </Button>
        </div>
      </template>
    </DataTable>
  </div>
</template> 