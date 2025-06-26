import { ApiConfiguration } from '@/api/config';
import { MockDataService } from '@/api/mocks';
import type { Activity, Attendance, Contact, Customer, Participant } from '@/types';
import type { RelationalParams } from '@/types/enhanced';
import type { ContactWithRelations, CustomerWithRelations } from '@/types/relationships';
import type { ApiResponse, RequestParams } from '@/api/client/types';

// Export all types and client functionality
export * from '@/api/client';
export * from '@/api/services';
export * from '@/api/config';
export * from '@/api/mocks';

// Environment-based API service selection
const USE_MOCK_API = import.meta.env['VITE_USE_MOCK_API'] === 'true';

// Create the main API service instance
const apiService = USE_MOCK_API ? new MockDataService() : new ApiConfiguration();

// Clean, domain-focused API interface
export const api = {
  // Activities
  activities: {
    getAll: (params?: RequestParams & RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivities(params)
        : (apiService as ApiConfiguration).activities.getAll(params),

    getById: (id: string, params?: RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivity(id, params)
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

  // Activity Completions
  activityCompletions: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivityCompletions()
        : Promise.reject(new Error('Activity completions not implemented in real API yet')),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivityCompletion(id)
        : Promise.reject(new Error('Activity completions not implemented in real API yet')),

    getByActivityId: (activityId: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivityCompletionsByActivityId(activityId)
        : Promise.reject(new Error('Activity completions not implemented in real API yet')),

    create: (data: any) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createActivityCompletion(data)
        : Promise.reject(new Error('Activity completions not implemented in real API yet')),

    update: (id: string, data: any) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateActivityCompletion(id, data)
        : Promise.reject(new Error('Activity completions not implemented in real API yet')),

    delete: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteActivityCompletion(id)
        : Promise.reject(new Error('Activity completions not implemented in real API yet')),

    getStats: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getActivityCompletionStats()
        : Promise.reject(new Error('Activity completions not implemented in real API yet')),
  },

  // Participants
  participants: {
    getAll: (params?: RequestParams & RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getParticipants(params)
        : (apiService as ApiConfiguration).participants.getAll(params),

    getById: (id: string, params?: RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getParticipant(id, params)
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
        ? (apiService as MockDataService).updateAttendance(id, data)
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
    getAll: (params?: RequestParams & RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getUsers(params)
        : Promise.reject(new Error('Users not implemented in real API yet')),

    getById: (id: string, params?: RelationalParams) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getUser(id, params)
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

    updatePassword: (id: string, newPassword: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateUserPassword(id, newPassword)
        : Promise.reject(new Error('Users not implemented in real API yet')),
  },

  participantGroups: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getParticipantGroups()
        : Promise.reject(new Error('Participant groups not implemented in real API yet')),
  },

  // Offices
  offices: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getOffices()
        : Promise.reject(new Error('Offices not implemented in real API yet')),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getOfficeById(id)
        : Promise.reject(new Error('Offices not implemented in real API yet')),
  },

  // Junction table - Enheter Participants Groups
  enheterParticipantsGroups: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getEnheterParticipantsGroups()
        : Promise.reject(new Error('Junction table not implemented in real API yet')),

    getByParticipantId: (participantId: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getEnheterParticipantsGroupsByParticipantId(participantId)
        : Promise.reject(new Error('Junction table not implemented in real API yet')),

    getByOfficeId: (officeId: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getEnheterParticipantsGroupsByOfficeId(officeId)
        : Promise.reject(new Error('Junction table not implemented in real API yet')),
  },

  // Groups Junction
  groupsJunction: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getGroupsJunction()
        : Promise.reject(new Error('Groups junction not implemented in real API yet')),
  },

  // Offices Users Junction
  officesUsersJunction: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getOfficesUsersJunction()
        : Promise.reject(new Error('Offices users junction not implemented in real API yet')),
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

  newOrganizations: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getNewOrganizations()
        : Promise.reject(new Error('New organizations not implemented in real API yet')),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getNewOrganization(id)
        : Promise.reject(new Error('New organizations not implemented in real API yet')),
  },

  customers: {
    // Specify exact return types for each method
    getAll: (
      params?: RequestParams & RelationalParams
    ): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomers(params)
        : (apiService as ApiConfiguration).customers.getAll(params),

    getById: (
      id: string,
      params?: RelationalParams
    ): Promise<ApiResponse<Customer | CustomerWithRelations | null>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomer(id, params)
        : (apiService as ApiConfiguration).customers.getById(id, params),

    create: (data: Omit<Customer, 'CustomerID' | 'CreatedDate'>): Promise<ApiResponse<Customer>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).createCustomer(data)
        : (apiService as ApiConfiguration).customers.create(data),

    update: (
      id: string,
      data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>
    ): Promise<ApiResponse<Customer>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateCustomer(id, data)
        : (apiService as ApiConfiguration).customers.update(id, data),

    delete: (id: string): Promise<ApiResponse<boolean>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteCustomer(id)
        : (apiService as ApiConfiguration).customers.delete(id),
  },

  // Contacts
  // Backend Implementation Notes for contacts endpoints:
  //
  // GET /api/contacts
  // - Support query parameters: ?include=customer,workOrders&page=1&limit=25&search=term
  // - Return: { data: Contact[] | ContactWithRelations[], success: boolean, message?: string }
  // - When include=customer: resolve Contact.customer relationship
  // - When include=workOrders: resolve Contact.workOrders[] relationship and compute totalWorkOrders, activeWorkOrders
  //
  // GET /api/contacts/:id
  // - Support query parameters: ?include=customer,workOrders
  // - Return: { data: Contact | ContactWithRelations | null, success: boolean, message?: string }
  // - Return null if contact not found
  // - Always compute fullName field: FirstName + LastName
  //
  // POST /api/contacts
  // - Accept: Omit<Contact, 'ContactID'>
  // - Auto-generate: ContactID (increment)
  // - Validate: All required fields present, email format, CustomerID exists
  // - Return: { data: Contact, success: boolean, message?: string }
  //
  // PUT /api/contacts/:id
  // - Accept: Partial<Omit<Contact, 'ContactID'>>
  // - Preserve: ContactID (never update this)
  // - Validate: Same as POST for provided fields
  // - Return: { data: Contact, success: boolean, message?: string }
  //
  // DELETE /api/contacts/:id
  // - Check: No dependent records (work orders) or handle cascade
  // - Return: { data: boolean, success: boolean, message?: string }
  contacts: {
    // Specify exact return types for each method
    getAll: (
      params?: RequestParams & RelationalParams
    ): Promise<ApiResponse<Contact[] | ContactWithRelations[]>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getContacts(params)
        : (apiService as ApiConfiguration).contacts.getAll(params),

    getById: (
      id: string,
      params?: RelationalParams
    ): Promise<ApiResponse<Contact | ContactWithRelations | null>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getContact(id, params)
        : (apiService as ApiConfiguration).contacts.getById(id, params),

    create: (data: Omit<Contact, 'ContactID'>): Promise<ApiResponse<Contact>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).createContact(data)
        : (apiService as ApiConfiguration).contacts.create(data),

    update: (
      id: string,
      data: Partial<Omit<Contact, 'ContactID'>>
    ): Promise<ApiResponse<Contact>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateContact(id, data)
        : (apiService as ApiConfiguration).contacts.update(id, data),

    delete: (id: string): Promise<ApiResponse<boolean>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteContact(id)
        : (apiService as ApiConfiguration).contacts.delete(id),
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
        : (apiService as ApiConfiguration).auth.login({ email, password }),

    logout: (token?: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).logout()
        : (apiService as ApiConfiguration).auth.logout(token),

    getCurrentUser: (token: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCurrentUser(token)
        : (apiService as ApiConfiguration).auth.getCurrentUser(token),

    refreshToken: (refreshToken: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Refresh token not implemented in mock'))
        : (apiService as ApiConfiguration).auth.refreshToken(refreshToken),

    validateToken: (token: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Token validation not implemented in mock'))
        : (apiService as ApiConfiguration).auth.validateToken(token),

    changePassword: (oldPassword: string, newPassword: string, token: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Change password not implemented in mock'))
        : (apiService as ApiConfiguration).auth.changePassword(oldPassword, newPassword, token),

    requestPasswordReset: (email: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Password reset not implemented in mock'))
        : (apiService as ApiConfiguration).auth.requestPasswordReset(email),

    resetPassword: (token: string, newPassword: string) =>
      USE_MOCK_API
        ? Promise.reject(new Error('Password reset not implemented in mock'))
        : (apiService as ApiConfiguration).auth.resetPassword(token, newPassword),

    getDemoUsers: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getDemoUsers()
        : (apiService as ApiConfiguration).auth.getDemoUsers(),

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
