<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn } from 'lucide-vue-next';
import stadsmissionenLogo from '@/assets/images/ostergotland.png';

const { login } = useAuth();

// Form state
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');

// Demo users state
const demoUsers = ref<
  Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    type: 'admin' | 'manager' | 'user';
    stadsmission?: number;
    organizationName?: string;
    officeCount?: number;
  }>
>([]);
const loadingDemoUsers = ref(false);
const organizations = ref<Array<{ id: number; name: string }>>([]);
const offices = ref<Array<any>>([]);
const officesUsersJunction = ref<Array<any>>([]);

// Handle form submission
const handleSubmit = async () => {
  if (!email.value || !password.value) {
    error.value = 'Vänligen fyll i både e-post och lösenord';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const result = await login(email.value, password.value);

    if (!result.success) {
      error.value = result.error ?? 'Inloggning misslyckades';
    }
  } catch (err) {
    error.value = 'Ett oväntat fel uppstod';
    console.error('Login error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Toggle password visibility
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// Load demo users and organizations from API
const loadDemoUsers = async () => {
  loadingDemoUsers.value = true;
  try {
    // Load all required data in parallel
    const [orgResponse, usersResponse, fullUsersResponse, officesResponse, junctionResponse] =
      await Promise.all([
        api.newOrganizations.getAll(),
        api.auth.getDemoUsers(),
        api.users.getAll(),
        api.offices.getAll(),
        api.officesUsersJunction.getAll(),
      ]);

    // Process organizations
    if (orgResponse.success && orgResponse.data) {
      organizations.value = orgResponse.data.map((org: any) => ({
        id: org.id,
        name: org.name || org.namn,
      }));
    }

    // Process offices
    if (officesResponse.success && officesResponse.data) {
      offices.value = officesResponse.data;
    }

    // Process junction data
    if (junctionResponse.success && junctionResponse.data) {
      officesUsersJunction.value = junctionResponse.data;
    }

    // Process demo users
    if (
      usersResponse.success &&
      usersResponse.data &&
      fullUsersResponse.success &&
      fullUsersResponse.data
    ) {
      const fullUsers = fullUsersResponse.data;

      // Enhance demo users with stadsmission, organization info, and office count
      demoUsers.value = usersResponse.data.map((demoUser: any) => {
        const fullUser = fullUsers.find((u: any) => u.id === demoUser.id);
        const org = organizations.value.find(o => o.id === fullUser?.stadsmission);

        // Calculate office count for this user
        const userOfficeCount = officesUsersJunction.value.filter(
          (junction: any) => junction.userID === demoUser.id
        ).length;

        return {
          ...demoUser,
          stadsmission: fullUser?.stadsmission,
          organizationName: org?.name || 'Okänd organisation',
          officeCount: userOfficeCount,
        };
      });
    } else if (usersResponse.success && usersResponse.data) {
      demoUsers.value = usersResponse.data.map((user: any) => ({
        ...user,
        officeCount: 0,
      }));
    }
  } catch (err) {
    console.error('Failed to load demo users:', err);
  } finally {
    loadingDemoUsers.value = false;
  }
};

// Fill credentials with selected demo user
const fillDemoCredentials = (user: (typeof demoUsers.value)[0]) => {
  email.value = user.email;
  // For demo purposes, we'll use a predictable password pattern
  // In a real app, this would come from the API or be handled differently
  const passwordMap: { [key: string]: string } = {
    'superadmin@stadsmissionen.se': 'admin123',
    'erik.enhetschef@ostergotlandsstadsmission.se': 'erik123',
    'maria.koordinator@ostergotlandsstadsmission.se': 'maria123',
    'johan.handlaggare@ostergotlandsstadsmission.se': 'johan123',
    'lisa.medarbetare@ostergotlandsstadsmission.se': 'lisa123',
    'karin.admin@stadsmissionen.se': 'karin123',
    'anna.chef@goteborgsstadsmission.se': 'anna123',
    'peter.handlaggare@goteborgsstadsmission.se': 'peter123',
    'sara.koordinator@arvikastadsmission.se': 'sara123',
    'magnus.medarbetare@arvikastadsmission.se': 'magnus123',
  };
  password.value = passwordMap[user.email] ?? 'demo123';
};

// Organize users by stadsmission and sort by role
const organizedUsers = computed(() => {
  if (!demoUsers.value.length || !organizations.value.length) {
    return [];
  }

  // Define role hierarchy for sorting (higher number = higher priority)
  const roleHierarchy: { [key: string]: number } = {
    'System Administrator': 5,
    Administratör: 4,
    Enhetsansvarig: 3,
    Handläggare: 2,
    Medarbetare: 1,
  };

  // Group users by organization
  const usersByOrg = demoUsers.value.reduce(
    (acc, user) => {
      const orgId = user.stadsmission;
      if (!orgId) return acc;

      if (!acc[orgId]) {
        acc[orgId] = [];
      }
      acc[orgId].push(user);
      return acc;
    },
    {} as { [key: number]: typeof demoUsers.value }
  );

  // Create organized structure with sorting
  return organizations.value
    .filter(org => usersByOrg[org.id]) // Only include orgs that have users
    .map(org => ({
      id: org.id,
      name: org.name,
      users: usersByOrg[org.id].sort((a, b) => {
        const aLevel = roleHierarchy[a.role] || 0;
        const bLevel = roleHierarchy[b.role] || 0;
        return bLevel - aLevel; // Descending order
      }),
    }))
    .sort((a, b) => a.id - b.id); // Sort organizations by ID
});

// Initialize demo users on component mount
onMounted(() => {
  loadDemoUsers();
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
  >
    <div class="w-full max-w-2xl">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img :src="stadsmissionenLogo" alt="Östergötlands Stadsmission" class="h-16 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-900">Välkommen tillbaka</h1>
        <p class="text-gray-600 mt-2">Logga in på ditt konto</p>
      </div>

      <!-- Login Form -->
      <Card>
        <CardHeader>
          <CardTitle>Logga in</CardTitle>
          <CardDescription>
            Ange dina inloggningsuppgifter för att komma åt systemet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="handleSubmit">
            <!-- Error Alert -->
            <Alert v-if="error" variant="destructive">
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>

            <!-- Email Field -->
            <div class="space-y-2">
              <Label for="email">E-postadress</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="din.epost@stadsmissionen.se"
                :disabled="isLoading"
                required
              />
            </div>

            <!-- Password Field -->
            <div class="space-y-2">
              <Label for="password">Lösenord</Label>
              <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Ange ditt lösenord"
                  :disabled="isLoading"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  :disabled="isLoading"
                  @click="togglePasswordVisibility"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <!-- Submit Button -->
            <Button type="submit" class="w-full" :disabled="isLoading">
              <div
                v-if="isLoading"
                class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
              />
              <LogIn v-else class="h-4 w-4 mr-2" />
              {{ isLoading ? 'Loggar in...' : 'Logga in' }}
            </Button>
          </form>

          <!-- Demo Credentials -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <p class="text-sm text-gray-600 mb-3">Demo-konton för testning:</p>

            <!-- Loading state for demo users -->
            <div v-if="loadingDemoUsers" class="flex items-center justify-center py-4">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
              <span class="text-sm text-gray-500">Laddar demo-konton...</span>
            </div>

            <!-- Demo user buttons organized by stadsmission in columns -->
            <div v-else class="space-y-4">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="org in organizedUsers" :key="org.id" class="space-y-2">
                  <h4 class="text-xs font-medium text-gray-700 text-center">{{ org.name }}</h4>
                  <div class="space-y-1">
                    <Button
                      v-for="user in org.users"
                      :key="user.id"
                      variant="outline"
                      size="sm"
                      :disabled="isLoading"
                      class="w-full text-left justify-start h-auto py-2 text-xs"
                      @click="fillDemoCredentials(user)"
                    >
                      <div class="flex flex-col items-start w-full">
                        <div class="text-xs">{{ user.role }}</div>
                        <div
                          class="text-xs text-muted-foreground mt-1 flex items-center justify-between w-full"
                        >
                          <span>{{ user.officeCount || 0 }} kontor</span>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>

              <!-- Fallback if no demo users loaded -->
              <div v-if="demoUsers.length === 0" class="text-sm text-gray-500 text-center py-2">
                Inga demo-konton tillgängliga
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Footer -->
      <div class="text-center mt-8 text-sm text-gray-500">
        <p>&copy; 2024 Östergötlands Stadsmission. Alla rättigheter förbehållna.</p>
      </div>
    </div>
  </div>
</template>
