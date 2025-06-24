<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Mail, Phone, MoreHorizontal } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface Props {
  item: any
  showView?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showEmail?: boolean
  showPhone?: boolean
  showMore?: boolean
  compact?: boolean
  variant?: 'default' | 'dropdown'
}

const props = withDefaults(defineProps<Props>(), {
  showView: true,
  showEdit: true,
  showDelete: true,
  showEmail: false,
  showPhone: false,
  showMore: false,
  compact: false,
  variant: 'default'
})

const emit = defineEmits<{
  view: [item: any, event: Event]
  edit: [item: any, event: Event]
  delete: [item: any, event: Event]
  email: [item: any, event: Event]
  phone: [item: any, event: Event]
  action: [action: string, item: any, event: Event]
}>()

const handleView = (event: Event) => {
  event.stopPropagation()
  emit('view', props.item, event)
}

const handleEdit = (event: Event) => {
  event.stopPropagation()
  emit('edit', props.item, event)
}

const handleDelete = (event: Event) => {
  event.stopPropagation()
  emit('delete', props.item, event)
}

const handleEmail = (event: Event) => {
  event.stopPropagation()
  emit('email', props.item, event)
}

const handlePhone = (event: Event) => {
  event.stopPropagation()
  emit('phone', props.item, event)
}
</script>

<template>
  <!-- Default variant - inline buttons -->
  <div
    v-if="variant === 'default'"
    class="flex items-center space-x-1"
  >
    <Button
      v-if="showView"
      variant="ghost"
      :size="compact ? 'sm' : 'sm'"
      :class="compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'"
      title="Visa detaljer"
      @click="handleView"
    >
      <Eye :class="compact ? 'h-3 w-3' : 'h-4 w-4'" />
    </Button>
    
    <Button
      v-if="showEdit"
      variant="ghost"
      :size="compact ? 'sm' : 'sm'"
      :class="compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'"
      title="Redigera"
      @click="handleEdit"
    >
      <Edit :class="compact ? 'h-3 w-3' : 'h-4 w-4'" />
    </Button>
    
    <Button
      v-if="showEmail && item.email"
      variant="ghost"
      :size="compact ? 'sm' : 'sm'"
      :class="compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'"
      title="Skicka e-post"
      @click="handleEmail"
    >
      <Mail :class="compact ? 'h-3 w-3' : 'h-4 w-4'" />
    </Button>
    
    <Button
      v-if="showPhone && item.phone"
      variant="ghost"
      :size="compact ? 'sm' : 'sm'"
      :class="compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'"
      title="Ring"
      @click="handlePhone"
    >
      <Phone :class="compact ? 'h-3 w-3' : 'h-4 w-4'" />
    </Button>
    
    <Button
      v-if="showDelete"
      variant="ghost"
      :size="compact ? 'sm' : 'sm'"
      :class="[
        compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0',
        'text-red-600 hover:text-red-700 hover:bg-red-50'
      ]"
      title="Ta bort"
      @click="handleDelete"
    >
      <Trash2 :class="compact ? 'h-3 w-3' : 'h-4 w-4'" />
    </Button>
    
    <!-- Custom actions slot -->
    <slot
      name="actions"
      :item="item"
    />
  </div>

  <!-- Dropdown variant - more compact for mobile or when space is limited -->
  <div v-else-if="variant === 'dropdown'">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          :size="compact ? 'sm' : 'sm'"
          :class="compact ? 'h-6 w-6 p-0' : 'h-8 w-8 p-0'"
        >
          <MoreHorizontal :class="compact ? 'h-3 w-3' : 'h-4 w-4'" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        class="w-48"
      >
        <DropdownMenuItem
          v-if="showView"
          class="cursor-pointer"
          @click="handleView"
        >
          <Eye class="mr-2 h-4 w-4" />
          Visa detaljer
        </DropdownMenuItem>
        
        <DropdownMenuItem
          v-if="showEdit"
          class="cursor-pointer"
          @click="handleEdit"
        >
          <Edit class="mr-2 h-4 w-4" />
          Redigera
        </DropdownMenuItem>
        
        <DropdownMenuItem
          v-if="showEmail && item.email"
          class="cursor-pointer"
          @click="handleEmail"
        >
          <Mail class="mr-2 h-4 w-4" />
          Skicka e-post
        </DropdownMenuItem>
        
        <DropdownMenuItem
          v-if="showPhone && item.phone"
          class="cursor-pointer"
          @click="handlePhone"
        >
          <Phone class="mr-2 h-4 w-4" />
          Ring
        </DropdownMenuItem>
        
        <!-- Custom actions slot for dropdown -->
        <slot
          name="dropdown-actions"
          :item="item"
        />
        
        <DropdownMenuSeparator v-if="showDelete" />
        
        <DropdownMenuItem
          v-if="showDelete"
          class="cursor-pointer text-red-600 focus:text-red-600"
          @click="handleDelete"
        >
          <Trash2 class="mr-2 h-4 w-4" />
          Ta bort
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template> 