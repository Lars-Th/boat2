import type { ApiResponse } from '@/types';
import type { Organization } from '@/types';
import type { HttpClient } from '@/api/client/http-client';
import { BaseService } from '@/api/services/base.service';

/**
 * Organization API Service
 *
 * This service handles all organization-related API operations including
 * CRUD operations and organization management.
 */
export class OrganizationService extends BaseService<Organization> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/organizations');
  }

  /**
   * Get all organizations (overrides BaseService method)
   */
  async getAll(): Promise<ApiResponse<Organization[]>> {
    return super.getAll();
  }

  /**
   * Get organization by ID (overrides BaseService method)
   */
  async getById(id: string): Promise<ApiResponse<Organization | null>> {
    return super.getById(id);
  }

  /**
   * Create a new organization (overrides BaseService method)
   */
  async create(organization: Partial<Organization>): Promise<ApiResponse<Organization>> {
    return super.create(organization);
  }

  /**
   * Update an existing organization (overrides BaseService method)
   */
  async update(
    id: string,
    organization: Partial<Organization>
  ): Promise<ApiResponse<Organization>> {
    return super.update(id, organization);
  }

  /**
   * Delete an organization (overrides BaseService method)
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    return super.delete(id);
  }

  /**
   * Get organization settings
   */
  async getSettings(): Promise<
    ApiResponse<{
      organizations: Organization[];
      currentOrganization: string;
      systemSettings: {
        defaultLanguage: string;
        dateFormat: string;
        timeFormat: string;
        currency: string;
        timezone: string;
      };
      permissions: {
        roles: Array<{
          id: string;
          namn: string;
          beskrivning: string;
          permissions: string[];
        }>;
        resources: string[];
        actions: string[];
      };
    }>
  > {
    return this.get('/settings');
  }

  /**
   * Update organization settings
   */
  async updateSettings(settings: {
    currentOrganization?: string;
    systemSettings?: {
      defaultLanguage?: string;
      dateFormat?: string;
      timeFormat?: string;
      currency?: string;
      timezone?: string;
    };
  }): Promise<ApiResponse<boolean>> {
    return this.put('/settings', settings);
  }
}

// Note: Default instance removed - now created via ApiConfiguration with proper HttpClient
