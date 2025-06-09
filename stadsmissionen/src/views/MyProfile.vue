<script setup lang="ts">
import { computed, ref } from 'vue';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
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
  User,
  UserCheck,
} from 'lucide-vue-next';
import { useToast } from '@/composables/useToast';

// Import data
import usersData from '@/assets/data/users.json';
import organizationSettingsData from '@/assets/data/organizationSettings.json';

// Reactive data
const users = ref(usersData);
const organizations = ref(organizationSettingsData.organizations);

// Simulate current logged in user (in real app this would come from auth store)
const currentUserId = ref('user-1'); // Anna Andersson
const editingProfile = ref(false);
const showChangePasswordDialog = ref(false);

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// Show password states
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// Current user
const currentUser = computed(() => {
  return users.value.find(user => user.id === currentUserId.value);
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
    color: 'outline' as const,
    icon: UserCheck,
  },
  {
    id: 'administrator',
    namn: 'Administratör',
    beskrivning: 'Full åtkomst inom en stadsmission',
    color: 'default' as const,
    icon: Shield,
  },
  {
    id: 'systemadministrator',
    namn: 'Systemadministratör',
    beskrivning: 'Full åtkomst till hela systemet',
    color: 'destructive' as const,
    icon: Crown,
  },
];

// User roles with details
const userRoles = computed(() => {
  if (!currentUser.value) return [];
  return currentUser.value.roller
    .map(roleId => roleDefinitions.find(r => r.id === roleId))
    .filter(Boolean) as typeof roleDefinitions;
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

const { success, error } = useToast();

// Save profile changes
const saveProfile = () => {
  if (currentUser.value) {
    currentUser.value.uppdateradDatum = new Date().toISOString();
    editingProfile.value = false;
    console.log('Profile updated');
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
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    success('Lösenord ändrat', 'Ditt lösenord har uppdaterats framgångsrikt');
    console.log('Password changed');
  }
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
</script>

<template>
  <PageLayout
    title="Mina sidor"
    breadcrumbs="Dashboard / Administration / Mina sidor"
    show-stats
    :stats="stats"
  >
    <div v-if="enhancedCurrentUser" class="space-y-6 p-6">
      <!-- Profile Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User class="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 class="text-2xl font-semibold">
              {{ enhancedCurrentUser.namn }}
            </h2>
            <p class="text-muted-foreground">
              {{ enhancedCurrentUser.epost }}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <Badge :variant="enhancedCurrentUser.aktiv ? 'default' : 'outline'">
                {{ enhancedCurrentUser.aktiv ? 'Aktiv' : 'Inaktiv' }}
              </Badge>
              <Badge v-for="role in userRoles" :key="role.id" :variant="role.color" class="text-xs">
                {{ role.namn }}
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
                <DialogTitle>Ändra lösenord</DialogTitle>
              </DialogHeader>
              <div class="space-y-4">
                <div class="space-y-2">
                  <Label for="currentPassword">Nuvarande lösenord</Label>
                  <div class="relative">
                    <Input
                      id="currentPassword"
                      v-model="passwordForm.currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      placeholder="Ange nuvarande lösenord"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      class="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <Eye v-if="!showCurrentPassword" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </Button>
                  </div>
                </div>

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
                    :disabled="
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword
                    "
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
            {{ editingProfile ? 'Avbryt' : 'Redigera profil' }}
          </Button>
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
            <div class="space-y-2">
              <Label>Stadsmission</Label>
              <p class="text-sm bg-muted p-2 rounded">
                {{ enhancedCurrentUser.organisationNamn }}
              </p>
            </div>

            <div class="space-y-2">
              <Label>Tilldelade enheter</Label>
              <div class="flex flex-wrap gap-1">
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
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="role in userRoles"
                  :key="role.id"
                  :variant="role.color"
                  class="text-xs"
                >
                  <component :is="role.icon" class="h-3 w-3 mr-1" />
                  {{ role.namn }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Role Details -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-5 w-5" />
            Rollbeskrivningar och behörigheter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="role in userRoles" :key="role.id" class="p-4 border rounded-lg">
              <div class="flex items-center gap-2 mb-2">
                <component :is="role.icon" class="h-4 w-4" />
                <span class="font-medium">{{ role.namn }}</span>
                <Badge :variant="role.color" class="text-xs">
                  {{ role.id }}
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground">
                {{ role.beskrivning }}
              </p>
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
      <p class="text-muted-foreground">Det gick inte att ladda användarinformation</p>
    </div>
  </PageLayout>
</template>
