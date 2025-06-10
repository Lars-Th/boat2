import type { Attendance } from '@/types';
import type { ApiResponse, QueryParams } from '../client/types';
import type { HttpClient } from '@/api/client/http-client';
import { BaseService } from '@/api/services/base.service';

export class AttendanceService extends BaseService<Attendance> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/attendances');
  }

  // Domain-specific methods
  async getByActivityId(activityId: string): Promise<ApiResponse<Attendance[]>> {
    return this.get<Attendance[]>(`/activities/${activityId}/attendances`);
  }

  async getByParticipantId(participantId: string): Promise<ApiResponse<Attendance[]>> {
    return this.get<Attendance[]>(`/participants/${participantId}/attendances`);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Attendance[]>> {
    const params: QueryParams = { startDate, endDate };
    return this.get<Attendance[]>(`${this.endpoint}/date-range`, params);
  }

  async markAttendance(
    activityId: string,
    participantId: string,
    present: boolean,
    notes?: string
  ): Promise<ApiResponse<Attendance>> {
    return this.post<Attendance>(`${this.endpoint}/mark`, {
      activityId,
      participantId,
      present,
      notes,
    });
  }

  async bulkMarkAttendance(
    activityId: string,
    attendances: Array<{
      participantId: string;
      present: boolean;
      notes?: string;
    }>
  ): Promise<ApiResponse<Attendance[]>> {
    return this.post<Attendance[]>(`${this.endpoint}/bulk-mark`, {
      activityId,
      attendances,
    });
  }

  async getStatistics(activityId?: string): Promise<
    ApiResponse<{
      totalAttendances: number;
      presentCount: number;
      absentCount: number;
      attendanceRate: number;
    }>
  > {
    const params: QueryParams = activityId ? { activityId } : {};
    return this.get(`${this.endpoint}/statistics`, params);
  }
}
