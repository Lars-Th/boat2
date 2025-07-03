import { ApiConfiguration } from '@/api/config';
import { MockDataService } from '@/api/mocks';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiRequestParams } from '@/types';

// Export all types and client functionality
export * from '@/api/client';
export * from '@/api/services';
export * from '@/api/config';
export * from '@/api/mocks';

// Environment-based API service selection
const USE_MOCK_API = (import.meta as any).env?.VITE_USE_MOCK_API === 'true';

// Create the main API service instance
const apiService = USE_MOCK_API ? new MockDataService() : new ApiConfiguration();

// Clean, domain-focused API interface
export const api = {
  // Activities
  users: {
    getAll: (params?: ApiRequestParams & RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getUsers(params)
        : (apiService as ApiConfiguration).users.getAll(),

    getById: (id: string, params?: RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getUser(id, params)
        : (apiService as ApiConfiguration).users.getById(id),

    create: (data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createUser(data as never)
        : (apiService as ApiConfiguration).users.create(data),

    update: (id: string, data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateUser(id, data as never)
        : (apiService as ApiConfiguration).users.update(id, data),

    delete: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteUser(id)
        : (apiService as ApiConfiguration).users.delete(id),

    updatePassword: (id: string, newPassword: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateUserPassword(id, newPassword)
        : (apiService as ApiConfiguration).users.changePassword(id, newPassword),
  },

  // PermissionGroups
  permissionGroups: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getPermissionGroups()
        : Promise.reject(new Error('PermissionGroups not implemented in real API yet')),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getPermissionGroup(id)
        : Promise.reject(new Error('PermissionGroups not implemented in real API yet')),

    create: (data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createPermissionGroup(data as never)
        : Promise.reject(new Error('PermissionGroups not implemented in real API yet')),

    update: (id: string, data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updatePermissionGroup(id, data as never)
        : Promise.reject(new Error('PermissionGroups not implemented in real API yet')),

    delete: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).deletePermissionGroup(id)
        : Promise.reject(new Error('PermissionGroups not implemented in real API yet')),
  },

  // Authentication
  auth: {
    login: (email: string, password: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).login(email, password)
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    logout: (_token?: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).logout()
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    getCurrentUser: (token: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCurrentUser(token)
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    refreshToken: (_refreshToken: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Refresh token not implemented in mock'))
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    validateToken: (_token: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Token validation not implemented in mock'))
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    changePassword: (_oldPassword: string, _newPassword: string, _token: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Change password not implemented in mock'))
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    requestPasswordReset: (_email: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Password reset not implemented in mock'))
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    resetPassword: (_token: string, _newPassword: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Password reset not implemented in mock'))
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    getDemoUsers: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getDemoUsers()
        : Promise.reject(new Error('Auth not implemented in real API yet')),

    getDefaultUser: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getDefaultUser()
        : Promise.reject(new Error('Default user not implemented in real API')),
  },
};

// Default export for convenience
export default api;

// Export the service instance for advanced usage
export { apiService };
