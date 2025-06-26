import type { Contact } from '@/types';
import type { ContactWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiResponse } from '@/types';
import type { HttpClient } from '../client/http-client';
import type { QueryParams, RequestParams } from '@/types';
import { BaseService } from './base.service';

/**
 * Real backend implementation for Contact API
 *
 * TODO: Replace these method stubs with actual HTTP calls
 * TODO: Implement proper error handling and validation
 * TODO: Add authentication headers to all requests
 * TODO: Handle relationship loading based on include parameters
 */
export class ContactService extends BaseService<Contact> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/contacts');
  }

  async getAll(
    params?: RequestParams & RelationalParams
  ): Promise<ApiResponse<Contact[] | ContactWithRelations[]>> {
    // Convert RelationalParams to QueryParams for the HTTP client
    const queryParams: QueryParams = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    if (params?.page) queryParams['page'] = params.page;
    if (params?.pageSize) queryParams['pageSize'] = params.pageSize;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.sort) queryParams['sort'] = params.sort;
    if (params?.order) queryParams['order'] = params.order;
    if (params?.filters) Object.assign(queryParams, params.filters);

    return this.httpClient.get<Contact[] | ContactWithRelations[]>(this.endpoint, queryParams);
  }

  async getById(
    id: string,
    params?: RelationalParams
  ): Promise<ApiResponse<Contact | ContactWithRelations | null>> {
    const queryParams: QueryParams = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Contact | ContactWithRelations | null>(
      `${this.endpoint}/${id}`,
      queryParams
    );
  }

  async create(data: Omit<Contact, 'ContactID'>): Promise<ApiResponse<Contact>> {
    return this.httpClient.post<Contact>(this.endpoint, data);
  }

  async update(
    id: string,
    data: Partial<Omit<Contact, 'ContactID'>>
  ): Promise<ApiResponse<Contact>> {
    return this.httpClient.put<Contact>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.delete<boolean>(`${this.endpoint}/${id}`);
  }
}

/**
 * Data Model Specification
 *
 * The Contact entity must match this exact structure in the database:
 *
 * Table: contacts
 *
 * ContactID        INT PRIMARY KEY AUTO_INCREMENT
 * CustomerID       INT NOT NULL FOREIGN KEY REFERENCES customers(CustomerID)
 * FirstName        VARCHAR(255) NOT NULL
 * LastName         VARCHAR(255) NOT NULL
 * Title            VARCHAR(255) NOT NULL
 * Phone            VARCHAR(50) NOT NULL
 * Mobile           VARCHAR(50) NOT NULL
 * Email            VARCHAR(255) NOT NULL UNIQUE
 * Department       VARCHAR(255) NOT NULL
 * IsPrimary        BOOLEAN NOT NULL DEFAULT FALSE
 * Notes            TEXT NOT NULL DEFAULT ''
 *
 * Indexes:
 * - PRIMARY KEY (ContactID)
 * - INDEX idx_customer (CustomerID)
 * - INDEX idx_email (Email)
 * - INDEX idx_primary (CustomerID, IsPrimary) -- For primary contact constraint
 *
 * Constraints:
 * - FOREIGN KEY (CustomerID) REFERENCES customers(CustomerID) ON DELETE CASCADE
 * - UNIQUE KEY unique_primary_per_customer (CustomerID) WHERE IsPrimary = TRUE
 *   (Only one primary contact per customer)
 *
 * Relationship Loading:
 *
 * When include=customer:
 * - JOIN customers ON contacts.CustomerID = customers.CustomerID
 * - Include full customer object in response
 *
 * When include=workOrders:
 * - JOIN workOrders ON contacts.ContactID = workOrders.ContactPersonID
 * - Include array of work orders in response
 * - Compute totalWorkOrders = COUNT(workOrders.WorkOrderID)
 * - Compute activeWorkOrders = COUNT(workOrders.WorkOrderID WHERE Status IN ('in_progress', 'pending'))
 *
 * Computed Fields:
 * - fullName = CONCAT(FirstName, ' ', LastName)
 *
 * Error Handling:
 *
 * All endpoints must return consistent error format:
 * {
 *   data: null,
 *   success: false,
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "Human readable error message"
 *   }
 * }
 *
 * Common error codes:
 * - VALIDATION_ERROR: Invalid input data
 * - NOT_FOUND: Contact not found
 * - DUPLICATE_EMAIL: Email already exists
 * - CONSTRAINT_VIOLATION: Business rule violation (e.g., multiple primary contacts)
 * - FOREIGN_KEY_ERROR: Referenced customer doesn't exist
 * - DEPENDENCY_ERROR: Cannot delete due to dependent records
 */
