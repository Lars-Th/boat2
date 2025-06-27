import type { TowingStation } from '@/types';
import type { TowingStationWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiResponse } from '@/types';
import type { HttpClient } from '../client/http-client';
import type { BaseRequestParams } from '@/types/api-parameters';
import { BaseService } from './base.service';

/**
 * TowingStation API Service for storage facility management
 *
 * Handles CRUD operations for towing stations including:
 * - Storage facility management
 * - Capacity and pricing information
 * - Working hours and services
 * - Related task assignments
 */
export class TowingStationService extends BaseService<TowingStation> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/towing-stations');
  }

  async getAll(
    params?: BaseRequestParams & RelationalParams
  ): Promise<ApiResponse<TowingStation[] | TowingStationWithRelations[]>> {
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

    return this.httpClient.get<TowingStation[] | TowingStationWithRelations[]>(
      this.endpoint,
      queryParams
    );
  }

  async getById(
    id: string,
    params?: RelationalParams
  ): Promise<ApiResponse<TowingStation | TowingStationWithRelations | null>> {
    const queryParams: Record<string, any> = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<TowingStation | TowingStationWithRelations | null>(
      `${this.endpoint}/${id}`,
      queryParams
    );
  }

  async create(
    data: Omit<TowingStation, 'TowingStationID' | 'CreatedDate' | 'UpdatedDate'>
  ): Promise<ApiResponse<TowingStation>> {
    return this.httpClient.post<TowingStation>(this.endpoint, data);
  }

  async update(
    id: string,
    data: Partial<Omit<TowingStation, 'TowingStationID' | 'CreatedDate' | 'UpdatedDate'>>
  ): Promise<ApiResponse<TowingStation>> {
    return this.httpClient.put<TowingStation>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.delete<boolean>(`${this.endpoint}/${id}`);
  }

  // TowingStation-specific methods
  async getByCity(city: string, params?: RelationalParams): Promise<ApiResponse<TowingStation[]>> {
    const queryParams: Record<string, any> = { city };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<TowingStation[]>(`${this.endpoint}/by-city`, queryParams);
  }

  async getAvailableStations(params?: RelationalParams): Promise<ApiResponse<TowingStation[]>> {
    const queryParams: Record<string, any> = { status: 'active' };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<TowingStation[]>(`${this.endpoint}/available`, queryParams);
  }

  async updateCapacity(
    id: string,
    capacityData: {
      Capacity: number;
      CurrentOccupancy: number;
    }
  ): Promise<ApiResponse<TowingStation>> {
    return this.httpClient.patch<TowingStation>(`${this.endpoint}/${id}/capacity`, capacityData);
  }

  async updatePricing(
    id: string,
    pricingData: {
      PricePerHour: number;
      PricePerDay: number;
    }
  ): Promise<ApiResponse<TowingStation>> {
    return this.httpClient.patch<TowingStation>(`${this.endpoint}/${id}/pricing`, pricingData);
  }

  async updateWorkingHours(
    id: string,
    workingHours: TowingStation['WorkingHours']
  ): Promise<ApiResponse<TowingStation>> {
    return this.httpClient.patch<TowingStation>(`${this.endpoint}/${id}/working-hours`, {
      workingHours,
    });
  }

  async updateServices(
    id: string,
    services: TowingStation['Services']
  ): Promise<ApiResponse<TowingStation>> {
    return this.httpClient.patch<TowingStation>(`${this.endpoint}/${id}/services`, { services });
  }

  async updateStatus(
    id: string,
    status: TowingStation['Status']
  ): Promise<ApiResponse<TowingStation>> {
    return this.httpClient.patch<TowingStation>(`${this.endpoint}/${id}/status`, { status });
  }

  // Get stations with capacity for new vehicles
  async getWithAvailableCapacity(
    minCapacity: number = 1,
    params?: RelationalParams
  ): Promise<ApiResponse<TowingStation[]>> {
    const queryParams: Record<string, any> = { minCapacity };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<TowingStation[]>(`${this.endpoint}/with-capacity`, queryParams);
  }

  // Get emergency available stations
  async getEmergencyAvailable(params?: RelationalParams): Promise<ApiResponse<TowingStation[]>> {
    const queryParams: Record<string, any> = { emergencyAvailable: true };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<TowingStation[]>(
      `${this.endpoint}/emergency-available`,
      queryParams
    );
  }
}
