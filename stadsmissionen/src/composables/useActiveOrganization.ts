import { computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useApiList } from '@/composables/useApi';
import api from '@/api';
import type { Organization } from '@/types';

export function useActiveOrganization() {
  const { currentUser } = useAuth();

  // Fetch organizations data
  const {
    data: organizationsData,
    loading: organizationsLoading,
    error: organizationsError,
  } = useApiList<any>(() => api.newOrganizations.getAll(), {
    cacheKey: 'activeOrganizations',
  });

  // Get the active organization based on the logged-in user's stadsmission
  const activeOrganization = computed(() => {
    console.log('useActiveOrganization - currentUser:', currentUser.value);
    console.log('useActiveOrganization - organizationsData:', organizationsData.value);

    if (!currentUser.value?.stadsmission || !organizationsData.value) {
      console.log('useActiveOrganization - Missing user stadsmission or organizations data');
      return null;
    }

    const foundOrg = organizationsData.value.find(
      (org: any) =>
        org.id === currentUser.value?.stadsmission ||
        org.id === currentUser.value?.stadsmission?.toString()
    );

    console.log('useActiveOrganization - Found organization:', foundOrg);
    return foundOrg || null;
  });

  // Get the active organization's logo
  const activeOrganizationLogo = computed(() => {
    return (
      activeOrganization.value?.logotyp ||
      activeOrganization.value?.logo ||
      '/src/assets/images/logo-placeholder.png'
    );
  });

  // Get the active organization's name
  const activeOrganizationName = computed(() => {
    return activeOrganization.value?.namn || activeOrganization.value?.name || 'Stadsmissionen';
  });

  return {
    activeOrganization,
    activeOrganizationLogo,
    activeOrganizationName,
    organizationsLoading,
    organizationsError,
  };
}
