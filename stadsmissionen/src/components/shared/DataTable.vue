<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronUp, ChevronDown, ArrowUpDown, Mail, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { TableColumn } from '@/types'

interface Props {
  data: Record<string, unknown>[]
  columns: TableColumn[]
  itemsPerPage?: number
  searchFields?: string[]
  filterField?: string
  filterOptions?: { value: string; label: string }[]
  onRowClick?: (item: Record<string, unknown>) => void
  onSendEmail?: (item: Record<string, unknown>, event: Event) => void
  onDelete?: (item: Record<string, unknown>, event: Event) => void
  onView?: (item: Record<string, unknown>, event: Event) => void
  onEdit?: (item: Record<string, unknown>, event: Event) => void
  deleteConfirmMessage?: string
  loading?: boolean
  showActions?: boolean
  showSearch?: boolean
  showPagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 10,
  searchFields: () => [],
  filterField: '',
  filterOptions: () => [],
  deleteConfirmMessage: 'Är du säker på att du vill radera detta objekt',
  loading: false,
  showActions: true,
  showSearch: true,
  showPagination: true
})

const emit = defineEmits<{
  rowClick: [item: Record<string, unknown>]
  sendEmail: [item: Record<string, unknown>, event: Event]
  delete: [item: Record<string, unknown>, event: Event]
  edit: [item: Record<string, unknown>]
  view: [item: Record<string, unknown>]
}>()

// Paginering
const currentPage = ref(1)

// Sök och filter
const searchQuery = ref('')
const statusFilter = ref('all')

// Sortering
const sortField = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Filtrerad och sorterad lista
const filteredData = computed(() => {
  let filtered = props.data.filter((item: Record<string, unknown>) => {
    // Search functionality
    const matchesSearch = props.searchFields.length === 0 || 
      props.searchFields.some(field => {
        const value = item[field]
        return value && String(value).toLowerCase().includes(searchQuery.value.toLowerCase())
      })

    // Filter functionality
    const matchesFilter = !statusFilter.value || 
      statusFilter.value === 'all' ||
      item[props.filterField] === statusFilter.value

    return matchesSearch && matchesFilter
  })

  // Sortering
  if (sortField.value) {
    filtered.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const aValue = a[sortField.value]
      const bValue = b[sortField.value]
      
      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      const comparison = aValue < bValue ? -1 : 1
      return sortDirection.value === 'asc' ? comparison : -comparison
    })
  }

  return filtered
})

// Paginerad lista
const paginatedData = computed(() => {
  const itemsPerPageValue = props.itemsPerPage ?? 10
  const start = (currentPage.value - 1) * itemsPerPageValue
  const end = start + itemsPerPageValue
  return filteredData.value.slice(start, end)
})

// Totalt antal sidor
const totalPages = computed(() => {
  const itemsPerPageValue = props.itemsPerPage ?? 10
  return Math.ceil(filteredData.value.length / itemsPerPageValue)
})

// Reset page when search or filter changes
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const getSortIcon = (field: string) => {
  if (sortField.value !== field) return ArrowUpDown
  return sortDirection.value === 'asc' ? ChevronUp : ChevronDown
}

const handleRowClick = (item: Record<string, unknown>) => {
  if (props.onRowClick) {
    props.onRowClick(item)
  }
  emit('rowClick', item)
}

const handleSendEmail = (item: Record<string, unknown>, event: Event) => {
  event.stopPropagation()
  if (props.onSendEmail) {
    props.onSendEmail(item, event)
  }
  emit('sendEmail', item, event)
}

const handleDelete = (item: Record<string, unknown>, event: Event) => {
  event.stopPropagation()
  if (confirm(props.deleteConfirmMessage)) {
    if (props.onDelete) {
      props.onDelete(item, event)
    }
    emit('delete', item, event)
  }
}

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const getCellValue = (item: Record<string, unknown>, column: TableColumn) => {
  if (column.render) {
    return column.render(item[String(column.key)], item)
  }
  
  return item[String(column.key)]
}

const getBadgeVariant = (value: unknown, column: TableColumn): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (column.badgeVariant) {
    const variant = column.badgeVariant(value)
    // Ensure the variant is one of the allowed types
    if (['default', 'secondary', 'outline', 'destructive'].includes(variant)) {
      return variant as 'default' | 'secondary' | 'outline' | 'destructive'
    }
  }
  return 'default'
}

// Expose search and filter for parent components
defineExpose({
  searchQuery,
  statusFilter,
  filteredData,
  currentPage,
  totalPages
})
</script>

<template>
  <div class="space-y-4">
    <!-- Search and Filter Bar -->
    <slot 
      name="filters" 
      :search-query="searchQuery" 
      :status-filter="statusFilter" 
      :filter-options="filterOptions"
      :update-search-query="(value: string) => searchQuery = value"
      :update-status-filter="(value: string) => statusFilter = value"
    >
      <!-- Default filter implementation can be added here if needed -->
    </slot>

    <!-- Table -->
    <Table>
      <TableHeader class="bg-gray-100">
        <TableRow>
          <TableHead 
            v-for="column in columns" 
            :key="column.key"
            :class="[
              'bg-gray-100 text-xs',
              column.sortable ? 'cursor-pointer' : '',
              column.align === 'right' ? 'text-right' : '',
              column.align === 'center' ? 'text-center' : ''
            ]"
            :style="column.width ? { width: column.width } : {}"
            @click="column.sortable ? sortBy(column.key) : null"
          >
            <div
              v-if="column.sortable"
              class="flex items-center gap-2"
            >
              {{ column.label }}
              <component
                :is="getSortIcon(column.key)"
                class="h-3 w-3"
              />
            </div>
            <span v-else>{{ column.label }}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow 
          v-for="(item, index) in paginatedData" 
          :key="String(item['id'] || item['ParticipantID'] || item['ActivityID'] || index)" 
          class="hover:bg-muted/30 cursor-pointer" 
          @click="handleRowClick(item)"
        >
          <TableCell 
            v-for="column in columns" 
            :key="column.key"
            :class="[
              'text-xs',
              column.key === 'company' || column.key === 'name' ? 'font-bold' : '',
              column.align === 'right' ? 'text-right' : '',
              column.align === 'center' ? 'text-center' : ''
            ]"
          >
            <!-- Badge type -->
            <Badge 
              v-if="column.type === 'badge'" 
              :variant="getBadgeVariant(getCellValue(item, column), column)" 
              class="text-xs"
            >
              {{ getCellValue(item, column) }}
            </Badge>
            
            <!-- Custom type with slot -->
            <slot 
              v-else-if="column.type === 'custom'" 
              :name="`cell-${column.key}`" 
              :value="getCellValue(item, column)" 
              :row="item"
            >
              {{ getCellValue(item, column) }}
            </slot>
            
            <!-- Actions type -->
            <div
              v-else-if="column.type === 'actions'"
              class="flex gap-1 justify-end"
            >
              <!-- Custom actions slot -->
              <slot
                name="actions"
                :row="item"
              >
                <!-- Default actions -->
                <Button 
                  v-if="onSendEmail && item['email']"
                  variant="ghost" 
                  size="sm" 
                  class="text-xs h-6 w-6 p-0" 
                  title="Skicka e-post"
                  @click="handleSendEmail(item, $event)"
                >
                  <Mail class="h-3 w-3" />
                </Button>
                <Button 
                  v-if="onDelete"
                  variant="ghost" 
                  size="sm" 
                  class="text-xs h-6 w-6 p-0 text-red-600 hover:text-red-800" 
                  title="Radera"
                  @click="handleDelete(item, $event)"
                >
                  <Trash2 class="h-3 w-3" />
                </Button>
              </slot>
            </div>
            
            <!-- Regular text -->
            <span v-else>{{ getCellValue(item, column) }}</span>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-4 mb-8 px-4">
      <div class="text-xs text-muted-foreground">
        Visar {{ (currentPage - 1) * (itemsPerPage ?? 10) + 1 }}-{{ Math.min(currentPage * (itemsPerPage ?? 10), filteredData.length) }} av {{ filteredData.length }} objekt
      </div>
      <div class="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          class="text-xs h-8"
          :disabled="currentPage === 1"
          @click="previousPage"
        >
          <ChevronLeft class="h-3 w-3 mr-1" />
          Föregående
        </Button>
        
        <div class="flex gap-1">
          <Button
            v-for="page in Math.min(totalPages, 5)"
            :key="page"
            variant="outline"
            size="sm"
            class="text-xs h-8 w-8"
            :class="{ 'bg-primary text-primary-foreground': page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          class="text-xs h-8"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Nästa
          <ChevronRight class="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  </div>
</template> 