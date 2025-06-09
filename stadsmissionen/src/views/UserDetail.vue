<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building,
  Calendar,
  Clock,
  Crown,
  Edit,
  Eye,
  EyeOff,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
  UserCheck,
} from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Import data
import usersData from '@/assets/data/users.json';
import organizationSettingsData from '@/assets/data/organizationSettings.json';

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();

// Reactive data
const users = ref(usersData);
const organizations = ref(organizationSettingsData.organizations);

// Get user ID from route
const userId = computed(() => route.params['id'] as string);

// Editing states
const editingProfile = ref(false);
const showChangePasswordDialog = ref(false);
const showDeleteDialog = ref(false);

// Password form
const passwordForm = ref({
  newPassword: '',
  confirmPassword: '',
});

// Show password states
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Current user
const currentUser = computed(() => {
  return users.value.find(user => user.id === userId.value);
});

// Enhanced current user with organization info
const enhancedCurrentUser = computed(() => {
  if (!currentUser.value) return null;

  const org = organizations.value.find(o => o.id === currentUser.value?.organisationId);

  return {
    ...currentUser.value,
    organisationNamn: org?.namn ?? 'Okänd organisation',
    organisationEnheter: org?.enheter ?? [],
  };
});

// Role definitions
const roleDefinitions = [
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
    organizationScope: 'single',
    unitScope: 'selected',
  },
  {
    id: 'administrator',
    namn: 'Administratör',
    beskrivning: 'Full åtkomst inom en stadsmission',
    color: 'default',
    icon: Shield,
    permissions: ['all_within_organization'],
    organizationScope: 'single',
    unitScope: 'all',
  },
  {
    id: 'systemadministrator',
    namn: 'Systemadministratör',
    beskrivning: 'Full åtkomst till hela systemet',
    color: 'destructive',
    icon: Crown,
    permissions: ['system_admin'],
    organizationScope: 'all',
    unitScope: 'all',
  },
];

// User roles with details
const userRoles = computed(() => {
  if (!currentUser.value) return [];
  return currentUser.value.roller
    .map(roleId => roleDefinitions.find(r => r.id === roleId))
    .filter(Boolean);
});

// Available units for selected organization
const availableUnits = computed(() => {
  if (!enhancedCurrentUser.value) return [];
  const org = organizations.value.find(o => o.id === enhancedCurrentUser.value?.organisationId);
  return org?.enheter ?? [];
});

// Statistics
const stats = computed(() => [
  {
    title: 'Aktiv sedan',
    value: formatDate(currentUser.value?.skapadDatum ?? ''),
    icon: Calendar,
    color: 'blue',
  },
  {
    title: 'Senast inloggad',
    value: currentUser.value?.senastInloggad
      ? formatDate(currentUser.value.senastInloggad)
      : 'Aldrig',
    icon: Clock,
    color: 'green',
  },
  {
    title: 'Roller',
    value: currentUser.value?.roller.length ?? 0,
    icon: Shield,
    color: 'purple',
  },
  {
    title: 'Enheter',
    value: currentUser.value?.enheter.length ?? 0,
    icon: Building,
    color: 'orange',
  },
]);

// Save profile changes
const saveProfile = () => {
  if (currentUser.value) {
    currentUser.value.uppdateradDatum = new Date().toISOString();
    editingProfile.value = false;
    success('Sparat', 'Användarens profil har sparats framgångsrikt');
    console.log('Profile updated for user:', currentUser.value.id);
  }
};

// Change password
const changePassword = () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    error('Lösenordsfel', 'Lösenorden matchar inte. Kontrollera att båda fälten är identiska.');
    return;
  }

  if (currentUser.value) {
    currentUser.value.losenord = passwordForm.value.newPassword;
    showChangePasswordDialog.value = false;
    passwordForm.value = {
      newPassword: '',
      confirmPassword: '',
    };
    success('Lösenord ändrat', 'Användarens lösenord har uppdaterats framgångsrikt');
    console.log('Password changed for user:', currentUser.value.id);
  }
};

// Delete user
const deleteUser = () => {
  if (currentUser.value) {
    const index = users.value.findIndex(u => u.id === currentUser.value?.id);
    if (index > -1) {
      users.value.splice(index, 1);
      console.log('Deleted user:', currentUser.value.id);
      router.push('/admin/users');
    }
  }
};

// Handle role change
const handleRoleChange = (roleId: string, checked: boolean) => {
  if (!enhancedCurrentUser.value) return;

  if (checked) {
    if (!enhancedCurrentUser.value.roller.includes(roleId)) {
      enhancedCurrentUser.value.roller.push(roleId);
    }
  } else {
    const index = enhancedCurrentUser.value.roller.indexOf(roleId);
    if (index > -1) {
      enhancedCurrentUser.value.roller.splice(index, 1);
    }
  }

  // Auto-adjust units based on role
  const role = roleDefinitions.find(r => r.id === roleId);
  if (role && checked) {
    if (role.unitScope === 'all') {
      // Administrator gets all units
      enhancedCurrentUser.value.enheter = [...availableUnits.value];
    } else if (role.id === 'systemadministrator') {
      // System admin gets all units from all organizations
      enhancedCurrentUser.value.enheter = [];
    }
  }
};

// Handle unit change
const handleUnitChange = (unitName: string, checked: boolean) => {
  if (!enhancedCurrentUser.value) return;

  if (checked) {
    if (!enhancedCurrentUser.value.enheter.includes(unitName)) {
      enhancedCurrentUser.value.enheter.push(unitName);
    }
  } else {
    const index = enhancedCurrentUser.value.enheter.indexOf(unitName);
    if (index > -1) {
      enhancedCurrentUser.value.enheter.splice(index, 1);
    }
  }
};

// Check if units should be shown
const shouldShowUnits = computed(() => {
  if (!enhancedCurrentUser.value) return false;
  return enhancedCurrentUser.value.roller.some(roleId => {
    const role = roleDefinitions.find(r => r.id === roleId);
    return role?.unitScope === 'selected';
  });
});

// Check if organization should be shown
const shouldShowOrganization = computed(() => {
  if (!enhancedCurrentUser.value) return true;
  return !enhancedCurrentUser.value.roller.includes('systemadministrator');
});

// Go back to user list
const goBack = () => {
  router.push('/admin/users');
};

// Format date
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format datetime
const formatDateTime = (dateString: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

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
    :title="enhancedCurrentUser ? `Användare: ${enhancedCurrentUser.namn}` : 'Användare'"
    breadcrumbs="Dashboard / Administration / Användare / Detaljer"
    show-stats
    :stats="stats"
  >
    <div v-if="enhancedCurrentUser" class="space-y-6 p-6">
      <!-- Header with back button -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="outline" size="sm" class="gap-2" @click="goBack">
            <ArrowLeft class="h-4 w-4" />
            Tillbaka till lista
          </Button>
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <User class="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 class="text-xl font-semibold">
              {{ enhancedCurrentUser.namn }}
            </h2>
            <p class="text-muted-foreground">
              {{ enhancedCurrentUser.epost }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <Badge :variant="enhancedCurrentUser.aktiv ? 'default' : 'outline'">
                {{ enhancedCurrentUser.aktiv ? 'Aktiv' : 'Inaktiv' }}
              </Badge>
              <Badge
                v-for="role in userRoles"
                :key="role?.id || 'unknown'"
                :variant="getBadgeVariant(role?.color)"
                class="text-xs"
              >
                {{ role?.namn }}
              </Badge>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <Dialog v-model:open="showChangePasswordDialog">
            <DialogTrigger as-child>
              <Button variant="outline" class="gap-2">
                <Shield class="h-4 w-4" />
                Ändra lösenord
              </Button>
            </DialogTrigger>
            <DialogContent class="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Ändra lösenord för
                  {{ enhancedCurrentUser.namn }}
                </DialogTitle>
              </DialogHeader>
              <div class="space-y-4">
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
                  <Label for="confirmPassword">Bekräfta nytt lösenord</Label>
                  <div class="relative">
                    <Input
                      id="confirmPassword"
                      v-model="passwordForm.confirmPassword"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="Upprepa lösenordet"
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

                <div class="flex gap-4 justify-end pt-4">
                  <Button variant="outline" @click="showChangePasswordDialog = false">
                    Avbryt
                  </Button>
                  <Button
                    :disabled="!passwordForm.newPassword || !passwordForm.confirmPassword"
                    @click="changePassword"
                  >
                    Ändra lösenord
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" class="gap-2" @click="editingProfile = !editingProfile">
            <Edit class="h-4 w-4" />
            {{ editingProfile ? 'Avbryt' : 'Redigera' }}
          </Button>

          <Dialog v-model:open="showDeleteDialog">
            <DialogTrigger as-child>
              <Button variant="destructive" class="gap-2">
                <Trash2 class="h-4 w-4" />
                Ta bort
              </Button>
            </DialogTrigger>
            <DialogContent class="max-w-md">
              <DialogHeader>
                <DialogTitle>Ta bort användare</DialogTitle>
              </DialogHeader>
              <div class="space-y-4">
                <p class="text-sm text-muted-foreground">
                  Är du säker på att du vill ta bort användaren
                  <strong>{{ enhancedCurrentUser.namn }}</strong>
                  ? Denna åtgärd kan inte ångras.
                </p>

                <div class="flex gap-4 justify-end pt-4">
                  <Button variant="outline" @click="showDeleteDialog = false">Avbryt</Button>
                  <Button variant="destructive" @click="deleteUser">Ta bort användare</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <!-- Profile Details -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Personal Information -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <User class="h-5 w-5" />
              Personlig information
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Namn</Label>
              <Input
                v-if="editingProfile"
                v-model="enhancedCurrentUser.namn"
                placeholder="För- och efternamn"
              />
              <p v-else class="text-sm bg-muted p-2 rounded">
                {{ enhancedCurrentUser.namn }}
              </p>
            </div>

            <div class="space-y-2">
              <Label>E-post</Label>
              <Input
                v-if="editingProfile"
                v-model="enhancedCurrentUser.epost"
                type="email"
                placeholder="anvandare@stadsmission.se"
              />
              <p v-else class="text-sm bg-muted p-2 rounded">
                {{ enhancedCurrentUser.epost }}
              </p>
            </div>

            <div class="space-y-2">
              <Label>Status</Label>
              <div v-if="editingProfile" class="flex items-center space-x-2">
                <Switch v-model:checked="enhancedCurrentUser.aktiv" />
                <Label>Aktiv användare</Label>
              </div>
              <p v-else class="text-sm bg-muted p-2 rounded">
                {{ enhancedCurrentUser.aktiv ? 'Aktiv' : 'Inaktiv' }}
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Organization Information -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Building class="h-5 w-5" />
              Organisationsinformation
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="shouldShowOrganization" class="space-y-2">
              <Label>Stadsmission</Label>
              <Select v-if="editingProfile" v-model="enhancedCurrentUser.organisationId">
                <SelectTrigger>
                  <SelectValue placeholder="Välj stadsmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="org in organizations" :key="org.id" :value="org.id">
                    {{ org.namn }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-else class="text-sm bg-muted p-2 rounded">
                {{ enhancedCurrentUser.organisationNamn }}
              </p>
            </div>

            <div v-if="shouldShowUnits && availableUnits.length > 0" class="space-y-2">
              <Label>Tilldelade enheter</Label>
              <div v-if="editingProfile" class="grid grid-cols-1 gap-2">
                <div v-for="unit in availableUnits" :key="unit" class="flex items-center space-x-2">
                  <Checkbox
                    :id="`unit-${unit}`"
                    :checked="enhancedCurrentUser.enheter.includes(unit)"
                    @update:checked="(checked: boolean) => handleUnitChange(unit, checked)"
                  />
                  <Label :for="`unit-${unit}`" class="text-sm">{{ unit }}</Label>
                </div>
              </div>
              <div v-else class="flex flex-wrap gap-1">
                <Badge
                  v-for="enhet in enhancedCurrentUser.enheter"
                  :key="enhet"
                  variant="outline"
                  class="text-xs"
                >
                  {{ enhet }}
                </Badge>
                <span
                  v-if="enhancedCurrentUser.enheter.length === 0"
                  class="text-xs text-muted-foreground"
                >
                  Alla enheter
                </span>
              </div>
            </div>

            <div class="space-y-2">
              <Label>Roller</Label>
              <div v-if="editingProfile" class="space-y-3">
                <div
                  v-for="role in roleDefinitions"
                  :key="role.id"
                  class="flex items-start space-x-3 p-3 border rounded-lg"
                >
                  <Checkbox
                    :id="role.id"
                    :checked="enhancedCurrentUser.roller.includes(role.id)"
                    @update:checked="(checked: boolean) => handleRoleChange(role.id, checked)"
                  />
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <component :is="role.icon" class="h-4 w-4" />
                      <Label :for="role.id" class="font-medium">{{ role.namn }}</Label>
                      <Badge :variant="getBadgeVariant(role.color)" class="text-xs">
                        {{ role.id }}
                      </Badge>
                    </div>
                    <p class="text-sm text-muted-foreground mt-1">
                      {{ role.beskrivning }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-else class="flex flex-wrap gap-1">
                <Badge
                  v-for="role in userRoles"
                  :key="role?.id || 'unknown'"
                  :variant="getBadgeVariant(role?.color)"
                  class="text-xs"
                >
                  <component :is="role?.icon" class="h-3 w-3 mr-1" />
                  {{ role?.namn }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Role Details -->
      <Card v-if="!editingProfile">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-5 w-5" />
            Rollbeskrivningar och behörigheter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="role in userRoles"
              :key="role?.id || 'unknown'"
              class="p-4 border rounded-lg"
            >
              <div class="flex items-center gap-2 mb-2">
                <component :is="role?.icon" class="h-4 w-4" />
                <span class="font-medium">{{ role?.namn }}</span>
                <Badge :variant="getBadgeVariant(role?.color)" class="text-xs">
                  {{ role?.id }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground mb-2">
                {{ role?.beskrivning }}
              </p>
              <div class="text-xs">
                <p>
                  <strong>Stadsmissioner:</strong>
                  {{ role?.organizationScope === 'all' ? 'Alla' : 'En specifik' }}
                </p>
                <p>
                  <strong>Enheter:</strong>
                  {{ role?.unitScope === 'all' ? 'Alla' : 'Valda enheter' }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Account Information -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Settings class="h-5 w-5" />
            Kontoinformation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium">Konto skapat</Label>
                <p class="text-sm text-muted-foreground">
                  {{ formatDate(enhancedCurrentUser.skapadDatum) }}
                </p>
              </div>
              <div>
                <Label class="text-sm font-medium">Senast uppdaterad</Label>
                <p class="text-sm text-muted-foreground">
                  {{
                    formatDateTime(
                      enhancedCurrentUser.uppdateradDatum || enhancedCurrentUser.skapadDatum
                    )
                  }}
                </p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <Label class="text-sm font-medium">Senast inloggad</Label>
                <p class="text-sm text-muted-foreground">
                  {{
                    enhancedCurrentUser.senastInloggad
                      ? formatDateTime(enhancedCurrentUser.senastInloggad)
                      : 'Aldrig'
                  }}
                </p>
              </div>
              <div>
                <Label class="text-sm font-medium">Användar-ID</Label>
                <p class="text-sm text-muted-foreground font-mono">
                  {{ enhancedCurrentUser.id }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Save Changes -->
      <div v-if="editingProfile" class="flex gap-4 justify-end pt-4 border-t">
        <Button variant="outline" @click="editingProfile = false">Avbryt</Button>
        <Button class="gap-2" @click="saveProfile">
          <Save class="h-4 w-4" />
          Spara ändringar
        </Button>
      </div>
    </div>

    <!-- No user found -->
    <div v-else class="text-center py-12">
      <User class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 class="text-lg font-medium mb-2">Användare hittades inte</h3>
      <p class="text-muted-foreground">Användaren med ID "{{ userId }}" kunde inte hittas</p>
      <Button class="mt-4 gap-2" @click="goBack">
        <ArrowLeft class="h-4 w-4" />
        Tillbaka till lista
      </Button>
    </div>
  </PageLayout>
</template>
