<script setup lang="ts">
import { computed, ref } from 'vue';
import StandardHeader from '@/components/layout/StandardHeader.vue';
import ViewControls from '@/components/shared/ViewControls.vue';
import DataTable from '@/components/shared/DataTable.vue';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-vue-next';
import type { BreadcrumbItem, TableColumn } from '@/types';

interface LoginAccount {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'Aktiv' | 'Inaktiv' | 'Låst';
  lastLogin: string;
  createdAt: string;
  department: string;
}

// const router = useRouter()

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Inställningar', to: '/settings' },
  { label: 'Inloggningskonton', isCurrentPage: true },
];

// Mock data for login accounts
const loginAccounts = ref<LoginAccount[]>([
  {
    id: 1,
    username: 'lars.thomas',
    email: 'lars.thomas@example.com',
    firstName: 'Lars',
    lastName: 'Thomas',
    role: 'Administrator',
    status: 'Aktiv',
    lastLogin: '2024-01-15 14:30',
    createdAt: '2020-03-15',
    department: 'IT',
  },
  {
    id: 2,
    username: 'anna.svensson',
    email: 'anna.svensson@example.com',
    firstName: 'Anna',
    lastName: 'Svensson',
    role: 'Användare',
    status: 'Aktiv',
    lastLogin: '2024-01-14 09:15',
    createdAt: '2021-06-20',
    department: 'Försäljning',
  },
  {
    id: 3,
    username: 'erik.johansson',
    email: 'erik.johansson@example.com',
    firstName: 'Erik',
    lastName: 'Johansson',
    role: 'Moderator',
    status: 'Inaktiv',
    lastLogin: '2024-01-10 16:45',
    createdAt: '2022-01-10',
    department: 'Teknik',
  },
  {
    id: 4,
    username: 'maria.andersson',
    email: 'maria.andersson@example.com',
    firstName: 'Maria',
    lastName: 'Andersson',
    role: 'Användare',
    status: 'Låst',
    lastLogin: '2024-01-05 11:20',
    createdAt: '2023-03-05',
    department: 'Ekonomi',
  },
]);

// Column configuration
const columns: TableColumn<Record<string, unknown>>[] = [
  {
    key: 'username',
    label: 'Användarnamn',
    sortable: true,
  },
  {
    key: 'fullName',
    label: 'Namn',
    sortable: true,
  },
  {
    key: 'email',
    label: 'E-post',
    sortable: true,
  },
  {
    key: 'role',
    label: 'Roll',
    sortable: true,
    type: 'badge',
    badgeVariant: (value: unknown) => {
      switch (value as string) {
        case 'Administrator':
          return 'destructive';
        case 'Moderator':
          return 'default';
        case 'Användare':
          return 'secondary';
        default:
          return 'outline';
      }
    },
  },
  {
    key: 'department',
    label: 'Avdelning',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    type: 'badge',
    badgeVariant: (value: unknown) => {
      switch (value as string) {
        case 'Aktiv':
          return 'default';
        case 'Inaktiv':
          return 'secondary';
        case 'Låst':
          return 'destructive';
        default:
          return 'outline';
      }
    },
  },
  {
    key: 'lastLogin',
    label: 'Senaste inloggning',
    sortable: true,
    type: 'custom',
  },
  {
    key: 'actions',
    label: 'Åtgärder',
    sortable: false,
    type: 'actions',
    align: 'right',
  },
];

// Filter options
const filterOptions: { value: string; label: string }[] = [
  { value: 'Aktiv', label: 'Aktiv' },
  { value: 'Inaktiv', label: 'Inaktiv' },
  { value: 'Låst', label: 'Låst' },
];

// Action buttons
const actionButtons = [
  {
    label: 'Lägg till användare',
    icon: Plus,
    onClick: addNewUser,
    class: 'text-xs h-8',
  },
];

// Statistics
const stats = computed(() => [
  {
    label: 'Totalt antal användare',
    value: loginAccounts.value.length.toString(),
  },
  {
    label: 'Aktiva användare',
    value: loginAccounts.value.filter(account => account.status === 'Aktiv').length.toString(),
  },
  {
    label: 'Låsta konton',
    value: loginAccounts.value.filter(account => account.status === 'Låst').length.toString(),
  },
  {
    label: 'Administratörer',
    value: loginAccounts.value
      .filter(account => account.role === 'Administrator')
      .length.toString(),
  },
]);

// Table data with computed full name
const tableData = computed(() =>
  loginAccounts.value.map(account => ({
    ...account,
    fullName: `${account.firstName} ${account.lastName}`,
  }))
);

// Action methods
function addNewUser() {
  console.log('Add new user');
  // TODO: Navigate to new user form or open modal
}

async function viewUserDetails(user: Record<string, unknown>) {
  console.log('View user details:', user);
  // TODO: Navigate to user details view
}

function sendEmail(user: Record<string, unknown>) {
  window.location.href = `mailto:${user['email']}`;
}

async function deleteUser(user: Record<string, unknown>) {
  console.log('Delete user:', user);
  // TODO: Implement user deletion
}

function resetPassword(user: Record<string, unknown>) {
  console.log('Reset password for:', user);
  // TODO: Implement password reset
}

function toggleUserStatus(user: Record<string, unknown>) {
  const account = loginAccounts.value.find(acc => acc.id === user['id']);
  if (account) {
    account.status = account.status === 'Aktiv' ? 'Inaktiv' : 'Aktiv';
  }
}
</script>

<template>
  <div class="w-full">
    <StandardHeader
      title="Inloggningskonton"
      :breadcrumbs="breadcrumbs"
      description="Hantera användarkonten och behörigheter i systemet"
      show-stats
      :stats="stats"
    />

    <DataTable
      :data="tableData"
      :columns="columns"
      :search-fields="['username', 'fullName', 'email', 'department']"
      filter-field="status"
      :filter-options="filterOptions"
      :on-row-click="viewUserDetails"
      :on-send-email="sendEmail"
      :on-delete="deleteUser"
      delete-confirm-message="Är du säker på att du vill radera detta användarkonto? Denna åtgärd kan inte ångras."
    >
      <template
        #filters="{
          searchQuery,
          statusFilter,
          filterOptions: slotFilterOptions,
          updateSearchQuery,
          updateStatusFilter,
        }"
      >
        <ViewControls
          :action-buttons="actionButtons"
          :search-query="searchQuery"
          :status-filter="statusFilter"
          search-placeholder="Sök på användarnamn, namn, e-post eller avdelning..."
          :filter-options="slotFilterOptions || []"
          @update:search-query="updateSearchQuery"
          @update:status-filter="updateStatusFilter"
        />
      </template>

      <!-- Custom template for last login -->
      <template #lastLogin="{ row }">
        <div class="text-sm">
          <div class="flex items-center gap-2">
            <Clock class="h-3 w-3 text-muted-foreground" />
            <span>{{ new Date(row.lastLogin).toLocaleDateString('sv-SE') }}</span>
          </div>
          <div class="text-xs text-muted-foreground">
            {{
              new Date(row.lastLogin).toLocaleTimeString('sv-SE', {
                hour: '2-digit',
                minute: '2-digit',
              })
            }}
          </div>
        </div>
      </template>

      <!-- Custom actions -->
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <Button size="sm" variant="outline" class="h-8 px-2" @click.stop="resetPassword(row)">
            Återställ lösenord
          </Button>
          <Button
            size="sm"
            :variant="row['status'] === 'Aktiv' ? 'secondary' : 'default'"
            class="h-8 px-2"
            @click.stop="toggleUserStatus(row)"
          >
            {{ row['status'] === 'Aktiv' ? 'Inaktivera' : 'Aktivera' }}
          </Button>
        </div>
      </template>
    </DataTable>

    <!-- Additional Information Panel -->
    <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 px-6">
      <div class="bg-white p-4 rounded-lg border">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Roller fördelning</h3>
        <div class="space-y-1">
          <div class="text-xs flex justify-between">
            <span>Administratörer:</span>
            <span class="font-medium">
              {{ loginAccounts.filter(acc => acc.role === 'Administrator').length }}
            </span>
          </div>
          <div class="text-xs flex justify-between">
            <span>Moderatorer:</span>
            <span class="font-medium">
              {{ loginAccounts.filter(acc => acc.role === 'Moderator').length }}
            </span>
          </div>
          <div class="text-xs flex justify-between">
            <span>Användare:</span>
            <span class="font-medium">
              {{ loginAccounts.filter(acc => acc.role === 'Användare').length }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Avdelningar</h3>
        <div class="space-y-1">
          <div class="text-xs flex justify-between">
            <span>IT:</span>
            <span class="font-medium">
              {{ loginAccounts.filter(acc => acc.department === 'IT').length }}
            </span>
          </div>
          <div class="text-xs flex justify-between">
            <span>Försäljning:</span>
            <span class="font-medium">
              {{ loginAccounts.filter(acc => acc.department === 'Försäljning').length }}
            </span>
          </div>
          <div class="text-xs flex justify-between">
            <span>Teknik:</span>
            <span class="font-medium">
              {{ loginAccounts.filter(acc => acc.department === 'Teknik').length }}
            </span>
          </div>
          <div class="text-xs flex justify-between">
            <span>Ekonomi:</span>
            <span class="font-medium">
              {{ loginAccounts.filter(acc => acc.department === 'Ekonomi').length }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded-lg border">
        <h3 class="text-sm font-medium text-gray-500 mb-2">Säkerhet</h3>
        <div class="space-y-2">
          <Button variant="outline" size="sm" class="w-full text-xs">
            Exportera användarrapport
          </Button>
          <Button variant="outline" size="sm" class="w-full text-xs">Säkerhetsinställningar</Button>
        </div>
      </div>
    </div>
  </div>
</template>
