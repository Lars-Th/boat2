# Data Stores Documentation

This folder contains the application's state management stores using Pinia. The stores handle both business data (customers, contacts) and application configuration (dashboard settings).

## 📁 Store Architecture

### Store Types

1. **Business Data Stores**: Manage core application entities
   - `customerStore.ts` - Customer and contact person management
   - `contactStore.ts` - General contact management
   - `prospectorStore.ts` - External API integration for prospect data

2. **Configuration Stores**: Manage UI and application settings
   - `dashboardStore.ts` - Dashboard statistics, quick actions, and navigation

### Data Sources

Each store follows one of two patterns:

#### Pattern 1: JSON File-backed Stores
- **Files**: `customerStore.ts`, `contactStore.ts`, `dashboardStore.ts`
- **Data**: Imported from corresponding `.json` files
- **Usage**: Mock data during development, will be replaced with API calls

#### Pattern 2: API-backed Stores  
- **Files**: `prospectorStore.ts`
- **Data**: Real-time API integration with external services
- **Usage**: Production-ready API connections

## 🏗️ Store Structure

All stores follow consistent patterns:

```typescript
// Standard store structure
export const useStoreStore = defineStore('storeName', {
  state: () => ({
    items: dataSource as ItemType[],
    // ... other state
  }),
  getters: {
    // Computed properties for filtering/transforming data
    activeItems: (state) => state.items.filter(item => item.status === 'Aktiv'),
    getItemById: (state) => (id: number) => state.items.find(item => item.id === id),
  },
  actions: {
    // CRUD operations
    addItem(item: Omit<ItemType, 'id'>) { /* ... */ },
    removeItem(id: number) { /* ... */ },
    updateItem(updated: ItemType) { /* ... */ },
  }
})
```

## 📋 Data Management Instructions

### Adding New Data

#### 1. Adding Records to Existing Stores

**For Development (JSON-backed stores):**
```typescript
// In your component
import { useCustomerStore } from '@/stores'

const customerStore = useCustomerStore()

// Add new customer
customerStore.addCustomer({
  name: "John Doe",
  email: "john@example.com",
  // ... other required fields (excluding 'id')
})
```

**For JSON files directly:**
```json
// In customers.json, add new object to array
{
  "id": 999, // Use next available ID
  "name": "New Customer",
  "status": "Aktiv",
  // ... all required fields
}
```

#### 2. Creating New Data Types

1. **Define the interface:**
```typescript
export interface NewDataType {
  id: number
  name: string
  status: 'Aktiv' | 'Inaktiv'
  // ... other fields
}
```

2. **Create JSON file** (if needed):
```json
// newData.json
[
  {
    "id": 1,
    "name": "Sample Record",
    "status": "Aktiv"
  }
]
```

3. **Create the store:**
```typescript
// newDataStore.ts
import { defineStore } from 'pinia'
import newDataData from './newData.json'

export const useNewDataStore = defineStore('newData', {
  state: () => ({
    items: newDataData as NewDataType[],
  }),
  getters: {
    activeItems: (state) => state.items.filter(item => item.status === 'Aktiv'),
    getItemById: (state) => (id: number) => state.items.find(item => item.id === id),
  },
  actions: {
    addItem(item: Omit<NewDataType, 'id'>) {
      this.items.push({ ...item, id: Date.now() })
    },
    removeItem(id: number) {
      this.items = this.items.filter(i => i.id !== id)
    },
    updateItem(updated: NewDataType) {
      const index = this.items.findIndex(i => i.id === updated.id)
      if (index !== -1) {
        this.items[index] = updated
      }
    },
  }
})
```

4. **Export from index.ts:**
```typescript
export { useNewDataStore } from './newDataStore.ts'
```

### Modifying Existing Data

#### 1. Update Records
```typescript
// Get the store
const store = useCustomerStore()

// Find and update a record
const customer = store.getCustomerById(123)
if (customer) {
  store.updateCustomer({
    ...customer,
    name: "Updated Name",
    email: "updated@example.com"
  })
}
```

#### 2. Modify Data Structure

**Adding new fields to existing interface:**
1. Update the TypeScript interface
2. Add the field to existing JSON records (with default values)
3. Update any related getters/actions

**Example:**
```typescript
// Before
export interface Customer {
  id: number
  name: string
  email: string
}

// After
export interface Customer {
  id: number
  name: string
  email: string
  createdAt: string // New field
}
```

### Safely Removing Data

#### 1. Remove Individual Records

⚠️ **Always check for dependencies first!**

```typescript
// Check for related data before deletion
const customerStore = useCustomerStore()
const contactPersons = customerStore.getContactPersonsByCustomerId(customerId)

if (contactPersons.length > 0) {
  // Handle related data first
  console.warn('Customer has associated contact persons')
}

// Safe removal (automatically handles related data)
customerStore.removeCustomer(customerId)
```

#### 2. Remove Data Types/Stores

**Before removing a store:**

1. **Check dependencies** in other stores
2. **Remove imports** from components
3. **Update index.ts** exports
4. **Remove JSON files** (if applicable)
5. **Update related interfaces** that reference the removed type

**Example removal checklist:**
- [ ] Search codebase for store usage: `useRemovedStore`
- [ ] Remove from `src/stores/index.ts`
- [ ] Delete store file: `removedStore.ts`
- [ ] Delete data file: `removed.json` (if exists)
- [ ] Update any components using the store
- [ ] Check for TypeScript errors

## 🔧 Dependencies

### Required Packages
```json
{
  "pinia": "^2.x.x",
  "vue": "^3.x.x"
}
```

### Store Dependencies
- **Pinia**: State management framework
- **Vue 3**: Reactivity system (for composition API stores)
- **TypeScript**: Type safety and interfaces

## 🚨 Safety Guidelines

### Data Integrity Rules

1. **Always use unique IDs**: Use `Date.now()` for new records or proper UUID generation
2. **Validate required fields**: Ensure all required interface fields are provided
3. **Handle relationships**: When deleting, cascade to related entities
4. **Backup before major changes**: JSON files should be backed up before structure changes

### Common Pitfalls

❌ **Don't:**
- Modify JSON files while the application is running
- Delete records without checking dependencies
- Change interface structure without updating existing data
- Use duplicate IDs

✅ **Do:**
- Use store actions for all data modifications
- Validate data before adding/updating
- Follow the established naming conventions
- Test data changes in development first

## 🔄 Migration Path

### From JSON to API

When ready to move from JSON mock data to real APIs:

1. **Keep store interfaces unchanged**
2. **Replace JSON imports with API calls**
3. **Update the `fetch` actions to make real HTTP requests**
4. **Add loading states and error handling**

```typescript
// Before (JSON)
import customersData from './customers.json'
state: () => ({
  customers: customersData as Customer[],
})

// After (API)
state: () => ({
  customers: [] as Customer[],
})

actions: {
  async fetchCustomers() {
    this.loading = true
    try {
      const response = await fetch('/api/customers')
      this.customers = await response.json()
    } catch (error) {
      this.error = error.message
    } finally {
      this.loading = false
    }
  }
}
```

## 📊 Current Data Overview

| Store | Records | JSON File | Purpose |
|-------|---------|-----------|---------|
| Customer | ~600 | `customers.json` | Customer management |
| Contact Persons | ~10 | `contactPersons.json` | Customer contacts |
| Contacts | ~27 | `contacts.json` | General contacts |
| Work Orders | ~10 | `workOrders.json` | Work order management |
| Work Order Relations | ~46 | `workOrderRelations.json` | Pure many-to-many relationships |
| Dashboard | Static | `dashboard.json` | UI configuration |
| Prospector | Dynamic | None | External API integration |

### Work Orders Data Structure

The work orders store (`workOrderStore.ts`) manages project data with comprehensive time tracking:

#### Core Fields
- **Basic Info**: `orderNumber`, `customerName`, `projectName`, `description`
- **Assignment**: `assignedTo` (array of employee names), `status`, `priority`
- **Time Tracking**: 
  - `estimatedHours`: Original time estimate for the project
  - `actualHours`: Time actually spent on the project
  - `allocatedTime`: Total time allocated/budgeted for the project (including buffer)
  - `usedTime`: Actual time used including overhead and breaks
- **Scheduling**: `startDate`, `dueDate`, `address`

#### Time Field Differences
- **estimatedHours vs allocatedTime**: Estimated hours is the pure work estimate, while allocated time includes buffer time, meetings, and overhead
- **actualHours vs usedTime**: Actual hours is productive work time, while used time includes all time spent (breaks, setup, etc.)

### Work Order Relations (Many-to-Many)

The work order relations store (`workOrderRelations.json`) handles pure many-to-many relationships between work orders, contacts (people), and customers (companies), enabling complex multi-company collaborations:

#### Relationship Types
1. **Contact-to-WorkOrder**: Individual people assigned to work orders
2. **Company-to-WorkOrder**: Companies involved in work orders (as partners, suppliers, consultants)
3. **Mixed Relationships**: Both contacts and companies can be involved in the same work order
4. **Multi-Company Projects**: Single work orders can involve multiple companies with their respective contacts

#### Core Fields (Simplified Structure)
- **Identifiers**: `workOrderId`, `contactId` (nullable), `customerId`

This is a pure relationship table - all additional data like roles, status, time tracking, and notes are derived from the work order itself, maintaining data consistency and avoiding duplication.

#### Complex Relationship Examples

**Work Order 1 (Multi-Company System Update - 3 companies, 4 contacts):**
```json
// Primary company contacts
{"id": 1, "workOrderId": 1, "contactId": 1, "customerId": 1},
{"id": 2, "workOrderId": 1, "contactId": 2, "customerId": 1},

// Consulting partner with specific contact
{"id": 4, "workOrderId": 1, "contactId": 3, "customerId": 2},

// Additional company-wide involvement
{"id": 5, "workOrderId": 1, "contactId": null, "customerId": 3}
```

**Work Order 2 (Simple Website Redesign - 1 company, 2 contacts):**
```json
// Single company with multiple contacts
{"id": 6, "workOrderId": 2, "contactId": 3, "customerId": 2},
{"id": 7, "workOrderId": 2, "contactId": 4, "customerId": 2}
```

**Work Order 5 (Basic Solar Installation - 1 company, 2 contacts):**
```json
// Single company project
{"id": 20, "workOrderId": 5, "contactId": 11, "customerId": 5},
{"id": 21, "workOrderId": 5, "contactId": 12, "customerId": 5}
```

**Work Order 7 (Complex Store Design - 4 companies, 6 contacts):**
```json
// Main company (RetailMax AB) - multiple contacts
{"id": 27, "workOrderId": 7, "contactId": 15, "customerId": 7},
{"id": 28, "workOrderId": 7, "contactId": 16, "customerId": 7},
{"id": 29, "workOrderId": 7, "contactId": 17, "customerId": 7},

// Partner company (FastFood Chain AB) - company-wide + specific contact
{"id": 30, "workOrderId": 7, "contactId": null, "customerId": 6},
{"id": 31, "workOrderId": 7, "contactId": 13, "customerId": 6},

// Supplier company (BuildCorp AB) - company-wide + specific contact
{"id": 32, "workOrderId": 7, "contactId": null, "customerId": 3},
{"id": 33, "workOrderId": 7, "contactId": 6, "customerId": 3},

// Additional consulting (Acme AB) - company-wide + specific contact
{"id": 34, "workOrderId": 7, "contactId": null, "customerId": 1},
{"id": 35, "workOrderId": 7, "contactId": 2, "customerId": 1}
```

**Work Order 8 (Single Company Medical Equipment - 1 company, 3 contacts):**
```json
// All contacts from same company
{"id": 36, "workOrderId": 8, "contactId": 18, "customerId": 8},
{"id": 37, "workOrderId": 8, "contactId": 19, "customerId": 8},
{"id": 38, "workOrderId": 8, "contactId": 20, "customerId": 8}
```

#### Enhanced Benefits
- **Pure Relationship Model**: Clean many-to-many relationships without data duplication
- **Data Consistency**: All work order details (status, priority, time tracking) come from the work order itself
- **Multi-Company Support**: Single work orders can involve unlimited companies
- **Flexible Contact Assignment**: Each company can have multiple contacts or company-wide assignments
- **Cross-Company Collaboration**: Support for complex multi-company projects with clear relationships
- **Scalable Architecture**: Easy to add/remove companies and contacts without affecting work order data
- **Simplified Maintenance**: Changes to work order status/priority automatically reflect in all relationships
- **Varied Complexity**: Supports simple single-company projects to complex multi-stakeholder collaborations

#### UI Features
- **Company Grouping**: Relations are grouped by company for better visualization
- **Summary Statistics**: Shows total companies, contacts, and company-wide assignments
- **Flexible Assignment**: Easy to add company-wide or specific contact assignments
- **Visual Organization**: Clear display of which contacts belong to which companies
- **Scalable Display**: Handles varying numbers of companies and contacts per work order

#### Relationship Variety
- **Simple Projects**: 1 company, 2-3 contacts (Work Orders 2, 5, 8, 10)
- **Medium Projects**: 2 companies, 3-5 contacts (Work Orders 3, 4, 6, 9)
- **Complex Projects**: 3-4 companies, 4-6 contacts (Work Orders 1, 7)

For questions or issues with data management, refer to the individual store files or contact the development team. 