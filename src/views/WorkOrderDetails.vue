<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkOrderStore, type WorkOrder, type WorkOrderTask } from '@/storages/workOrderStore'
import { useCustomerStore } from '@/storages/customerStorage'
import { useNotifications } from '@/composables/useNotifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Save, ArrowLeft, Plus, Edit, Trash2, Check, X } from 'lucide-vue-next'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import ActionBar from '@/components/custom/ActionBar.vue'
import DataTable from '@/components/custom/DataTable.vue'

const route = useRoute()
const router = useRouter()
const workOrderStore = useWorkOrderStore()
const customerStore = useCustomerStore()
const { success, error, confirm } = useNotifications()

const workOrderId = computed(() => {
  const id = route.params.id
  return id === 'new' ? null : parseInt(id as string)
})

const isNewWorkOrder = computed(() => workOrderId.value === null)

// Breadcrumbs
const breadcrumbs = computed(() => [
  { label: 'Home', to: '/' },
  { label: 'Arbetsorder', to: '/work-orders' },
  { 
    label: isNewWorkOrder.value 
      ? 'Ny arbetsorder' 
      : formData.value.orderNumber || 'Arbetsorderdetaljer', 
    isCurrentPage: true 
  }
])

// Action buttons for ActionBar
const actionButtons = computed(() => [
  {
    label: 'Spara arbetsorder',
    icon: Save,
    onClick: saveWorkOrder,
    class: 'text-xs h-8'
  },
  {
    label: 'Tillbaka',
    icon: ArrowLeft,
    onClick: () => router.push('/work-orders'),
    variant: 'outline' as const,
    class: 'text-xs h-8'
  }
])

// Form data
const formData = ref<Partial<WorkOrder>>({
  orderNumber: '',
  customerId: 0,
  customerName: '',
  projectName: '',
  description: '',
  assignedTo: [],
  status: 'Planerad',
  priority: 'Medium',
  estimatedHours: 0,
  actualHours: 0,
  startDate: '',
  dueDate: '',
  address: '',
  tasks: []
})

// Task modal
const isTaskModalOpen = ref(false)
const editingTask = ref<WorkOrderTask | null>(null)
const taskForm = ref({
  type: 'standard' as 'standard' | 'paus' | 'övrigt',
  machine: '',
  tool: '',
  value: 0,
  unit: 'st',
  description: '',
  completed: false
})

// Customer options
const customerOptions = computed(() => {
  return customerStore.customers.map(customer => ({
    value: customer.id,
    label: customer.companyName
  }))
})

// Handle customer selection
const handleCustomerChange = (customerId: string) => {
  const customer = customerStore.customers.find(c => c.id === parseInt(customerId))
  if (customer) {
    formData.value.customerId = customer.id
    formData.value.customerName = customer.companyName
  }
}

// Load work order data
onMounted(() => {
  if (!isNewWorkOrder.value && workOrderId.value) {
    const workOrder = workOrderStore.getWorkOrderById(workOrderId.value)
    if (workOrder) {
      formData.value = { ...workOrder }
    } else {
      error('Arbetsorder hittades inte', 'Den begärda arbetsordern kunde inte hittas.')
      router.push('/work-orders')
    }
  } else {
    // New work order
    formData.value.orderNumber = workOrderStore.generateOrderNumber()
    formData.value.tasks = []
  }
})

// Task columns for DataTable
const taskColumns = [
  {
    key: 'type',
    label: 'Typ',
    sortable: true,
    width: '10%',
    type: 'badge' as const,
    badgeVariant: (value: string) => {
      switch (value) {
        case 'standard': return 'default'
        case 'paus': return 'secondary'
        case 'övrigt': return 'outline'
        default: return 'outline'
      }
    }
  },
  {
    key: 'description',
    label: 'Beskrivning',
    sortable: true,
    width: '25%'
  },
  {
    key: 'machine',
    label: 'Maskin',
    sortable: true,
    width: '15%'
  },
  {
    key: 'tool',
    label: 'Redskap',
    sortable: true,
    width: '15%'
  },
  {
    key: 'valueWithUnit',
    label: 'Värde',
    sortable: false,
    width: '10%'
  },
  {
    key: 'completed',
    label: 'Status',
    sortable: true,
    width: '10%',
    type: 'badge' as const,
    badgeVariant: (value: boolean) => value ? 'default' : 'secondary'
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
    width: '15%',
    type: 'actions' as const,
    align: 'right' as const
  }
]

// Transform tasks for DataTable
const transformedTasks = computed(() => {
  return (formData.value.tasks || []).map(task => ({
    ...task,
    valueWithUnit: `${task.value} ${task.unit}`,
    completed: task.completed ? 'Klar' : 'Pågående'
  }))
})

// Handle assigned people
const availableEmployees = computed(() => {
  return workOrderStore.employees.filter(employee => 
    !formData.value.assignedTo?.includes(employee)
  )
})

const addAssignedPerson = (employee: string) => {
  if (!formData.value.assignedTo) {
    formData.value.assignedTo = []
  }
  if (!formData.value.assignedTo.includes(employee)) {
    formData.value.assignedTo.push(employee)
  }
}

const removeAssignedPerson = (index: number) => {
  if (formData.value.assignedTo) {
    formData.value.assignedTo.splice(index, 1)
  }
}

// Save work order
const saveWorkOrder = async () => {
  try {
    if (!formData.value.projectName || !formData.value.customerId || formData.value.customerId === 0) {
      error('Obligatoriska fält saknas', 'Vänligen fyll i kund och projektnamn.')
      return
    }

    if (isNewWorkOrder.value) {
      const newWorkOrder = workOrderStore.addWorkOrder(formData.value as Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>)
      success('Arbetsorder skapad', `Arbetsorder ${newWorkOrder.orderNumber} har skapats.`)
      router.push(`/work-orders/${newWorkOrder.id}`)
    } else if (workOrderId.value) {
      workOrderStore.updateWorkOrder(workOrderId.value, formData.value)
      success('Arbetsorder uppdaterad', 'Ändringarna har sparats.')
    }
  } catch (err) {
    error('Fel vid sparande', 'Ett fel uppstod när arbetsordern skulle sparas.')
  }
}

// Task management
const openTaskModal = (task?: WorkOrderTask) => {
  if (task) {
    editingTask.value = task
    taskForm.value = { ...task }
  } else {
    editingTask.value = null
    taskForm.value = {
      type: 'standard',
      machine: '',
      tool: '',
      value: 0,
      unit: 'st',
      description: '',
      completed: false
    }
  }
  isTaskModalOpen.value = true
}

const saveTask = () => {
  if (!taskForm.value.description) {
    error('Beskrivning saknas', 'Vänligen ange en beskrivning för uppgiften.')
    return
  }

  if (editingTask.value) {
    // Update existing task
    const taskIndex = formData.value.tasks?.findIndex(t => t.id === editingTask.value!.id)
    if (taskIndex !== undefined && taskIndex >= 0 && formData.value.tasks) {
      formData.value.tasks[taskIndex] = { ...editingTask.value, ...taskForm.value }
    }
  } else {
    // Add new task
    const newTask: WorkOrderTask = {
      id: Math.max(...(formData.value.tasks?.map(t => t.id) || [0]), 0) + 1,
      ...taskForm.value,
      createdAt: new Date().toISOString()
    }
    
    if (!formData.value.tasks) {
      formData.value.tasks = []
    }
    formData.value.tasks.push(newTask)
  }

  isTaskModalOpen.value = false
  success('Uppgift sparad', editingTask.value ? 'Uppgiften har uppdaterats.' : 'Ny uppgift har lagts till.')
}

const deleteTask = async (task: WorkOrderTask) => {
  const confirmed = await confirm(
    'Ta bort uppgift',
    `Är du säker på att du vill ta bort uppgiften "${task.description}"?`,
    {
      confirmText: 'Ta bort',
      cancelText: 'Avbryt',
      confirmVariant: 'destructive'
    }
  )

  if (confirmed && formData.value.tasks) {
    const taskIndex = formData.value.tasks.findIndex(t => t.id === task.id)
    if (taskIndex >= 0) {
      formData.value.tasks.splice(taskIndex, 1)
      success('Uppgift borttagen', 'Uppgiften har tagits bort.')
    }
  }
}

const toggleTaskCompletion = (task: WorkOrderTask) => {
  if (formData.value.tasks) {
    const taskIndex = formData.value.tasks.findIndex(t => t.id === task.id)
    if (taskIndex >= 0) {
      formData.value.tasks[taskIndex].completed = !formData.value.tasks[taskIndex].completed
    }
  }
}

// Page stats
const stats = computed(() => [
  {
    label: 'Totalt uppgifter',
    value: (formData.value.tasks?.length || 0).toString(),
    change: '',
    trend: 'neutral' as const
  },
  {
    label: 'Klara uppgifter',
    value: (formData.value.tasks?.filter(t => t.completed).length || 0).toString(),
    change: '',
    trend: 'up' as const
  },
  {
    label: 'Beräknade timmar',
    value: formData.value.estimatedHours?.toString() || '0',
    change: '',
    trend: 'neutral' as const
  },
  {
    label: 'Faktiska timmar',
    value: formData.value.actualHours?.toString() || '0',
    change: '',
    trend: 'neutral' as const
  }
])
</script>

<template>
  <div class="w-full">
    <!-- Standard Header -->
    <StandardHeader
      :title="isNewWorkOrder ? 'Ny arbetsorder' : `Arbetsorder ${formData.orderNumber}`"
      :breadcrumbs="breadcrumbs"
      :show-stats="true"
      :stats="stats"
    />

    <!-- Action Bar -->
    <ActionBar :action-buttons="actionButtons" />

    <div class="space-y-6 px-6 mt-6">
      <!-- Grundläggande information - Centrerad box -->
      <div class="flex justify-center">
        <div class="w-full max-w-6xl bg-white p-6 rounded-lg border">
          <h3 class="text-lg font-semibold mb-4 text-left">Grundläggande information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            <div class="space-y-2">
              <Label for="orderNumber">Ordernummer</Label>
              <Input
                id="orderNumber"
                v-model="formData.orderNumber"
                :disabled="!isNewWorkOrder"
                class="text-xs"
              />
            </div>

            <div class="space-y-2">
              <Label for="customer">Kund *</Label>
              <Select :value="formData.customerId?.toString()" @update:value="handleCustomerChange">
                <SelectTrigger class="text-xs">
                  <SelectValue placeholder="Välj kund" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    v-for="customer in customerOptions" 
                    :key="customer.value" 
                    :value="customer.value.toString()"
                  >
                    {{ customer.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="projectName">Projektnamn *</Label>
              <Input
                id="projectName"
                v-model="formData.projectName"
                class="text-xs"
              />
            </div>

            <div class="space-y-2">
              <Label for="assignedTo">Tilldelade personer</Label>
              <div class="space-y-2">
                <div class="flex flex-wrap gap-1 min-h-[32px] p-2 border rounded-md">
                  <Badge 
                    v-for="(person, index) in formData.assignedTo" 
                    :key="index"
                    variant="secondary"
                    class="text-xs"
                  >
                    {{ person }}
                    <Button
                      variant="ghost"
                      size="sm"
                      @click="removeAssignedPerson(index)"
                      class="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X class="h-2 w-2" />
                    </Button>
                  </Badge>
                  <span v-if="!formData.assignedTo?.length" class="text-xs text-muted-foreground">
                    Inga personer tilldelade
                  </span>
                </div>
                <Select @update:value="addAssignedPerson">
                  <SelectTrigger class="text-xs">
                    <SelectValue placeholder="Lägg till person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="employee in availableEmployees" 
                      :key="employee" 
                      :value="employee"
                    >
                      {{ employee }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="status">Status</Label>
              <Select v-model="formData.status">
                <SelectTrigger class="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planerad">Planerad</SelectItem>
                  <SelectItem value="Pågående">Pågående</SelectItem>
                  <SelectItem value="Pausad">Pausad</SelectItem>
                  <SelectItem value="Avslutad">Avslutad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="priority">Prioritet</Label>
              <Select v-model="formData.priority">
                <SelectTrigger class="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Låg">Låg</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hög">Hög</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="startDate">Startdatum</Label>
              <Input
                id="startDate"
                v-model="formData.startDate"
                type="date"
                class="text-xs"
              />
            </div>

            <div class="space-y-2">
              <Label for="dueDate">Slutdatum</Label>
              <Input
                id="dueDate"
                v-model="formData.dueDate"
                type="date"
                class="text-xs"
              />
            </div>

            <div class="space-y-2">
              <Label for="estimatedHours">Beräknade timmar</Label>
              <Input
                id="estimatedHours"
                v-model.number="formData.estimatedHours"
                type="number"
                min="0"
                class="text-xs"
              />
            </div>

            <div class="space-y-2 md:col-span-2 lg:col-span-3">
              <Label for="address">Adress</Label>
              <Input
                id="address"
                v-model="formData.address"
                class="text-xs"
              />
            </div>

            <div class="space-y-2 md:col-span-2 lg:col-span-3">
              <Label for="description">Beskrivning</Label>
              <Textarea
                id="description"
                v-model="formData.description"
                rows="3"
                class="text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Uppgifter - Utan box -->
      <div class="space-y-4">
        <div class="flex justify-between items-center text-left">
          <h3 class="text-lg font-semibold">Uppgifter</h3>
          <Dialog v-model:open="isTaskModalOpen">
            <DialogTrigger asChild>
              <Button @click="openTaskModal()" class="text-xs h-8">
                <Plus class="h-3 w-3 mr-1" />
                Lägg till uppgift
              </Button>
            </DialogTrigger>
            <DialogContent class="max-w-md">
              <DialogHeader>
                <DialogTitle>{{ editingTask ? 'Redigera uppgift' : 'Ny uppgift' }}</DialogTitle>
              </DialogHeader>
              
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="taskType">Typ</Label>
                  <Select v-model="taskForm.type">
                    <SelectTrigger class="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="paus">Paus</SelectItem>
                      <SelectItem value="övrigt">Övrigt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-2">
                  <Label for="taskDescription">Beskrivning *</Label>
                  <Input
                    id="taskDescription"
                    v-model="taskForm.description"
                    class="text-xs"
                  />
                </div>

                <div class="space-y-2" v-if="taskForm.type !== 'paus'">
                  <Label for="taskMachine">Maskin</Label>
                  <Select v-model="taskForm.machine">
                    <SelectTrigger class="text-xs">
                      <SelectValue placeholder="Välj maskin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="machine in workOrderStore.machines" 
                        :key="machine" 
                        :value="machine"
                      >
                        {{ machine }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-2" v-if="taskForm.type !== 'paus' && taskForm.machine">
                  <Label for="taskTool">Redskap</Label>
                  <Select v-model="taskForm.tool">
                    <SelectTrigger class="text-xs">
                      <SelectValue placeholder="Välj redskap" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem 
                        v-for="tool in workOrderStore.tools" 
                        :key="tool" 
                        :value="tool"
                      >
                        {{ tool }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="space-y-2">
                    <Label for="taskValue">Värde</Label>
                    <Input
                      id="taskValue"
                      v-model.number="taskForm.value"
                      type="number"
                      min="0"
                      step="0.1"
                      class="text-xs"
                    />
                  </div>

                  <div class="space-y-2">
                    <Label for="taskUnit">Enhet</Label>
                    <Select v-model="taskForm.unit">
                      <SelectTrigger class="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem 
                          v-for="unit in workOrderStore.units" 
                          :key="unit" 
                          :value="unit"
                        >
                          {{ unit }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div class="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" @click="isTaskModalOpen = false" class="text-xs">
                    Avbryt
                  </Button>
                  <Button @click="saveTask" class="text-xs">
                    {{ editingTask ? 'Uppdatera' : 'Lägg till' }}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          :data="transformedTasks"
          :columns="taskColumns"
          :items-per-page="10"
          :search-fields="['description', 'machine', 'tool']"
          :on-edit="(task) => openTaskModal(task)"
          :on-delete="deleteTask"
          delete-confirm-message="Är du säker på att du vill ta bort denna uppgift?"
        >
          <!-- Custom actions -->
          <template #actions="{ row }">
            <div class="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                @click="toggleTaskCompletion(row)"
                class="h-6 w-6 p-0"
                :class="row.completed === 'Klar' ? 'text-green-600' : 'text-gray-400'"
              >
                <Check class="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="openTaskModal(row)"
                class="h-6 w-6 p-0"
              >
                <Edit class="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="deleteTask(row)"
                class="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template> 