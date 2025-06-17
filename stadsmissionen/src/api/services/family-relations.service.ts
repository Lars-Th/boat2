import type { ApiResponse } from '@/api/client/types';
import type { FamilyRelation } from '@/types';

/**
 * Family Relations API Service
 *
 * This service demonstrates how to implement family relations API endpoints.
 * Currently uses mock data, but can be easily adapted for real API calls.
 */
export class FamilyRelationsService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all family relations
   */
  async getAll(): Promise<ApiResponse<FamilyRelation[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/family-relations`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FamilyRelation[];

      return {
        data,
        success: true,
        message: 'Family relations retrieved successfully',
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch family relations',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Get family relations for a specific participant
   */
  async getByParticipantId(participantId: string): Promise<ApiResponse<FamilyRelation[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/family-relations/participant/${participantId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FamilyRelation[];

      return {
        data,
        success: true,
        message: 'Participant family relations retrieved successfully',
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to fetch participant family relations',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Create a new family relation
   */
  async create(relation: Partial<FamilyRelation>): Promise<ApiResponse<FamilyRelation>> {
    try {
      const response = await fetch(`${this.baseUrl}/family-relations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relation),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FamilyRelation;

      return {
        data,
        success: true,
        message: 'Family relation created successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as FamilyRelation,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create family relation',
          code: 'CREATE_ERROR',
        },
      };
    }
  }

  /**
   * Update an existing family relation
   */
  async update(
    id: string,
    relation: Partial<FamilyRelation>
  ): Promise<ApiResponse<FamilyRelation>> {
    try {
      const response = await fetch(`${this.baseUrl}/family-relations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(relation),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FamilyRelation;

      return {
        data,
        success: true,
        message: 'Family relation updated successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as FamilyRelation,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update family relation',
          code: 'UPDATE_ERROR',
        },
      };
    }
  }

  /**
   * Delete a family relation
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/family-relations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        data: true,
        success: true,
        message: 'Family relation deleted successfully',
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete family relation',
          code: 'DELETE_ERROR',
        },
      };
    }
  }

  /**
   * Get family relations by relation type
   */
  async getByType(relationType: string): Promise<ApiResponse<FamilyRelation[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/family-relations/type/${relationType}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as FamilyRelation[];

      return {
        data,
        success: true,
        message: `Family relations of type '${relationType}' retrieved successfully`,
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Failed to fetch family relations by type',
          code: 'FETCH_ERROR',
        },
      };
    }
  }
}

// Export a default instance
export const familyRelationsService = new FamilyRelationsService();
