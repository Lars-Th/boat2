import type { ApiResponse } from '@/types';
import type { Organization } from '@/types';

/**
 * Organization API Service
 *
 * This service handles all organization-related API operations including
 * CRUD operations and organization management.
 */
export class OrganizationService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all organizations
   */
  async getAll(): Promise<ApiResponse<Organization[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as Organization[];

      return {
        data,
        success: true,
        message: 'Organizations retrieved successfully',
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch organizations',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<ApiResponse<Organization | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            data: null,
            success: true,
            message: 'Organization not found',
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as Organization;

      return {
        data,
        success: true,
        message: 'Organization retrieved successfully',
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch organization',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Create a new organization
   */
  async create(organization: Partial<Organization>): Promise<ApiResponse<Organization>> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organization),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as Organization;

      return {
        data,
        success: true,
        message: 'Organization created successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as Organization,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create organization',
          code: 'CREATE_ERROR',
        },
      };
    }
  }

  /**
   * Update an existing organization
   */
  async update(
    id: string,
    organization: Partial<Organization>
  ): Promise<ApiResponse<Organization>> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(organization),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as Organization;

      return {
        data,
        success: true,
        message: 'Organization updated successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as Organization,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update organization',
          code: 'UPDATE_ERROR',
        },
      };
    }
  }

  /**
   * Delete an organization
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        data: true,
        success: true,
        message: 'Organization deleted successfully',
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete organization',
          code: 'DELETE_ERROR',
        },
      };
    }
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
    try {
      const response = await fetch(`${this.baseUrl}/organizations/settings`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
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
      };

      return {
        data,
        success: true,
        message: 'Organization settings retrieved successfully',
      };
    } catch (error) {
      return {
        data: {
          organizations: [],
          currentOrganization: '',
          systemSettings: {
            defaultLanguage: 'sv',
            dateFormat: 'YYYY-MM-DD',
            timeFormat: '24h',
            currency: 'SEK',
            timezone: 'Europe/Stockholm',
          },
          permissions: {
            roles: [],
            resources: [],
            actions: [],
          },
        },
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch organization settings',
          code: 'FETCH_ERROR',
        },
      };
    }
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
    try {
      const response = await fetch(`${this.baseUrl}/organizations/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        data: true,
        success: true,
        message: 'Organization settings updated successfully',
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to update organization settings',
          code: 'UPDATE_ERROR',
        },
      };
    }
  }
}

// Export a default instance
export const organizationService = new OrganizationService();
