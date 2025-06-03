<script setup lang="ts">
import { computed, ref } from 'vue'
import StandardHeader from '@/components/custom/StandardHeader.vue'
import ActionBar from '@/components/custom/ActionBar.vue'
import DataTable from '@/components/custom/DataTable.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Plus, Shield, Users, Settings, Eye, Edit, Trash2 } from 'lucide-vue-next'

interface BreadcrumbItem {
  label: string
  to?: string | { name: string; params?: Record<string, any> }
  isCurrentPage?: boolean
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface PermissionGroup {
  id: number
  name: string
  description: string
  userCount: number
  permissions: string[]
  color: string
  isSystemGroup: boolean
  createdAt: string
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

// Permission groups
const permissionGroups = ref<PermissionGroup[]>([
  {
    id: 1,
    name: 'Administrator',
    description: 'Full åtkomst till alla funktioner i systemet',
    userCount: 2,
    permissions: ['system.admin', 'system.settings', 'users.view', 'users.create', 'users.edit', 'users.delete', 'customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'reports.view', 'reports.export'],
    color: 'red',
    isSystemGroup: true,
    createdAt: '2020-01-01'
  },
  {
    id: 2,
    name: 'Moderator',
    description: 'Kan hantera kunder och arbetsorder men inte användare',
    userCount: 3,
    permissions: ['customers.view', 'customers.create', 'customers.edit', 'orders.view', 'orders.create', 'orders.edit', 'reports.view'],
    color: 'blue',
    isSystemGroup: false,
    createdAt: '2020-01-01'
  },
  {
    id: 3,
    name: 'Användare',
    description: 'Grundläggande åtkomst för daglig användning',
    userCount: 15,
    permissions: ['customers.view', 'orders.view', 'reports.view'],
    color: 'green',
    isSystemGroup: false,
    createdAt: '2020-01-01'
  },
  {
    id: 4,
    name: 'Läsare',
    description: 'Endast läsåtkomst till systemet',
    userCount: 5,
    permissions: ['customers.view', 'orders.view'],
    color: 'gray',
    isSystemGroup: false,
    createdAt: '2021-03-15'
  }
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

// Group permissions by category
const groupedPermissions = computed(() => {
  const grouped: Record<string, Permission[]> = {}
  availablePermissions.forEach(permission => {
    if (!grouped[permission.category]) {
      grouped[permission.category] = []
    }
    grouped[permission.category].push(permission)
  })
  return grouped
})

// Action methods
function addNewGroup() {
  console.log('Add new permission group')
  // TODO: Open modal or navigate to form
}

function viewGroupDetails(group: any) {
  console.log('View group details:', group)
  // TODO: Navigate to group details
}

function editGroup(group: any) {
  console.log('Edit group:', group)
  // TODO: Open edit modal
}

function deleteGroup(group: any) {
  if (group.isSystemGroup === 'System') {
    alert('Systemgrupper kan inte raderas')
    return
  }
  console.log('Delete group:', group)
  // TODO: Implement deletion
}

function duplicateGroup(group: any) {
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
      :show-stats="true"
      :stats="stats"
    />

    <div class="p-6 space-y-6">
      <!-- Permission Groups Table -->
      <DataTable
        :data="tableData"
        :columns="columns"
        :search-fields="['name', 'description']"
        :on-row-click="viewGroupDetails"
        :on-delete="deleteGroup"
        delete-confirm-message="Är du säker på att du vill radera denna behörighetsgrupp? Användare i gruppen kommer att förlora sina behörigheter."
      >
        <template #filters="{ searchQuery, updateSearchQuery }">
          <ActionBar
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
              @click.stop="editGroup(row)"
              class="h-8 px-2"
              :disabled="row.isSystemGroup === 'System'"
            >
              <Edit class="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              @click.stop="duplicateGroup(row)"
              class="h-8 px-2"
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
              <div v-for="(permissions, category) in groupedPermissions" :key="category">
                <h4 class="font-medium text-sm mb-2">{{ category }}</h4>
                <div class="grid grid-cols-1 gap-2 ml-4">
                  <div 
                    v-for="permission in permissions" 
                    :key="permission.id"
                    class="flex items-center justify-between p-2 bg-muted/50 rounded text-xs"
                  >
                    <div>
                      <div class="font-medium">{{ permission.name }}</div>
                      <div class="text-muted-foreground">{{ permission.description }}</div>
                    </div>
                  </div>
                </div>
                <Separator v-if="Object.keys(groupedPermissions).indexOf(category) < Object.keys(groupedPermissions).length - 1" class="mt-3" />
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
              <div v-for="group in permissionGroups" :key="group.id" class="flex items-center justify-between p-3 border rounded">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-3 h-3 rounded-full"
                    :class="{
                      'bg-red-500': group.color === 'red',
                      'bg-blue-500': group.color === 'blue',
                      'bg-green-500': group.color === 'green',
                      'bg-gray-500': group.color === 'gray'
                    }"
                  ></div>
                  <div>
                    <div class="font-medium text-sm">{{ group.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ group.permissions.length }} behörigheter</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium">{{ group.userCount }}</div>
                  <div class="text-xs text-muted-foreground">användare</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template> 