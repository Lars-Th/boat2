import type { Task } from '@/types';
import type { TaskWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiResponse } from '@/types';
import type { HttpClient } from '../client/http-client';
import type { TaskApiParams } from '@/types/api-parameters';
import { BaseService } from './base.service';

/**
 * Task API Service for towing operations
 *
 * Handles CRUD operations for towing tasks including:
 * - Task management (create, read, update, delete)
 * - Car relationship loading
 * - Towing station associations
 * - Payment and completion tracking
 */
export class TaskService extends BaseService<Task> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/tasks');
  }

  async getAll(
    params?: TaskApiParams & RelationalParams
  ): Promise<ApiResponse<Task[] | TaskWithRelations[]>> {
    const queryParams: Record<string, any> = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    // Standard pagination and filtering
    if (params?.page) queryParams['page'] = params.page;
    if (params?.pageSize) queryParams['pageSize'] = params.pageSize;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.sort) queryParams['sort'] = params.sort;
    if (params?.order) queryParams['order'] = params.order;
    if (params?.filters) Object.assign(queryParams, params.filters);

    // Task-specific filters
    if (params?.status) queryParams['status'] = params.status;
    if (params?.priority) queryParams['priority'] = params.priority;
    if (params?.type) queryParams['type'] = params.type;
    if (params?.carId) queryParams['carId'] = params.carId;
    if (params?.towingStationId) queryParams['towingStationId'] = params.towingStationId;

    if (params?.dateRange) {
      queryParams['dateStart'] = params.dateRange.start;
      queryParams['dateEnd'] = params.dateRange.end;
    }

    return this.httpClient.get<Task[] | TaskWithRelations[]>(this.endpoint, queryParams);
  }

  async getById(
    id: string,
    params?: RelationalParams
  ): Promise<ApiResponse<Task | TaskWithRelations | null>> {
    const queryParams: Record<string, any> = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Task | TaskWithRelations | null>(
      `${this.endpoint}/${id}`,
      queryParams
    );
  }

  async create(
    data: Omit<Task, 'TaskID' | 'CreatedDate' | 'UpdatedDate'>
  ): Promise<ApiResponse<Task>> {
    return this.httpClient.post<Task>(this.endpoint, data);
  }

  async update(
    id: string,
    data: Partial<Omit<Task, 'TaskID' | 'CreatedDate' | 'UpdatedDate'>>
  ): Promise<ApiResponse<Task>> {
    return this.httpClient.put<Task>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.delete<boolean>(`${this.endpoint}/${id}`);
  }

  // Task-specific methods
  async completeTask(
    id: string,
    completionData: {
      CompletedDate: string;
      TotalCost: number;
      Notes?: string;
    }
  ): Promise<ApiResponse<Task>> {
    return this.httpClient.patch<Task>(`${this.endpoint}/${id}/complete`, completionData);
  }

  async releaseTask(
    id: string,
    releaseData: {
      ReleasedDate: string;
      ReleaseAuthorizedBy: string;
      TowDurationHours: number;
      Notes?: string;
    }
  ): Promise<ApiResponse<Task>> {
    return this.httpClient.patch<Task>(`${this.endpoint}/${id}/release`, releaseData);
  }

  async updatePayment(
    id: string,
    paymentData: {
      PaidAmount: number;
      PaymentStatus: 'pending' | 'paid' | 'overdue' | 'hold';
      PaymentDate?: string;
      PaymentMethod?: string;
    }
  ): Promise<ApiResponse<Task>> {
    return this.httpClient.patch<Task>(`${this.endpoint}/${id}/payment`, paymentData);
  }

  // Get tasks by status
  async getByStatus(
    status: Task['Status'],
    params?: RelationalParams
  ): Promise<ApiResponse<Task[]>> {
    const queryParams: Record<string, any> = { status };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Task[]>(this.endpoint, queryParams);
  }

  // Get tasks by car
  async getByCarId(carId: number, params?: RelationalParams): Promise<ApiResponse<Task[]>> {
    const queryParams: Record<string, any> = { carId };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Task[]>(this.endpoint, queryParams);
  }
}
