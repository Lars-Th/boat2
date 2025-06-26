import { computed, ref } from 'vue';
import { organizationService } from '@/api/services/organization.service';
import type { Organization } from '@/types';
import type { ApiResponse } from '@/types';

export function useOrganizationManagement() {
  // Reactive state
  const organizations = ref<Organization[]>([]);
  const currentOrganization = ref<Organization | null>(null);
  const organizationSettings = ref<{
    organizations: Organization[];
    currentOrganization: string;
    systemSettings: {
      defaultLanguage: string;
      dateFormat: string;
      timeFormat: string;
      currency: string;
      timezone: string;
    };
    permissions: {
      roles: Array<{
        id: string;
        namn: string;
        beskrivning: string;
        permissions: string[];
      }>;
      resources: string[];
      actions: string[];
    };
  } | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const hasOrganizations = computed(() => organizations.value.length > 0);
  const activeOrganizations = computed(() => organizations.value.filter(org => org.aktiv));
  const inactiveOrganizations = computed(() => organizations.value.filter(org => !org.aktiv));

  /**
   * Load all organizations
   */
  const loadOrganizations = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<Organization[]> = await organizationService.getAll();

      if (response.success) {
        organizations.value = response.data;
      } else {
        error.value = response.error?.message ?? 'Failed to load organizations';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load a specific organization by ID
   */
  const loadOrganization = async (id: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<Organization | null> = await organizationService.getById(id);

      if (response.success) {
        currentOrganization.value = response.data;
      } else {
        error.value = response.error?.message ?? 'Failed to load organization';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load organization settings
   */
  const loadOrganizationSettings = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await organizationService.getSettings();

      if (response.success) {
        organizationSettings.value = response.data;
        organizations.value = response.data.organizations;
      } else {
        error.value = response.error?.message ?? 'Failed to load organization settings';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create a new organization
   */
  const createOrganization = async (
    organizationData: Partial<Organization>
  ): Promise<ApiResponse<Organization>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<Organization> =
        await organizationService.create(organizationData);

      if (response.success) {
        // Add the new organization to the list
        organizations.value.push(response.data);
      } else {
        error.value = response.error?.message ?? 'Failed to create organization';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: null as unknown as Organization,
        success: false,
        error: {
          message: errorMessage,
          code: 'CREATE_ERROR',
        },
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update an existing organization
   */
  const updateOrganization = async (
    id: string,
    organizationData: Partial<Organization>
  ): Promise<ApiResponse<Organization>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<Organization> = await organizationService.update(
        id,
        organizationData
      );

      if (response.success) {
        // Update the organization in the list
        const index = organizations.value.findIndex(org => org.id === id);
        if (index !== -1) {
          organizations.value[index] = response.data;
        }

        // Update current organization if it's the same organization
        if (currentOrganization.value?.id === id) {
          currentOrganization.value = response.data;
        }
      } else {
        error.value = response.error?.message ?? 'Failed to update organization';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: null as unknown as Organization,
        success: false,
        error: {
          message: errorMessage,
          code: 'UPDATE_ERROR',
        },
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Delete an organization
   */
  const deleteOrganization = async (id: string): Promise<ApiResponse<boolean>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<boolean> = await organizationService.delete(id);

      if (response.success) {
        // Remove the organization from the list
        const index = organizations.value.findIndex(org => org.id === id);
        if (index !== -1) {
          organizations.value.splice(index, 1);
        }

        // Clear current organization if it's the same organization
        if (currentOrganization.value?.id === id) {
          currentOrganization.value = null;
        }
      } else {
        error.value = response.error?.message ?? 'Failed to delete organization';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: false,
        success: false,
        error: {
          message: errorMessage,
          code: 'DELETE_ERROR',
        },
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update organization settings
   */
  const updateSettings = async (settings: {
    currentOrganization?: string;
    systemSettings?: {
      defaultLanguage?: string;
      dateFormat?: string;
      timeFormat?: string;
      currency?: string;
      timezone?: string;
    };
  }): Promise<ApiResponse<boolean>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<boolean> = await organizationService.updateSettings(settings);

      if (response.success) {
        // Update the settings in the local state
        if (organizationSettings.value) {
          if (settings.currentOrganization) {
            organizationSettings.value.currentOrganization = settings.currentOrganization;
          }
          if (settings.systemSettings) {
            organizationSettings.value.systemSettings = {
              ...organizationSettings.value.systemSettings,
              ...settings.systemSettings,
            };
          }
        }
      } else {
        error.value = response.error?.message ?? 'Failed to update organization settings';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: false,
        success: false,
        error: {
          message: errorMessage,
          code: 'UPDATE_ERROR',
        },
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Get organization by ID from the loaded list
   */
  const getOrganizationById = (id: string): Organization | undefined => {
    return organizations.value.find(org => org.id === id);
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * Reset state
   */
  const reset = (): void => {
    organizations.value = [];
    currentOrganization.value = null;
    organizationSettings.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    // State
    organizations,
    currentOrganization,
    organizationSettings,
    loading,
    error,

    // Computed
    hasOrganizations,
    activeOrganizations,
    inactiveOrganizations,

    // Methods
    loadOrganizations,
    loadOrganization,
    loadOrganizationSettings,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    updateSettings,
    getOrganizationById,
    clearError,
    reset,
  };
}
