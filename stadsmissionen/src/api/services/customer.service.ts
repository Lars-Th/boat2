import type { Customer } from '@/types';
import type { CustomerWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiResponse } from '@/api/client/types';
import type { HttpClient } from '../client/http-client';
import type { QueryParams, RequestParams } from '../client/types';
import { BaseService } from './base.service';

/**
 * Real backend implementation for Customer API
 *
 * TODO: Replace these method stubs with actual HTTP calls
 * TODO: Implement proper error handling and validation
 * TODO: Add authentication headers to all requests
 * TODO: Handle relationship loading based on include parameters
 */
export class CustomerService extends BaseService<Customer> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/customers');
  }

  async getAll(
    params?: RequestParams & RelationalParams
  ): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> {
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

    return this.httpClient.get<Customer[] | CustomerWithRelations[]>(this.endpoint, queryParams);
  }

  async getById(
    id: string,
    params?: RelationalParams
  ): Promise<ApiResponse<Customer | CustomerWithRelations | null>> {
    const queryParams: QueryParams = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Customer | CustomerWithRelations | null>(
      `${this.endpoint}/${id}`,
      queryParams
    );
  }

  async create(data: Omit<Customer, 'CustomerID' | 'CreatedDate'>): Promise<ApiResponse<Customer>> {
    return this.httpClient.post<Customer>(this.endpoint, data);
  }

  async update(
    id: string,
    data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>
  ): Promise<ApiResponse<Customer>> {
    return this.httpClient.put<Customer>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.delete<boolean>(`${this.endpoint}/${id}`);
  }
}

/**
 * Data Model Specification for Backend Implementation
 *
 * The Customer entity must match this exact structure:
 *
 * {
 *   "CustomerID": 1,                    // Auto-generated integer, never null
 *   "CustomerNumber": "K001",           // Required string, max 255 characters, unique
 *   "CompanyName": "Acme AB",           // Required string, max 255 characters
 *   "OrganizationNumber": "556123-4567", // Required string, Swedish org number format
 *   "Phone": "08-123 45 67",            // Required string, max 50 characters
 *   "Email": "anna@acme.se",            // Required string, valid email format
 *   "Address": "Storgatan 12",          // Required string, max 255 characters
 *   "PostalCode": "111 22",             // Required string, max 10 characters
 *   "City": "Stockholm",                // Required string, max 100 characters
 *   "Country": "Sverige",               // Required string, max 100 characters
 *   "InvoiceAddress": {                 // Required object or null
 *     "Address": "Box 123",             // Required if InvoiceAddress not null
 *     "PostalCode": "111 22",           // Required if InvoiceAddress not null
 *     "City": "Stockholm"               // Required if InvoiceAddress not null
 *   },
 *   "PaymentTerms": 30,                 // Required integer, days (1-365)
 *   "VATNumber": "SE556123456701",      // Required string, valid VAT format
 *   "Status": "active",                 // Required enum: "active" | "inactive"
 *   "CreatedDate": "2024-01-01",        // Auto-generated ISO date string
 *   "Notes": "Stor kund med regelbundna uppdrag" // Optional string, max 1000 characters
 * }
 *
 * Required Field Validation:
 * - CustomerID: Auto-generated integer, never null
 * - CustomerNumber: Required, unique, max 255 chars
 * - CompanyName: Required, max 255 chars
 * - OrganizationNumber: Required, Swedish format (XXXXXX-XXXX)
 * - Phone: Required, max 50 chars
 * - Email: Required, valid email format
 * - Address: Required, max 255 chars
 * - PostalCode: Required, max 10 chars
 * - City: Required, max 100 chars
 * - Country: Required, max 100 chars
 * - PaymentTerms: Required, integer 1-365
 * - VATNumber: Required, valid Swedish VAT format
 * - Status: Required, must be "active" or "inactive"
 * - CreatedDate: Auto-generated, ISO date string
 *
 * Optional Fields:
 * - Notes: Can be empty string or null, max 1000 chars
 * - InvoiceAddress: Can be null if same as main address
 *
 * Relationship Loading:
 * When include=contacts parameter is provided:
 * - Load all Contact records where Contact.CustomerID = Customer.CustomerID
 * - Include as "contacts" array in response
 * - Compute "primaryContact" as the contact where IsPrimary = true
 *
 * When include=workOrders parameter is provided:
 * - Load all WorkOrder records where WorkOrder.CustomerID = Customer.CustomerID
 * - Include as "workOrders" array in response
 * - Compute "totalWorkOrders" as count of all work orders
 * - Compute "activeWorkOrders" as count of work orders with Status in ['active', 'in_progress', 'pending']
 *
 * Error Handling:
 * All endpoints must return consistent error format:
 * {
 *   "data": null,
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR" | "NOT_FOUND" | "DEPENDENCY_ERROR" | "NETWORK_ERROR",
 *     "message": "Detailed error description"
 *   }
 * }
 */
