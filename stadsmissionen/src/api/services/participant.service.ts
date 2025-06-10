import type { Attendance, Participant } from '@/types';
import type { ApiResponse, QueryParams } from '@/api/client/types';
import type { HttpClient } from '@/api/client/http-client';
import { BaseService } from '@/api/services/base.service';

export class ParticipantService extends BaseService<Participant> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/participants');
  }

  // Domain-specific methods
  async getByActivityId(activityId: string): Promise<ApiResponse<Participant[]>> {
    return this.get<Participant[]>(`/activities/${activityId}/participants`);
  }

  async search(query: string): Promise<ApiResponse<Participant[]>> {
    const params: QueryParams = { search: query };
    return this.get<Participant[]>(`${this.endpoint}/search`, params);
  }

  async getByEmail(email: string): Promise<ApiResponse<Participant | null>> {
    const params: QueryParams = { email };
    return this.get<Participant | null>(`${this.endpoint}/by-email`, params);
  }

  async getByPhone(phone: string): Promise<ApiResponse<Participant | null>> {
    const params: QueryParams = { phone };
    return this.get<Participant | null>(`${this.endpoint}/by-phone`, params);
  }

  async getByGroup(groupId: string): Promise<ApiResponse<Participant[]>> {
    return this.get<Participant[]>(`/participant-groups/${groupId}/participants`);
  }

  async addToGroup(participantId: string, groupId: string): Promise<ApiResponse<boolean>> {
    return this.post<boolean>(`${this.endpoint}/${participantId}/groups/${groupId}`);
  }

  async removeFromGroup(participantId: string, groupId: string): Promise<ApiResponse<boolean>> {
    return this.deleteEndpoint<boolean>(`${this.endpoint}/${participantId}/groups/${groupId}`);
  }

  async getAttendanceHistory(participantId: string): Promise<ApiResponse<Attendance[]>> {
    return this.get<Attendance[]>(`${this.endpoint}/${participantId}/attendance-history`);
  }

  async activate(id: string): Promise<ApiResponse<Participant>> {
    return this.patch<Participant>(`${this.endpoint}/${id}/activate`);
  }

  async deactivate(id: string): Promise<ApiResponse<Participant>> {
    return this.patch<Participant>(`${this.endpoint}/${id}/deactivate`);
  }
}
