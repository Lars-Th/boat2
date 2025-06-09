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
| Dashboard | Static | `dashboard.json` | UI configuration |
| Prospector | Dynamic | None | External API integration |

---

For questions or issues with data management, refer to the individual store files or contact the development team. 