import { computed, ref } from 'vue';
import type { User } from '@/types';

// Mock user data - replace with actual API calls
const currentUser = ref<User | null>({
  id: 'current-user',
  namn: 'Current User',
  epost: 'user@example.com',
  losenord: '',
  roller: ['administrator'], // Changed to administrator to allow reports access
  enheter: ['Barn och unga'],
  organisationId: 'org-1',
  aktiv: true,
  skapadDatum: new Date().toISOString(),
  senastInloggad: new Date().toISOString(),
});

const isAuthenticated = ref(true);
const isLoading = ref(false);

export function useAuth() {
  const login = async (email: string, password: string): Promise<boolean> => {
    isLoading.value = true;
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login
      currentUser.value = {
        id: `user-${Date.now()}`,
        namn: 'Authenticated User',
        epost: email,
        losenord: password,
        roller: ['systemadministrator'], // Changed to administrator to allow reports access
        enheter: ['Barn och unga'],
        organisationId: 'org-1',
        aktiv: true,
        skapadDatum: new Date().toISOString(),
        senastInloggad: new Date().toISOString(),
      };

      isAuthenticated.value = true;
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async (): Promise<void> => {
    isLoading.value = true;
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      currentUser.value = null;
      isAuthenticated.value = false;
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const getCurrentUser = (): User | null => {
    return currentUser.value;
  };

  const getCurrentUserId = (): string => {
    return currentUser.value?.id ?? 'anonymous';
  };

  const hasRole = (role: string): boolean => {
    return currentUser.value?.roller.includes(role) ?? false;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const canAccessEnhet = (enhet: string): boolean => {
    return currentUser.value?.enheter.includes(enhet) ?? false;
  };

  const isAdmin = computed(() => hasAnyRole(['admin', 'systemadministrator']));
  const isManager = computed(() => hasAnyRole(['enhetsansvarig', 'administrator']));

  // Permission checking functions
  const canCreateActivity = computed(() =>
    hasAnyRole(['handlaggare', 'enhetsansvarig', 'administrator'])
  );

  const canEditUser = computed(() => hasAnyRole(['administrator', 'systemadministrator']));

  const canDeleteUser = computed(() => hasRole('systemadministrator'));

  const canExportData = computed(() =>
    hasAnyRole(['enhetsansvarig', 'administrator', 'systemadministrator'])
  );

  const canManagePermissions = computed(() => hasAnyRole(['administrator', 'systemadministrator']));

  return {
    // State
    currentUser: computed(() => currentUser.value),
    isAuthenticated: computed(() => isAuthenticated.value),
    isLoading: computed(() => isLoading.value),

    // Actions
    login,
    logout,
    getCurrentUser,
    getCurrentUserId,

    // Permissions
    hasRole,
    hasAnyRole,
    canAccessEnhet,
    isAdmin,
    isManager,
    canCreateActivity,
    canEditUser,
    canDeleteUser,
    canExportData,
    canManagePermissions,
  };
}
