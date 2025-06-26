<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import PageLayout from '@/components/layout/PageLayout.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Building,
  CheckCircle,
  Edit,
  Loader2,
  MessageSquare,
  Save,
  UserCheck,
  Users,
} from 'lucide-vue-next';
import type { Organization, User } from '@/types';

// Import components
import OrganizationManager from '@/components/features/organization/OrganizationManager.vue';
import UnitManager from '@/components/features/organization/UnitManager.vue';

// Import composables
import { useOrganizationManagement } from '@/composables/useOrganizationManagement';

// Use API service and composables
import { useApiList } from '@/composables/useApi';
import api from '@/api';

// Router
const router = useRouter();

// Fetch data using API services
const {
  data: organizationsData,
  loading: organizationsLoading,
  error: organizationsError,
  refresh: refreshOrganizations,
} = useApiList<any>(() => api.newOrganizations.getAll(), {
  cacheKey: 'newOrganizations',
});

const {
  data: usersData,
  loading: usersLoading,
  error: usersError,
  refresh: refreshUsers,
} = useApiList<User>(() => api.users.getAll(), {
  cacheKey: 'users',
});

const {
  data: officesData,
  loading: officesLoading,
  error: officesError,
  refresh: refreshOffices,
} = useApiList<any>(() => api.offices.getAll(), {
  cacheKey: 'offices',
});

// Loading and error states
const isLoading = computed(
  () =>
    Boolean(organizationsLoading.value) ||
    Boolean(usersLoading.value) ||
    Boolean(officesLoading.value)
);
const hasError = computed(
  () =>
    organizationsError.value !== null || usersError.value !== null || officesError.value !== null
);

// Refresh function for error recovery
const handleRefresh = async () => {
  await Promise.all([refreshOrganizations(), refreshUsers(), refreshOffices()]);
};

// Initialize organization API composable
const { organizations, loadOrganizations, updateOrganization } = useOrganizationManagement();

// Local state for selected organization
const selectedOrgId = ref<string>('');
const selectedOrganization = computed(
  () => newOrganizations.value.find((org: any) => org.id.toString() === selectedOrgId.value) ?? null
);

// Computed properties for the template
const users = computed(() => usersData.value ?? []);
const organizationUsers = computed(() => {
  if (!selectedOrganization.value) return [];
  return (
    usersData.value?.filter(
      (user: User) => user.organisationId === selectedOrganization.value?.id
    ) ?? []
  );
});

// Use the new organizations data
const newOrganizations = computed(() => {
  const orgs = organizationsData.value ?? [];
  const offices = officesData.value ?? [];
  const users = usersData.value ?? [];

  // Add linked offices and user count to each organization
  return orgs.map((org: any) => ({
    ...org,
    enheter: offices
      .filter((office: any) => office.OrganizationID === org.id)
      .map((office: any) => office.Name),
    userCount: users.filter((user: any) => user.stadsmission === org.id).length,
  }));
});

const stats = computed(() => [
  {
    title: 'Totalt organisationer',
    value: newOrganizations.value.length,
    icon: Building,
    color: 'blue',
  },
  {
    title: 'Totalt användare',
    value: usersData.value?.length ?? 0,
    icon: Users,
    color: 'purple',
  },
  {
    title: 'Aktiva användare',
    value: usersData.value?.filter((user: User) => user.aktiv).length ?? 0,
    icon: UserCheck,
    color: 'orange',
  },
]);

// Functions for organization management
const selectOrganization = (orgId: string) => {
  selectedOrgId.value = orgId;
};

const addUnit = (unitName: string) => {
  if (selectedOrganization.value) {
    const updatedOrg = {
      ...selectedOrganization.value,
      enheter: [...selectedOrganization.value.enheter, unitName],
    };
    updateOrganization(selectedOrganization.value.id, updatedOrg);
  }
};

const removeUnit = (unitName: string) => {
  if (selectedOrganization.value) {
    const updatedOrg = {
      ...selectedOrganization.value,
      enheter: selectedOrganization.value.enheter.filter((unit: string) => unit !== unitName),
    };
    updateOrganization(selectedOrganization.value.id, updatedOrg);
  }
};

const updateOrganizationInfo = (updates: Partial<Organization>) => {
  if (selectedOrganization.value) {
    const updatedOrg = {
      ...selectedOrganization.value,
      ...updates,
    };
    updateOrganization(selectedOrganization.value.id, updatedOrg);
  }
};

// Load data on component mount
const loadData = async () => {
  await Promise.all([refreshOrganizations(), refreshUsers(), refreshOffices()]);

  // Set initial selected organization
  if (newOrganizations.value.length > 0 && newOrganizations.value[0]) {
    selectedOrgId.value = newOrganizations.value[0].id.toString();
  }
};

// Load data when component mounts
loadData();

// Local state for editing
const editingOrgInfo = ref(false);

// Mock permissions data (since API endpoint doesn't exist)
const permissions = ref<{ roles: Role[] }>({
  roles: [
    { id: 'systemadministrator', namn: 'Systemadministratör' },
    { id: 'administrator', namn: 'Administratör' },
    { id: 'enhetsansvarig', namn: 'Enhetsansvarig' },
    { id: 'handlaggare', namn: 'Handläggare' },
  ],
});

// Save organization info
const saveOrganizationInfo = () => {
  if (selectedOrganization.value) {
    updateOrganizationInfo({
      uppdateradDatum: new Date().toISOString(),
    });
    editingOrgInfo.value = false;
    console.log('Saved organization info');
  }
};

// Define role interface
interface Role {
  id: string;
  namn: string;
}

// Get role display name
const getRoleDisplayName = (roleId: string) => {
  const role = permissions.value.roles.find((r: Role) => r.id === roleId);
  return role?.namn ?? roleId;
};

// Get role color
const getRoleColor = (roleId: string) => {
  switch (roleId) {
    case 'systemadministrator':
      return 'destructive';
    case 'administrator':
      return 'default';
    case 'enhetsansvarig':
      return 'secondary';
    case 'handlaggare':
      return 'outline';
    default:
      return 'outline';
  }
};
</script>

<template>
  <PageLayout
    title="Systeminställningar"
    breadcrumbs="Dashboard / Administration / Inställningar"
    show-stats
    :stats="stats"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div class="text-center space-y-4">
        <Loader2 class="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p class="text-muted-foreground">Laddar systeminställningar...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="flex items-center justify-center py-12">
      <div class="text-center space-y-4">
        <AlertCircle class="h-8 w-8 mx-auto text-destructive" />
        <div>
          <h3 class="font-semibold text-lg mb-2">Kunde inte ladda systeminställningar</h3>
          <p class="text-muted-foreground mb-4">
            Ett fel uppstod när systeminställningarna skulle hämtas.
          </p>
          <Button class="gap-2" @click="handleRefresh">
            <Loader2 class="h-4 w-4" />
            Försök igen
          </Button>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div v-else class="space-y-8 p-6">
      <!-- Empty State -->
      <div v-if="!organizationsData?.length" class="text-center py-12">
        <Building class="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 class="font-semibold text-lg mb-2">Inga organisationer hittades</h3>
        <p class="text-muted-foreground mb-4">
          Det finns inga organisationer att hantera för tillfället.
        </p>
        <Button variant="outline" class="gap-2" @click="handleRefresh">
          <Loader2 class="h-4 w-4" />
          Uppdatera
        </Button>
      </div>

      <!-- Organization Manager Section -->
      <OrganizationManager
        v-else
        :organizations="newOrganizations"
        :selected-org-id="selectedOrgId"
        :users="users"
        @update:organizations="newOrganizations = $event"
        @update:selected-org-id="selectOrganization"
        @update:users="users = $event"
      />

      <!-- Management Tabs for Selected Organization -->
      <div v-if="selectedOrganization" class="space-y-4">
        <div class="border-t pt-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Edit class="h-5 w-5" />
            Hantera: {{ selectedOrganization.namn }}
          </h2>

          <Tabs default-value="info" class="w-full">
            <TabsList class="grid w-full grid-cols-3">
              <TabsTrigger value="info">Grundinfo</TabsTrigger>
              <TabsTrigger value="units">Enheter</TabsTrigger>
              <TabsTrigger value="users">Användare</TabsTrigger>
            </TabsList>

            <!-- Organization Info Tab -->
            <TabsContent value="info" class="space-y-6">
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <CardTitle class="flex items-center gap-2">
                      <Building class="h-5 w-5" />
                      Organisationsinformation
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      class="gap-2"
                      @click="editingOrgInfo = !editingOrgInfo"
                    >
                      <Edit class="h-4 w-4" />
                      {{ editingOrgInfo ? 'Avbryt' : 'Redigera' }}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent class="space-y-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Basic Info -->
                    <div class="space-y-4">
                      <div class="space-y-2">
                        <Label>Organisationsnamn</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.namn"
                          placeholder="Organisationsnamn"
                        />
                        <p v-else class="text-sm bg-muted p-2 rounded">
                          {{ selectedOrganization.namn }}
                        </p>
                      </div>

                      <div class="space-y-2">
                        <Label>Logotyp (URL)</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.logotyp"
                          placeholder="Sökväg till logotyp"
                        />
                        <div v-else class="flex items-center gap-2">
                          <img
                            v-if="selectedOrganization.logotyp"
                            :src="selectedOrganization.logotyp"
                            :alt="selectedOrganization.namn"
                            class="h-8 w-8 object-contain"
                          />
                          <p class="text-sm bg-muted p-2 rounded flex-1">
                            {{ selectedOrganization.logotyp ?? 'Ingen logotyp' }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <!-- Contact Info -->
                    <div class="space-y-4">
                      <h4 class="font-medium flex items-center gap-2">
                        <MessageSquare class="h-4 w-4" />
                        Kontaktuppgifter
                      </h4>

                      <div class="space-y-2">
                        <Label>Adress</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kontaktuppgifter.adress"
                          placeholder="Gatuadress"
                        />
                        <p v-else class="text-sm bg-muted p-2 rounded">
                          {{ selectedOrganization.kontaktuppgifter.adress ?? 'Ingen adress' }}
                        </p>
                      </div>

                      <div class="grid grid-cols-2 gap-2">
                        <div class="space-y-2">
                          <Label>Postnummer</Label>
                          <Input
                            v-if="editingOrgInfo"
                            v-model="selectedOrganization.kontaktuppgifter.postnummer"
                            placeholder="12345"
                          />
                          <p v-else class="text-sm bg-muted p-2 rounded">
                            {{ selectedOrganization.kontaktuppgifter.postnummer ?? '-' }}
                          </p>
                        </div>
                        <div class="space-y-2">
                          <Label>Ort</Label>
                          <Input
                            v-if="editingOrgInfo"
                            v-model="selectedOrganization.kontaktuppgifter.ort"
                            placeholder="Ort"
                          />
                          <p v-else class="text-sm bg-muted p-2 rounded">
                            {{ selectedOrganization.kontaktuppgifter.ort ?? '-' }}
                          </p>
                        </div>
                      </div>

                      <div class="space-y-2">
                        <Label>Telefon</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kontaktuppgifter.telefon"
                          placeholder="031-123456"
                        />
                        <p v-else class="text-sm bg-muted p-2 rounded">
                          {{ selectedOrganization.kontaktuppgifter.telefon ?? 'Ingen telefon' }}
                        </p>
                      </div>

                      <div class="space-y-2">
                        <Label>E-post</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kontaktuppgifter.epost"
                          type="email"
                          placeholder="info@example.se"
                        />
                        <p v-else class="text-sm bg-muted p-2 rounded">
                          {{ selectedOrganization.kontaktuppgifter.epost ?? 'Ingen e-post' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Comment Labels -->
                  <div class="space-y-4">
                    <h4 class="font-medium flex items-center gap-2">
                      <MessageSquare class="h-4 w-4" />
                      Kommentarsetiketter
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div class="space-y-2">
                        <Label>Kommentar 1</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kommentarLabels.kommentar1"
                          placeholder="Etikett för kommentar 1"
                        />
                        <p v-else class="text-sm bg-muted p-2 rounded">
                          {{ selectedOrganization.kommentarLabels.kommentar1 }}
                        </p>
                      </div>
                      <div class="space-y-2">
                        <Label>Kommentar 2</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kommentarLabels.kommentar2"
                          placeholder="Etikett för kommentar 2"
                        />
                        <p v-else class="text-sm bg-muted p-2 rounded">
                          {{ selectedOrganization.kommentarLabels.kommentar2 }}
                        </p>
                      </div>
                      <div class="space-y-2">
                        <Label>Kommentar 3</Label>
                        <Input
                          v-if="editingOrgInfo"
                          v-model="selectedOrganization.kommentarLabels.kommentar3"
                          placeholder="Etikett för kommentar 3"
                        />
                        <p v-else class="text-sm bg-muted p-2 rounded">
                          {{ selectedOrganization.kommentarLabels.kommentar3 }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div v-if="editingOrgInfo" class="flex gap-4 justify-end pt-4 border-t">
                    <Button variant="outline" @click="editingOrgInfo = false">Avbryt</Button>
                    <Button class="gap-2" @click="saveOrganizationInfo">
                      <Save class="h-4 w-4" />
                      Spara ändringar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <!-- Units Tab -->
            <TabsContent value="units" class="space-y-6">
              <UnitManager
                :units="selectedOrganization.enheter"
                :organization-name="selectedOrganization.namn"
                @add-unit="addUnit"
                @remove-unit="removeUnit"
              />
            </TabsContent>

            <!-- Users Tab -->
            <TabsContent value="users" class="space-y-6">
              <Card>
                <CardHeader>
                  <div class="flex items-center justify-between">
                    <CardTitle class="flex items-center gap-2">
                      <Users class="h-5 w-5" />
                      Användare för {{ selectedOrganization.namn }}
                    </CardTitle>
                    <Button class="gap-2" @click="router.push('/admin/users')">
                      <Users class="h-4 w-4" />
                      Hantera användare
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div class="space-y-4">
                    <!-- Summary -->
                    <div class="bg-muted/50 p-4 rounded-lg">
                      <h4 class="font-medium mb-2">Användaröversikt</h4>
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div class="font-medium text-lg">
                            {{ organizationUsers.length }}
                          </div>
                          <div class="text-muted-foreground">Totalt användare</div>
                        </div>
                        <div>
                          <div class="font-medium text-lg">
                            {{ organizationUsers.filter(u => u.aktiv).length }}
                          </div>
                          <div class="text-muted-foreground">Aktiva</div>
                        </div>
                        <div>
                          <div class="font-medium text-lg">
                            {{
                              organizationUsers.filter(u => u.roller.includes('administrator'))
                                .length
                            }}
                          </div>
                          <div class="text-muted-foreground">Administratörer</div>
                        </div>
                        <div>
                          <div class="font-medium text-lg">
                            {{
                              organizationUsers.filter(u => u.roller.includes('handlaggare')).length
                            }}
                          </div>
                          <div class="text-muted-foreground">Handläggare</div>
                        </div>
                      </div>
                    </div>

                    <!-- Recent Users -->
                    <div>
                      <h4 class="font-medium mb-3">Senaste användare</h4>
                      <div class="space-y-2">
                        <div
                          v-for="user in organizationUsers.slice(0, 5)"
                          :key="user.id"
                          class="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div class="space-y-1">
                            <div class="flex items-center gap-2">
                              <span class="font-medium">{{ user.namn }}</span>
                              <Badge :variant="user.aktiv ? 'default' : 'outline'" class="text-xs">
                                {{ user.aktiv ? 'Aktiv' : 'Inaktiv' }}
                              </Badge>
                            </div>
                            <p class="text-sm text-muted-foreground">
                              {{ user.epost }}
                            </p>
                            <div class="flex gap-1">
                              <Badge
                                v-for="role in user.roller"
                                :key="role"
                                :variant="getRoleColor(role)"
                                class="text-xs"
                              >
                                {{ getRoleDisplayName(role) }}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div
                          v-if="organizationUsers.length === 0"
                          class="text-center py-8 text-muted-foreground"
                        >
                          Inga användare finns för denna organisation
                        </div>
                        <div v-else-if="organizationUsers.length > 5" class="text-center pt-2">
                          <Button variant="outline" size="sm" @click="router.push('/admin/users')">
                            Visa alla {{ organizationUsers.length }} användare
                          </Button>
                        </div>
                      </div>
                    </div>

                    <!-- Info about user management -->
                    <div class="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div class="flex items-start gap-3">
                        <Users class="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 class="font-medium text-blue-900 mb-1">
                            Fullständig användarhantering
                          </h4>
                          <p class="text-sm text-blue-700 mb-3">
                            För att skapa nya användare, hantera lösenord, tilldela roller och
                            behörigheter, använd den dedikerade användarhanteringen.
                          </p>
                          <Button size="sm" class="gap-2" @click="router.push('/admin/users')">
                            <Users class="h-4 w-4" />
                            Gå till användarhantering
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
