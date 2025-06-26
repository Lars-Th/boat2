import type { ApiResponse } from '@/types';
import type { User } from '@/types';

/**
 * User API Service
 *
 * This service handles all user-related API operations including
 * CRUD operations, authentication, and user management.
 */
export class UserService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get all users
   */
  async getAll(): Promise<ApiResponse<User[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/users`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as User[];

      return {
        data,
        success: true,
        message: 'Users retrieved successfully',
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch users',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<ApiResponse<User | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            data: null,
            success: true,
            message: 'User not found',
          };
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as User;

      return {
        data,
        success: true,
        message: 'User retrieved successfully',
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch user',
          code: 'FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Create a new user
   */
  async create(user: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as User;

      return {
        data,
        success: true,
        message: 'User created successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as User,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create user',
          code: 'CREATE_ERROR',
        },
      };
    }
  }

  /**
   * Update an existing user
   */
  async update(id: string, user: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as User;

      return {
        data,
        success: true,
        message: 'User updated successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as User,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update user',
          code: 'UPDATE_ERROR',
        },
      };
    }
  }

  /**
   * Delete a user
   */
  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        data: true,
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete user',
          code: 'DELETE_ERROR',
        },
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(id: string, newPassword: string): Promise<ApiResponse<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        data: true,
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to change password',
          code: 'PASSWORD_CHANGE_ERROR',
        },
      };
    }
  }

  /**
   * Update user roles
   */
  async updateRoles(id: string, roles: string[]): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roller: roles }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as User;

      return {
        data,
        success: true,
        message: 'User roles updated successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as User,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update user roles',
          code: 'ROLES_UPDATE_ERROR',
        },
      };
    }
  }

  /**
   * Update user units
   */
  async updateUnits(id: string, units: string[]): Promise<ApiResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${id}/units`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enheter: units }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as User;

      return {
        data,
        success: true,
        message: 'User units updated successfully',
      };
    } catch (error) {
      return {
        data: null as unknown as User,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update user units',
          code: 'UNITS_UPDATE_ERROR',
        },
      };
    }
  }
}

// Export a default instance
export const userService = new UserService();
