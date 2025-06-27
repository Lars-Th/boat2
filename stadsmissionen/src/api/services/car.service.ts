import type { Car } from '@/types';
import type { CarWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiResponse } from '@/types';
import type { HttpClient } from '../client/http-client';
import type { CarApiParams } from '@/types/api-parameters';
import { BaseService } from './base.service';

/**
 * Car API Service for vehicle management
 *
 * Handles CRUD operations for vehicles including:
 * - Vehicle information management
 * - Owner information
 * - Insurance details
 * - Related task loading
 */
export class CarService extends BaseService<Car> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/cars');
  }

  async getAll(
    params?: CarApiParams & RelationalParams
  ): Promise<ApiResponse<Car[] | CarWithRelations[]>> {
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

    // Car-specific filters
    if (params?.status) queryParams['status'] = params.status;
    if (params?.brand) queryParams['brand'] = params.brand;
    if (params?.year) queryParams['year'] = params.year;
    if (params?.ownerName) queryParams['ownerName'] = params.ownerName;

    return this.httpClient.get<Car[] | CarWithRelations[]>(this.endpoint, queryParams);
  }

  async getById(
    id: string,
    params?: RelationalParams
  ): Promise<ApiResponse<Car | CarWithRelations | null>> {
    const queryParams: Record<string, any> = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Car | CarWithRelations | null>(
      `${this.endpoint}/${id}`,
      queryParams
    );
  }

  async create(
    data: Omit<Car, 'CarID' | 'CreatedDate' | 'UpdatedDate'>
  ): Promise<ApiResponse<Car>> {
    return this.httpClient.post<Car>(this.endpoint, data);
  }

  async update(
    id: string,
    data: Partial<Omit<Car, 'CarID' | 'CreatedDate' | 'UpdatedDate'>>
  ): Promise<ApiResponse<Car>> {
    return this.httpClient.put<Car>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.delete<boolean>(`${this.endpoint}/${id}`);
  }

  // Car-specific methods
  async getByLicensePlate(
    licensePlate: string,
    params?: RelationalParams
  ): Promise<ApiResponse<Car | null>> {
    const queryParams: Record<string, any> = { licensePlate };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Car | null>(`${this.endpoint}/by-license-plate`, queryParams);
  }

  async getByVIN(vin: string, params?: RelationalParams): Promise<ApiResponse<Car | null>> {
    const queryParams: Record<string, any> = { vin };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Car | null>(`${this.endpoint}/by-vin`, queryParams);
  }

  async getByOwner(ownerName: string, params?: RelationalParams): Promise<ApiResponse<Car[]>> {
    const queryParams: Record<string, any> = { ownerName };

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Car[]>(`${this.endpoint}/by-owner`, queryParams);
  }

  async updateStatus(id: string, status: Car['Status']): Promise<ApiResponse<Car>> {
    return this.httpClient.patch<Car>(`${this.endpoint}/${id}/status`, { status });
  }

  async updateOwnerInfo(
    id: string,
    ownerData: {
      OwnerName: string;
      OwnerPhone: string;
      OwnerEmail: string;
      OwnerAddress: string;
    }
  ): Promise<ApiResponse<Car>> {
    return this.httpClient.patch<Car>(`${this.endpoint}/${id}/owner`, ownerData);
  }

  async updateInsurance(
    id: string,
    insuranceData: {
      InsuranceCompany: string;
      InsurancePolicyNumber: string;
    }
  ): Promise<ApiResponse<Car>> {
    return this.httpClient.patch<Car>(`${this.endpoint}/${id}/insurance`, insuranceData);
  }
}
