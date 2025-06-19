# AI Mock Data Implementation Checklist

This document outlines the complete process for converting views with static data to use the mock API system, providing a consistent data layer that can later be replaced with real API calls.

## 📋 **Complete Checklist**

### **Phase 1: Planning & Data Structure**

- [ ] **Analyze Existing Static Data**
  - [ ] Identify the current data structure and fields
  - [ ] Determine what additional fields would be relevant
  - [ ] Plan for future relationships (even if not implementing them yet)
  - [ ] Consider real-world data requirements

- [ ] **Design JSON Structure**
  - [ ] Choose appropriate field names (follow existing naming conventions)
  - [ ] Add unique ID field (e.g., `EntityID`, `BoatID`, `ToolID`)
  - [ ] Include timestamps (`CreatedDate`, `LastModified`)
  - [ ] Add status fields where applicable
  - [ ] Plan for nested objects (technical details, contact info, etc.)

- [ ] **Review Existing Patterns**
  - [ ] Check `src/assets/data/` for similar entity structures
  - [ ] Follow naming conventions from existing JSON files
  - [ ] Ensure consistency with database field names

### **Phase 2: Create JSON Data File**

- [ ] **Create Data File**
  - [ ] Create `src/assets/data/[entityName].json`
  - [ ] Use plural naming (e.g., `boats.json`, `vehicles.json`)
  - [ ] Include 4-6 sample records for variety

- [ ] **JSON Structure Template**
  ```json
  [
    {
      "EntityID": 1,
      "EntityNumber": "E001",
      "Name": "Sample Entity",
      "Type": "EntityType",
      "Status": "active",
      "CreatedDate": "2023-01-15T10:00:00Z",
      "LastModified": "2024-01-15T14:30:00Z",
      "ContactInfo": {
        "Phone": "0701-234567",
        "Email": "contact@example.com"
      },
      "TechnicalDetails": {
        "Property1": "Value1",
        "Property2": 123,
        "Property3": true
      },
      "Notes": "Additional information about this entity"
    }
  ]
  ```

- [ ] **Data Quality Checklist**
  - [ ] Ensure all records have consistent field structure
  - [ ] Use realistic Swedish data (names, locations, phone numbers)
  - [ ] Include variety in status values and types
  - [ ] Add meaningful notes and descriptions
  - [ ] Use proper ISO date formats

### **Phase 3: Update MockDataService**

- [ ] **Add Data Import**
  - [ ] Open `src/api/mocks/mock-data.service.ts`
  - [ ] Add import statement in the imports section
  ```typescript
  import entityNameData from '@/assets/data/entityName.json';
  ```

- [ ] **Add CRUD Methods**
  - [ ] Add methods at the end of the MockDataService class
  - [ ] Follow the established pattern for consistency

- [ ] **Method Template**
  ```typescript
  // EntityName
  async getEntityNames(): Promise<ApiResponse<typeof entityNameData>> {
    return this.mockRequest(entityNameData);
  }

  async getEntityName(id: string): Promise<ApiResponse<(typeof entityNameData)[0] | null>> {
    const entity = entityNameData.find(e => e.EntityID.toString() === id);
    return this.mockRequest(entity || null);
  }

  async createEntityName(
    data: Partial<(typeof entityNameData)[0]>
  ): Promise<ApiResponse<(typeof entityNameData)[0]>> {
    const newEntity = {
      ...data,
      EntityID: Math.max(...entityNameData.map(e => e.EntityID)) + 1,
      CreatedDate: new Date().toISOString(),
    } as (typeof entityNameData)[0];

    return this.mockRequest(newEntity);
  }

  async updateEntityName(
    id: string,
    data: Partial<(typeof entityNameData)[0]>
  ): Promise<ApiResponse<(typeof entityNameData)[0]>> {
    const existingEntity = entityNameData.find(e => e.EntityID.toString() === id);
    if (!existingEntity) {
      return {
        data: null as unknown as (typeof entityNameData)[0],
        success: false,
        error: {
          message: 'Entity not found',
          code: 'NOT_FOUND',
        },
      };
    }

    const updatedEntity = { ...existingEntity, ...data } as (typeof entityNameData)[0];
    return this.mockRequest(updatedEntity);
  }

  async deleteEntityName(id: string): Promise<ApiResponse<boolean>> {
    const exists = entityNameData.some(e => e.EntityID.toString() === id);
    if (!exists) {
      return {
        data: false,
        success: false,
        error: {
          message: 'Entity not found',
          code: 'NOT_FOUND',
        },
      };
    }

    return this.mockRequest(true);
  }
  ```

### **Phase 4: Update Main API Configuration**

- [ ] **Add API Endpoints**
  - [ ] Open `src/api/index.ts`
  - [ ] Add new entity section before the closing brace of the `api` object

- [ ] **API Template**
  ```typescript
  // EntityName
  entityNames: {
    getAll: () =>
      USE_MOCK_API
        ? (apiService as MockDataService).getEntityNames()
        : Promise.reject(new Error('EntityNames not implemented in real API yet')),

    getById: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).getEntityName(id)
        : Promise.reject(new Error('EntityNames not implemented in real API yet')),

    create: (data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).createEntityName(data as never)
        : Promise.reject(new Error('EntityNames not implemented in real API yet')),

    update: (id: string, data: Record<string, unknown>) =>
      USE_MOCK_API
        ? (apiService as MockDataService).updateEntityName(id, data as never)
        : Promise.reject(new Error('EntityNames not implemented in real API yet')),

    delete: (id: string) =>
      USE_MOCK_API
        ? (apiService as MockDataService).deleteEntityName(id)
        : Promise.reject(new Error('EntityNames not implemented in real API yet')),
  },
  ```

### **Phase 5: Update View Component**

- [ ] **Update Imports**
  - [ ] Replace static data imports with API composable
  ```typescript
  // Remove static data
  // const mockData = ref([...]);

  // Add API imports
  import { useApiList } from '@/composables/useApi';
  import api from '@/api';
  ```

- [ ] **Replace Static Data with API Call**
  ```typescript
  // Fetch data using the API service
  const {
    data: entityNames,
    loading: entityNamesLoading,
    error: entityNamesError,
  } = useApiList(() => api.entityNames.getAll(), {
    cacheKey: 'entityNames',
  });
  ```

- [ ] **Update Computed Properties**
  - [ ] Replace references to static data with API data
  - [ ] Add null checks for loading states
  ```typescript
  // Loading state
  const isLoading = computed(() => entityNamesLoading.value);

  // Error state
  const hasError = computed(() => entityNamesError.value !== null);

  // Statistics (example)
  const stats = computed(() => {
    if (!entityNames.value) {
      return [
        { title: 'Total', value: 0, icon: YourIcon, color: 'blue' },
        // ... other default stats
      ];
    }

    const activeEntities = entityNames.value.filter((e: any) => e.Status === 'active').length;
    // ... compute other statistics

    return [
      {
        title: 'Total',
        value: entityNames.value.length,
        icon: YourIcon,
        color: 'blue',
      },
      // ... other computed stats
    ];
  });
  ```

### **Phase 6: Update Template**

- [ ] **Add Error State**
  ```vue
  <!-- Error State -->
  <div v-else-if="hasError" class="flex items-center justify-center py-12">
    <div class="text-center">
      <p class="text-destructive mb-2">Ett fel uppstod vid laddning av data</p>
      <Button
        variant="outline"
        @click="() => { /* Add refresh logic */ }"
      >
        Försök igen
      </Button>
    </div>
  </div>
  ```

- [ ] **Update DataTable Reference**
  ```vue
  <!-- DataTable -->
  <DataTable
    v-else
    :data="entityNames"
    :columns="columns"
    :search-fields="['Name', 'Type', 'EntityNumber', 'Status']"
    @row-click="handleRowClick"
  >
  ```

- [ ] **Update Loading Condition**
  ```vue
  <!-- Loading State -->
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
      <p class="text-muted-foreground">Laddar data...</p>
    </div>
  </div>
  ```

### **Phase 7: Testing & Validation**

- [ ] **Test API Functionality**
  - [ ] Verify data loads correctly
  - [ ] Test loading states
  - [ ] Test error handling
  - [ ] Verify search functionality works with new data structure

- [ ] **Test Data Completeness**
  - [ ] Ensure all required fields are present
  - [ ] Verify computed statistics work correctly
  - [ ] Test sorting and filtering

- [ ] **Test UI Consistency**
  - [ ] Verify table columns display correctly
  - [ ] Check badge variants and status displays
  - [ ] Test responsive design

### **Phase 8: Documentation & Cleanup**

- [ ] **Update View Comments**
  - [ ] Remove old static data comments
  - [ ] Add comments about API usage
  - [ ] Document any specific data processing

- [ ] **Clean Up Unused Code**
  - [ ] Remove static data arrays
  - [ ] Remove unused imports
  - [ ] Clean up any debug code

## 🎯 **Quick Reference**

### **Common Data Fields**
- **IDs**: `EntityID`, `EntityNumber` (for display)
- **Names**: `Name`, `Title`, `Description`
- **Status**: `Status` (active, inactive, maintenance, etc.)
- **Dates**: `CreatedDate`, `LastModified`, `LastService`, `NextService`
- **Contact**: `Owner`, `OwnerPhone`, `OwnerEmail`
- **Location**: `Location`, `HarbourLocation`, `Address`

### **Naming Conventions**
- **JSON Files**: kebab-case, plural (e.g., `work-orders.json`)
- **Import Names**: camelCase + Data (e.g., `workOrdersData`)
- **Method Names**: camelCase, match entity name (e.g., `getWorkOrders`)
- **API Properties**: camelCase, plural (e.g., `workOrders`)

### **File Locations**
- **JSON Files**: `src/assets/data/entityName.json`
- **Mock Service**: `src/api/mocks/mock-data.service.ts`
- **API Index**: `src/api/index.ts`
- **Views**: `src/views/YourView.vue`

## ⚠️ **Common Issues & Solutions**

### **TypeScript Errors on Data Access**
```typescript
// Problem: Property access errors
entityNames.value.filter(e => e.Status === 'active')

// Solution: Add type assertion
entityNames.value.filter((e: any) => e.Status === 'active')
```

### **Loading State Not Working**
- Ensure `isLoading` computed property is properly defined
- Check that `v-if="isLoading"` comes before other conditions
- Verify API call is actually being made

### **Data Not Displaying**
- Check browser console for import errors
- Verify JSON file is valid (use JSON validator)
- Ensure data structure matches what the component expects

### **Search Not Working**
- Update `:search-fields` array with correct field names
- Ensure field names match those in the JSON data
- Check for nested object fields (may need flattening)

### **Statistics Not Calculating**
- Add null checks in computed properties
- Ensure data is available before calculation
- Use type assertions for TypeScript compatibility

## 🚀 **Example Implementation Pattern**

### **Before (Static Data)**
```typescript
const mockData = ref([
  { id: 1, name: 'Item 1', status: 'active' },
  { id: 2, name: 'Item 2', status: 'inactive' },
]);

const isLoading = ref(false);
const stats = computed(() => ({
  total: mockData.value.length,
  active: mockData.value.filter(item => item.status === 'active').length,
}));
```

### **After (Mock API)**
```typescript
const {
  data: items,
  loading: itemsLoading,
  error: itemsError,
} = useApiList(() => api.items.getAll(), {
  cacheKey: 'items',
});

const isLoading = computed(() => itemsLoading.value);
const hasError = computed(() => itemsError.value !== null);

const stats = computed(() => {
  if (!items.value) {
    return { total: 0, active: 0 };
  }

  return {
    total: items.value.length,
    active: items.value.filter((item: any) => item.Status === 'active').length,
  };
});
```

## 📚 **Related Documentation**

- **API Architecture**: See `docs/StructureAPI.md` for detailed API patterns
- **Mock vs Real API**: Understanding the dual implementation system
- **Data Relations**: How to add relationships between entities (future enhancement)

---

**💡 Pro Tip**: Always start with simple CRUD operations and add complexity gradually. The mock system is designed to be easily replaceable with real API calls later!
