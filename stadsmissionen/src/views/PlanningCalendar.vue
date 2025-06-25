<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Grab,
  MapPin,
  Plus,
  User,
  Users,
  X,
} from 'lucide-vue-next';
import { useApiList } from '@/composables/useApi';
import api from '@/api';

const router = useRouter();

// API Data with composables
const {
  data: workOrders,
  loading: workOrdersLoading,
  error: workOrdersError,
  refresh: refetchWorkOrders,
} = useApiList(() => api.workOrders.getAll(), { cacheKey: 'workOrders' });

const {
  data: customers,
  loading: customersLoading,
  error: customersError,
  refresh: refetchCustomers,
} = useApiList(() => api.customers.getAll(), { cacheKey: 'customers' });

const {
  data: employees,
  loading: employeesLoading,
  error: employeesError,
  refresh: refetchEmployees,
} = useApiList(() => api.employees.getAll(), { cacheKey: 'employees' });

// Loading and error states
const isLoading = computed(
  () => workOrdersLoading.value || customersLoading.value || employeesLoading.value
);

const hasError = computed(
  () =>
    workOrdersError.value !== null || customersError.value !== null || employeesError.value !== null
);

// State
const currentDate = ref(new Date());
const statusFilter = ref('');
const draggedItem = ref(null);
const draggedType = ref(''); // 'workorder' or 'employee'
const isDragOver = ref(false);
const dragOverTarget = ref<{ date: string } | null>(null);
const expandedWorkOrders = ref(new Set<number>());
const viewMode = ref('week'); // 'week' or 'month'
const copyMode = ref(false);
const copyingWorkOrder = ref(null);

// Data
const workOrderSchedule = ref({}); // { date: [workOrderIds] }

// Swedish holidays and special days
const holidays = ref({
  '2024-01-01': 'Nyårsdagen',
  '2024-01-06': 'Trettondedag jul',
  '2024-03-29': 'Långfredagen',
  '2024-04-01': 'Annandag påsk',
  '2024-05-01': 'Första maj',
  '2024-05-09': 'Kristi himmelsfärdsdag',
  '2024-05-20': 'Annandag pingst',
  '2024-06-06': 'Nationaldagen',
  '2024-06-21': 'Midsommarafton',
  '2024-06-22': 'Midsommardagen',
  '2024-12-24': 'Julafton',
  '2024-12-25': 'Juldagen',
  '2024-12-26': 'Annandag jul',
  '2024-12-31': 'Nyårsafton',
});

// Event handlers
const handleCreateWorkOrder = () => {
  router.push('/work-orders/new');
};

const handleRetry = async () => {
  await Promise.all([refetchWorkOrders(), refetchCustomers(), refetchEmployees()]);
};

// Initialize schedule when data is loaded
onMounted(() => {
  // Watch for data changes and initialize schedule
  const unwatch = computed(() => {
    if (workOrders.value && workOrders.value.length > 0) {
      initializeSchedule();
      return true;
    }
    return false;
  });

  // Clean up watcher when component unmounts
  return unwatch;
});

const initializeSchedule = () => {
  // Initialize with smart time distribution - leave some work orders unscheduled
  workOrderSchedule.value = {
    '2024-02-19': [1, 5], // Monday - 2 orders
    '2024-02-20': [2, 6], // Tuesday - 2 orders
    '2024-02-21': [3], // Wednesday - 1 order
    '2024-02-22': [4], // Thursday - 1 order
    // Leave orders 7, 8, 9, 10+ unscheduled
  };

  // Set scheduled dates and auto-calculate start times
  updateScheduledTimes();
};

const updateScheduledTimes = () => {
  Object.entries(workOrderSchedule.value).forEach(([date, orderIds]) => {
    let currentTime = 7; // Start at 7:00

    orderIds.forEach((id: number) => {
      const workOrder = workOrders.value.find((wo: any) => wo.WorkOrderID === id);
      if (workOrder) {
        workOrder.ScheduledDate = date;
        workOrder.ScheduledStartTime = currentTime;

        // Calculate effective duration based on assigned employees
        const assignedEmployees = getAssignedEmployees(workOrder.WorkOrderID);
        const effectiveDuration = calculateEffectiveDuration(
          workOrder.EstimatedHours,
          assignedEmployees.length
        );

        currentTime += effectiveDuration;
      }
    });
  });
};

// Simplified function to get assigned employees for a work order
const getAssignedEmployees = (workOrderId: number) => {
  const workOrder = workOrders.value.find((wo: any) => wo.WorkOrderID === workOrderId);
  if (!workOrder?.AssignedEmployeeIDs) {
    return workOrder?.AssignedEmployeeID ? [workOrder.AssignedEmployeeID] : [];
  }
  return workOrder.AssignedEmployeeIDs;
};

// Simplified function to calculate effective duration based on number of employees
const calculateEffectiveDuration = (originalHours: number, employeeCount: number) => {
  if (employeeCount <= 1) return originalHours;
  // More employees = shorter duration (but not perfectly linear due to coordination overhead)
  const efficiency = Math.min(employeeCount * 0.8, employeeCount); // 80% efficiency per additional person
  return Math.ceil(originalHours / efficiency);
};

// Helper function to add days to a date string
const addDaysToDate = (dateString: string, days: number) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return formatDate(date, 'YYYY-MM-DD');
};

// Computed properties
const currentWeek = computed(() => {
  const date = new Date(currentDate.value);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
});

const weekStart = computed(() => {
  const date = new Date(currentDate.value);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
});

const weekEnd = computed(() => {
  const date = new Date(weekStart.value);
  return new Date(date.setDate(date.getDate() + 6));
});

const weekDays = computed(() => {
  if (viewMode.value === 'month') {
    return getMonthDays();
  }

  const days = [];
  const start = new Date(weekStart.value);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push({
      date: formatDate(date, 'YYYY-MM-DD'),
      name: formatDate(date, 'ddd'),
      fullDate: new Date(date),
      isWeekend: isWeekend(date),
      isHoliday: isHoliday(formatDate(date, 'YYYY-MM-DD')),
      isWorkDay: isWorkDay(date),
    });
  }

  return days;
});

const unscheduledWorkOrders = computed(() => {
  const scheduledIds = new Set();

  Object.values(workOrderSchedule.value).forEach((orderIds: any) => {
    orderIds.forEach((id: number) => scheduledIds.add(id));
  });

  return workOrders.value.filter(
    (wo: any) =>
      !scheduledIds.has(wo.WorkOrderID) &&
      wo.Status !== 'completed' &&
      (!statusFilter.value || wo.Status === statusFilter.value)
  );
});

const calendarStats = computed(() => {
  if (!workOrders.value || !employees.value) {
    return [
      { title: 'Totalt arbetsordrar', value: 0, icon: ClipboardList, color: 'blue' },
      { title: 'Planerade', value: 0, icon: Calendar, color: 'green' },
      { title: 'Oplanerade', value: 0, icon: AlertCircle, color: 'orange' },
      { title: 'Kapacitetsutnyttjande', value: '0%', icon: BarChart3, color: 'purple' },
    ];
  }

  const totalUtilization = getTotalWeekUtilization();

  return [
    {
      title: 'Totalt arbetsordrar',
      value: workOrders.value.length,
      icon: ClipboardList,
      color: 'blue',
    },
    {
      title: 'Planerade',
      value: getScheduledCount(),
      icon: Calendar,
      color: 'green',
    },
    {
      title: 'Oplanerade',
      value: unscheduledWorkOrders.value.length,
      icon: AlertCircle,
      color: 'orange',
    },
    {
      title: 'Kapacitetsutnyttjande',
      value: `${Math.round(totalUtilization)}%`,
      icon: BarChart3,
      color: totalUtilization < 70 ? 'red' : totalUtilization < 90 ? 'orange' : 'green',
    },
  ];
});

// Helper functions
const formatDate = (date: Date | string, format: string = 'YYYY-MM-DD') => {
  const d = new Date(date);

  const formats: { [key: string]: string } = {
    'YYYY-MM-DD': d.toISOString().split('T')[0],
    'DD/MM': `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`,
    ddd: d.toLocaleDateString('sv-SE', { weekday: 'short' }),
  };

  return formats[format] ?? d.toLocaleDateString('sv-SE');
};

const formatDateRange = (start: Date, end: Date) => {
  return `${formatDate(start, 'DD/MM')} - ${formatDate(end, 'DD/MM')}`;
};

const formatWorkOrderSchedule = (workOrder: any) => {
  if (!workOrder.ScheduledStartTime || !workOrder.ScheduledDate) return 'Ej schemalagd';
  const startHour = workOrder.ScheduledStartTime;
  const endHour = startHour + workOrder.EstimatedHours;
  return `${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`;
};

const isToday = (dateString: string) => {
  return dateString === formatDate(new Date());
};

const getDayWorkOrders = (date: string) => {
  const orderIds = workOrderSchedule.value[date] ?? [];
  return orderIds
    .map((id: number) => workOrders.value.find((wo: any) => wo.WorkOrderID === id))
    .filter(Boolean);
};

const getSortedDayWorkOrders = (date: string) => {
  const dayOrders = getDayWorkOrders(date);

  return dayOrders.sort((a, b) => {
    // Sort by scheduled start time, then by priority
    if (a.ScheduledStartTime !== b.ScheduledStartTime) {
      return (a.ScheduledStartTime ?? 0) - (b.ScheduledStartTime ?? 0);
    }

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.Priority] ?? 3) - (priorityOrder[b.Priority] ?? 3);
  });
};

const getDayWorkloadHours = (date: string) => {
  const dayOrders = getSortedDayWorkOrders(date);
  return dayOrders.reduce((total, wo) => {
    const assignedEmployees = getAssignedEmployees(wo.WorkOrderID);
    const effectiveHours = calculateEffectiveDuration(wo.EstimatedHours, assignedEmployees.length);
    return total + (effectiveHours ?? 0);
  }, 0);
};

const getTotalDayCapacity = (date: string) => {
  // Calculate total capacity based on employees' weekly capacity
  if (!employees.value) return 32; // fallback
  return employees.value.reduce((total, emp) => total + (emp.weeklyCapacity ?? 40) / 5, 0); // daily capacity
};

const getDayCapacityPercentage = (date: string) => {
  const used = getDayWorkloadHours(date);
  const total = getTotalDayCapacity(date);
  return Math.min((used / total) * 100, 100);
};

const getDayCapacityColor = (date: string) => {
  const percentage = getDayCapacityPercentage(date);
  if (percentage < 70) return 'bg-red-500';
  if (percentage < 90) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getDayCapacityTextColor = (date: string) => {
  const percentage = getDayCapacityPercentage(date);
  if (percentage < 70) return 'text-red-600';
  if (percentage < 90) return 'text-yellow-600';
  return 'text-green-600';
};

const getEmployeeWeekHours = (employeeId: number) => {
  let totalHours = 0;

  weekDays.value.forEach(day => {
    const dayOrders = getDayWorkOrders(day.date);
    dayOrders.forEach(wo => {
      if (wo.AssignedEmployeeID === employeeId) {
        totalHours += wo.EstimatedHours ?? 0;
      }
    });
  });

  return totalHours;
};

const getTotalWeekUtilization = () => {
  if (!employees.value) return 0;
  const totalPlanned = employees.value.reduce((sum, emp) => sum + getEmployeeWeekHours(emp.id), 0);
  const totalCapacity = employees.value.reduce((sum, emp) => sum + (emp.weeklyCapacity ?? 40), 0);
  return totalCapacity > 0 ? (totalPlanned / totalCapacity) * 100 : 0;
};

const getScheduledCount = () => {
  const scheduledIds = new Set();
  Object.values(workOrderSchedule.value).forEach((orderIds: any) => {
    orderIds.forEach((id: number) => scheduledIds.add(id));
  });
  return scheduledIds.size;
};

const getEmployeeName = (employeeId: number) => {
  const employee = employees.value.find((e: any) => e.id === employeeId);
  return employee?.name ?? '';
};

const getEmployeeInitials = (employeeId: number) => {
  const employee = employees.value.find((e: any) => e.id === employeeId);
  return employee?.initials ?? '';
};

const getCustomerName = (customerId: number) => {
  const customer = customers.value.find((c: any) => c.CustomerID === customerId);
  return customer?.CompanyName ?? 'Okänd kund';
};

// Updated function to handle multiple employees
const getWorkOrderEmployeeDisplay = (workOrder: any) => {
  if (workOrder.AssignedEmployeeIDs && workOrder.AssignedEmployeeIDs.length > 0) {
    if (workOrder.AssignedEmployeeIDs.length === 1) {
      return getEmployeeName(workOrder.AssignedEmployeeIDs[0]);
    } else {
      const names = workOrder.AssignedEmployeeIDs.map((id: number) => getEmployeeInitials(id)).join(
        ', '
      );
      return `${names} (${workOrder.AssignedEmployeeIDs.length} pers)`;
    }
  } else if (workOrder.AssignedEmployeeID) {
    return getEmployeeName(workOrder.AssignedEmployeeID);
  }
  return 'Ej tilldelad';
};

// Function to get effective hours display
const getEffectiveHoursDisplay = (workOrder: any) => {
  const assignedEmployees = getAssignedEmployees(workOrder.WorkOrderID);
  const effectiveHours = calculateEffectiveDuration(
    workOrder.EstimatedHours,
    assignedEmployees.length
  );

  if (assignedEmployees.length > 1) {
    return `${effectiveHours}h (${workOrder.EstimatedHours}h/${assignedEmployees.length} pers)`;
  }
  return `${workOrder.EstimatedHours}h`;
};

// Simple copy work order to another day
const copyWorkOrderToDay = (workOrder: any, targetDate: string) => {
  // Check if work order can be scheduled on this date
  if (!canScheduleOnDate(workOrder, targetDate)) {
    const date = new Date(targetDate);
    let message = 'Kan inte schemalägga på denna dag: ';
    if (isWeekend(date)) message += 'Helg';
    if (isHoliday(targetDate)) message += 'Röd dag';
    alert(message);
    return;
  }

  // Add to target date
  if (!workOrderSchedule.value[targetDate]) {
    workOrderSchedule.value[targetDate] = [];
  }

  // Check if already scheduled on this date
  if (workOrderSchedule.value[targetDate].includes(workOrder.WorkOrderID)) {
    alert('Arbetsorder är redan schemalagd på denna dag');
    return;
  }

  workOrderSchedule.value[targetDate].push(workOrder.WorkOrderID);
  updateScheduledTimes();

  // Auto-cancel copy mode after successful copy
  copyMode.value = false;
  copyingWorkOrder.value = null;
};

// Expansion functions
const toggleWorkOrderExpansion = (workOrderId: number) => {
  if (expandedWorkOrders.value.has(workOrderId)) {
    expandedWorkOrders.value.delete(workOrderId);
  } else {
    expandedWorkOrders.value.add(workOrderId);
  }
};

// Styling functions
const getWorkOrderStatusClasses = (workOrder: any) => {
  const baseClasses = 'border';

  // Check if assigned
  if (!workOrder.AssignedEmployeeID) {
    return `${baseClasses} bg-yellow-50 border-yellow-300 text-yellow-800`;
  }

  // Check for collisions (simplified)
  const hasCollision = false; // You can implement collision detection here
  if (hasCollision) {
    return `${baseClasses} bg-red-50 border-red-300 text-red-800`;
  }

  // Normal planned work order
  return `${baseClasses} bg-blue-50 border-blue-300 text-blue-800`;
};

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'destructive';
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'Akut';
    case 'high':
      return 'Hög';
    case 'medium':
      return 'Medium';
    case 'low':
      return 'Låg';
    default:
      return priority;
  }
};

const getWorkloadColor = (hours: number) => {
  if (hours < 30) return 'bg-red-500';
  if (hours < 35) return 'bg-yellow-500';
  if (hours <= 40) return 'bg-green-500';
  return 'bg-red-500';
};

const getUtilizationColor = (hours: number) => {
  const percentage = (hours / 40) * 100;
  if (percentage < 70) return 'text-red-600';
  if (percentage < 90) return 'text-yellow-600';
  return 'text-green-600';
};

// Navigation functions
const previousWeek = () => {
  const date = new Date(currentDate.value);
  date.setDate(date.getDate() - 7);
  currentDate.value = date;
};

const nextWeek = () => {
  const date = new Date(currentDate.value);
  date.setDate(date.getDate() + 7);
  currentDate.value = date;
};

const goToToday = () => {
  currentDate.value = new Date();
};

// Enhanced Drag and drop functions
const onDragStart = (event: DragEvent, item: any, type: string) => {
  draggedItem.value = item;
  draggedType.value = type;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.id ?? item.WorkOrderID);
  }
};

const onDragOver = (event: DragEvent, date: string) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const onDragEnter = (event: DragEvent, date: string) => {
  event.preventDefault();
  isDragOver.value = true;
  dragOverTarget.value = { date };
};

const onDragLeave = (event: DragEvent) => {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOver.value = false;
    dragOverTarget.value = null;
  }
};

const onDrop = (event: DragEvent, date: string) => {
  event.preventDefault();
  isDragOver.value = false;
  dragOverTarget.value = null;

  // Handle copy mode
  if (copyMode.value && copyingWorkOrder.value) {
    copyWorkOrderToDay(copyingWorkOrder.value, date);
    return;
  }

  if (!draggedItem.value) return;

  if (draggedType.value === 'workorder') {
    // Check if work order can be scheduled on this date
    if (!canScheduleOnDate(draggedItem.value, date)) {
      const targetDate = new Date(date);
      let message = 'Kan inte schemalägga på denna dag: ';
      if (isWeekend(targetDate)) message += 'Helg';
      if (isHoliday(date)) message += 'Röd dag';
      alert(message);
      return;
    }

    // Remove from current position
    removeWorkOrderFromSchedule(draggedItem.value.WorkOrderID);

    // Add to new date
    if (!workOrderSchedule.value[date]) {
      workOrderSchedule.value[date] = [];
    }

    workOrderSchedule.value[date].push(draggedItem.value.WorkOrderID);
    updateScheduledTimes();
  }

  draggedItem.value = null;
  draggedType.value = '';
};

const onEmployeeDrop = (event: DragEvent, workOrder: any) => {
  event.preventDefault();
  event.stopPropagation();

  if (draggedType.value === 'employee' && draggedItem.value) {
    // Assign employee to work order
    workOrder.AssignedEmployeeID = draggedItem.value.id;
    draggedItem.value = null;
    draggedType.value = '';
  }
};

const removeWorkOrderFromSchedule = (workOrderId: number) => {
  Object.keys(workOrderSchedule.value).forEach(date => {
    const orderIds = workOrderSchedule.value[date];
    const index = orderIds.indexOf(workOrderId);
    if (index > -1) {
      orderIds.splice(index, 1);
      if (orderIds.length === 0) {
        delete workOrderSchedule.value[date];
      }
    }
  });

  // Clear scheduled info
  const workOrder = workOrders.value.find((wo: any) => wo.WorkOrderID === workOrderId);
  if (workOrder) {
    workOrder.ScheduledDate = null;
    workOrder.ScheduledStartTime = null;
  }
};

// Action functions
const viewWorkOrder = (id: number) => {
  router.push(`/work-orders/${id}`);
};

// Month view helper
const getMonthDays = () => {
  const days = [];
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  // Get first day of month and adjust to start from Monday
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(firstDay.getDate() + mondayOffset);

  // Generate 42 days (6 weeks) for month view
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    days.push({
      date: formatDate(date, 'YYYY-MM-DD'),
      name: formatDate(date, 'DD'),
      fullDate: new Date(date),
      isCurrentMonth: date.getMonth() === month,
      isWeekend: isWeekend(date),
      isHoliday: isHoliday(formatDate(date, 'YYYY-MM-DD')),
      isWorkDay: isWorkDay(date),
      isToday: isToday(formatDate(date, 'YYYY-MM-DD')),
    });
  }

  return days;
};

// Helper functions for day types
const isWeekend = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

const isHoliday = (dateString: string) => {
  return Object.prototype.hasOwnProperty.call(holidays.value, dateString);
};

const isWorkDay = (date: Date) => {
  const dateString = formatDate(date, 'YYYY-MM-DD');
  return !isWeekend(date) && !isHoliday(dateString);
};

const getHolidayName = (dateString: string) => {
  return holidays.value[dateString] ?? '';
};

// View mode functions
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'week' ? 'month' : 'week';
};

const currentPeriodLabel = computed(() => {
  if (viewMode.value === 'month') {
    return currentDate.value.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
  }
  return `Vecka ${currentWeek.value}`;
});

const currentPeriodSubLabel = computed(() => {
  if (viewMode.value === 'month') {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return `${formatDate(firstDay, 'DD/MM')} - ${formatDate(lastDay, 'DD/MM')}`;
  }
  return formatDateRange(weekStart.value, weekEnd.value);
});

// Navigation functions
const previousPeriod = () => {
  const date = new Date(currentDate.value);
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() - 1);
  } else {
    date.setDate(date.getDate() - 7);
  }
  currentDate.value = date;
};

const nextPeriod = () => {
  const date = new Date(currentDate.value);
  if (viewMode.value === 'month') {
    date.setMonth(date.getMonth() + 1);
  } else {
    date.setDate(date.getDate() + 7);
  }
  currentDate.value = date;
};

// Check if work order can be scheduled on date
const canScheduleOnDate = (workOrder: any, dateString: string) => {
  const date = new Date(dateString);

  // Check if it's a work day or if weekend work is allowed
  if (!isWorkDay(date) && !workOrder.AllowWeekends) {
    return false;
  }

  // Check if it's a holiday and work order doesn't allow holiday work
  if (isHoliday(dateString) && !workOrder.AllowHolidays) {
    return false;
  }

  return true;
};

// Start copy work order
const startCopy = (workOrder: any) => {
  copyMode.value = true;
  copyingWorkOrder.value = workOrder;
};

// Cancel copy work order
const cancelCopy = () => {
  copyMode.value = false;
  copyingWorkOrder.value = null;
};
</script>

<template>
  <div>
    <PageLayout
      title="Planeringskalender"
      :breadcrumbs="[
        { label: 'Hem', to: '/' },
        { label: 'Planeringskalender', isCurrentPage: true },
      ]"
      description="Planera medarbetare och arbetsordrar för 100% kapacitet"
      :stats="calendarStats"
    >
      <template #actions>
        <div class="flex gap-2">
          <Button variant="outline" class="gap-2" @click="goToToday">
            <Calendar class="h-4 w-4" />
            Idag
          </Button>
          <Button class="gap-2" @click="handleCreateWorkOrder">
            <Plus class="h-4 w-4" />
            Ny arbetsorder
          </Button>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
          ></div>
          <p class="text-muted-foreground">Laddar kalenderdata...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="hasError" class="text-center py-12">
        <div class="text-red-500 mb-4">
          <AlertCircle class="h-12 w-12 mx-auto mb-2" />
          <p class="text-lg font-semibold">Kunde inte ladda kalenderdata</p>
          <p class="text-sm text-muted-foreground mt-1">
            {{ workOrdersError?.message ?? employeesError?.message ?? customersError?.message }}
          </p>
        </div>
        <Button variant="outline" @click="handleRetry">Försök igen</Button>
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-4">
        <!-- Calendar Controls -->
        <div class="bg-card rounded-lg border border-border p-3">
          <div class="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <!-- Week Navigation -->
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <Button variant="outline" size="sm" @click="previousPeriod">
                  <ChevronLeft class="h-4 w-4" />
                </Button>
                <div class="text-center min-w-[180px]">
                  <h3 class="font-semibold text-sm">{{ currentPeriodLabel }}</h3>
                  <p class="text-xs text-muted-foreground">
                    {{ currentPeriodSubLabel }}
                  </p>
                </div>
                <Button variant="outline" size="sm" @click="nextPeriod">
                  <ChevronRight class="h-4 w-4" />
                </Button>
              </div>

              <!-- View Mode Toggle -->
              <Button variant="outline" size="sm" class="gap-2" @click="toggleViewMode">
                <Calendar class="h-4 w-4" />
                {{ viewMode === 'week' ? 'Månadsvy' : 'Veckovy' }}
              </Button>
            </div>

            <!-- Filters and Legend -->
            <div class="flex flex-wrap gap-2 items-center">
              <!-- Status Filter -->
              <select
                v-model="statusFilter"
                class="px-2 py-1 border border-border rounded text-xs bg-background"
              >
                <option value="">Alla status</option>
                <option value="planning">Planering</option>
                <option value="active">Aktiva</option>
                <option value="completed">Slutförda</option>
              </select>

              <!-- Color Legend -->
              <div class="flex gap-2 text-xs">
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
                  <span>Planerad</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
                  <span>Ej tilldelad</span>
                </div>
                <div class="flex items-center gap-1">
                  <div class="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
                  <span>Kollision</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Individual Day Move Mode Banner -->
        <div
          v-if="copyMode && copyingWorkOrder"
          class="bg-blue-50 border border-blue-200 rounded-lg p-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Grab class="h-4 w-4 text-blue-600" />
              <span class="text-sm font-medium text-blue-800">
                Kopierar arbetsorder: {{ copyingWorkOrder.WorkOrderNumber }} från
                {{ formatDate(copyingWorkOrder.ScheduledDate, 'DD/MM') }}
              </span>
            </div>
            <Button variant="outline" size="sm" @click="cancelCopy">Avbryt</Button>
          </div>
          <p class="text-xs text-blue-600 mt-1">
            Klicka på en dag för att kopiera dit, eller dra och släpp.
          </p>
        </div>

        <!-- Main Calendar Layout -->
        <div class="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <!-- Sidebar with Work Orders and Employees -->
          <div class="xl:col-span-1 space-y-4">
            <!-- Unscheduled Work Orders -->
            <div class="bg-card rounded-lg border border-border p-3">
              <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
                <AlertCircle class="h-4 w-4" />
                Oplanerade arbetsordrar
              </h3>

              <div class="space-y-1 max-h-[300px] overflow-y-auto">
                <div
                  v-for="workOrder in unscheduledWorkOrders"
                  :key="workOrder.WorkOrderID"
                  class="p-2 border border-border rounded text-xs hover:bg-muted/30 transition-colors cursor-move shadow-sm"
                  :class="getWorkOrderStatusClasses(workOrder)"
                  draggable="true"
                  @dragstart="onDragStart($event, workOrder, 'workorder')"
                  @click="toggleWorkOrderExpansion(workOrder.WorkOrderID)"
                >
                  <!-- Compact View (Always visible) -->
                  <div class="flex justify-between items-start mb-1">
                    <div class="flex-1 min-w-0">
                      <h4 class="font-medium text-xs truncate">{{ workOrder.WorkOrderNumber }}</h4>
                      <p class="text-xs text-muted-foreground truncate">{{ workOrder.Title }}</p>
                    </div>
                    <div class="flex items-center gap-1">
                      <!-- Multi-employee indicator -->
                      <div
                        v-if="getAssignedEmployees(workOrder.WorkOrderID).length > 1"
                        class="text-xs bg-green-100 text-green-700 px-1 rounded"
                      >
                        {{ getAssignedEmployees(workOrder.WorkOrderID).length }}👥
                      </div>
                      <Badge
                        :variant="getPriorityVariant(workOrder.Priority)"
                        class="text-xs px-1 py-0"
                      >
                        {{ getPriorityText(workOrder.Priority).charAt(0) }}
                      </Badge>
                      <ChevronRight
                        class="h-3 w-3 transition-transform"
                        :class="{ 'rotate-90': expandedWorkOrders.has(workOrder.WorkOrderID) }"
                      />
                    </div>
                  </div>

                  <!-- Expanded Details -->
                  <div
                    v-if="expandedWorkOrders.has(workOrder.WorkOrderID)"
                    class="mt-2 pt-2 border-t border-border/50"
                  >
                    <div class="space-y-1 text-xs text-muted-foreground">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1">
                          <User class="h-3 w-3" />
                          <span class="font-medium">
                            {{ getWorkOrderEmployeeDisplay(workOrder) }}
                          </span>
                        </div>
                        <div class="flex items-center gap-1">
                          <Clock class="h-3 w-3" />
                          <span>{{ getEffectiveHoursDisplay(workOrder) }}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        <MapPin class="h-3 w-3" />
                        <span class="truncate">{{ getCustomerName(workOrder.CustomerID) }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <Calendar class="h-3 w-3" />
                        <span>
                          {{ formatDate(workOrder.ScheduledDate, 'DD/MM') }}
                          {{ formatWorkOrderSchedule(workOrder) }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1">
                        <Badge
                          :variant="getPriorityVariant(workOrder.Priority)"
                          class="text-xs px-1 py-0"
                        >
                          {{ getPriorityText(workOrder.Priority) }}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="unscheduledWorkOrders.length === 0"
                  class="text-center py-6 text-muted-foreground"
                >
                  <CheckCircle class="h-8 w-8 mx-auto mb-1" />
                  <p class="text-xs">Alla planerade</p>
                </div>
              </div>
            </div>

            <!-- Available Employees -->
            <div class="bg-card rounded-lg border border-border p-3">
              <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users class="h-4 w-4" />
                Medarbetare
              </h3>

              <div class="space-y-2">
                <div
                  v-for="employee in employees"
                  :key="employee.id"
                  class="p-2 border border-border rounded text-xs hover:bg-muted/30 transition-colors cursor-move"
                  draggable="true"
                  @dragstart="onDragStart($event, employee, 'employee')"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <div
                      class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium"
                    >
                      {{ employee.initials }}
                    </div>
                    <span class="font-medium text-xs">{{ employee.name }}</span>
                  </div>
                  <div class="flex justify-between text-xs text-muted-foreground">
                    <span>Denna vecka:</span>
                    <span class="font-medium">
                      {{ getEmployeeWeekHours(employee.id) }}h /
                      {{ employee.weeklyCapacity ?? 40 }}h
                    </span>
                  </div>
                  <div class="w-full bg-muted rounded-full h-1 mt-1">
                    <div
                      class="h-1 rounded-full transition-all"
                      :class="getWorkloadColor(getEmployeeWeekHours(employee.id))"
                      :style="{
                        width: `${Math.min((getEmployeeWeekHours(employee.id) / (employee.weeklyCapacity ?? 40)) * 100, 100)}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Week/Month Overview Calendar -->
          <div class="xl:col-span-4">
            <div class="bg-card rounded-lg border border-border overflow-hidden">
              <!-- Week/Month Header -->
              <div
                :class="viewMode === 'month' ? 'grid grid-cols-7' : 'grid grid-cols-7'"
                class="border-b border-border"
              >
                <div
                  v-for="day in viewMode === 'month' ? weekDays.slice(0, 7) : weekDays"
                  :key="day.date"
                  class="p-3 text-center border-r border-border last:border-r-0"
                  :class="{
                    'bg-primary/5': day.isToday,
                    'bg-gray-100 text-gray-500': day.isWeekend && viewMode === 'week',
                    'bg-red-50 text-red-600': day.isHoliday,
                  }"
                >
                  <div class="font-medium text-sm">
                    {{
                      viewMode === 'month'
                        ? ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'][weekDays.indexOf(day)]
                        : day.name
                    }}
                  </div>
                  <div v-if="viewMode === 'week'" class="text-xs text-muted-foreground">
                    {{ formatDate(day.date, 'DD/MM') }}
                  </div>
                  <div v-if="viewMode === 'week'" class="text-xs text-muted-foreground mt-1">
                    {{ getDayWorkloadHours(day.date) }}h / {{ getTotalDayCapacity(day.date) }}h
                  </div>
                  <div v-if="viewMode === 'week'" class="w-full bg-muted rounded-full h-1 mt-1">
                    <div
                      class="h-1 rounded-full transition-all"
                      :class="getDayCapacityColor(day.date)"
                      :style="{ width: `${getDayCapacityPercentage(day.date)}%` }"
                    ></div>
                  </div>
                  <!-- Holiday indicator -->
                  <div v-if="day.isHoliday" class="text-xs text-red-600 font-medium mt-1">
                    {{ getHolidayName(day.date) }}
                  </div>
                </div>
              </div>

              <!-- Day Columns/Grid with Work Orders -->
              <div
                :class="viewMode === 'month' ? 'grid grid-cols-7 gap-0' : 'grid grid-cols-7'"
                class="min-h-[500px]"
              >
                <!-- Month View: 6 weeks of days -->
                <template v-if="viewMode === 'month'">
                  <div
                    v-for="day in weekDays"
                    :key="day.date"
                    class="border-r border-b border-border last:border-r-0 relative drop-zone p-1 min-h-[120px]"
                    :class="{
                      'bg-primary/5': day.isToday,
                      'bg-gray-50 text-gray-400': day.isWeekend,
                      'bg-red-50': day.isHoliday,
                      'opacity-50': !day.isCurrentMonth,
                      'bg-green-50 border-green-200':
                        isDragOver && dragOverTarget?.date === day.date,
                    }"
                    @drop="onDrop($event, day.date)"
                    @dragover="onDragOver($event, day.date)"
                    @dragenter="onDragEnter($event, day.date)"
                    @dragleave="onDragLeave($event)"
                  >
                    <!-- Day number -->
                    <div class="text-xs font-medium mb-1 flex justify-between items-center">
                      <span
                        :class="{ 'text-red-600': day.isHoliday, 'text-gray-400': day.isWeekend }"
                      >
                        {{ day.name }}
                      </span>
                      <span v-if="day.isHoliday" class="text-xs text-red-500">🔴</span>
                      <span v-else-if="day.isWeekend" class="text-xs text-gray-400">⚫</span>
                    </div>

                    <!-- Compact work orders for month view -->
                    <div class="space-y-0.5">
                      <div
                        v-for="workOrder in getSortedDayWorkOrders(day.date).slice(0, 3)"
                        :key="workOrder.WorkOrderID"
                        class="p-1 rounded text-xs cursor-pointer transition-all hover:shadow-sm relative group"
                        :class="getWorkOrderStatusClasses(workOrder)"
                        draggable="true"
                        @dragstart="onDragStart($event, workOrder, 'workorder')"
                        @click="toggleWorkOrderExpansion(workOrder.WorkOrderID)"
                      >
                        <div class="truncate font-medium">{{ workOrder.WorkOrderNumber }}</div>
                        <!-- Copy button for month view -->
                        <Button
                          variant="ghost"
                          size="sm"
                          class="absolute -top-1 -right-1 h-3 w-3 p-0 opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white rounded-full z-10"
                          title="Kopiera"
                          @click.stop="startCopy(workOrder)"
                        >
                          <Plus class="h-1 w-1" />
                        </Button>
                      </div>
                      <div
                        v-if="getSortedDayWorkOrders(day.date).length > 3"
                        class="text-xs text-muted-foreground text-center"
                      >
                        +{{ getSortedDayWorkOrders(day.date).length - 3 }} fler
                      </div>
                    </div>

                    <!-- Copy Mode Indicator -->
                    <div
                      v-if="copyMode && copyingWorkOrder"
                      class="absolute inset-2 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded flex items-center justify-center cursor-pointer"
                      @click="copyWorkOrderToDay(copyingWorkOrder, day.date)"
                    >
                      <div class="text-blue-600 text-xs font-medium flex items-center gap-1">
                        <Plus class="h-3 w-3" />
                        Kopiera hit
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Week View: Detailed day columns -->
                <template v-else>
                  <div
                    v-for="day in weekDays"
                    :key="day.date"
                    class="border-r border-border last:border-r-0 relative drop-zone p-2"
                    :class="{
                      'bg-primary/5': day.isToday,
                      'bg-gray-100': day.isWeekend,
                      'bg-red-50': day.isHoliday,
                      'bg-green-50 border-green-200':
                        isDragOver && dragOverTarget?.date === day.date,
                    }"
                    @drop="onDrop($event, day.date)"
                    @dragover="onDragOver($event, day.date)"
                    @dragenter="onDragEnter($event, day.date)"
                    @dragleave="onDragLeave($event)"
                  >
                    <!-- Work Orders for this day (sorted by scheduled time) -->
                    <div class="space-y-1">
                      <div
                        v-for="workOrder in getSortedDayWorkOrders(day.date)"
                        :key="workOrder.WorkOrderID"
                        class="p-2 rounded text-xs cursor-pointer transition-all hover:shadow-sm relative group"
                        :class="getWorkOrderStatusClasses(workOrder)"
                        draggable="true"
                        @dragstart="onDragStart($event, workOrder, 'workorder')"
                        @click="toggleWorkOrderExpansion(workOrder.WorkOrderID)"
                        @drop="onEmployeeDrop($event, workOrder)"
                        @dragover.prevent
                        @dragenter.prevent
                      >
                        <!-- Remove button -->
                        <Button
                          variant="ghost"
                          size="sm"
                          class="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
                          title="Ta bort arbetsorder"
                          @click.stop="removeWorkOrderFromSchedule(workOrder.WorkOrderID)"
                        >
                          <X class="h-2 w-2" />
                        </Button>

                        <!-- Copy button -->
                        <Button
                          variant="ghost"
                          size="sm"
                          class="absolute -top-1 -right-6 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-blue-500 hover:bg-blue-600 text-white rounded-full z-10"
                          title="Kopiera till andra dagar"
                          @click.stop="startCopy(workOrder)"
                        >
                          <Plus class="h-2 w-2" />
                        </Button>

                        <!-- Compact View (Always visible) -->
                        <div class="flex justify-between items-start mb-1">
                          <div class="flex-1 min-w-0">
                            <div class="font-medium truncate text-xs">
                              {{ workOrder.WorkOrderNumber }}
                            </div>
                            <div class="text-xs text-muted-foreground truncate">
                              {{ workOrder.Title }}
                            </div>
                          </div>
                          <div class="flex items-center gap-1">
                            <!-- Multi-employee indicator -->
                            <div
                              v-if="getAssignedEmployees(workOrder.WorkOrderID).length > 1"
                              class="text-xs bg-green-100 text-green-700 px-1 rounded"
                            >
                              {{ getAssignedEmployees(workOrder.WorkOrderID).length }}👥
                            </div>
                            <ChevronRight
                              class="h-3 w-3 transition-transform"
                              :class="{
                                'rotate-90': expandedWorkOrders.has(workOrder.WorkOrderID),
                              }"
                            />
                          </div>
                        </div>

                        <!-- Expanded Details -->
                        <div
                          v-if="expandedWorkOrders.has(workOrder.WorkOrderID)"
                          class="mt-2 pt-2 border-t border-border/50"
                        >
                          <div class="space-y-1 text-xs text-muted-foreground">
                            <div class="flex items-center justify-between">
                              <div class="flex items-center gap-1">
                                <User class="h-3 w-3" />
                                <span class="font-medium">
                                  {{ getWorkOrderEmployeeDisplay(workOrder) }}
                                </span>
                              </div>
                              <div class="flex items-center gap-1">
                                <Clock class="h-3 w-3" />
                                <span>{{ getEffectiveHoursDisplay(workOrder) }}</span>
                              </div>
                            </div>
                            <div class="flex items-center gap-1">
                              <MapPin class="h-3 w-3" />
                              <span class="truncate">
                                {{ getCustomerName(workOrder.CustomerID) }}
                              </span>
                            </div>
                            <div class="flex items-center gap-1">
                              <Calendar class="h-3 w-3" />
                              <span>
                                {{ formatDate(workOrder.ScheduledDate, 'DD/MM') }}
                                {{ formatWorkOrderSchedule(workOrder) }}
                              </span>
                            </div>
                            <div class="flex items-center gap-1">
                              <Badge
                                :variant="getPriorityVariant(workOrder.Priority)"
                                class="text-xs px-1 py-0"
                              >
                                {{ getPriorityText(workOrder.Priority) }}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Drop Zone Indicator -->
                    <div
                      v-if="isDragOver && dragOverTarget?.date === day.date"
                      class="absolute inset-2 border-2 border-dashed border-green-400 bg-green-50/50 rounded flex items-center justify-center"
                    >
                      <div class="text-green-600 text-xs font-medium flex items-center gap-1">
                        <Plus class="h-3 w-3" />
                        Släpp här
                      </div>
                    </div>

                    <!-- Copy Mode Indicator -->
                    <div
                      v-if="copyMode && copyingWorkOrder"
                      class="absolute inset-2 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded flex items-center justify-center cursor-pointer"
                      @click="copyWorkOrderToDay(copyingWorkOrder, day.date)"
                    >
                      <div class="text-blue-600 text-xs font-medium flex items-center gap-1">
                        <Plus class="h-3 w-3" />
                        Kopiera hit
                      </div>
                    </div>

                    <!-- Current time indicator -->
                    <div
                      v-if="day.isToday"
                      class="absolute left-0 right-0 h-0.5 bg-red-500 z-20 top-16"
                    >
                      <div class="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>

                    <!-- Capacity indicator -->
                    <div class="absolute bottom-1 left-1 right-1">
                      <div class="text-xs text-center" :class="getDayCapacityTextColor(day.date)">
                        {{ Math.round(getDayCapacityPercentage(day.date)) }}%
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="bg-card rounded-lg border border-border p-4 mt-4">
          <h3 class="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 class="h-4 w-4" />
            Veckosammanfattning
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              v-for="employee in employees"
              :key="employee.id"
              class="p-3 border border-border rounded"
            >
              <div class="flex items-center gap-2 mb-2">
                <div
                  class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium"
                >
                  {{ employee.initials }}
                </div>
                <span class="font-medium text-sm">{{ employee.name }}</span>
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-xs">
                  <span>Planerat:</span>
                  <span class="font-medium">{{ getEmployeeWeekHours(employee.id) }}h</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span>Kapacitet:</span>
                  <span class="text-muted-foreground">{{ employee.weeklyCapacity ?? 40 }}h</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span>Utnyttjande:</span>
                  <span :class="getUtilizationColor(getEmployeeWeekHours(employee.id))">
                    {{
                      Math.round(
                        (getEmployeeWeekHours(employee.id) / (employee.weeklyCapacity ?? 40)) * 100
                      )
                    }}%
                  </span>
                </div>
                <div class="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div
                    class="h-1.5 rounded-full transition-all"
                    :class="getWorkloadColor(getEmployeeWeekHours(employee.id))"
                    :style="{
                      width: `${Math.min((getEmployeeWeekHours(employee.id) / (employee.weeklyCapacity ?? 40)) * 100, 100)}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  </div>
</template>

<style lang="scss" scoped>
.drop-zone {
  transition: all 0.2s ease;
}

.drop-zone:hover {
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
