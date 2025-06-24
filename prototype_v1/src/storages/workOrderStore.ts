import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WorkOrderTask {
  id: number
  type: 'standard' | 'paus' | 'övrigt'
  machine: string
  tool?: string
  value: number
  unit: string
  description: string
  completed: boolean
  createdAt: string
}

export interface WorkOrder {
  id: number
  orderNumber: string
  customerId: number
  customerName: string
  projectName: string
  description: string
  assignedTo: string[]
  status: 'Planerad' | 'Pågående' | 'Pausad' | 'Avslutad'
  priority: 'Låg' | 'Medium' | 'Hög'
  estimatedHours: number
  actualHours: number
  startDate: string
  dueDate: string
  address: string
  tasks: WorkOrderTask[]
  createdAt: string
  updatedAt: string
}

export const useWorkOrderStore = defineStore('workOrder', () => {
  const workOrders = ref<WorkOrder[]>([
    {
      id: 1,
      orderNumber: 'AO-2024-001',
      customerId: 1,
      customerName: 'Acme AB',
      projectName: 'Systemuppdatering',
      description: 'Uppdatering av befintligt system med nya funktioner',
      assignedTo: ['Anna Andersson'],
      status: 'Pågående',
      priority: 'Hög',
      estimatedHours: 40,
      actualHours: 25,
      startDate: '2024-01-15',
      dueDate: '2024-02-15',
      address: 'Storgatan 123, Stockholm',
      tasks: [
        {
          id: 1,
          type: 'standard',
          machine: 'Grävmaskin CAT 320',
          tool: 'Standardskopa',
          value: 50,
          unit: 'kubik',
          description: 'Schaktning för fundament',
          completed: true,
          createdAt: '2024-01-15T08:00:00'
        },
        {
          id: 2,
          type: 'paus',
          machine: '',
          tool: '',
          value: 1,
          unit: 'timmar',
          description: 'Lunchpaus',
          completed: true,
          createdAt: '2024-01-15T12:00:00'
        }
      ],
      createdAt: '2024-01-15T08:00:00',
      updatedAt: '2024-01-15T08:00:00'
    },
    {
      id: 2,
      orderNumber: 'AO-2024-002',
      customerId: 2,
      customerName: 'TechCorp Ltd',
      projectName: 'Webbplats redesign',
      description: 'Komplett redesign av företagets webbplats',
      assignedTo: ['Erik Eriksson'],
      status: 'Planerad',
      priority: 'Medium',
      estimatedHours: 60,
      actualHours: 0,
      startDate: '2024-02-01',
      dueDate: '2024-03-15',
      address: 'Industrivägen 45, Göteborg',
      tasks: [],
      createdAt: '2024-01-20T10:00:00',
      updatedAt: '2024-01-20T10:00:00'
    }
  ])

  const machines = ref([
    'Grävmaskin CAT 320',
    'Grävmaskin Volvo EC220',
    'Hjullastare CAT 950',
    'Dumper Volvo A25',
    'Komprimator Dynapac CA250',
    'Asfaltsläggare Volvo ABG5820'
  ])

  const tools = ref([
    'Standardskopa',
    'Dräneringsskopa',
    'Sorteringsskopa',
    'Hydraulhammare',
    'Roterande skopa',
    'Gafflar',
    'Snöplog',
    'Saltspridare'
  ])

  const units = ref([
    'st',
    'kubik',
    'mil',
    'meter',
    'timmar',
    'ton',
    'kvadrat',
    'liter'
  ])

  const employees = ref([
    'Anna Andersson',
    'Erik Eriksson',
    'Maria Nilsson',
    'Johan Johansson',
    'Lisa Larsson',
    'Peter Petersson',
    'Sara Svensson'
  ])

  // Computed
  const totalWorkOrders = computed(() => workOrders.value.length)
  const activeWorkOrders = computed(() => workOrders.value.filter(wo => wo.status === 'Pågående'))
  const plannedWorkOrders = computed(() => workOrders.value.filter(wo => wo.status === 'Planerad'))
  const completedWorkOrders = computed(() => workOrders.value.filter(wo => wo.status === 'Avslutad'))

  // Actions
  const getWorkOrderById = (id: number): WorkOrder | undefined => {
    return workOrders.value.find(wo => wo.id === id)
  }

  const addWorkOrder = (workOrder: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = Math.max(...workOrders.value.map(wo => wo.id), 0) + 1
    const now = new Date().toISOString()
    
    const newWorkOrder: WorkOrder = {
      ...workOrder,
      id: newId,
      createdAt: now,
      updatedAt: now
    }
    
    workOrders.value.push(newWorkOrder)
    return newWorkOrder
  }

  const updateWorkOrder = (id: number, updates: Partial<WorkOrder>) => {
    const index = workOrders.value.findIndex(wo => wo.id === id)
    if (index !== -1) {
      workOrders.value[index] = {
        ...workOrders.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      return workOrders.value[index]
    }
    return null
  }

  const removeWorkOrder = (id: number) => {
    const index = workOrders.value.findIndex(wo => wo.id === id)
    if (index !== -1) {
      workOrders.value.splice(index, 1)
      return true
    }
    return false
  }

  const addTaskToWorkOrder = (workOrderId: number, task: Omit<WorkOrderTask, 'id' | 'createdAt'>) => {
    const workOrder = getWorkOrderById(workOrderId)
    if (workOrder) {
      const newTaskId = Math.max(...workOrder.tasks.map(t => t.id), 0) + 1
      const newTask: WorkOrderTask = {
        ...task,
        id: newTaskId,
        createdAt: new Date().toISOString()
      }
      
      workOrder.tasks.push(newTask)
      updateWorkOrder(workOrderId, { tasks: workOrder.tasks })
      return newTask
    }
    return null
  }

  const updateTask = (workOrderId: number, taskId: number, updates: Partial<WorkOrderTask>) => {
    const workOrder = getWorkOrderById(workOrderId)
    if (workOrder) {
      const taskIndex = workOrder.tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        workOrder.tasks[taskIndex] = { ...workOrder.tasks[taskIndex], ...updates }
        updateWorkOrder(workOrderId, { tasks: workOrder.tasks })
        return workOrder.tasks[taskIndex]
      }
    }
    return null
  }

  const removeTask = (workOrderId: number, taskId: number) => {
    const workOrder = getWorkOrderById(workOrderId)
    if (workOrder) {
      const taskIndex = workOrder.tasks.findIndex(t => t.id === taskId)
      if (taskIndex !== -1) {
        workOrder.tasks.splice(taskIndex, 1)
        updateWorkOrder(workOrderId, { tasks: workOrder.tasks })
        return true
      }
    }
    return false
  }

  const generateOrderNumber = (): string => {
    const year = new Date().getFullYear()
    const existingNumbers = workOrders.value
      .map(wo => wo.orderNumber)
      .filter(num => num.startsWith(`AO-${year}-`))
      .map(num => parseInt(num.split('-')[2]))
      .filter(num => !isNaN(num))
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1
    return `AO-${year}-${nextNumber.toString().padStart(3, '0')}`
  }

  return {
    workOrders,
    machines,
    tools,
    units,
    employees,
    totalWorkOrders,
    activeWorkOrders,
    plannedWorkOrders,
    completedWorkOrders,
    getWorkOrderById,
    addWorkOrder,
    updateWorkOrder,
    removeWorkOrder,
    addTaskToWorkOrder,
    updateTask,
    removeTask,
    generateOrderNumber
  }
}) 