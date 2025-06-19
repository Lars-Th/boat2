# AI Data API Instructions

This document provides comprehensive instructions for managing API data, types, relationships, and data pipelines when updating views in the Stadsmissionen application. It covers both mock and backend API implementations.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Structure](#api-structure)
3. [Type System](#type-system)
4. [Relationship Management](#relationship-management)
5. [Data Pipeline Patterns](#data-pipeline-patterns)
6. [Implementation Phases](#implementation-phases)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

The application uses a layered API architecture with the following components:

```
View Components
    ↓
API Composables (useApiItem, useApiList)
    ↓
API Service Layer (api/index.ts)
    ↓
Mock Data Service OR Real Backend
    ↓
JSON Data Files (for mock) OR HTTP Client (for backend)
```

### Key Principles

- **Single Source of Truth**: All data flows through the API service layer
- **Type Safety**: Full TypeScript support with enhanced relationship types
- **Relationship Management**: Automatic resolution of related data
- **Caching**: Built-in caching for performance optimization
- **Error Handling**: Consistent error handling across all API calls

## API Structure

### Core API Service (`src/api/index.ts`)

The main API service provides a unified interface for both mock and real backend:

```typescript
export const api = {
  // Entity CRUD operations
  entityName: {
    getAll: (params?: RelationalParams) => Promise<ApiResponse<Entity[]>>,
    getById: (id: string, params?: RelationalParams) => Promise<ApiResponse<Entity | null>>,
    create: (data: Record<string, unknown>) => Promise<ApiResponse<Entity>>,
    update: (id: string, data: Record<string, unknown>) => Promise<ApiResponse<Entity>>,
    delete: (id: string) => Promise<ApiResponse<boolean>>,
  }
}
```

### Mock Data Service (`src/api/mocks/mock-data.service.ts`)

Handles all mock data operations with relationship resolution:

```typescript
class MockDataService {
  // Standard CRUD with relationship support
  async getEntities(params?: RelationalParams): Promise<ApiResponse<Entity[]>>
  async getEntity(id: string, params?: RelationalParams): Promise<ApiResponse<Entity | null>>

  // Relationship resolution logic
  private enhanceWithRelations(entity: Entity, params: RelationalParams): EnhancedEntity
}
```

## Type System

### Base Types (`src/types/index.ts`)

Define core entity interfaces:

```typescript
export interface Entity {
  id: number;
  name: string;
  // ... other base properties
}
```

### Enhanced Types (`src/types/enhanced.ts`)

Define relationship-enhanced versions:

```typescript
export interface EntityWithRelations extends Entity {
  relatedEntities?: RelatedEntity[];
  parentEntity?: ParentEntity;
}

// Relational parameters for API calls
export interface RelationalParams {
  include?: string[];
}
```

### Relationship Types (`src/types/relationships.ts`)

Define complex relationship structures:

```typescript
export interface EntityWithRelations {
  // Base entity properties
  id: number;
  name: string;

  // Resolved relationships (optional)
  customer?: CustomerWithRelations;
  contacts?: ContactWithRelations[];
  assignedUsers?: EmployeeWithRelations[];
}
```

## Relationship Management

### Relationship Configuration (`src/config/relationships.ts`)

Define how entities relate to each other:

```typescript
export const entityRelationships: RelationshipConfig<Entity, {
  customer: CustomerWithRelations;
  contacts: ContactWithRelations[];
}> = {
  relationships: {
    customer: {
      type: 'belongsTo',
      foreignKey: 'customerId',
      targetEntity: 'customers',
      targetKey: 'id',
      cache: true,
      eager: true,
    },
    contacts: {
      type: 'hasMany',
      foreignKey: 'entityId',
      targetEntity: 'contacts',
      targetKey: 'entityId',
      cache: true,
      eager: false,
    },
  },
};
```

### Relationship Types

- **belongsTo**: One-to-one relationship (entity belongs to parent)
- **hasOne**: One-to-one relationship (entity has one child)
- **hasMany**: One-to-many relationship (entity has multiple children)
- **manyToMany**: Many-to-many relationship (through junction table or array)

### Eager vs Lazy Loading

- **Eager (`eager: true`)**: Load immediately with parent entity
- **Lazy (`eager: false`)**: Load only when specifically requested
- **Cache (`cache: true`)**: Cache resolved relationships for performance

## Data Pipeline Patterns

### Pattern 1: Simple List View

For basic list views without relationships:

```typescript
// In Vue component
const {
  data: entities,
  loading: isLoading,
  error: hasError,
} = useApiList(() => api.entities.getAll(), {
  cacheKey: 'entities',
});
```

### Pattern 2: Detail View with Relationships

For detail views requiring related data:

```typescript
// In Vue component
const entityId = computed(() => route.params['id'] as string);

const {
  data: entityWithRelations,
  loading: isLoading,
  error: hasError,
  refresh: refreshEntity,
} = useApiItem(
  () => api.entities.getById(entityId.value, {
    include: ['customer', 'contacts', 'assignedUsers']
  }),
  {
    cacheKey: `entity-with-relations-${entityId.value}`,
  }
);

// Extract related data
const entity = computed(() => entityWithRelations.value);
const customer = computed(() => entityWithRelations.value?.customer);
const contacts = computed(() => entityWithRelations.value?.contacts || []);
```

### Pattern 3: Multiple Related Entities

For complex views requiring multiple separate API calls:

```typescript
// Primary entity
const {
  data: primaryEntity,
  loading: primaryLoading,
} = useApiItem(() => api.entities.getById(entityId.value));

// Related entities (dependent on primary)
const {
  data: relatedEntities,
  loading: relatedLoading,
} = useApiList(
  () => primaryEntity.value?.customerId
    ? api.customers.getById(primaryEntity.value.customerId.toString(), {
        include: ['contacts']
      })
    : null,
  {
    cacheKey: `customer-${primaryEntity.value?.customerId}-with-contacts`,
    enabled: computed(() => !!primaryEntity.value?.customerId),
  }
);
```

### Pattern 4: Computed Statistics

For views requiring computed data from relationships:

```typescript
// Computed statistics from related data
const totalHours = computed(() => {
  return tasks.value
    .filter((task: any) => task.Status === 'completed')
    .reduce((total: number, task: any) => total + (task.Hours || 0), 0);
});

const progress = computed(() => {
  if (!entity.value?.EstimatedHours) return 0;
  return Math.round((totalHours.value / entity.value.EstimatedHours) * 100);
});
```

## Implementation Phases

### Phase 1: Analysis and Planning

**Checklist:**
- [ ] Identify all entities involved in the view
- [ ] Map relationships between entities
- [ ] Determine which relationships need eager/lazy loading
- [ ] Identify computed fields and statistics needed
- [ ] Plan caching strategy

### Phase 2: Type Definitions

**Checklist:**
- [ ] Define base entity interfaces in `src/types/index.ts`
- [ ] Create enhanced types with relationships in `src/types/enhanced.ts`
- [ ] Add relationship-specific types in `src/types/relationships.ts`
- [ ] Define RelationalParams for the entity

### Phase 3: Mock Data Enhancement

**Checklist:**
- [ ] Verify JSON data files exist in `src/assets/data/`
- [ ] Implement relationship resolution in MockDataService
- [ ] Add support for `include` parameters
- [ ] Handle computed fields (e.g., ActualHours from tasks)
- [ ] Test relationship resolution logic

**Mock Service Implementation Pattern:**
```typescript
async getEntity(id: string, params?: RelationalParams): Promise<ApiResponse<any | null>> {
  const entity = entityData.find(e => e.id === parseInt(id));
  if (!entity) return this.mockRequest(null);

  if (!params?.include || params.include.length === 0) {
    return this.mockRequest(entity);
  }

  const enhanced: any = { ...entity };

  if (params.include?.includes('customer')) {
    const customer = customersData.find(c => c.id === entity.customerId);
    enhanced.customer = customer;
  }

  if (params.include?.includes('contacts')) {
    const contacts = contactsData.filter(c => c.entityId === entity.id);
    enhanced.contacts = contacts;
  }

  return this.mockRequest(enhanced);
}
```

### Phase 4: API Service Integration

**Checklist:**
- [ ] Add entity endpoints to `src/api/index.ts`
- [ ] Implement both mock and real API branches
- [ ] Add proper TypeScript return types
- [ ] Test API service methods

**API Service Pattern:**
```typescript
entityName: {
  getAll: (params?: RelationalParams) =>
    USE_MOCK_API
      ? (apiService as MockDataService).getEntities(params)
      : realApiService.entities.getAll(params),

  getById: (id: string, params?: RelationalParams) =>
    USE_MOCK_API
      ? (apiService as MockDataService).getEntity(id, params)
      : realApiService.entities.getById(id, params),
},
```

### Phase 5: View Component Implementation

**Checklist:**
- [ ] Import required composables (`useApiItem`, `useApiList`)
- [ ] Set up data fetching with proper relationships
- [ ] Implement loading and error states
- [ ] Add computed properties for derived data
- [ ] Handle caching and refresh logic
- [ ] Test component with mock data

**Component Implementation Pattern:**
```typescript
// Get entity ID from route
const entityId = computed(() => route.params['id'] as string);

// Fetch entity with relationships
const {
  data: entityWithRelations,
  loading: isLoading,
  error: hasError,
  refresh: refreshEntity,
} = useApiItem(
  () => api.entities.getById(entityId.value, {
    include: ['customer', 'contacts', 'tasks']
  }),
  {
    cacheKey: `entity-with-relations-${entityId.value}`,
  }
);

// Extract data
const entity = computed(() => entityWithRelations.value);
const customer = computed(() => entityWithRelations.value?.customer);
const contacts = computed(() => entityWithRelations.value?.contacts || []);
const tasks = computed(() => entityWithRelations.value?.tasks || []);

// Computed statistics
const totalHours = computed(() => {
  return tasks.value.reduce((total, task) => total + (task.hours || 0), 0);
});
```

### Phase 6: Testing and Validation

**Checklist:**
- [ ] Test all relationship loading scenarios
- [ ] Verify caching behavior
- [ ] Test error handling
- [ ] Validate computed statistics
- [ ] Check loading states
- [ ] Test refresh functionality

## Best Practices

### Data Fetching

1. **Use Appropriate Composables**
   - `useApiList()` for collections
   - `useApiItem()` for single entities
   - `useApiMutation()` for create/update/delete operations

2. **Implement Proper Caching**
   ```typescript
   {
     cacheKey: `entity-${entityId.value}`,
     cache: true,
   }
   ```

3. **Handle Dependencies**
   ```typescript
   {
     enabled: computed(() => !!parentEntity.value?.id),
   }
   ```

### Relationship Management

1. **Use Eager Loading Sparingly**
   - Only for critical relationships needed immediately
   - Prefer lazy loading for optional data

2. **Implement Computed Fields in Mock Service**
   ```typescript
   // Compute ActualHours from related tasks
   enhanced.ActualHours = tasks.reduce((total, task) => total + task.Hours, 0);
   ```

3. **Handle Missing Relationships Gracefully**
   ```typescript
   const contacts = computed(() => entity.value?.contacts || []);
   ```

### Error Handling

1. **Combine Error States**
   ```typescript
   const hasError = computed(() =>
     entityError.value !== null || relatedError.value !== null
   );
   ```

2. **Provide Meaningful Error Messages**
   ```typescript
   const errorMessage = computed(() => {
     if (entityError.value) return 'Failed to load entity';
     if (relatedError.value) return 'Failed to load related data';
     return null;
   });
   ```

### Performance Optimization

1. **Use Computed Properties for Derived Data**
   ```typescript
   const statistics = computed(() => ({
     total: items.value.length,
     completed: items.value.filter(i => i.status === 'completed').length,
   }));
   ```

2. **Implement Proper Cache Keys**
   ```typescript
   cacheKey: `entity-${entityId.value}-with-${params.include?.join('-')}`
   ```

## Troubleshooting

### Common Issues

1. **Relationships Not Loading**
   - Check `include` parameter is correctly specified
   - Verify relationship exists in mock data
   - Ensure foreign keys match between entities

2. **Caching Issues**
   - Use unique cache keys for different parameter combinations
   - Call `refresh()` to clear cache when needed
   - Check cache duration settings

3. **Type Errors**
   - Ensure enhanced types include optional relationship properties
   - Use proper null checks for optional relationships
   - Verify RelationalParams interface matches usage

4. **Performance Issues**
   - Avoid eager loading too many relationships
   - Use computed properties instead of methods for derived data
   - Implement proper loading states

### Debugging Tips

1. **Log API Responses**
   ```typescript
   onSuccess: (data) => console.log('API Response:', data)
   ```

2. **Check Network Tab**
   - Verify API calls are being made
   - Check response structure matches expected types

3. **Use Vue DevTools**
   - Inspect reactive data
   - Check computed property dependencies
   - Monitor component re-renders

### Example Implementations

Refer to these existing implementations as examples:

- **ActivityDetail.vue**: Simple relationship loading with types and participants
- **WorkOrderDetail.vue**: Complex relationships with customers, contacts, tasks, and employees
- **UserDetail.vue**: Handling current user context and permissions

These examples demonstrate the patterns and best practices outlined in this document.
