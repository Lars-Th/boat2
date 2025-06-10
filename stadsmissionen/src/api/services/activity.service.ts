import type { Activity } from '@/types';
import type { ApiResponse, QueryParams } from '../client/types';
import type { HttpClient } from '../client/http-client';
import { BaseService } from '@/api/services/base.service';

export class ActivityService extends BaseService<Activity> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/activities');
  }

  // Domain-specific methods
  async getByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Activity[]>> {
    const params: QueryParams = { startDate, endDate };
    return this.get<Activity[]>(`${this.endpoint}/date-range`, params);
  }

  async getByType(typeId: number): Promise<ApiResponse<Activity[]>> {
    return this.get<Activity[]>(`${this.endpoint}/by-type/${typeId}`);
  }

  async getUpcoming(limit = 10): Promise<ApiResponse<Activity[]>> {
    const params: QueryParams = { limit };
    return this.get<Activity[]>(`${this.endpoint}/upcoming`, params);
  }

  async getByLocation(location: string): Promise<ApiResponse<Activity[]>> {
    const params: QueryParams = { location };
    return this.get<Activity[]>(`${this.endpoint}/by-location`, params);
  }

  async duplicate(id: string): Promise<ApiResponse<Activity>> {
    return this.post<Activity>(`${this.endpoint}/${id}/duplicate`);
  }

  async cancel(id: string, reason?: string): Promise<ApiResponse<Activity>> {
    return this.patch<Activity>(`${this.endpoint}/${id}/cancel`, { reason });
  }

  async activate(id: string): Promise<ApiResponse<Activity>> {
    return this.patch<Activity>(`${this.endpoint}/${id}/activate`);
  }
}
