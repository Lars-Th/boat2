<script setup lang="ts">
import { ref, computed } from 'vue'


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import StandardHeader from '@/components/layout/StandardHeader.vue'
import { Plus, Edit, Users, Shield } from 'lucide-vue-next'
import type { BreadcrumbItem, PermissionGroup } from '@/types'
import { useToast } from '@/composables/useToast'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Inställningar', to: '/settings' },
  { label: 'Behörighetsgrupper', isCurrentPage: true }
]

// Available permissions
const availablePermissions: Permission[] = [
  { id: 'users.view', name: 'Visa användare', description: 'Kan visa användarlistor', category: 'Användare' },
  { id: 'users.create', name: 'Skapa användare', description: 'Kan skapa nya användare', category: 'Användare' },
  { id: 'users.edit', name: 'Redigera användare', description: 'Kan redigera användaruppgifter', category: 'Användare' },
  { id: 'users.delete', name: 'Radera användare', description: 'Kan radera användare', category: 'Användare' },
  { id: 'customers.view', name: 'Visa kunder', description: 'Kan visa kundlistor', category: 'Kunder' },
  { id: 'customers.create', name: 'Skapa kunder', description: 'Kan skapa nya kunder', category: 'Kunder' },
  { id: 'customers.edit', name: 'Redigera kunder', description: 'Kan redigera kunduppgifter', category: 'Kunder' },
  { id: 'customers.delete', name: 'Radera kunder', description: 'Kan radera kunder', category: 'Kunder' },
  { id: 'orders.view', name: 'Visa arbetsorder', description: 'Kan visa arbetsorder', category: 'Arbetsorder' },
  { id: 'orders.create', name: 'Skapa arbetsorder', description: 'Kan skapa nya arbetsorder', category: 'Arbetsorder' },
  { id: 'orders.edit', name: 'Redigera arbetsorder', description: 'Kan redigera arbetsorder', category: 'Arbetsorder' },
  { id: 'orders.delete', name: 'Radera arbetsorder', description: 'Kan radera arbetsorder', category: 'Arbetsorder' },
  { id: 'system.admin', name: 'Systemadministration', description: 'Full systemåtkomst', category: 'System' },
  { id: 'system.settings', name: 'Systeminställningar', description: 'Kan ändra systeminställningar', category: 'System' },
  { id: 'reports.view', name: 'Visa rapporter', description: 'Kan visa rapporter', category: 'Rapporter' },
  { id: 'reports.export', name: 'Exportera rapporter', description: 'Kan exportera rapporter', category: 'Rapporter' }
]

// Sample permission groups data with correct types
const permissionGroups = ref<PermissionGroup[]>([
  {
    id: "1",
    name: "Administratörer",
    description: "Full systemåtkomst",
    userCount: 3,
    permissions: ["user.create", "user.edit", "user.delete", "system.admin"],
    color: "red",
    isSystemGroup: true,
  },
  {
    id: "2", 
    name: "Handläggare",
    description: "Kan hantera deltagare och aktiviteter",
    userCount: 12,
    permissions: ["participant.create", "participant.edit", "activity.create"],
    color: "blue",
    isSystemGroup: false,
  },
  {
    id: "3",
    name: "Läsare",
    description: "Endast läsåtkomst",
    userCount: 8,
    permissions: ["participant.view", "activity.view"],
    color: "green", 
    isSystemGroup: false,
  },
  {
    id: "4",
    name: "Rapportläsare",
    description: "Kan visa rapporter och statistik",
    userCount: 5,
    permissions: ["reports.view", "statistics.view"],
    color: "gray",
    isSystemGroup: false,
  },
])

// Column configuration
const columns = [
  {
    key: 'name',
    label: 'Gruppnamn',
    sortable: true
  },
  {
    key: 'description',
    label: 'Beskrivning',
    sortable: false
  },
  {
    key: 'userCount',
    label: 'Antal användare',
    sortable: true,
    type: 'custom' as const
  },
  {
    key: 'permissions',
    label: 'Behörigheter',
    sortable: false,
    type: 'custom' as const
  },
  {
    key: 'isSystemGroup',
    label: 'Typ',
    sortable: true,
    type: 'badge' as const,
    badgeVariant: (isSystem: boolean) => isSystem ? 'destructive' : 'default'
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
    type: 'actions' as const,
    align: 'right' as const
  }
]

// Action buttons
const actionButtons = [
  {
    label: 'Skapa ny grupp',
    icon: Plus,
    onClick: addNewGroup,
    class: 'text-xs h-8'
  }
]

// Statistics
const stats = computed(() => [
  {
    label: 'Totalt antal grupper',
    value: permissionGroups.value.length.toString()
  },
  {
    label: 'Systemgrupper',
    value: permissionGroups.value.filter(group => group.isSystemGroup).length.toString()
  },
  {
    label: 'Anpassade grupper',
    value: permissionGroups.value.filter(group => !group.isSystemGroup).length.toString()
  },
  {
    label: 'Totalt antal användare',
    value: permissionGroups.value.reduce((sum, group) => sum + group.userCount, 0).toString()
  }
])

// Table data with computed values
const tableData = computed(() => 
  permissionGroups.value.map(group => ({
    ...group,
    isSystemGroup: group.isSystemGroup ? 'System' : 'Anpassad'
  }))
)

// Get permission name by ID
const getPermissionName = (permissionId: string): string => {
  const permission = availablePermissions.find(p => p.id === permissionId)
  return permission ? permission.name : permissionId
}

// Fix the availablePermissions reference
const groupedPermissions = computed(() => {
  const grouped: Record<string, typeof availablePermissions> = {}
  
  availablePermissions.forEach(permission => {
    grouped[permission.category] ??= []
    grouped[permission.category]?.push(permission)
  })
  
  return grouped
})

// Action methods
function addNewGroup() {
  console.log('Add new permission group')
  // TODO: Open modal or navigate to form
}

function viewGroupDetails(group: Record<string, unknown>) {
  console.log('View group details:', group)
  // TODO: Navigate to group details
}

function editGroup(group: Record<string, unknown>) {
  console.log('Edit group:', group)
  // TODO: Open edit modal
}

const { success } = useToast()

// Delete permission group
const handleDeleteGroup = (group: PermissionGroup) => {
  if (confirm(`Är du säker på att du vill ta bort behörighetsgruppen "${group.name}"?`)) {
    console.log("Deleting permission group:", group.id)
    success("Behörighetsgrupp borttagen", "Behörighetsgruppen har tagits bort framgångsrikt");
  }
}

function duplicateGroup(group: Record<string, unknown>) {
  console.log('Duplicate group:', group)
  // TODO: Create copy of group
}
</script>

<template>
  <div class="w-full">
    <StandardHeader
      title="Behörighetsgrupper"
      :breadcrumbs="breadcrumbs"
      description="Hantera användarroller och behörigheter i systemet"
      show-stats
      :stats="stats"
    />

    <div class="p-6 space-y-6">
      <!-- Permission Groups Table -->
      <DataTable
        :data="tableData"
        :columns="columns"
        :search-fields="['name', 'description']"
        :on-row-click="viewGroupDetails"
        :on-delete="handleDeleteGroup"
        delete-confirm-message="Är du säker på att du vill radera denna behörighetsgrupp? Användare i gruppen kommer att förlora sina behörigheter."
      >
        <template #filters="{ searchQuery, updateSearchQuery }">
          <ViewControls
            :action-buttons="actionButtons"
            :search-query="searchQuery"
            search-placeholder="Sök på gruppnamn eller beskrivning..."
            @update:search-query="updateSearchQuery"
          />
        </template>

        <!-- Custom template for user count -->
        <template #userCount="{ row }">
          <div class="flex items-center gap-2">
            <Users class="h-4 w-4 text-muted-foreground" />
            <span class="font-medium">{{ row.userCount }}</span>
            <span class="text-xs text-muted-foreground">användare</span>
          </div>
        </template>

        <!-- Custom template for permissions -->
        <template #permissions="{ row }">
          <div class="flex flex-wrap gap-1 max-w-md">
            <Badge 
              v-for="permissionId in row.permissions.slice(0, 3)" 
              :key="permissionId"
              variant="outline"
              class="text-xs"
            >
              {{ getPermissionName(permissionId) }}
            </Badge>
            <Badge 
              v-if="row.permissions.length > 3"
              variant="secondary"
              class="text-xs"
            >
              +{{ row.permissions.length - 3 }} till
            </Badge>
          </div>
        </template>

        <!-- Custom actions -->
        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              class="h-8 px-2"
              :disabled="row.isSystemGroup === 'System'"
              @click.stop="editGroup(row)"
            >
              <Edit class="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              class="h-8 px-2"
              @click.stop="duplicateGroup(row)"
            >
              Kopiera
            </Button>
          </div>
        </template>
      </DataTable>

      <!-- Permission Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Available Permissions -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Shield class="h-5 w-5" />
              Tillgängliga behörigheter
            </CardTitle>
            <CardDescription>
              Alla behörigheter som kan tilldelas grupper
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="(permissions, category) in groupedPermissions"
                :key="category"
              >
                <h4 class="font-medium text-sm mb-2">
                  {{ category }}
                </h4>
                <div class="grid grid-cols-1 gap-2 ml-4">
                  <div 
                    v-for="permission in permissions" 
                    :key="permission.id"
                    class="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                  >
                    <div>
                      <div class="font-medium">
                        {{ permission.name }}
                      </div>
                      <div class="text-muted-foreground">
                        {{ permission.description }}
                      </div>
                    </div>
                  </div>
                </div>
                <Separator
                  v-if="Object.keys(groupedPermissions).indexOf(category) < Object.keys(groupedPermissions).length - 1"
                  class="mt-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Group Statistics -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Users class="h-5 w-5" />
              Gruppstatistik
            </CardTitle>
            <CardDescription>
              Översikt över användarfördelning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="group in permissionGroups"
                :key="group.id"
                class="flex items-center justify-between p-3 border rounded"
              >
                <div class="flex items-center gap-3">
                  <div 
                    class="w-3 h-3 rounded-full"
                    :class="{
                      'bg-red-500': group.color === 'red',
                      'bg-blue-500': group.color === 'blue',
                      'bg-green-500': group.color === 'green',
                      'bg-gray-500': group.color === 'gray'
                    }"
                  />
                  <div>
                    <div class="font-medium text-sm">
                      {{ group.name }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ group.permissions.length }} behörigheter
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium">
                    {{ group.userCount }}
                  </div>
                  <div class="text-xs text-muted-foreground">
                    användare
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template> 