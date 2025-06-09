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

/* eslint-disable no-unused-vars */
interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  type?: 'text' | 'badge' | 'actions' | 'custom'
  badgeVariant?: (value: any) => string
}

interface Props {
  data: any[]
  columns: Column[]
  itemsPerPage?: number
  searchFields?: string[]
  filterField?: string
  filterOptions?: { value: string; label: string }[]
  onRowClick?: (item: any) => void
  onSendEmail?: (item: any, event: Event) => void
  onDelete?: (item: any, event: Event) => void
  onView?: (item: any, event: Event) => void
  onEdit?: (item: any, event: Event) => void
  deleteConfirmMessage?: string
}
/* eslint-enable no-unused-vars */

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 20,
  searchFields: () => [],
  filterOptions: () => [],
  deleteConfirmMessage: 'Är du säker på att du vill radera detta objekt?'
})

const emit = defineEmits<{
  rowClick: [item: any]
  sendEmail: [item: any, event: Event]
  delete: [item: any, event: Event]
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
  let filtered = props.data.filter((item: any) => {
    // Search functionality
    const matchesSearch = props.searchFields.length === 0 || 
      props.searchFields.some(field => 
        item[field]?.toString().toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    
    // Filter functionality
    const matchesStatus = statusFilter.value === 'all' || 
      (props.filterField && item[props.filterField] === statusFilter.value)
    
    return matchesSearch && matchesStatus
  })

  // Sortering
  if (sortField.value) {
    filtered.sort((a: any, b: any) => {
      const aValue = a[sortField.value]
      const bValue = b[sortField.value]
      
      if (sortDirection.value === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })
  }

  return filtered
})

// Paginerad lista
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredData.value.slice(start, end)
})

// Totalt antal sidor
const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / props.itemsPerPage)
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

const handleRowClick = (item: any) => {
  if (props.onRowClick) {
    props.onRowClick(item)
  }
  emit('rowClick', item)
}

const handleSendEmail = (item: any, event: Event) => {
  event.stopPropagation()
  if (props.onSendEmail) {
    props.onSendEmail(item, event)
  }
  emit('sendEmail', item, event)
}

const handleDelete = (_item: any, _event: Event) => {
  _event.stopPropagation()
  if (confirm(props.deleteConfirmMessage)) {
    if (props.onDelete) {
      props.onDelete(_item, _event)
    }
    emit('delete', _item, _event)
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

const getCellValue = (item: any, column: Column) => {
  return item[column.key]
}

const getBadgeVariant = (value: any, column: Column): 'default' | 'secondary' | 'outline' | 'destructive' => {
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
          v-for="item in paginatedData" 
          :key="item.id" 
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
                  v-if="onSendEmail && item.email"
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
        Visar {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredData.length) }} av {{ filteredData.length }} objekt
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