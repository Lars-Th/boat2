<script setup lang="ts">
import { ref, computed } from 'vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Mail, Trash2, Star, Edit, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-vue-next'
import type { Contact } from '@/storages/contactStorage'

interface Props {
  contactPersons: Contact[]
  mainContact?: Contact | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'delete-contact': [id: number]
  'update-contact': [contact: Contact]
  'set-main-contact': [id: number]
  'edit-contact': [contact: Contact]
}>()

// Sorting
const sortField = ref('')
const sortDirection = ref<'asc' | 'desc'>('asc')

// Sorted data
const sortedData = computed(() => {
  if (!sortField.value) return props.contactPersons
  
  return [...props.contactPersons].sort((a, b) => {
    const aValue = a[sortField.value as keyof Contact]
    const bValue = b[sortField.value as keyof Contact]
    
    // Handle undefined/null values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return 1
    if (bValue == null) return -1
    
    if (sortDirection.value === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })
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

const sendEmail = (email: string) => {
  if (email) {
    window.location.href = `mailto:${email}`
  }
}

const deleteContact = (id: number) => {
  emit('delete-contact', id)
}

const setMainContact = (id: number) => {
  emit('set-main-contact', id)
}

// Column definitions
const columns = [
  { key: 'name', label: 'Namn', sortable: true },
  { key: 'email', label: 'E-post', sortable: true },
  { key: 'phone', label: 'Telefon', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'isMainContact', label: 'Huvudkontakt', sortable: true },
  { key: 'actions', label: 'Åtgärder', sortable: false }
]
</script>

<template>
  <div class="border-t border-gray-200">
    <Table>
      <TableHeader class="bg-gray-100 border-t border-gray-300">
        <TableRow>
          <TableHead 
            v-for="column in columns" 
            :key="column.key"
            :class="[
              'bg-gray-100 text-xs',
              column.sortable ? 'cursor-pointer' : '',
              column.key === 'actions' ? 'text-right' : ''
            ]"
            @click="column.sortable ? sortBy(column.key) : null"
          >
            <div v-if="column.sortable" class="flex items-center gap-2">
              {{ column.label }}
              <component :is="getSortIcon(column.key)" class="h-3 w-3" />
            </div>
            <span v-else>{{ column.label }}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="sortedData.length === 0">
          <TableCell :colspan="columns.length" class="text-center py-8">
            <p class="text-muted-foreground text-sm">Inga kontaktpersoner registrerade.</p>
          </TableCell>
        </TableRow>
        <TableRow 
          v-else
          v-for="person in sortedData" 
          :key="person.id" 
          class="hover:bg-gray-50"
        >
          <!-- Name -->
          <TableCell class="text-xs font-medium text-slate-700">
            {{ person.name }}
          </TableCell>
          
          <!-- Email -->
          <TableCell class="text-xs">
            {{ person.email || '-' }}
          </TableCell>
          
          <!-- Phone -->
          <TableCell class="text-xs">
            <Tooltip v-if="person.phone">
              <TooltipTrigger asChild>
                <a :href="`tel:${person.phone}`" class="text-blue-600 hover:underline">
                  {{ person.phone }}
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ring {{ person.name }}</p>
              </TooltipContent>
            </Tooltip>
            <span v-else class="text-gray-500">-</span>
          </TableCell>
          
          <!-- Status -->
          <TableCell class="text-xs">
            {{ person.status || '-' }}
          </TableCell>
          
          <!-- Main Contact -->
          <TableCell class="text-xs">
            <div class="flex flex-col items-center space-y-1">
              <div>
                <Badge 
                  v-if="person.isMainContact" 
                  variant="secondary" 
                  class="text-xs px-2 py-0 bg-green-100 text-green-700 border border-green-200"
                >
                  <Star class="h-3 w-3 mr-1 text-green-600 fill-green-600" />
                  Ja
                </Badge>
                <span v-else class="text-xs text-gray-500"></span>
              </div>
              
              <!-- Set as main contact button -->
              <Tooltip v-if="!person.isMainContact">
                <TooltipTrigger asChild>
                  <button
                    @click="setMainContact(person.id)"
                    class="p-1 text-yellow-600 hover:text-yellow-800"
                  >
                    <Star class="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ange som huvudkontakt</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TableCell>
          
          <!-- Actions -->
          <TableCell class="text-right">
            <div class="flex justify-end space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    @click="() => emit('edit-contact', person)"
                    class="p-1 text-green-600 hover:text-green-800"
                  >
                    <Edit class="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Redigera {{ person.name }}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    @click="sendEmail(person.email)"
                    class="p-1 text-blue-600 hover:text-blue-800"
                    :disabled="!person.email"
                  >
                    <Mail class="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Skicka e-post till {{ person.name }}</p>
                </TooltipContent>
              </Tooltip>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        class="p-1 text-red-600 hover:text-red-800"
                        :disabled="person.isMainContact"
                        :class="{ 'opacity-50 cursor-not-allowed': person.isMainContact }"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p v-if="person.isMainContact">Huvudkontakt kan inte tas bort</p>
                      <p v-else>Ta bort {{ person.name }}</p>
                    </TooltipContent>
                  </Tooltip>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle class="text-base">Bekräfta borttagning</AlertDialogTitle>
                    <AlertDialogDescription class="text-sm">
                      Är du säker på att du vill ta bort kontaktpersonen {{ person.name }}? 
                      Denna åtgärd kan inte ångras.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel class="text-xs h-8">Avbryt</AlertDialogCancel>
                    <AlertDialogAction 
                      @click="deleteContact(person.id)"
                      class="text-xs h-8 bg-red-600 hover:bg-red-700"
                    >
                      Ta bort
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <div class="border-b border-gray-300"></div>
  </div>
</template> 