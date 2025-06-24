<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import DataTable from '@/components/shared/DataTable.vue';
import SearchAndFilter from '@/components/shared/SearchAndFilter.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  Crown,
  Edit,
  Eye,
  EyeOff,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-vue-next';
import { useApi } from '@/composables/useApi';
import api from '@/api';

// API Data with composables
const {
  data: users,
  loading: usersLoading,
  error: usersError,
  refresh: refetchUsers,
} = useApi(() => api.users?.getAll() ?? Promise.resolve({ data: [], success: true }), {
  immediate: true,
});

const {
  data: organizationSettings,
  loading: organizationsLoading,
  error: organizationsError,
  refresh: refetchOrganizations,
} = useApi(
  () =>
    api.organizations?.getAll() ?? Promise.resolve({ data: { organizations: [] }, success: true }),
  { immediate: true }
);

// Loading and error states
const isLoading = computed(() => usersLoading.value || organizationsLoading.value);

const hasError = computed(() => usersError.value !== null || organizationsError.value !== null);

// Event handlers
const handleRetry = async () => {
  await Promise.all([refetchUsers(), refetchOrganizations()]);
};

// Type definitions
interface User {
  id: string;
  namn: string;
  epost: string;
  losenord: string;
  roller: string[];
  organisationId: string;
  enheter: string[];
  aktiv: boolean;
  senastInloggad?: string;
  skapadDatum: string;
  uppdateradDatum?: string;
}

interface RoleDefinition {
  id: string;
  namn: string;
  beskrivning: string;
  color: 'default' | 'destructive' | 'outline' | 'secondary';
  icon: typeof UserCheck;
  permissions: string[];
  organizationScope: string;
  unitScope: string;
}

interface NewUser {
  namn: string;
  epost: string;
  losenord: string;
  confirmLosenord: string;
  roller: string[];
  organisationId: string;
  enheter: string[];
  aktiv: boolean;
}

interface PasswordForm {
  newPassword: string;
  confirmPassword: string;
}

const router = useRouter();

// Get organizations from API data
const organizations = computed(() => {
  return organizationSettings.value ?? [];
});

// Reactive data
const searchQuery = ref('');
const showNewUserDialog = ref(false);

// New user form
const newUser = ref<NewUser>({
  namn: '',
  epost: '',
  losenord: '',
  confirmLosenord: '',
  roller: [],
  organisationId: '',
  enheter: [],
  aktiv: true,
});

// Dialog states
const showPasswordDialog = ref(false);
const selectedUserForPassword = ref<User | null>(null);

// Password form
const passwordForm = ref<PasswordForm>({
  newPassword: '',
  confirmPassword: '',
});

// Show password states
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmNewPassword = ref(false);

// Role definitions with permissions
const roleDefinitions: RoleDefinition[] = [
  {
    id: 'handlaggare',
    namn: 'Handläggare',
    beskrivning: 'Grundläggande funktioner för en specifik enhet',
    color: 'outline',
    icon: UserCheck,
    permissions: [
      'view_participants',
      'create_participants',
      'edit_participants',
      'view_activities',
      'create_activities',
    ],
    organizationScope: 'single', // single organization
    unitScope: 'selected', // selected units only
  },
  {
    id: 'administrator',
    namn: 'Administratör',
    beskrivning: 'Full åtkomst inom en stadsmission',
    color: 'default',
    icon: Shield,
    permissions: ['all_within_organization'],
    organizationScope: 'single', // single organization
    unitScope: 'all', // all units in organization
  },
  {
    id: 'systemadministrator',
    namn: 'Systemadministratör',
    beskrivning: 'Full åtkomst till hela systemet',
    color: 'destructive',
    icon: Crown,
    permissions: ['system_admin'],
    organizationScope: 'all', // all organizations
    unitScope: 'all', // all units everywhere
  },
];

// Load data on component mount
onMounted(async () => {
  await Promise.all([loadUsers(), loadOrganizationSettings()]);
});

// Enhanced users with organization and role info
const enhancedUsers = computed(() => {
  if (!users.value) return [];

  return users.value.map(user => {
    const org = organizations.value.find(o => o.id === user.organisationId);
    const roles = user.roller
      .map(roleId => roleDefinitions.find(r => r.id === roleId))
      .filter(Boolean);

    return {
      ...user,
      organisationNamn: org?.namn ?? 'Okänd organisation',
      roles,
      primaryRole: roles[0] ?? null,
      enheterNamn: user.enheter ?? [],
    };
  });
});

// Filtered users
const filteredUsers = computed(() => {
  if (!searchQuery.value) return enhancedUsers.value;

  const search = searchQuery.value.toLowerCase();
  return enhancedUsers.value.filter(
    user =>
      user.namn.toLowerCase().includes(search) ||
      user.epost.toLowerCase().includes(search) ||
      user.organisationNamn.toLowerCase().includes(search) ||
      user.roles.some(role => role?.namn.toLowerCase().includes(search))
  );
});

// Statistics
const stats = computed(() => {
  if (!users.value) {
    return [
      { title: 'Totalt användare', value: 0, icon: Users, color: 'blue' },
      { title: 'Aktiva användare', value: 0, icon: UserCheck, color: 'green' },
      { title: 'Administratörer', value: 0, icon: Shield, color: 'purple' },
      { title: 'Systemadmins', value: 0, icon: Crown, color: 'orange' },
    ];
  }

  return [
    {
      title: 'Totalt användare',
      value: users.value.length,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Aktiva användare',
      value: users.value.filter(u => u.aktiv).length,
      icon: UserCheck,
      color: 'green',
    },
    {
      title: 'Administratörer',
      value: users.value.filter(u => u.roller.includes('administrator')).length,
      icon: Shield,
      color: 'purple',
    },
    {
      title: 'Systemadmins',
      value: users.value.filter(u => u.roller.includes('systemadministrator')).length,
      icon: Crown,
      color: 'orange',
    },
  ];
});

// Available units for selected organization
const availableUnits = computed(() => {
  if (!newUser.value.organisationId) return [];
  const org = organizations.value.find(o => o.id === newUser.value.organisationId);
  return org?.enheter ?? [];
});

// Table columns
const columns = [
  {
    key: 'namn',
    label: 'Namn',
    sortable: true,
  },
  {
    key: 'epost',
    label: 'E-post',
    sortable: true,
  },
  {
    key: 'organisationNamn',
    label: 'Stadsmission',
    sortable: true,
  },
  {
    key: 'roles',
    label: 'Roller',
    sortable: false,
    type: 'custom' as const,
  },
  {
    key: 'enheterNamn',
    label: 'Enheter',
    sortable: false,
    type: 'custom' as const,
  },
  {
    key: 'aktiv',
    label: 'Status',
    sortable: true,
    type: 'custom' as const,
  },
  {
    key: 'actions',
    label: '',
    sortable: false,
    type: 'actions' as const,
  },
];

// Create new user
const handleCreateUser = () => {
  if (newUser.value.losenord !== newUser.value.confirmLosenord) {
    showErrorToast('Lösenorden matchar inte!');
    return;
  }

  const userToCreate: Partial<User> = {
    namn: newUser.value.namn,
    epost: newUser.value.epost,
    losenord: newUser.value.losenord, // In real app, this would be hashed
    organisationId: newUser.value.organisationId,
    roller: [...newUser.value.roller],
    enheter: [...newUser.value.enheter],
    aktiv: newUser.value.aktiv,
  };

  if (users.value) {
    users.value.push(userToCreate);
  }
  showNewUserDialog.value = false;
  resetNewUserForm();
  console.log('Created new user:', userToCreate);
};

// Reset new user form
const resetNewUserForm = () => {
  newUser.value = {
    namn: '',
    epost: '',
    losenord: '',
    confirmLosenord: '',
    organisationId: '',
    roller: [],
    enheter: [],
    aktiv: true,
  };
};

// Edit user
const handleEditUser = (user: Record<string, unknown>, event: Event) => {
  event.stopPropagation();
  router.push(`/admin/users/${user['id']}`);
};

// Navigate to user detail when clicking on row
const handleNavigateToUser = (user: Record<string, unknown>) => {
  router.push(`/admin/users/${user['id']}`);
};

// Delete user
const handleDeleteUser = (user: Record<string, unknown>, event: Event) => {
  event.stopPropagation();
  if (window.confirm(`Är du säker på att du vill ta bort användaren "${user['namn']}"?`)) {
    if (users.value) {
      const index = users.value.findIndex(u => u.id === user['id']);
      if (index > -1) {
        users.value.splice(index, 1);
        console.log('Deleted user:', user['id']);
      }
    }
  }
};

// Change password
const handleChangePassword = (user: Record<string, unknown>, event: Event) => {
  event.stopPropagation();
  selectedUserForPassword.value = user as unknown as User;
  passwordForm.value = { newPassword: '', confirmPassword: '' };
  showPasswordDialog.value = true;
};

// Save new password
const handleSaveNewPassword = () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showErrorToast('Lösenorden matchar inte!');
    return;
  }

  if (!selectedUserForPassword.value) {
    showErrorToast('Ingen användare vald');
    return;
  }

  if (users.value) {
    const user = users.value.find(u => u.id === selectedUserForPassword.value?.id);
    if (user) {
      user.losenord = passwordForm.value.newPassword; // In real app, this would be hashed
      showPasswordDialog.value = false;
      selectedUserForPassword.value = null;
      console.log('Password updated for user:', user.id);
    }
  }
};

// Handle role change
const handleRoleChange = (roleId: string, checked: boolean) => {
  if (checked) {
    if (!newUser.value.roller.includes(roleId)) {
      newUser.value.roller.push(roleId);
    }
  } else {
    const index = newUser.value.roller.indexOf(roleId);
    if (index > -1) {
      newUser.value.roller.splice(index, 1);
    }
  }

  // Auto-adjust units based on role
  const role = roleDefinitions.find(r => r.id === roleId);
  if (role && checked) {
    if (role.unitScope === 'all') {
      // Administrator gets all units
      newUser.value.enheter = [...availableUnits.value];
    } else if (role.id === 'systemadministrator') {
      // System admin gets all units from all organizations
      newUser.value.enheter = [];
    }
  }
};

// Handle unit change
const handleUnitChange = (unitName: string, checked: boolean) => {
  if (checked) {
    if (!newUser.value.enheter.includes(unitName)) {
      newUser.value.enheter.push(unitName);
    }
  } else {
    const index = newUser.value.enheter.indexOf(unitName);
    if (index > -1) {
      newUser.value.enheter.splice(index, 1);
    }
  }
};

// Check if units should be shown
const shouldShowUnits = computed(() => {
  return newUser.value.roller.some(roleId => {
    const role = roleDefinitions.find(r => r.id === roleId);
    return role?.unitScope === 'selected';
  });
});

// Check if organization should be shown
const shouldShowOrganization = computed(() => {
  return !newUser.value.roller.includes('systemadministrator');
});

// Helper function to ensure valid Badge variants
const getBadgeVariant = (
  color: string | undefined
): 'default' | 'destructive' | 'outline' | 'secondary' => {
  if (!color) return 'default';
  const validVariants = ['default', 'destructive', 'outline', 'secondary'];
  return validVariants.includes(color)
    ? (color as 'default' | 'destructive' | 'outline' | 'secondary')
    : 'default';
};
</script>

<template>
  <PageLayout
    title="Användarhantering"
    breadcrumbs="Dashboard / Administration / Användare"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p class="text-muted-foreground">Laddar användare...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="text-center py-12">
      <div class="text-red-500 mb-4">
        <AlertCircle class="h-12 w-12 mx-auto mb-2" />
        <p class="text-lg font-semibold">Kunde inte ladda användare</p>
        <p class="text-sm text-muted-foreground mt-1">
          {{ usersError?.message ?? organizationsError?.message }}
        </p>
      </div>
      <Button variant="outline" @click="handleRetry">Försök igen</Button>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Search and Filter -->
      <div class="px-6 py-4">
        <SearchAndFilter v-model:search="searchQuery" placeholder="Sök användare...">
          <template #actions>
            <Dialog v-model:open="showNewUserDialog">
              <DialogTrigger as-child>
                <Button class="gap-2">
                  <Plus class="h-4 w-4" />
                  Ny användare
                </Button>
              </DialogTrigger>
              <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Skapa ny användare</DialogTitle>
                </DialogHeader>
                <div class="space-y-6">
                  <!-- Basic Info -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <Label for="userName">Namn *</Label>
                      <Input
                        id="userName"
                        v-model="newUser.namn"
                        placeholder="För- och efternamn"
                        required
                      />
                    </div>
                    <div class="space-y-2">
                      <Label for="userEmail">E-post *</Label>
                      <Input
                        id="userEmail"
                        v-model="newUser.epost"
                        type="email"
                        placeholder="anvandare@stadsmission.se"
                        required
                      />
                    </div>
                  </div>

                  <!-- Password -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <Label for="userPassword">Lösenord *</Label>
                      <div class="relative">
                        <Input
                          id="userPassword"
                          v-model="newUser.losenord"
                          :type="showPassword ? 'text' : 'password'"
                          placeholder="Minst 8 tecken"
                          required
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          @click="showPassword = !showPassword"
                        >
                          <Eye v-if="!showPassword" class="h-4 w-4" />
                          <EyeOff v-else class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div class="space-y-2">
                      <Label for="confirmPassword">Bekräfta lösenord *</Label>
                      <div class="relative">
                        <Input
                          id="confirmPassword"
                          v-model="newUser.confirmLosenord"
                          :type="showConfirmPassword ? 'text' : 'password'"
                          placeholder="Upprepa lösenordet"
                          required
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                          @click="showConfirmPassword = !showConfirmPassword"
                        >
                          <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                          <EyeOff v-else class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <!-- Roles -->
                  <div class="space-y-4">
                    <Label>Roller *</Label>
                    <div class="space-y-3">
                      <div
                        v-for="role in roleDefinitions"
                        :key="role.id"
                        class="flex items-start space-x-3 p-3 border rounded-lg"
                      >
                        <Checkbox
                          :id="role.id"
                          :checked="newUser.roller.includes(role.id)"
                          @update:checked="(checked: boolean) => handleRoleChange(role.id, checked)"
                        />
                        <div class="flex-1">
                          <div class="flex items-center gap-2">
                            <component :is="role.icon" class="h-4 w-4" />
                            <Label :for="role.id" class="font-medium">{{ role.namn }}</Label>
                            <Badge :variant="role.color" class="text-xs">
                              {{ role.id }}
                            </Badge>
                          </div>
                          <p class="text-sm text-muted-foreground mt-1">
                            {{ role.beskrivning }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Organization -->
                  <div v-if="shouldShowOrganization" class="space-y-2">
                    <Label>Stadsmission *</Label>
                    <Select v-model="newUser.organisationId">
                      <SelectTrigger>
                        <SelectValue placeholder="Välj stadsmission" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="org in organizations" :key="org.id" :value="org.id">
                          {{ org.namn }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <!-- Units -->
                  <div v-if="shouldShowUnits && availableUnits.length > 0" class="space-y-2">
                    <Label>Enheter</Label>
                    <div class="grid grid-cols-2 gap-2">
                      <div
                        v-for="unit in availableUnits"
                        :key="unit"
                        class="flex items-center space-x-2"
                      >
                        <Checkbox
                          :id="`unit-${unit}`"
                          :checked="newUser.enheter.includes(unit)"
                          @update:checked="(checked: boolean) => handleUnitChange(unit, checked)"
                        />
                        <Label :for="`unit-${unit}`" class="text-sm">{{ unit }}</Label>
                      </div>
                    </div>
                  </div>

                  <!-- Active Status -->
                  <div class="flex items-center space-x-2">
                    <Switch id="userActive" v-model:checked="newUser.aktiv" />
                    <Label for="userActive">Aktiv användare</Label>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-4 justify-end pt-4 border-t">
                    <Button
                      variant="outline"
                      @click="
                        showNewUserDialog = false;
                        resetNewUserForm();
                      "
                    >
                      Avbryt
                    </Button>
                    <Button
                      :disabled="
                        !newUser.namn.trim() || !newUser.epost.trim() || newUser.roller.length === 0
                      "
                      class="gap-2"
                      @click="handleCreateUser"
                    >
                      <Plus class="h-4 w-4" />
                      Skapa användare
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </template>
        </SearchAndFilter>
      </div>

      <!-- Users Table -->
      <DataTable
        :data="filteredUsers"
        :columns="columns"
        class="cursor-pointer"
        @row-click="handleNavigateToUser"
      >
        <!-- Custom column renderers -->
        <template #cell-roles="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="role in (row as any).roles ?? []"
              :key="role?.id ?? 'unknown'"
              :variant="getBadgeVariant(role?.color ?? 'outline')"
              class="text-xs"
            >
              {{ role?.namn ?? 'Okänd roll' }}
            </Badge>
          </div>
        </template>

        <template #cell-enheterNamn="{ row }">
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="enhet in (Array.isArray((row as any).enheterNamn)
                ? (row as any).enheterNamn
                : []
              ).slice(0, 2)"
              :key="String(enhet)"
              variant="outline"
              class="text-xs"
            >
              {{ String(enhet) }}
            </Badge>
            <Badge
              v-if="
                (Array.isArray((row as any).enheterNamn) ? (row as any).enheterNamn : []).length > 2
              "
              variant="outline"
              class="text-xs"
            >
              +{{
                (Array.isArray((row as any).enheterNamn) ? (row as any).enheterNamn : []).length - 2
              }}
            </Badge>
            <span
              v-if="
                (Array.isArray((row as any).enheterNamn) ? (row as any).enheterNamn : []).length ===
                0
              "
              class="text-xs text-muted-foreground"
            >
              Alla enheter
            </span>
          </div>
        </template>

        <template #cell-aktiv="{ row }">
          <Badge :variant="row['aktiv'] ? 'default' : 'outline'">
            {{ row['aktiv'] ? 'Aktiv' : 'Inaktiv' }}
          </Badge>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Redigera användare"
              @click="event => handleEditUser(row, event)"
            >
              <Edit class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0"
              title="Ändra lösenord"
              @click="event => handleChangePassword(row, event)"
            >
              <Eye class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Ta bort användare"
              @click="event => handleDeleteUser(row, event)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </template>
      </DataTable>

      <!-- Change Password Dialog -->
      <Dialog v-model:open="showPasswordDialog">
        <DialogContent class="max-w-md">
          <DialogHeader>
            <DialogTitle>Ändra lösenord</DialogTitle>
          </DialogHeader>
          <div class="space-y-4">
            <p class="text-sm text-muted-foreground">
              Ändra lösenord för:
              <strong>{{ selectedUserForPassword?.namn }}</strong>
            </p>

            <div class="space-y-2">
              <Label for="newPassword">Nytt lösenord</Label>
              <div class="relative">
                <Input
                  id="newPassword"
                  v-model="passwordForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  placeholder="Minst 8 tecken"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  @click="showNewPassword = !showNewPassword"
                >
                  <Eye v-if="!showNewPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="confirmNewPassword">Bekräfta nytt lösenord</Label>
              <div class="relative">
                <Input
                  id="confirmNewPassword"
                  v-model="passwordForm.confirmPassword"
                  :type="showConfirmNewPassword ? 'text' : 'password'"
                  placeholder="Upprepa lösenordet"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  @click="showConfirmNewPassword = !showConfirmNewPassword"
                >
                  <Eye v-if="!showConfirmNewPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div class="flex gap-4 justify-end pt-4">
              <Button variant="outline" @click="showPasswordDialog = false">Avbryt</Button>
              <Button variant="outline" @click="showPasswordDialog = false">Avbryt</Button>
              <Button
                :disabled="!passwordForm.newPassword || !passwordForm.confirmPassword"
                @click="handleSaveNewPassword"
              >
                Spara lösenord
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <!-- Role Information Cards -->
      <div class="px-6 py-4">
        <h3 class="text-lg font-semibold mb-4">Rollbeskrivningar</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card v-for="role in roleDefinitions" :key="role.id">
            <CardHeader class="pb-2">
              <CardTitle class="text-sm font-medium flex items-center gap-2">
                <component :is="role.icon" class="h-4 w-4" />
                {{ role.namn }}
                <Badge :variant="role.color" class="text-xs">
                  {{ role.id }}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-xs text-muted-foreground mb-2">
                {{ role.beskrivning }}
              </p>
              <div class="text-xs">
                <p>
                  <strong>Stadsmissioner:</strong>
                  {{ role.organizationScope === 'all' ? 'Alla' : 'En specifik' }}
                </p>
                <p>
                  <strong>Enheter:</strong>
                  {{ role.unitScope === 'all' ? 'Alla' : 'Valda enheter' }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
