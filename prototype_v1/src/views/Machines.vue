<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkOrderStore } from '@/storages/workOrderStore'
import { useNotifications } from '@/composables/useNotifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import ActionBar from '@/components/custom/ActionBar.vue'
import DataTable from '@/components/custom/DataTable.vue'

const workOrderStore = useWorkOrderStore()
const { success, error, confirm } = useNotifications()

// Breadcrumbs
const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Maskiner', isCurrentPage: true }
]

// Modal state
const isMachineModalOpen = ref(false)
const editingMachine = ref<string | null>(null)
const machineForm = ref({
  name: ''
})

// Machine management functions
const openMachineModal = (machine?: any) => {
  if (machine) {
    editingMachine.value = machine.name
    machineForm.value.name = machine.name
  } else {
    editingMachine.value = null
    machineForm.value.name = ''
  }
  isMachineModalOpen.value = true
}

// Action buttons for ActionBar
const actionButtons = [
  {
    label: 'Lägg till maskin',
    icon: Plus,
    onClick: () => openMachineModal(),
    class: 'text-xs h-8'
  }
]

// Machine columns for DataTable
const machineColumns = [
  {
    key: 'name',
    label: 'Maskinnamn',
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

// Transform machines for DataTable
const transformedMachines = computed(() => {
  return workOrderStore.machines.map((machine, index) => ({
    id: index,
    name: machine
  }))
})

// Page stats
const stats = computed(() => [
  {
    label: 'Totalt maskiner',
    value: workOrderStore.machines.length.toString(),
    change: '',
    trend: 'neutral' as const
  },
  {
    label: 'Aktiva maskiner',
    value: workOrderStore.machines.length.toString(),
    change: '',
    trend: 'up' as const
  },
  {
    label: 'Nya denna månad',
    value: '2',
    change: '+100%',
    trend: 'up' as const
  },
  {
    label: 'Underhåll planerat',
    value: '3',
    change: '',
    trend: 'neutral' as const
  }
])

const saveMachine = () => {
  if (!machineForm.value.name.trim()) {
    error('Maskinnamn saknas', 'Vänligen ange ett maskinnamn.')
    return
  }

  if (editingMachine.value) {
    // Update existing machine
    const index = workOrderStore.machines.findIndex(m => m === editingMachine.value)
    if (index >= 0) {
      workOrderStore.machines[index] = machineForm.value.name.trim()
      success('Maskin uppdaterad', 'Maskinens namn har uppdaterats.')
    }
  } else {
    // Add new machine
    if (workOrderStore.machines.includes(machineForm.value.name.trim())) {
      error('Maskin finns redan', 'En maskin med detta namn finns redan.')
      return
    }
    workOrderStore.machines.push(machineForm.value.name.trim())
    success('Maskin tillagd', 'Ny maskin har lagts till.')
  }

  isMachineModalOpen.value = false
}

const deleteMachine = async (machine: any) => {
  const confirmed = await confirm(
    'Ta bort maskin',
    `Är du säker på att du vill ta bort maskinen "${machine.name}"?`,
    {
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      confirmVariant: 'destructive'
    }
  )

  if (confirmed) {
    const index = workOrderStore.machines.findIndex(m => m === machine.name)
    if (index >= 0) {
      workOrderStore.machines.splice(index, 1)
      success('Maskin borttagen', 'Maskinen har tagits bort.')
    }
  }
}
</script>

<template>
  <div class="w-full">
    <!-- Standard Header -->
    <StandardHeader
      title="Maskiner"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- Search and Filter Bar with Actions -->
    <DataTable
      :data="transformedMachines"
      :columns="machineColumns"
      :items-per-page="10"
      :search-fields="['name']"
      :on-edit="openMachineModal"
      :on-delete="deleteMachine"
      delete-confirm-message="Är du säker på att du vill ta bort denna maskin?"
    >
      <template #filters="{ searchQuery, statusFilter, filterOptions, updateSearchQuery, updateStatusFilter }">
        <ActionBar
          :action-buttons="actionButtons"
          :search-query="searchQuery"
          :status-filter="statusFilter"
          search-placeholder="Sök maskiner..."
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
            class="h-6 w-6 p-0"
            @click="openMachineModal(row)"
          >
            <Edit class="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            @click="deleteMachine(row)"
          >
            <Trash2 class="h-3 w-3" />
          </Button>
        </div>
      </template>
    </DataTable>

    <!-- Machine Modal -->
    <Dialog v-model:open="isMachineModalOpen">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>{{ editingMachine ? 'Redigera maskin' : 'Ny maskin' }}</DialogTitle>
        </DialogHeader>
        
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="machineName">Maskinnamn *</Label>
            <Input
              id="machineName"
              v-model="machineForm.name"
              placeholder="T.ex. Grävmaskin CAT 320"
              class="text-xs"
            />
          </div>

          <div class="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              class="text-xs"
              @click="isMachineModalOpen = false"
            >
              Avbryt
            </Button>
            <Button
              class="text-xs"
              @click="saveMachine"
            >
              {{ editingMachine ? 'Uppdatera' : 'Lägg till' }}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template> 