import type { ApiResponse, ApiError } from '@/types/api'
import type { Activity, ActivityType, Organization, User, Participant, ParticipantGroup, ActivityTemplate, Attendance } from '@/types'

export interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// Base interface that all API services should implement
export interface IApiService {
  // Activities
  getActivities(): Promise<ApiResponse<Activity[]>>
  getActivity(id: string): Promise<ApiResponse<Activity | null>>
  createActivity(activity: Partial<Activity>): Promise<ApiResponse<Activity>>
  updateActivity(id: string, activity: Partial<Activity>): Promise<ApiResponse<Activity>>
  deleteActivity(id: string): Promise<ApiResponse<boolean>>

  // Activity Types
  getActivityTypes(): Promise<ApiResponse<ActivityType[]>>

  // Organizations
  getOrganizations(): Promise<ApiResponse<Organization[]>>
  createOrganization(org: Partial<Organization>): Promise<ApiResponse<Organization>>
  updateOrganization(id: string, org: Partial<Organization>): Promise<ApiResponse<Organization>>
  deleteOrganization(id: string): Promise<ApiResponse<boolean>>

  // Users
  getUsers(): Promise<ApiResponse<User[]>>
  getUser(id: string): Promise<ApiResponse<User | null>>
  createUser(user: Partial<User>): Promise<ApiResponse<User>>
  updateUser(id: string, user: Partial<User>): Promise<ApiResponse<User>>
  deleteUser(id: string): Promise<ApiResponse<boolean>>

  // Participants
  getParticipants(): Promise<ApiResponse<Participant[]>>
  getParticipant(id: string): Promise<ApiResponse<Participant | null>>
  getParticipantsByActivityId(activityId: string): Promise<ApiResponse<Participant[]>>

  // Participant Groups
  getParticipantGroups(): Promise<ApiResponse<ParticipantGroup[]>>

  // Attendances
  getAttendances(): Promise<ApiResponse<Attendance[]>>
  getAttendancesByActivityId(activityId: string): Promise<ApiResponse<Attendance[]>>
  createAttendance(attendance: Partial<Attendance>): Promise<ApiResponse<Attendance>>

  // Activity Templates
  getActivityTemplates(): Promise<ApiResponse<ActivityTemplate[]>>
  getActivityTemplate(id: string): Promise<ApiResponse<ActivityTemplate | null>>
}

export class BaseApiService {
  protected config: ApiConfig

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ?? '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    }
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseURL}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as T
      
      return {
        data,
        success: true,
        message: 'Request successful',
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      const apiError: ApiError = {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'FETCH_ERROR',
        details: error,
      }

      return {
        data: null as unknown as T,
        success: false,
        error: apiError,
      }
    }
  }

  protected async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  protected async post<T>(
    endpoint: string,
    data: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  protected async put<T>(
    endpoint: string,
    data: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  protected async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
} 