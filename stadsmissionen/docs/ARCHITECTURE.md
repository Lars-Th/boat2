# Architecture Guide

## Project Structure & Separation of Concerns

This Vue 3 + TypeScript application follows a clean architecture pattern with clear separation of functionality. This guide explains how each layer works and how to properly implement new views.

## 📁 Directory Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   └── features/       # Feature-specific components
├── composables/        # Reactive business logic
├── schemas/           # Data validation definitions
├── services/          # External service integrations
│   └── api/          # API communication layer
├── types/            # TypeScript type definitions
├── utils/            # Pure utility functions
├── views/            # Page-level components
└── router/           # Route definitions
```

## 🏗️ Architecture Layers

### 1. **Data Layer** (`/services/api/`)

**Purpose**: Handle all external data communication

- `base.ts` - Base HTTP client with error handling
- `mock.ts` - Mock data for development
- `real.ts` - Production API implementation
- `index.ts` - Unified API interface

**Responsibilities**:

- HTTP requests/responses
- Data transformation
- Error handling
- Environment switching (mock/real)

### 2. **Validation Layer** (`/schemas/`)

**Purpose**: Define data validation rules and schemas

- `validationSchemas.ts` - Validation schemas for all entities

**Responsibilities**:

- Field validation rules
- Custom business logic validation
- Display names for error messages
- Type-safe validation schemas

### 3. **Business Logic Layer** (`/composables/`)

**Purpose**: Reactive business logic and state management

- `useValidation.ts` - Form validation logic
- `useApi.ts` - API state management
- `useOrganizationManagement.ts` - Organization-specific logic

**Responsibilities**:

- Reactive state management
- Business logic implementation
- Cross-component state sharing
- Integration between layers

### 4. **Presentation Layer** (`/views/` & `/components/`)

**Purpose**: User interface and user interactions

- Views: Page-level components
- Components: Reusable UI elements

**Responsibilities**:

- User interface rendering
- User interaction handling
- Component composition
- Route-specific logic

## 🔄 Data Flow Pattern

Views → Composables → API Services → External APIs
      ↘ Validation Schemas ↗

## 📋 How to Create a New View

### Step 1: Define Your Data Types

```typescript
// src/types/index.ts
export interface MyEntity {
  id: string
  name: string
  // ... other properties
}
```

### Step 2: Create Validation Schema

```typescript
// src/schemas/validationSchemas.ts
export const myEntityValidationSchema = {
  name: {
    rules: ['required'],
    displayName: 'Entity Name'
  },
  // ... other fields
}
```

### Step 3: Add API Methods

```typescript
// src/services/api/mock.ts & real.ts
async getMyEntities(): Promise<ApiResponse<MyEntity[]>> {
  // Implementation
}

async createMyEntity(data: Partial<MyEntity>): Promise<ApiResponse<MyEntity>> {
  // Implementation
}
```

### Step 4: Update API Index

```typescript
// src/services/api/index.ts
export const api = {
  // ... existing APIs
  myEntities: {
    getAll: () => apiService.getMyEntities(),
    create: (data: Partial<MyEntity>) => apiService.createMyEntity(data),
  },
}
```

### Step 5: Create Composable (if needed)

```typescript
// src/composables/useMyEntity.ts
import { ref } from 'vue'
import { useApi } from './useApi'
import { useValidation } from './useValidation'
import { myEntityValidationSchema } from '@/schemas/validationSchemas'
import { api } from '@/services/api'

export function useMyEntity() {
  const entities = ref<MyEntity[]>([])

  // Fetch data
  const { data, loading, error, execute } = useApi(
    () => api.myEntities.getAll()
  )

  // Validation
  const { validateWithSchema, errors } = useValidation()

  const createEntity = async (formData: Partial<MyEntity>) => {
    const isValid = validateWithSchema(formData, myEntityValidationSchema)
    if (!isValid) return false

    const result = await api.myEntities.create(formData)
    if (result.success) {
      entities.value.push(result.data)
    }
    return result.success
  }

  return {
    entities,
    loading,
    error,
    createEntity,
    errors,
    fetchEntities: execute
  }
}
```

### Step 6: Create Your View

```vue
<!-- src/views/MyEntityView.vue -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useMyEntity } from '@/composables/useMyEntity'

const {
  entities,
  loading,
  error,
  createEntity,
  fetchEntities
} = useMyEntity()

onMounted(() => {
  fetchEntities()
})

const handleCreate = async (formData: Partial<MyEntity>) => {
  const success = await createEntity(formData)
  if (success) {
    // Handle success (show toast, redirect, etc.)
  }
}
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <!-- Your UI here -->
      <div v-for="entity in entities" :key="entity.id">
        {{ entity.name }}
      </div>
    </div>
  </div>
</template>
```

## 🎯 Import Guidelines

### ✅ Correct Import Patterns

```typescript
// Views should import composables
import { useMyEntity } from '@/composables/useMyEntity'

// Composables should import API services
import { api } from '@/services/api'

// Composables should import validation schemas
import { myEntityValidationSchema } from '@/schemas/validationSchemas'

// Components should import utilities
import { cn } from '@/utils/libraryHelper'
```

### ❌ Avoid These Patterns

```typescript
// ❌ Don't import API services directly in views
import { api } from '@/services/api' // Use composables instead

// ❌ Don't import validation schemas directly in views
import { myEntityValidationSchema } from '@/schemas/validationSchemas' // Use composables

// ❌ Don't put business logic in views
// Keep views focused on presentation only
```

## 🔧 Common Patterns

### Form Handling with Validation

```typescript
// In your composable
const { validateForApi } = useValidation()

const submitForm = async (formData: Record<string, unknown>) => {
  const result = await validateForApi(
    formData,
    myEntityValidationSchema,
    (data) => api.myEntities.create(data)
  )

  return result
}
```

### Loading States

```typescript
// Use the useApi composable for automatic loading states
const { data, loading, error, execute } = useApi(
  () => api.myEntities.getAll(),
  { immediate: true } // Auto-fetch on mount
)
```

### Error Handling

```typescript
// Composables handle errors, views display them
const { error } = useMyEntity()

// In template
<div v-if="error" class="error">
  {{ error.message }}
</div>
```

## 🧪 Testing Strategy

### Unit Tests

- **Utils**: Test pure functions in isolation
- **Composables**: Test business logic with mocked dependencies
- **Components**: Test UI behavior and user interactions

### Integration Tests

- **API Services**: Test with mock server
- **Views**: Test complete user workflows

## 🚀 Performance Considerations

### Lazy Loading

```typescript
// Lazy load views
const MyView = () => import('@/views/MyView.vue')
```

### Computed Properties

```typescript
// Use computed for derived state
const filteredEntities = computed(() =>
  entities.value.filter(entity => entity.active)
)
```

### Caching

```typescript
// Use caching in API calls
const { data } = useApi(
  () => api.myEntities.getAll(),
  { cache: true, cacheKey: 'my-entities' }
)
```

## 📝 Best Practices

1. **Single Responsibility**: Each layer has one clear purpose
2. **Dependency Direction**: Always import "downward" in the architecture
3. **Type Safety**: Use TypeScript interfaces for all data structures
4. **Error Boundaries**: Handle errors at the appropriate layer
5. **Reactive State**: Use Vue's reactivity system properly
6. **Validation**: Always validate data before API calls
7. **Loading States**: Provide feedback for async operations

## 🔍 Debugging Tips

1. **Vue DevTools**: Use for reactive state inspection
2. **Network Tab**: Monitor API calls
3. **Console Logs**: Added automatically in development mode
4. **Error Boundaries**: Check error objects for detailed information

This architecture ensures maintainable, scalable, and testable code while following Vue 3 and TypeScript best practices.
