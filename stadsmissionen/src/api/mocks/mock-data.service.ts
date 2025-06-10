import type { ApiResponse } from '../client/types';
import type { Activity, ActivityType, Attendance, Participant } from '@/types';

// Import JSON data
import activitiesData from '@/assets/data/activities.json';
import activityTypesData from '@/assets/data/activityTypes.json';
import organizationSettingsData from '@/assets/data/organizationSettings.json';
import usersData from '@/assets/data/users.json';
import participantsData from '@/assets/data/participants.json';
import participantGroupsData from '@/assets/data/participantGroups.json';
import attendancesData from '@/assets/data/attendances.json';
import activityTemplatesData from '@/assets/data/activityTemplates.json';

export class MockDataService {
  private delay = 300; // Simulate network delay

  private async simulateNetworkDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }

  private async mockRequest<T>(data: T): Promise<ApiResponse<T>> {
    await this.simulateNetworkDelay();

    // Simulate occasional network errors (5% chance)
    if (Math.random() < 0.05) {
      return {
        data: null as T,
        success: false,
        error: {
          message: 'Network error occurred',
          code: 'NETWORK_ERROR',
        },
      };
    }

    return {
      data,
      success: true,
      message: 'Request successful',
    };
  }

  // Activities
  async getActivities(): Promise<ApiResponse<Activity[]>> {
    return this.mockRequest(activitiesData as Activity[]);
  }

  async getActivity(id: string): Promise<ApiResponse<Activity | null>> {
    const activity = activitiesData.find(a => a.ActivityID.toString() === id);
    return this.mockRequest(activity ? (activity as Activity) : null);
  }

  async createActivity(activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const newActivity = {
      ...activity,
      ActivityID: Math.max(...activitiesData.map(a => a.ActivityID)) + 1,
      DatumTid: activity.DatumTid ?? new Date().toISOString(),
    } as Activity;

    return this.mockRequest(newActivity);
  }

  async updateActivity(id: string, activity: Partial<Activity>): Promise<ApiResponse<Activity>> {
    const existingActivity = activitiesData.find(a => a.ActivityID.toString() === id);
    if (!existingActivity) {
      return {
        data: null as unknown as Activity,
        success: false,
        error: {
          message: 'Activity not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedActivity = { ...existingActivity, ...activity } as Activity;
    return this.mockRequest(updatedActivity);
  }

  async deleteActivity(id: string): Promise<ApiResponse<boolean>> {
    const exists = activitiesData.some(a => a.ActivityID.toString() === id);
    if (!exists) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Activity not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return this.mockRequest(true);
  }

  // Activity Types
  async getActivityTypes(): Promise<ApiResponse<ActivityType[]>> {
    return this.mockRequest(activityTypesData as unknown as ActivityType[]);
  }

  // Organizations
  async getOrganizations(): Promise<ApiResponse<typeof organizationSettingsData.organizations>> {
    return this.mockRequest(organizationSettingsData.organizations);
  }

  async createOrganization(
    org: Partial<(typeof organizationSettingsData.organizations)[0]>
  ): Promise<ApiResponse<(typeof organizationSettingsData.organizations)[0]>> {
    const newOrg = {
      ...org,
      id: (
        Math.max(...organizationSettingsData.organizations.map(o => parseInt(o.id))) + 1
      ).toString(),
      skapadDatum: new Date().toISOString(),
    } as unknown as (typeof organizationSettingsData.organizations)[0];

    return this.mockRequest(newOrg);
  }

  async updateOrganization(
    id: string,
    org: Partial<(typeof organizationSettingsData.organizations)[0]>
  ): Promise<ApiResponse<(typeof organizationSettingsData.organizations)[0]>> {
    const existingOrg = organizationSettingsData.organizations.find(o => o.id === id);
    if (!existingOrg) {
      return {
        data: null as unknown as (typeof organizationSettingsData.organizations)[0],
        success: false,
        error: {
          message: 'Organization not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedOrg = { ...existingOrg, ...org };
    return this.mockRequest(updatedOrg);
  }

  async deleteOrganization(id: string): Promise<ApiResponse<boolean>> {
    const exists = organizationSettingsData.organizations.some(o => o.id === id);
    if (!exists) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Organization not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return this.mockRequest(true);
  }

  // Users
  async getUsers(): Promise<ApiResponse<typeof usersData>> {
    return this.mockRequest(usersData);
  }

  async getUser(id: string): Promise<ApiResponse<(typeof usersData)[0] | null>> {
    const user = usersData.find(u => u.id === id);
    return this.mockRequest(user ?? null);
  }

  async createUser(
    user: Partial<(typeof usersData)[0]>
  ): Promise<ApiResponse<(typeof usersData)[0]>> {
    const newUser = {
      ...user,
      id: (Math.max(...usersData.map(u => parseInt(u.id))) + 1).toString(),
      skapadDatum: new Date().toISOString(),
    } as unknown as (typeof usersData)[0];

    return this.mockRequest(newUser);
  }

  async updateUser(
    id: string,
    user: Partial<(typeof usersData)[0]>
  ): Promise<ApiResponse<(typeof usersData)[0]>> {
    const existingUser = usersData.find(u => u.id === id);
    if (!existingUser) {
      return {
        data: null as unknown as (typeof usersData)[0],
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedUser = { ...existingUser, ...user };
    return this.mockRequest(updatedUser);
  }

  async deleteUser(id: string): Promise<ApiResponse<boolean>> {
    const exists = usersData.some(u => u.id === id);
    if (!exists) {
      return {
        data: false,
        success: false,
        error: {
          message: 'User not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return this.mockRequest(true);
  }

  // Participants
  async getParticipants(): Promise<ApiResponse<typeof participantsData>> {
    return this.mockRequest(participantsData);
  }

  async getParticipant(id: string): Promise<ApiResponse<(typeof participantsData)[0] | null>> {
    const participant = participantsData.find(p => p.ParticipantID.toString() === id);
    return this.mockRequest(participant ?? null);
  }

  // Participant Groups
  async getParticipantGroups(): Promise<ApiResponse<typeof participantGroupsData>> {
    return this.mockRequest(participantGroupsData);
  }

  // Attendances
  async getAttendances(): Promise<ApiResponse<typeof attendancesData>> {
    return this.mockRequest(attendancesData);
  }

  async getAttendancesByActivityId(activityId: string): Promise<ApiResponse<Attendance[]>> {
    const activityAttendances = attendancesData.filter(a => a.ActivityID.toString() === activityId);
    return this.mockRequest(activityAttendances as Attendance[]);
  }

  async createAttendance(attendance: Partial<Attendance>): Promise<ApiResponse<Attendance>> {
    const newAttendance = {
      ...attendance,
      AttendanceID: Math.max(...attendancesData.map(a => a.AttendanceID)) + 1,
      DatumTid: attendance.DatumTid ?? new Date().toISOString(),
    } as Attendance;

    return this.mockRequest(newAttendance);
  }

  async getParticipantsByActivityId(activityId: string): Promise<ApiResponse<Participant[]>> {
    const activityAttendances = attendancesData.filter(a => a.ActivityID.toString() === activityId);
    const participantIds = activityAttendances.map(a => a.ParticipantID);
    const activityParticipants = participantsData.filter(p =>
      participantIds.includes(p.ParticipantID)
    );
    return this.mockRequest(activityParticipants as Participant[]);
  }

  // Activity Templates
  async getActivityTemplates(): Promise<ApiResponse<typeof activityTemplatesData>> {
    return this.mockRequest(activityTemplatesData);
  }

  async getActivityTemplate(
    id: string
  ): Promise<ApiResponse<(typeof activityTemplatesData)[0] | null>> {
    const template = activityTemplatesData.find(t => t.id === id);
    return this.mockRequest(template ?? null);
  }
}
