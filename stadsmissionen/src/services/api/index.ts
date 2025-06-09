import { MockApiService } from './mock'
import { RealApiService } from './real'
import type { IApiService } from './base'

// Environment-based API service selection
const USE_MOCK_API = import.meta.env['VITE_USE_MOCK_API'] === 'true' || import.meta.env.DEV

// Create the appropriate API service instance
export const apiService: IApiService = USE_MOCK_API ? new MockApiService() : new RealApiService()

// Export types for convenience
export type { ApiResponse, ApiError, PaginatedResponse } from '@/types/api'

// Export individual services for direct access if needed
export { MockApiService } from './mock'
export { RealApiService } from './real'
export { BaseApiService } from './base'

// Smart API module interface - provides a clean, consistent API
export const api = {
  // Activities
  activities: {
    getAll: () => apiService.getActivities(),
    getById: (id: string) => apiService.getActivity(id),
    create: (activity: Parameters<typeof apiService.createActivity>[0]) => 
      apiService.createActivity(activity),
    update: (id: string, activity: Parameters<typeof apiService.updateActivity>[1]) => 
      apiService.updateActivity(id, activity),
    delete: (id: string) => apiService.deleteActivity(id),
  },

  // Activity Types
  activityTypes: {
    getAll: () => apiService.getActivityTypes(),
  },

  // Organizations
  organizations: {
    getAll: () => apiService.getOrganizations(),
    create: (org: Parameters<typeof apiService.createOrganization>[0]) => 
      apiService.createOrganization(org),
    update: (id: string, org: Parameters<typeof apiService.updateOrganization>[1]) => 
      apiService.updateOrganization(id, org),
    delete: (id: string) => apiService.deleteOrganization(id),
  },

  // Users
  users: {
    getAll: () => apiService.getUsers(),
    getById: (id: string) => apiService.getUser(id),
    create: (user: Parameters<typeof apiService.createUser>[0]) => 
      apiService.createUser(user),
    update: (id: string, user: Parameters<typeof apiService.updateUser>[1]) => 
      apiService.updateUser(id, user),
    delete: (id: string) => apiService.deleteUser(id),
  },

  // Participants
  participants: {
    getAll: () => apiService.getParticipants(),
    getById: (id: string) => apiService.getParticipant(id),
    getByActivityId: (activityId: string) => apiService.getParticipantsByActivityId(activityId),
  },

  // Participant Groups
  participantGroups: {
    getAll: () => apiService.getParticipantGroups(),
  },

  // Attendances
  attendances: {
    getAll: () => apiService.getAttendances(),
    getByActivityId: (activityId: string) => apiService.getAttendancesByActivityId(activityId),
    create: (attendance: Parameters<typeof apiService.createAttendance>[0]) => 
      apiService.createAttendance(attendance),
  },

  // Activity Templates
  activityTemplates: {
    getAll: () => apiService.getActivityTemplates(),
    getById: (id: string) => apiService.getActivityTemplate(id),
  },
}

// Default export for convenience
export default api 