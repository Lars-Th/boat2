import { BaseApiService } from './base'
import type { ApiResponse } from '@/types/api'
import type { Activity, ActivityType, Organization, User, Participant, ParticipantGroup, ActivityTemplate } from '@/types'

interface Attendance {
  AttendanceID: number
  ActivityID: number
  ParticipantID: number
  DatumTid: string
  Närvaro: boolean
  Anteckningar?: string
}

export class RealApiService extends BaseApiService {
  constructor() {
    super({
      baseURL: (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? 'https://api.yourdomain.com',
    })
  }

  // Activities
  async getActivities(): Promise<ApiResponse<Activity[]>> {
    return this.get<Activity[]>('/activities')
  }

  async getActivity(id: string): Promise<ApiResponse<Activity | null>> {
    return this.get<Activity | null>(`/activities/${id}`)
  }

  async createActivity(activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    return this.post<Activity>('/activities', activity)
  }

  async updateActivity(id: string, activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    return this.put<Activity>(`/activities/${id}`, activity)
  }

  async deleteActivity(id: string): Promise<ApiResponse<boolean>> {
    return this.delete<boolean>(`/activities/${id}`)
  }

  // Activity Types
  async getActivityTypes(): Promise<ApiResponse<ActivityType[]>> {
    return this.get<ActivityType[]>('/activity-types')
  }

  // Organizations
  async getOrganizations(): Promise<ApiResponse<Organization[]>> {
    return this.get<Organization[]>('/organizations')
  }

  async createOrganization(org: Partial<Organization>): Promise<ApiResponse<Organization>> {
    return this.post<Organization>('/organizations', org)
  }

  async updateOrganization(id: string, org: Partial<Organization>): Promise<ApiResponse<Organization>> {
    return this.put<Organization>(`/organizations/${id}`, org)
  }

  async deleteOrganization(id: string): Promise<ApiResponse<boolean>> {
    return this.delete<boolean>(`/organizations/${id}`)
  }

  // Users
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.get<User[]>('/users')
  }

  async getUser(id: string): Promise<ApiResponse<User | null>> {
    return this.get<User | null>(`/users/${id}`)
  }

  async createUser(user: Partial<User>): Promise<ApiResponse<User>> {
    return this.post<User>('/users', user)
  }

  async updateUser(id: string, user: Partial<User>): Promise<ApiResponse<User>> {
    return this.put<User>(`/users/${id}`, user)
  }

  async deleteUser(id: string): Promise<ApiResponse<boolean>> {
    return this.delete<boolean>(`/users/${id}`)
  }

  // Participants
  async getParticipants(): Promise<ApiResponse<Participant[]>> {
    return this.get<Participant[]>('/participants')
  }

  async getParticipant(id: string): Promise<ApiResponse<Participant | null>> {
    return this.get<Participant | null>(`/participants/${id}`)
  }

  async createParticipant(participant: Partial<Participant>): Promise<ApiResponse<Participant>> {
    return this.post<Participant>('/participants', participant)
  }

  async updateParticipant(id: string, participant: Partial<Participant>): Promise<ApiResponse<Participant>> {
    return this.put<Participant>(`/participants/${id}`, participant)
  }

  async deleteParticipant(id: string): Promise<ApiResponse<boolean>> {
    return this.delete<boolean>(`/participants/${id}`)
  }

  // Participant Groups
  async getParticipantGroups(): Promise<ApiResponse<ParticipantGroup[]>> {
    return this.get<ParticipantGroup[]>('/participant-groups')
  }

  // Attendances
  async getAttendances(): Promise<ApiResponse<Attendance[]>> {
    return this.get<Attendance[]>('/attendances')
  }

  async createAttendance(attendance: Partial<Attendance>): Promise<ApiResponse<Attendance>> {
    return this.post<Attendance>('/attendances', attendance)
  }

  // Activity Templates
  async getActivityTemplates(): Promise<ApiResponse<ActivityTemplate[]>> {
    return this.get<ActivityTemplate[]>('/activity-templates')
  }

  async getActivityTemplate(id: string): Promise<ApiResponse<ActivityTemplate | null>> {
    return this.get<ActivityTemplate | null>(`/activity-templates/${id}`)
  }

  async createActivityTemplate(template: Partial<ActivityTemplate>): Promise<ApiResponse<ActivityTemplate>> {
    return this.post<ActivityTemplate>('/activity-templates', template)
  }

  async updateActivityTemplate(id: string, template: Partial<ActivityTemplate>): Promise<ApiResponse<ActivityTemplate>> {
    return this.put<ActivityTemplate>(`/activity-templates/${id}`, template)
  }

  async deleteActivityTemplate(id: string): Promise<ApiResponse<boolean>> {
    return this.delete<boolean>(`/activity-templates/${id}`)
  }
} 