# Database Organization & Data Management

## Overview

This prototype system uses JSON files as a mock database with a service layer
architecture designed for easy migration to a real backend. The system manages
work orders, customers, employees, time tracking, and related entities for a
service management application.

## Data Storage Structure

### Location: `src/assets/data/`

All data is stored as JSON files in the assets directory:

```bash
src/assets/data/
├── participants.json       # Customer participants/contacts
├── timeEntries.json       # Time tracking entries
├── workOrders.json        # Work orders and tasks
├── employees.json         # Employee/user data
├── customers.json         # Customer information
├── contacts.json          # Contact persons
├── machines.json          # Equipment/machines
├── tools.json            # Tools and equipment
├── activities.json       # Activities (legacy system)
├── activityTypes.json    # Activity types (legacy)
├── attendances.json      # Attendance records (legacy)
├── users.json           # System users
└── organizationSettings.json # Organization configuration
```

## Data Relationships & Schema

### Core Entities

#### 1. Work Orders (`workOrders.json`)

```typescript
interface WorkOrder {
  WorkOrderID: number; // Primary key
  WorkOrderNumber: string; // Unique identifier (e.g., "AO-2024-001")
  CustomerID: number; // Foreign key -> customers.json
  ContactPersonID?: number; // Foreign key -> contacts.json
  Title: string;
  Description?: string;
  Type: 'standard' | 'quick_field' | 'service_non_billable';
  Status: 'planning' | 'active' | 'completed' | 'on_hold';
  Priority: 'low' | 'medium' | 'high' | 'urgent';
  AssignedTo: string; // Employee name
  AssignedUserIDs: number[]; // Foreign keys -> employees.json
  EstimatedHours?: number;
  ActualHours?: number;
  HourlyRate: number;
  CreatedDate: string;
  StartDate?: string;
  DueDate?: string;
  CompletedDate?: string;
  Location: {
    Address: string;
    PostalCode: string;
    City: string;
    Country: string;
    Coordinates: { lat: number; lng: number };
  };
  AttestationStatus: 'not_applicable' | 'pending' | 'approved';
  InvoiceStatus: 'not_applicable' | 'not_ready' | 'invoiced';
  IsBillable: boolean;
  Tasks: Task[]; // Embedded task objects
}
```

#### 2. Time Entries (`timeEntries.json`)

```typescript
interface TimeEntry {
  TimeEntryID: number; // Primary key
  WorkOrderID: number; // Foreign key -> workOrders.json
  UserID: number; // Foreign key -> employees.json
  UserName: string; // Denormalized for display
  Date: string; // YYYY-MM-DD format
  StartTime: string; // HH:MM format
  EndTime: string; // HH:MM format
  Hours: number; // Calculated duration
  Description: string;
  ActivityType: string;
  Status: 'pending' | 'approved';
  CreatedDate: string; // ISO timestamp
}
```

#### 3. Employees (`employees.json`)

```typescript
interface Employee {
  id: number; // Primary key
  name: string; // Full name
  initials: string; // Display initials
  email: string;
  phone: string;
  role: string; // Job title/position
  department: string;
  weeklyCapacity: number; // Hours per week
  skills: string[]; // Array of skill tags
  active: boolean; // Employment status
}
```

#### 4. Customers (`customers.json`)

```typescript
interface Customer {
  CustomerID: number; // Primary key
  Name: string;
  ContactPerson: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  PostalCode?: string;
  City?: string;
  Country?: string;
  Notes?: string;
}
```

#### 5. Participants (`participants.json`)

```typescript
interface Participant {
  ParticipantID: number; // Primary key
  Fornamn: string; // First name
  Efternamn: string; // Last name
  Personnummer: string; // Personal ID number
  Kon: string; // Gender
  Telefon: string; // Phone
  'E-post': string; // Email
  Adress: string; // Address
  Postnummer: string; // Postal code
  Ort: string; // City
  Kartkoordinater: {
    // Map coordinates
    lat: number;
    lng: number;
  };
  Enheter: string[]; // Units/departments
  Kommentar1: string; // Comment field 1
  Kommentar2: string; // Comment field 2
  Kommentar3: string; // Comment field 3
}
```

### Relationship Mapping

#### Primary Relationships

1. **WorkOrder → Customer**: `WorkOrderID.CustomerID` → `customers.CustomerID`
2. **WorkOrder → Contact**: `WorkOrderID.ContactPersonID` → `contacts.ContactID`
3. **WorkOrder → Employee**: `WorkOrderID.AssignedUserIDs[]` → `employees.id`
4. **TimeEntry → WorkOrder**: `TimeEntry.WorkOrderID` → `workOrders.WorkOrderID`
5. **TimeEntry → Employee**: `TimeEntry.UserID` → `employees.id`

#### Computed Relationships

- **Registered Hours**: Sum of `timeEntries.Hours` where `WorkOrderID` matches
  and `Status = "approved"`
- **Work Order Progress**: `ActualHours / EstimatedHours * 100`
- **Employee Workload**: Sum of assigned work order hours per employee

## API Service Layer

### Architecture: `src/services/api/`

```bash
src/services/api/
├── index.ts      # Main API service factory
├── base.ts       # Base API client with common functionality
├── mock.ts       # Mock implementation using JSON data
└── real.ts       # Real API implementation (for backend)
```

### Service Pattern

#### 1. API Factory (`index.ts`)

```typescript
// Determines which API implementation to use
const apiService =
  import.meta.env.VITE_USE_MOCK_API === 'true'
    ? new MockApiService()
    : new RealApiService();
```

#### 2. Mock Service (`mock.ts`)

- Simulates network delays (300ms)
- Implements full CRUD operations
- Uses JSON data as source of truth
- Provides consistent API interface

#### 3. Base Service (`base.ts`)

- Common HTTP client functionality
- Error handling patterns
- Request/response interceptors
- Timeout and retry logic

### API Methods Pattern

Each entity follows consistent CRUD patterns:

```typescript
// Standard CRUD operations
async getWorkOrders(): Promise<ApiResponse<WorkOrder[]>>
async getWorkOrder(id: string): Promise<ApiResponse<WorkOrder | null>>
async createWorkOrder(data: Partial<WorkOrder>): Promise<ApiResponse<WorkOrder>>
async updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<ApiResponse<WorkOrder>>
async deleteWorkOrder(id: string): Promise<ApiResponse<boolean>>
```

## Data Computing Logic

### 1. Time Calculations

#### Registered Hours Calculation

```typescript
function getRegisteredHours(workOrderId: number): number {
  return timeEntries
    .filter(
      entry => entry.WorkOrderID === workOrderId && entry.Status === 'approved'
    )
    .reduce((total, entry) => total + entry.Hours, 0);
}
```

#### Work Order Progress

```typescript
function calculateProgress(workOrder: WorkOrder): number {
  if (!workOrder.EstimatedHours) return 0;
  return Math.min(
    ((workOrder.ActualHours || 0) / workOrder.EstimatedHours) * 100,
    100
  );
}
```

### 2. Status Logic

#### Invoice Readiness

```typescript
function isReadyForInvoicing(workOrder: WorkOrder): boolean {
  return (
    workOrder.Status === 'completed' &&
    workOrder.AttestationStatus === 'approved' &&
    workOrder.IsBillable === true &&
    workOrder.InvoiceStatus === 'not_ready'
  );
}
```

#### Attestation Readiness

```typescript
function isReadyForAttestation(workOrder: WorkOrder): boolean {
  return (
    workOrder.Status === 'completed' &&
    workOrder.AttestationStatus === 'pending' &&
    workOrder.IsBillable === true
  );
}
```

### 3. Sorting Logic

#### Default Sort Orders

- **Work Orders**: `CreatedDate DESC, Priority ASC, Status ASC`
- **Time Entries**: `Date DESC, StartTime DESC`
- **Employees**: `name ASC, department ASC`
- **Customers**: `Name ASC`

#### Priority Mapping

```typescript
const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
const statusOrder = { active: 1, planning: 2, on_hold: 3, completed: 4 };
```

## Router Integration

### Route Structure (`src/router/router.ts`)

Routes are organized by functional areas:

```typescript
// Work Order Management
/work-orders           # List all work orders
/work-orders/:id       # Work order detail view
/ready-attestation     # Work orders ready for attestation
/ready-invoicing       # Work orders ready for invoicing

// Time Management
/time-reporting        # Time entry interface
/time-summary         # Time analytics and reports

// Resource Management
/customers            # Customer management
/employees            # Employee management (via /admin/users)
/machines             # Equipment management
/tools               # Tool management
```

### Navigation Permissions

Routes include permission-based access control:

```typescript
permissions: ['H', 'A', 'SA']; // H=Handläggare, A=Administratör, SA=Systemadministratör
```

## Data Consistency Rules

### 1. Referential Integrity

- All foreign key references must exist in target tables
- Deletion of referenced entities should cascade or be prevented
- Updates to primary keys should cascade to foreign keys

### 2. Business Rules

- Work orders cannot be deleted if they have time entries
- Time entries cannot exceed 24 hours per day per employee
- Approved time entries cannot be modified
- Completed work orders cannot have new time entries

### 3. Validation Rules

- Required fields must be present
- Date formats must be consistent (ISO 8601)
- Numeric fields must be non-negative
- Email addresses must be valid format

## Migration Strategy

### Backend Transition Plan

1. **Phase 1**: Replace `MockApiService` with `RealApiService`
2. **Phase 2**: Update environment configuration
3. **Phase 3**: Implement real API endpoints matching mock interface
4. **Phase 4**: Add authentication and authorization
5. **Phase 5**: Implement real database with proper relationships

### API Contract Preservation

The mock service interface serves as the API contract:

- All method signatures must be preserved
- Response formats must remain consistent
- Error handling patterns must be maintained
- Async/await patterns must be respected

## Development Guidelines

### For AI Agents

1. **Data Access**: Always use the API service layer, never access JSON files
   directly
2. **Relationships**: Use the documented foreign key relationships for data
   joining
3. **Calculations**: Implement computed fields using the documented logic
   patterns
4. **Validation**: Follow the business rules and validation patterns
5. **Testing**: Use the mock service for development and testing
6. **Consistency**: Maintain the established patterns when adding new features

### Adding New Entities

1. Create JSON data file in `src/assets/data/`
2. Add TypeScript interface in `src/types/`
3. Implement CRUD methods in `MockApiService`
4. Add routes in `router.ts`
5. Create Vue components following established patterns
6. Update this documentation

### Performance Considerations

- Mock service includes simulated network delays
- Large datasets should implement pagination
- Complex calculations should be memoized
- Real-time updates should use WebSocket patterns (future)

## Error Handling

### API Response Format

```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}
```

### Common Error Codes

- `NOT_FOUND`: Entity does not exist
- `VALIDATION_ERROR`: Data validation failed
- `NETWORK_ERROR`: Simulated network failure
- `PERMISSION_DENIED`: Insufficient permissions
- `BUSINESS_RULE_VIOLATION`: Business logic constraint violated

This documentation provides the foundation for understanding and extending the
prototype system while maintaining consistency and preparing for backend
migration.
