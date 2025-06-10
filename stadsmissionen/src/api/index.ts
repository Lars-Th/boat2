import { ApiConfiguration } from '@/api/config';
import { MockDataService } from '@/api/mocks';
import type { Activity, Attendance, Participant } from '@/types';
import type { RequestParams } from '@/api/client/types';

// Export all types and client functionality
export * from '@/api/client';
export * from '@/api/services';
export * from '@/api/config';
export * from '@/api/mocks';

// Environment-based API service selection
const USE_MOCK_API = import.meta.env['VITE_USE_MOCK_API'] === 'true' || import.meta.env.DEV;

// Create the main API service instance
const apiService = USE_MOCK_API ? new MockDataService() : new ApiConfiguration();

// Clean, domain-focused API interface
export const api = {
  // Activities
  activities: {
    getAll: (params?: RequestParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivities()
        : (apiService as ApiConfiguration).activities.getAll(params),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivity(id)
        : (apiService as ApiConfiguration).activities.getById(id),

    create: (data: Partial<Activity>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createActivity(data)
        : (apiService as ApiConfiguration).activities.create(data),

    update: (id: string, data: Partial<Activity>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateActivity(id, data)
        : (apiService as ApiConfiguration).activities.update(id, data),

    delete: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteActivity(id)
        : (apiService as ApiConfiguration).activities.delete(id),

    // Additional methods only available in real API
    getByDateRange: (start: string, end: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).activities.getByDateRange(start, end),

    getByType: (typeId: number) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).activities.getByType(typeId),

    getUpcoming: (limit?: number) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).activities.getUpcoming(limit),
  },

  // Activity Types
  activityTypes: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivityTypes()
        : (apiService as ApiConfiguration).activityTypes.getAll(),

    getById: (id: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).activityTypes.getById(id),
  },

  // Participants
  participants: {
    getAll: (params?: RequestParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getParticipants()
        : (apiService as ApiConfiguration).participants.getAll(params),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getParticipant(id)
        : (apiService as ApiConfiguration).participants.getById(id),

    getByActivityId: (activityId: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getParticipantsByActivityId(activityId)
        : (apiService as ApiConfiguration).participants.getByActivityId(activityId),

    create: (data: Partial<Participant>) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).participants.create(data),

    update: (id: string, data: Partial<Participant>) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).participants.update(id, data),

    delete: (id: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).participants.delete(id),

    search: (query: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).participants.search(query),
  },

  // Attendances
  attendances: {
    getAll: (params?: RequestParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getAttendances()
        : (apiService as ApiConfiguration).attendances.getAll(params),

    getByActivityId: (activityId: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getAttendancesByActivityId(activityId)
        : (apiService as ApiConfiguration).attendances.getByActivityId(activityId),

    getByParticipantId: (participantId: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).attendances.getByParticipantId(participantId),

    create: (data: Partial<Attendance>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createAttendance(data)
        : (apiService as ApiConfiguration).attendances.create(data),

    update: (id: string, data: Partial<Attendance>) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).attendances.update(id, data),

    delete: (id: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).attendances.delete(id),

    markAttendance: (
      activityId: string,
      participantId: string,
      present: boolean,
      notes?: string
    ) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Not implemented in mock'))
        : (apiService as ApiConfiguration).attendances.markAttendance(
            activityId,
            participantId,
            present,
            notes
          ),
  },

  // Legacy compatibility for organizations, users, etc.
  organizations: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getOrganizations()
        : Promise.reject(new Error('Organizations not implemented in real API yet')),

    create: (data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createOrganization(data as never)
        : Promise.reject(new Error('Organizations not implemented in real API yet')),

    update: (id: string, data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateOrganization(id, data as never)
        : Promise.reject(new Error('Organizations not implemented in real API yet')),

    delete: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteOrganization(id)
        : Promise.reject(new Error('Organizations not implemented in real API yet')),
  },

  users: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getUsers()
        : Promise.reject(new Error('Users not implemented in real API yet')),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getUser(id)
        : Promise.reject(new Error('Users not implemented in real API yet')),

    create: (data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createUser(data as never)
        : Promise.reject(new Error('Users not implemented in real API yet')),

    update: (id: string, data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateUser(id, data as never)
        : Promise.reject(new Error('Users not implemented in real API yet')),

    delete: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteUser(id)
        : Promise.reject(new Error('Users not implemented in real API yet')),
  },

  participantGroups: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getParticipantGroups()
        : Promise.reject(new Error('Participant groups not implemented in real API yet')),
  },

  activityTemplates: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivityTemplates()
        : Promise.reject(new Error('Activity templates not implemented in real API yet')),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivityTemplate(id)
        : Promise.reject(new Error('Activity templates not implemented in real API yet')),
  },
};

// Default export for convenience
export default api;

// Export the service instance for advanced usage
export { apiService };
