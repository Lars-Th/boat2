# API Implementation Standardization Guide

## Overview

This document provides a standardized approach for implementing API entities with proper type definitions, relationship management, and backend preparation. This guide ensures consistency across all entity implementations while maintaining current functionality and preparing for smooth backend transitions.

## Core Principles

1. **Type-JSON Alignment**: TypeScript interfaces must exactly match JSON data structure
2. **Relationship Consistency**: All entity relationships follow the same patterns and conventions
3. **Mock-to-Backend Transition**: Mock implementations provide clear specifications for backend development
4. **Functionality Preservation**: All improvements maintain existing user functionality
5. **Documentation Clarity**: Clear specifications enable easy debugging and backend implementation
6. **Service Architecture**: Consistent service layer patterns using BaseService and proper HTTP client integration

## Service and Controller Architecture

### Service Layer Structure

Our API architecture follows a layered approach with clear separation of concerns:

```
src/api/
├── client/           # HTTP client and type definitions
├── config/           # API configuration and service initialization
├── services/         # Individual entity services
├── mocks/           # Mock data services for development
└── index.ts         # Main API controller with environment switching
```

### BaseService Pattern

All real backend services extend `BaseService<T>` for consistency:

```typescript
// src/api/services/base.service.ts
export abstract class BaseService<T> {
  protected httpClient: HttpClient;
  protected endpoint: string;

  constructor(httpClient: HttpClient, endpoint: string) {
    this.httpClient = httpClient;
    this.endpoint = endpoint;
  }

  // Standard CRUD operations
  async getAll(params?: RequestParams): Promise<ApiResponse<T[]>>
  async getById(id: string): Promise<ApiResponse<T | null>>
  async create(data: Partial<T>): Promise<ApiResponse<T>>
  async update(id: string, data: Partial<T>): Promise<ApiResponse<T>>
  async delete(id: string): Promise<ApiResponse<boolean>>

  // Protected helper methods for custom endpoints
  protected async get<TResult>(endpoint: string, params?: QueryParams): Promise<ApiResponse<TResult>>
  protected async post<TResult>(endpoint: string, data?: unknown): Promise<ApiResponse<TResult>>
  // ... other HTTP methods
}
```

### Individual Service Implementation

Each entity service extends BaseService and adds relationship loading:

```typescript
// Example: src/api/services/customer.service.ts
import type { Customer } from '@/types';
import type { CustomerWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiResponse } from '@/api/client/types';
import type { HttpClient } from '../client/http-client';
import type { QueryParams, RequestParams } from '../client/types';
import { BaseService } from './base.service';

export class CustomerService extends BaseService<Customer> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/customers'); // Sets endpoint
  }

  // Override getAll to support relationship loading
  async getAll(params?: RequestParams & RelationalParams): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> {
    const queryParams: QueryParams = {};

    // Handle relationship includes
    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    // Handle standard request parameters
    if (params?.page) queryParams['page'] = params.page;
    if (params?.pageSize) queryParams['pageSize'] = params.pageSize;
    if (params?.search) queryParams['search'] = params.search;
    if (params?.sort) queryParams['sort'] = params.sort;
    if (params?.order) queryParams['order'] = params.order;
    if (params?.filters) Object.assign(queryParams, params.filters);

    return this.httpClient.get<Customer[] | CustomerWithRelations[]>(this.endpoint, queryParams);
  }

  // Override getById to support relationship loading
  async getById(id: string, params?: RelationalParams): Promise<ApiResponse<Customer | CustomerWithRelations | null>> {
    const queryParams: QueryParams = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Customer | CustomerWithRelations | null>(`${this.endpoint}/${id}`, queryParams);
  }

  // Use inherited create, update, delete methods or override if needed
  async create(data: Omit<Customer, 'CustomerID' | 'CreatedDate'>): Promise<ApiResponse<Customer>> {
    return this.httpClient.post<Customer>(this.endpoint, data);
  }

  async update(id: string, data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>): Promise<ApiResponse<Customer>> {
    return this.httpClient.put<Customer>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.delete<boolean>(`${this.endpoint}/${id}`);
  }
}
```

### Service Registration and Configuration

Services are registered in the ApiConfiguration class:

```typescript
// src/api/config/api-config.ts
import { HttpClient } from '../client/http-client';
import {
  ActivityService,
  ActivityTypeService,
  AttendanceService,
  AuthService,
  ParticipantService,
  CustomerService,    // Add new services here
  ContactService,     // Add new services here
} from '../services';

export class ApiConfiguration {
  private httpClient: HttpClient;

  // Declare public service instances
  public readonly activities: ActivityService;
  public readonly activityTypes: ActivityTypeService;
  public readonly attendances: AttendanceService;
  public readonly participants: ParticipantService;
  public readonly auth: AuthService;
  public readonly customers: CustomerService;     // Add new services here
  public readonly contacts: ContactService;       // Add new services here

  constructor(baseURL?: string) {
    this.httpClient = new HttpClient({
      baseURL: baseURL ?? (import.meta.env['VITE_API_BASE_URL'] as string) ?? '/api',
    });

    // Initialize all services with shared HTTP client
    this.activities = new ActivityService(this.httpClient);
    this.activityTypes = new ActivityTypeService(this.httpClient);
    this.attendances = new AttendanceService(this.httpClient);
    this.participants = new ParticipantService(this.httpClient);
    this.auth = new AuthService(this.httpClient);
    this.customers = new CustomerService(this.httpClient);    // Add new services here
    this.contacts = new ContactService(this.httpClient);      // Add new services here
  }

  // Configuration methods
  setBaseURL(baseURL: string): void {
    this.httpClient.setBaseURL(baseURL);
  }

  setTimeout(timeout: number): void {
    this.httpClient.setTimeout(timeout);
  }

  setCustomHeader(key: string, value: string): void {
    this.httpClient.setHeader(key, value);
  }

  removeCustomHeader(key: string): void {
    this.httpClient.removeHeader(key);
  }
}
```

### Service Export Registration

All services must be exported from the services index:

```typescript
// src/api/services/index.ts
// Export base service
export { BaseService } from '@/api/services/base.service';

// Export all domain services
export { ActivityService } from '@/api/services/activity.service';
export { ActivityTypeService } from '@/api/services/activity-type.service';
export { AttendanceService } from '@/api/services/attendance.service';
export { ParticipantService } from '@/api/services/participant.service';
export { AuthService } from '@/api/services/auth.service';
export { CustomerService } from '@/api/services/customer.service';    // Add new services here
export { ContactService } from '@/api/services/contact.service';      // Add new services here
```

### Main API Controller Pattern

The main API controller (`src/api/index.ts`) provides environment-based switching between mock and real APIs:

```typescript
// Environment-based API service selection
const USE_MOCK_API = import.meta.env['VITE_USE_MOCK_API'] === 'true' || import.meta.env.DEV;

// Create the main API service instance
const apiService = USE_MOCK_API ? new MockDataService() : new ApiConfiguration();

// Clean, domain-focused API interface
export const api = {
  customers: {
    // Specify exact return types for each method
    getAll: (params?: RequestParams & RelationalParams): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomers(params)
        : (apiService as ApiConfiguration).customers.getAll(params),

    getById: (id: string, params?: RelationalParams): Promise<ApiResponse<Customer | CustomerWithRelations | null>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomer(id, params)
        : (apiService as ApiConfiguration).customers.getById(id, params),

    create: (data: Omit<Customer, 'CustomerID' | 'CreatedDate'>): Promise<ApiResponse<Customer>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).createCustomer(data)
        : (apiService as ApiConfiguration).customers.create(data),

    update: (id: string, data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>): Promise<ApiResponse<Customer>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateCustomer(id, data)
        : (apiService as ApiConfiguration).customers.update(id, data),

    delete: (id: string): Promise<ApiResponse<boolean>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteCustomer(id)
        : (apiService as ApiConfiguration).customers.delete(id),
  },

  // Add other entities following the same pattern...
};
```

### Backend Implementation Documentation in Services

Each service should include comprehensive backend documentation:

```typescript
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
 *   // ... complete field specifications
 * }
 *
 * Required Field Validation:
 * - CustomerID: Auto-generated integer, never null
 * - CustomerNumber: Required, unique, max 255 chars
 * - CompanyName: Required, max 255 chars
 * // ... validation rules for all fields
 *
 * Relationship Loading:
 * When include=contacts parameter is provided:
 * - Load all Contact records where Contact.CustomerID = Customer.CustomerID
 * - Include as "contacts" array in response
 * - Compute "primaryContact" as the contact where IsPrimary = true
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
```

## Current Implementation Patterns

### Typical Issues Found
- **Type Misalignment**: TypeScript interfaces use different naming conventions than JSON data
- **Missing Relationship Types**: Enhanced types with relationships are incomplete or missing
- **Generic Return Types**: Mock services return `any[]` instead of properly typed responses
- **Unclear Backend Requirements**: Real API implementation lacks clear specifications
- **Service Architecture Inconsistency**: Services don't follow standardized patterns
- **Missing Controller Integration**: Services not properly integrated into main API controller

## Standardization Process

## Phase 1: Type System Alignment

### Objective
Ensure TypeScript interfaces exactly match the JSON data structure for all entities.

### Core Entity Type Definition

#### Step 1.1: Analyze JSON Structure
For each entity, examine the actual JSON data files in `src/assets/data/`:

```json
// Example: customers.json
{
  "CustomerID": 1,
  "CustomerNumber": "K001",
  "CompanyName": "Acme AB",
  "Status": "active",
  "CreatedDate": "2024-01-01"
}
```

#### Step 1.2: Create Matching TypeScript Interface
Update `src/types/index.ts` to match JSON exactly:

```typescript
export interface Customer {
  CustomerID: number;           // Matches JSON: "CustomerID"
  CustomerNumber: string;       // Matches JSON: "CustomerNumber"
  CompanyName: string;          // Matches JSON: "CompanyName"
  OrganizationNumber: string;   // Required field
  Phone: string;                // Required field
  Email: string;                // Required field
  Address: string;              // Required field
  PostalCode: string;           // Required field
  City: string;                 // Required field
  Country: string;              // Required field
  InvoiceAddress: {             // Nested object structure
    Address: string;
    PostalCode: string;
    City: string;
  };
  PaymentTerms: number;         // Required field
  VATNumber: string;            // Required field
  Status: 'active' | 'inactive'; // Enum type for validation
  CreatedDate: string;          // Required field
  Notes: string;                // Required field
}
```

#### Step 1.3: Handle Required vs Optional Fields
Analyze the JSON data to determine which fields are consistently present:

```typescript
export interface Customer {
  // Always present in JSON - required fields
  CustomerID: number;
  CompanyName: string;
  Status: 'active' | 'inactive';
  CreatedDate: string;

  // May be missing in some records - optional fields
  Phone?: string;
  Email?: string;
  Notes?: string;

  // Complex validation - conditional requirements
  InvoiceAddress: {
    Address: string;
    PostalCode: string;
    City: string;
  } | null; // Can be null in some cases
}
```

### Enhanced Relationship Types

#### Step 1.4: Define Relationship-Enhanced Interfaces
Update `src/types/enhanced.ts` or `src/types/relationships.ts`:

```typescript
export interface CustomerWithRelations extends Customer {
  // Resolved relationships - always optional since they're loaded conditionally
  contacts?: ContactWithRelations[];
  workOrders?: WorkOrderWithRelations[];

  // Computed fields from relationships
  primaryContact?: ContactWithRelations;
  totalWorkOrders?: number;
  activeWorkOrders?: number;
}

export interface ContactWithRelations extends Contact {
  // Parent relationship
  customer?: CustomerWithRelations;

  // Related entities
  workOrders?: WorkOrderWithRelations[];

  // Computed fields
  fullName?: string; // Computed from FirstName + LastName
}
```

#### Step 1.5: Update Relationship Configuration
Ensure `src/config/relationships.ts` matches the enhanced types:

```typescript
export const customerRelationships: RelationshipConfig<
  Customer,
  {
    contacts: ContactWithRelations[];
    workOrders: WorkOrderWithRelations[];
  }
> = {
  relationships: {
    contacts: {
      type: 'hasMany',
      foreignKey: 'CustomerID',        // Field in contacts table
      targetEntity: 'contacts',        // Target data source
      targetKey: 'CustomerID',         // Matching field in target
      cache: true,
      eager: true,                     // Load by default
    },
    workOrders: {
      type: 'hasMany',
      foreignKey: 'CustomerID',
      targetEntity: 'workOrders',
      targetKey: 'CustomerID',
      cache: false,                    // Don't cache (changes frequently)
      eager: false,                    // Load only when requested
    },
  },
};
```

---

## Phase 2: Mock API Service Updates

### Objective
Update mock services to return properly typed data and handle relationships correctly.

#### Step 2.1: Update Method Signatures
Replace generic types with specific entity types in `src/api/mocks/mock-data.service.ts`:

```typescript
// Before: Generic and unclear
async getCustomers(params?: RelationalParams): Promise<ApiResponse<any[]>>

// After: Specific and type-safe
async getCustomers(
  params?: RelationalParams
): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> {
  const customers = customersData as Customer[];

  if (!params?.include || params.include.length === 0) {
    return this.mockRequest(customers);
  }

  // Handle relationship loading
  const enhancedCustomers = customers.map(customer => {
    const enhanced: CustomerWithRelations = { ...customer };

    if (params.include?.includes('contacts')) {
      const customerContacts = contactsData.filter(
        c => c.CustomerID === customer.CustomerID
      ) as Contact[];
      enhanced.contacts = customerContacts as ContactWithRelations[];

      // Add computed field
      enhanced.primaryContact = customerContacts.find(c => c.IsPrimary === true) as ContactWithRelations;
    }

    if (params.include?.includes('workOrders')) {
      const customerWorkOrders = workOrdersData.filter(
        wo => wo.CustomerID === customer.CustomerID
      );
      enhanced.workOrders = customerWorkOrders as WorkOrderWithRelations[];

      // Add computed fields
      enhanced.totalWorkOrders = customerWorkOrders.length;
      enhanced.activeWorkOrders = customerWorkOrders.filter(wo => wo.Status === 'active').length;
    }

    return enhanced;
  });

  return this.mockRequest(enhancedCustomers);
}
```

#### Step 2.2: Implement Consistent Relationship Loading
Create a standardized pattern for relationship resolution:

```typescript
private enhanceEntityWithRelations<T, R>(
  entity: T,
  relationshipConfig: RelationshipConfig<T, R>,
  includeParams: string[],
  allData: { [key: string]: any[] }
): T & Partial<R> {
  const enhanced = { ...entity } as T & Partial<R>;

  for (const relationName of includeParams) {
    const relation = relationshipConfig.relationships[relationName];
    if (!relation) continue;

    const targetData = allData[relation.targetEntity];
    if (!targetData) continue;

    switch (relation.type) {
      case 'hasMany':
        enhanced[relationName] = targetData.filter(
          item => item[relation.targetKey] === entity[relation.foreignKey]
        );
        break;

      case 'belongsTo':
        enhanced[relationName] = targetData.find(
          item => item[relation.targetKey] === entity[relation.foreignKey]
        );
        break;

      case 'manyToMany':
        // Handle array of IDs or junction table
        const ids = entity[relation.foreignKey] as number[];
        enhanced[relationName] = targetData.filter(
          item => ids.includes(item[relation.targetKey])
        );
        break;
    }
  }

  return enhanced;
}
```

#### Step 2.3: Add Computed Field Generation
Implement consistent computed field patterns:

```typescript
private addComputedFields(entity: CustomerWithRelations): CustomerWithRelations {
  // Add full name for contacts
  if (entity.contacts) {
    entity.contacts = entity.contacts.map(contact => ({
      ...contact,
      fullName: `${contact.FirstName} ${contact.LastName}`.trim()
    }));

    // Find primary contact
    entity.primaryContact = entity.contacts.find(c => c.IsPrimary === true);
  }

  // Add work order statistics
  if (entity.workOrders) {
    entity.totalWorkOrders = entity.workOrders.length;
    entity.activeWorkOrders = entity.workOrders.filter(wo => wo.Status === 'active').length;
  }

  return entity;
}
```

---

## Phase 3: Real Backend Service Implementation

### Objective
Create real HTTP-based services that extend BaseService and integrate with the ApiConfiguration.

#### Step 3.1: Create Individual Service Class
Create a new service file in `src/api/services/`:

```typescript
// src/api/services/customer.service.ts
import type { Customer } from '@/types';
import type { CustomerWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';
import type { ApiResponse } from '@/api/client/types';
import type { HttpClient } from '../client/http-client';
import type { QueryParams, RequestParams } from '../client/types';
import { BaseService } from './base.service';

export class CustomerService extends BaseService<Customer> {
  constructor(httpClient: HttpClient) {
    super(httpClient, '/customers');
  }

  async getAll(params?: RequestParams & RelationalParams): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> {
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

  async getById(id: string, params?: RelationalParams): Promise<ApiResponse<Customer | CustomerWithRelations | null>> {
    const queryParams: QueryParams = {};

    if (params?.include && params.include.length > 0) {
      queryParams['include'] = params.include.join(',');
    }

    return this.httpClient.get<Customer | CustomerWithRelations | null>(`${this.endpoint}/${id}`, queryParams);
  }

  async create(data: Omit<Customer, 'CustomerID' | 'CreatedDate'>): Promise<ApiResponse<Customer>> {
    return this.httpClient.post<Customer>(this.endpoint, data);
  }

  async update(id: string, data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>): Promise<ApiResponse<Customer>> {
    return this.httpClient.put<Customer>(`${this.endpoint}/${id}`, data);
  }

  async delete(id: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.delete<boolean>(`${this.endpoint}/${id}`);
  }
}
```

#### Step 3.2: Register Service in Index
Add the service export to `src/api/services/index.ts`:

```typescript
export { CustomerService } from '@/api/services/customer.service';
```

#### Step 3.3: Add Service to ApiConfiguration
Update `src/api/config/api-config.ts`:

```typescript
import {
  // ... existing services
  CustomerService,
} from '../services';

export class ApiConfiguration {
  // ... existing properties
  public readonly customers: CustomerService;

  constructor(baseURL?: string) {
    // ... existing initialization
    this.customers = new CustomerService(this.httpClient);
  }
}
```

#### Step 3.4: Update Main API Controller
Update `src/api/index.ts` to use the real service:

```typescript
export const api = {
  customers: {
    getAll: (params?: RequestParams & RelationalParams): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomers(params)
        : (apiService as ApiConfiguration).customers.getAll(params),

    getById: (id: string, params?: RelationalParams): Promise<ApiResponse<Customer | CustomerWithRelations | null>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomer(id, params)
        : (apiService as ApiConfiguration).customers.getById(id, params),

    // ... other methods
  },
};
```

---

## Phase 4: API Service Layer Updates

### Objective
Update the main API service to use proper types and prepare for backend transition.

#### Step 4.1: Update API Service Types
In `src/api/index.ts`, replace generic types with specific entity types:

```typescript
// Import proper types
import type { Customer, Contact } from '@/types';
import type { CustomerWithRelations, ContactWithRelations } from '@/types/relationships';
import type { RelationalParams } from '@/types/enhanced';

export const api = {
  customers: {
    // Specify exact return types for each method
    getAll: (params?: RequestParams & RelationalParams): Promise<ApiResponse<Customer[] | CustomerWithRelations[]>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomers(params)
        : (apiService as ApiConfiguration).customers.getAll(params),

    getById: (id: string, params?: RelationalParams): Promise<ApiResponse<Customer | CustomerWithRelations | null>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).getCustomer(id, params)
        : (apiService as ApiConfiguration).customers.getById(id, params),

    create: (data: Omit<Customer, 'CustomerID' | 'CreatedDate'>): Promise<ApiResponse<Customer>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).createCustomer(data)
        : (apiService as ApiConfiguration).customers.create(data),

    update: (id: string, data: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>): Promise<ApiResponse<Customer>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateCustomer(id, data)
        : (apiService as ApiConfiguration).customers.update(id, data),

    delete: (id: string): Promise<ApiResponse<boolean>> =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteCustomer(id)
        : (apiService as ApiConfiguration).customers.delete(id),
  },
};
```

#### Step 4.2: Document Backend Requirements
For each entity, clearly document what the real backend needs to implement:

```typescript
// Backend Implementation Notes for customers endpoints:
//
// GET /api/customers
// - Support query parameters: ?include=contacts,workOrders&page=1&limit=25&search=term
// - Return: { data: Customer[] | CustomerWithRelations[], success: boolean, message?: string }
// - When include=contacts: resolve Customer.contacts[] relationship
// - When include=workOrders: resolve Customer.workOrders[] relationship
//
// GET /api/customers/:id
// - Support query parameters: ?include=contacts,workOrders
// - Return: { data: Customer | CustomerWithRelations | null, success: boolean, message?: string }
// - Return null if customer not found
//
// POST /api/customers
// - Accept: Omit<Customer, 'CustomerID' | 'CreatedDate'>
// - Auto-generate: CustomerID (increment), CreatedDate (current timestamp)
// - Validate: All required fields present, email format, organization number format
// - Return: { data: Customer, success: boolean, message?: string }
//
// PUT /api/customers/:id
// - Accept: Partial<Omit<Customer, 'CustomerID' | 'CreatedDate'>>
// - Preserve: CustomerID, CreatedDate (never update these)
// - Validate: Same as POST for provided fields
// - Return: { data: Customer, success: boolean, message?: string }
//
// DELETE /api/customers/:id
// - Check: No dependent records (contacts, work orders) or handle cascade
// - Return: { data: boolean, success: boolean, message?: string }
```

---

## Phase 5: View Component Updates

### Objective
Update view components to use the new typed APIs while maintaining all existing functionality.

#### Step 5.1: Update API Calls with Proper Types
In view components, specify the expected types:

```typescript
// Before: Generic and untyped
const {
  data: customers,
  loading: customersLoading,
  error: customersError,
} = useApiList(() => api.customers.getAll({ include: ['contacts', 'workOrders'] }));

// After: Properly typed
const {
  data: customers,
  loading: customersLoading,
  error: customersError,
} = useApiList<CustomerWithRelations[]>(
  () => api.customers.getAll({ include: ['contacts', 'workOrders'] }),
  {
    cacheKey: 'customers-with-relations',
  }
);

// Use computed properties to access typed data safely
const customerList = computed(() => customers.value || []);
const totalCustomers = computed(() => customerList.value.length);
const activeCustomers = computed(() =>
  customerList.value.filter(c => c.Status === 'active').length
);
```

#### Step 5.2: Handle Computed Fields Consistently
Use the computed fields provided by the enhanced types:

```typescript
// Helper functions that work with typed data
const getPrimaryContactName = (customer: CustomerWithRelations): string => {
  // Use the computed field from the enhanced type
  if (customer.primaryContact) {
    return customer.primaryContact.fullName ||
           `${customer.primaryContact.FirstName} ${customer.primaryContact.LastName}`;
  }

  // Fallback to manual search if computed field not available
  if (customer.contacts && customer.contacts.length > 0) {
    const primary = customer.contacts.find(c => c.IsPrimary === true);
    if (primary) {
      return primary.fullName || `${primary.FirstName} ${primary.LastName}`;
    }
  }

  return '-';
};

const getContactCount = (customer: CustomerWithRelations): number => {
  return customer.contacts?.length || 0;
};
```

---

## Phase 6: Backend Specification Documentation

### Objective
Create comprehensive documentation for backend developers to implement the real API.

#### Step 6.1: Create Backend API Specification
Create `docs/BackendAPISpecification.md` with detailed requirements:

```markdown
# Backend API Specification

## Customer Management Endpoints

### Data Model
The Customer entity must match this exact structure:
```json
{
  "CustomerID": 1,
  "CustomerNumber": "K001",
  "CompanyName": "Acme AB",
  "OrganizationNumber": "556123-4567",
  "Phone": "08-123 45 67",
  "Email": "anna@acme.se",
  "Address": "Storgatan 12",
  "PostalCode": "111 22",
  "City": "Stockholm",
  "Country": "Sverige",
  "InvoiceAddress": {
    "Address": "Box 123",
    "PostalCode": "111 22",
    "City": "Stockholm"
  },
  "PaymentTerms": 30,
  "VATNumber": "SE556123456701",
  "Status": "active",
  "CreatedDate": "2024-01-01",
  "Notes": "Stor kund med regelbundna uppdrag"
}
```

### Required Fields Validation
- CustomerID: Auto-generated integer, never null
- CompanyName: Required string, max 255 characters
- Status: Must be either "active" or "inactive"
- CreatedDate: Auto-generated ISO date string

### Optional Fields
- Phone, Email: Can be empty string or null
- Notes: Can be empty string or null
- InvoiceAddress: Can be null if same as main address

### Relationship Loading
When `include=contacts` parameter is provided:
- Load all Contact records where Contact.CustomerID = Customer.CustomerID
- Include as "contacts" array in response
- Compute "primaryContact" as the contact where IsPrimary = true

### Error Handling
All endpoints must return consistent error format:
```json
{
  "data": null,
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "CompanyName is required"
  }
}
```
```

#### Step 6.2: Add Comprehensive Service Documentation
Include detailed backend specifications in each service file as comments.

---

## Implementation Checklist

### For Each Entity (Customer, Contact, WorkOrder, etc.)

#### Type Definitions
- [ ] JSON data structure analyzed
- [ ] Base interface matches JSON exactly (field names, types, required/optional)
- [ ] Enhanced interface with relationships defined
- [ ] Relationship configuration updated
- [ ] Computed fields documented and implemented

#### Mock API Service
- [ ] Method signatures use proper types (no `any[]`)
- [ ] Relationship loading implemented correctly
- [ ] Computed fields generated consistently
- [ ] Error handling matches expected backend behavior
- [ ] CRUD operations maintain data consistency

#### Real Backend Service
- [ ] Service class extends BaseService<T>
- [ ] Constructor accepts HttpClient and sets endpoint
- [ ] getAll method supports RelationalParams with include functionality
- [ ] getById method supports RelationalParams with include functionality
- [ ] create, update, delete methods use proper type constraints
- [ ] Service exported from services/index.ts
- [ ] Service registered in ApiConfiguration class
- [ ] Service instance created in ApiConfiguration constructor

#### Main API Service
- [ ] Import statements include proper types
- [ ] Method signatures specify exact return types
- [ ] Backend implementation requirements documented in comments
- [ ] Mock/real API switching works correctly
- [ ] Controller methods call appropriate service methods

#### View Components
- [ ] API calls use proper type parameters
- [ ] Computed properties handle typed data safely
- [ ] Helper functions work with enhanced types
- [ ] All existing functionality preserved
- [ ] Loading and error states maintained

#### Backend Documentation
- [ ] Data model specification complete
- [ ] Required/optional fields documented
- [ ] Relationship loading requirements specified
- [ ] Error handling format documented
- [ ] Service includes comprehensive backend implementation comments

## Service Implementation Steps Summary

### 1. Create Service Class
```bash
# Create new service file
touch src/api/services/[entity].service.ts
```

### 2. Implement Service
- Extend BaseService<EntityType>
- Override methods that need relationship loading
- Add comprehensive backend documentation

### 3. Register Service
- Export from `src/api/services/index.ts`
- Add to `ApiConfiguration` class
- Initialize in constructor

### 4. Update Controller
- Add entity section to main API controller
- Implement environment switching
- Add proper type signatures

### 5. Test Integration
- Run type check: `npm run type-check`
- Test mock functionality
- Prepare for real API testing

## Validation and Testing

### Type Safety Verification
- [ ] No TypeScript compilation errors
- [ ] No `any` types in entity-related code
- [ ] IntelliSense provides accurate autocompletion
- [ ] Type errors caught at compile time

### Functionality Verification
- [ ] All existing features work unchanged
- [ ] Relationship loading works as before
- [ ] Search and filtering maintain functionality
- [ ] CRUD operations work correctly
- [ ] Error handling behaves consistently

### Backend Preparation
- [ ] Mock API provides clear specification for real implementation
- [ ] Service classes ready for HTTP implementation
- [ ] Data models match exactly between mock and expected backend
- [ ] Relationship loading requirements clearly documented
- [ ] Environment switching works correctly

## Benefits of This Approach

1. **Type Safety**: Compile-time error detection and better IDE support
2. **Debugging**: Clear type information makes debugging easier
3. **Documentation**: Self-documenting code through proper types
4. **Backend Transition**: Clear specifications for backend developers
5. **Consistency**: Standardized patterns across all entities
6. **Maintainability**: Easier to modify and extend functionality
7. **Service Architecture**: Clean separation of concerns with BaseService pattern
8. **Environment Flexibility**: Seamless switching between mock and real APIs

This standardization process ensures that all entity implementations follow consistent patterns while maintaining existing functionality and preparing for smooth backend transitions.
