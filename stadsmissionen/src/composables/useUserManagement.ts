import { computed, ref } from 'vue';
import { userService } from '@/api/services/user.service';
import type { User } from '@/types';
import type { ApiResponse } from '@/api/client/types';

export function useUserManagement() {
  // Reactive state
  const users = ref<User[]>([]);
  const currentUser = ref<User | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed properties
  const hasUsers = computed(() => users.value.length > 0);
  const activeUsers = computed(() => users.value.filter(user => user.aktiv));
  const inactiveUsers = computed(() => users.value.filter(user => !user.aktiv));

  /**
   * Load all users
   */
  const loadUsers = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<User[]> = await userService.getAll();

      if (response.success) {
        users.value = response.data;
      } else {
        error.value = response.error?.message ?? 'Failed to load users';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Load a specific user by ID
   */
  const loadUser = async (id: string): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<User | null> = await userService.getById(id);

      if (response.success) {
        currentUser.value = response.data;
      } else {
        error.value = response.error?.message ?? 'Failed to load user';
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An unexpected error occurred';
    } finally {
      loading.value = false;
    }
  };

  /**
   * Create a new user
   */
  const createUser = async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<User> = await userService.create(userData);

      if (response.success) {
        // Add the new user to the list
        users.value.push(response.data);
      } else {
        error.value = response.error?.message ?? 'Failed to create user';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: null as unknown as User,
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
   * Update an existing user
   */
  const updateUser = async (id: string, userData: Partial<User>): Promise<ApiResponse<User>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<User> = await userService.update(id, userData);

      if (response.success) {
        // Update the user in the list
        const index = users.value.findIndex(user => user.id === id);
        if (index !== -1) {
          users.value[index] = response.data;
        }

        // Update current user if it's the same user
        if (currentUser.value?.id === id) {
          currentUser.value = response.data;
        }
      } else {
        error.value = response.error?.message ?? 'Failed to update user';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: null as unknown as User,
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
   * Delete a user
   */
  const deleteUser = async (id: string): Promise<ApiResponse<boolean>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<boolean> = await userService.delete(id);

      if (response.success) {
        // Remove the user from the list
        const index = users.value.findIndex(user => user.id === id);
        if (index !== -1) {
          users.value.splice(index, 1);
        }

        // Clear current user if it's the same user
        if (currentUser.value?.id === id) {
          currentUser.value = null;
        }
      } else {
        error.value = response.error?.message ?? 'Failed to delete user';
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
   * Change user password
   */
  const changePassword = async (id: string, newPassword: string): Promise<ApiResponse<boolean>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<boolean> = await userService.changePassword(id, newPassword);

      if (!response.success) {
        error.value = response.error?.message ?? 'Failed to change password';
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
          code: 'CHANGE_PASSWORD_ERROR',
        },
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update user roles
   */
  const updateRoles = async (id: string, roles: string[]): Promise<ApiResponse<User>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<User> = await userService.updateRoles(id, roles);

      if (response.success) {
        // Update the user in the list
        const index = users.value.findIndex(user => user.id === id);
        if (index !== -1) {
          users.value[index] = response.data;
        }

        // Update current user if it's the same user
        if (currentUser.value?.id === id) {
          currentUser.value = response.data;
        }
      } else {
        error.value = response.error?.message ?? 'Failed to update user roles';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: null as unknown as User,
        success: false,
        error: {
          message: errorMessage,
          code: 'UPDATE_ROLES_ERROR',
        },
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update user units
   */
  const updateUnits = async (id: string, units: string[]): Promise<ApiResponse<User>> => {
    loading.value = true;
    error.value = null;

    try {
      const response: ApiResponse<User> = await userService.updateUnits(id, units);

      if (response.success) {
        // Update the user in the list
        const index = users.value.findIndex(user => user.id === id);
        if (index !== -1) {
          users.value[index] = response.data;
        }

        // Update current user if it's the same user
        if (currentUser.value?.id === id) {
          currentUser.value = response.data;
        }
      } else {
        error.value = response.error?.message ?? 'Failed to update user units';
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      error.value = errorMessage;
      return {
        data: null as unknown as User,
        success: false,
        error: {
          message: errorMessage,
          code: 'UPDATE_UNITS_ERROR',
        },
      };
    } finally {
      loading.value = false;
    }
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
    users.value = [];
    currentUser.value = null;
    loading.value = false;
    error.value = null;
  };

  return {
    // State
    users,
    currentUser,
    loading,
    error,

    // Computed
    hasUsers,
    activeUsers,
    inactiveUsers,

    // Methods
    loadUsers,
    loadUser,
    createUser,
    updateUser,
    deleteUser,
    changePassword,
    updateRoles,
    updateUnits,
    clearError,
    reset,
  };
}
