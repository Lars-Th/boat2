<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkOrderStore } from '@/storages/workOrderStore'
import { useNotifications } from '@/composables/useNotifications'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import ActionBar from '@/components/custom/ActionBar.vue'
import DataTable from '@/components/custom/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'

const workOrderStore = useWorkOrderStore()
const { success, error, confirm } = useNotifications()

// Breadcrumbs
const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Redskap', isCurrentPage: true }
]

// Modal state
const isToolModalOpen = ref(false)
const editingTool = ref<string | null>(null)
const toolForm = ref({
  name: ''
})

// Action buttons for ActionBar
const actionButtons = [
  {
    label: 'Lägg till redskap',
    icon: Plus,
    onClick: () => openToolModal(),
    class: 'text-xs h-8'
  }
]

// Tool columns for DataTable
const toolColumns = [
  {
    key: 'name',
    label: 'Redskapsnamn',
    sortable: true,
    width: '70%'
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
    width: '30%',
    type: 'actions' as const,
    align: 'right' as const
  }
]

// Transform tools for DataTable
const transformedTools = computed(() => {
  return workOrderStore.tools.map((tool, index) => ({
    id: index,
    name: tool
  }))
})

// Page stats  
const stats = computed(() => [
  {
    label: 'Totalt redskap',
    value: workOrderStore.tools.length.toString(),
    change: '',
    trend: 'neutral' as const
  },
  {
    label: 'Aktiva redskap',
    value: workOrderStore.tools.length.toString(),
    change: '',
    trend: 'up' as const
  },
  {
    label: 'Nya denna månad',
    value: '1',
    change: '+50%',
    trend: 'up' as const
  },
  {
    label: 'Service planerat',
    value: '2',
    change: '',
    trend: 'neutral' as const
  }
])

// Tool management
const openToolModal = (tool?: any) => {
  if (tool) {
    editingTool.value = tool.name
    toolForm.value.name = tool.name
  } else {
    editingTool.value = null
    toolForm.value.name = ''
  }
  isToolModalOpen.value = true
}

const saveTool = () => {
  if (!toolForm.value.name.trim()) {
    error('Redskapsnamn saknas', 'Vänligen ange ett redskapsnamn.')
    return
  }

  if (editingTool.value) {
    // Update existing tool
    const index = workOrderStore.tools.findIndex(t => t === editingTool.value)
    if (index >= 0) {
      workOrderStore.tools[index] = toolForm.value.name.trim()
      success('Redskap uppdaterat', 'Redskapets namn har uppdaterats.')
    }
  } else {
    // Add new tool
    if (workOrderStore.tools.includes(toolForm.value.name.trim())) {
      error('Redskap finns redan', 'Ett redskap med detta namn finns redan.')
      return
    }
    workOrderStore.tools.push(toolForm.value.name.trim())
    success('Redskap tillagt', 'Nytt redskap har lagts till.')
  }

  isToolModalOpen.value = false
}

const deleteTool = async (tool: any) => {
  const confirmed = await confirm(
    'Ta bort redskap',
    `Är du säker på att du vill ta bort redskapet "${tool.name}"?`,
    {
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      confirmVariant: 'destructive'
    }
  )

  if (confirmed) {
    const index = workOrderStore.tools.findIndex(t => t === tool.name)
    if (index >= 0) {
      workOrderStore.tools.splice(index, 1)
      success('Redskap borttaget', 'Redskapet har tagits bort.')
    }
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Standard Header -->
    <StandardHeader
      title="Redskap"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- Search and Filter Bar with Actions -->
    <DataTable
      :data="transformedTools"
      :columns="toolColumns"
      :items-per-page="10"
      :search-fields="['name']"
      :on-edit="openToolModal"
      :on-delete="deleteTool"
      delete-confirm-message="Är du säker på att du vill ta bort detta redskap?"
    >
      <template #filters="{ searchQuery, statusFilter, filterOptions, updateSearchQuery, updateStatusFilter }">
        <ActionBar
          :action-buttons="actionButtons"
          :search-query="searchQuery"
          :status-filter="statusFilter"
          search-placeholder="Sök redskap..."
          :filter-options="filterOptions"
          @update:search-query="updateSearchQuery"
          @update:status-filter="updateStatusFilter"
        />
      </template>

      <!-- Custom actions -->
      <template #actions="{ row }">
        <div class="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            @click="openToolModal(row)"
            class="h-6 w-6 p-0"
          >
            <Edit class="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="deleteTool(row)"
            class="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 class="h-3 w-3" />
          </Button>
        </div>
      </template>
    </DataTable>

    <!-- Tool Modal -->
    <Dialog v-model:open="isToolModalOpen">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingTool ? 'Redigera redskap' : 'Nytt redskap' }}</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="toolName">Redskapsnamn *</Label>
            <Input
              id="toolName"
              v-model="toolForm.name"
              placeholder="T.ex. Standardskopa"
              class="text-xs"
            />
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button variant="outline" @click="isToolModalOpen = false" class="text-xs">
              Avbryt
            </Button>
            <Button @click="saveTool" class="text-xs">
              {{ editingTool ? 'Uppdatera' : 'Lägg till' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template> 