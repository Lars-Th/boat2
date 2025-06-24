# AI New Button to Editable Details Implementation Guide

## Overview

This guide explains how to implement a "New" button functionality that allows
users to create new entities by navigating to an existing detail page in
creation mode. The detail page will show empty, editable fields instead of
fetching existing data.

## Pattern Summary

Instead of creating separate "New" and "Edit" pages, we reuse the existing
detail page component and make it context-aware:

- **View Mode**: Display existing entity data (read-only)
- **Edit Mode**: Edit existing entity data
- **Creation Mode**: Show empty form fields for creating new entities

## Prerequisites

- Existing detail page component (e.g., `EntityDetail.vue`)
- Existing list page with a "New" button
- API endpoints for CRUD operations
- Vue Router setup
- Composables: `useApiItem`, `useToast`

## Implementation Checklist

### 1. Router Configuration

- [ ] Add a new route for creation mode
- [ ] Ensure the creation route comes BEFORE the dynamic `:id` route
- [ ] Use a descriptive route name (e.g., `entity-new`)

```javascript
// In router/router.ts
{
  path: '/entities/list/new',
  name: 'entity-new',
  component: EntityDetail,
},
{
  path: '/entities/list/:id',
  name: 'entity-detail',
  component: EntityDetail,
},
```

### 2. List Page "New" Button

- [ ] Update the "New" button to navigate to the creation route
- [ ] Ensure the button uses the correct route path

```javascript
// In EntityList.vue
const handleNewEntity = () => {
  router.push('/entities/list/new');
};
```

### 3. Detail Page Component Updates

#### 3.1 Creation Mode Detection

- [ ] Add creation mode detection based on route name
- [ ] Add logging for debugging route parameters
- [ ] Move creation detection before other computed properties

```javascript
// Check if we're in creation mode based on route name
const isCreating = computed(() => {
  const creating = route.name === 'entity-new';
  console.log('EntityDetail: Creation mode check:', {
    routeName: route.name,
    routePath: route.path,
    isCreating: creating,
    timestamp: new Date().toISOString(),
  });
  return creating;
});
```

#### 3.2 Entity ID Handling

- [ ] Update entity ID computation to handle undefined values
- [ ] Add logging for route parameter debugging

```javascript
// Get entity ID from route (only for existing entities)
const entityId = computed(() => {
  const id = route.params['id'] as string;
  console.log('EntityDetail: Route params debug:', {
    routePath: route.path,
    routeName: route.name,
    allParams: route.params,
    idParam: id,
    isCreating: isCreating.value,
    timestamp: new Date().toISOString(),
  });
  return id;
});
```

#### 3.3 API Data Fetching

- [ ] Modify API call to skip fetching when in creation mode
- [ ] Use the `immediate` option to control when API calls execute

```javascript
// Fetch entity data (only if not creating)
const {
  data: entity,
  loading: isLoading,
  error: entityError,
  refresh: refreshEntity,
} = useApiItem <
Entity >
(() => api.entities.getById(entityId.value),
{
  cacheKey: `entity-${entityId.value}`,
  immediate: !isCreating.value, // Only fetch if not creating
});
```

#### 3.4 Error Handling

- [ ] Add comprehensive error logging
- [ ] Include creation mode context in error logs

```javascript
// Error states
const hasError = computed(() => {
  if (entityError.value !== null) {
    console.error('EntityDetail: API error detected:', {
      error: entityError.value,
      entityId: entityId.value,
      isCreating: isCreating.value,
      timestamp: new Date().toISOString(),
    });
  }
  return entityError.value !== null;
});
```

#### 3.5 Form Initialization

- [ ] Update form initialization to handle creation mode
- [ ] Set appropriate default values for new entities
- [ ] Handle both creation and edit scenarios

```javascript
// Initialize edit form
const initEditForm = () => {
  if (isCreating.value) {
    // Initialize with empty/default values for new entity
    editForm.value = {
      name: '',
      description: '',
      status: 'active', // Default status
      createdDate: new Date().toISOString(),
      // ... other default fields
    };
  } else if (entity.value) {
    // Initialize with existing entity data
    editForm.value = {
      name: entity.value.name,
      description: entity.value.description,
      status: entity.value.status,
      // ... other existing fields
    };
  }
};
```

#### 3.6 Edit Mode Management

- [ ] Initialize edit mode state
- [ ] Set edit mode to true when creating
- [ ] Handle edit mode in component lifecycle

```javascript
// Edit mode - will be set to true for creation in onMounted
const isEditing = ref(false);

// Initialize on mount
onMounted(() => {
  console.log('EntityDetail: Component mounted:', {
    entityId: entityId.value,
    isCreating: isCreating.value,
    hasEntityData: !!entity.value,
    timestamp: new Date().toISOString(),
  });

  // Start in edit mode if creating
  if (isCreating.value) {
    isEditing.value = true;
  }

  initEditForm();
});
```

#### 3.7 Save Operation

- [ ] Update save function to handle both creation and updates
- [ ] Use different API endpoints for create vs update
- [ ] Handle navigation after successful creation
- [ ] Add comprehensive logging

```javascript
// Save changes
const saveChanges = () => {
  isSaving.value = true;
  console.log('EntityDetail: Starting save operation:', {
    isCreating: isCreating.value,
    entityId: entityId.value,
    formData: editForm.value,
    timestamp: new Date().toISOString(),
  });

  const apiCall = isCreating.value
    ? api.entities.create(editForm.value)
    : api.entities.update(entityId.value, editForm.value);

  apiCall
    .then(response => {
      console.log('EntityDetail: API response received:', {
        success: response.success,
        hasData: !!response.data,
        error: response.error,
        isCreating: isCreating.value,
        entityId: entityId.value,
        timestamp: new Date().toISOString(),
      });

      if (response.success && response.data) {
        if (isCreating.value) {
          // Navigate to the newly created entity's detail page
          success(
            'Entity created',
            'The new entity has been created successfully'
          );
          router.push(`/entities/list/${response.data.id}`);
        } else {
          // Handle update success
          // Update local data and refresh cache
          // Exit edit mode
          // Show success message
        }
      } else {
        // Handle API errors
        const action = isCreating.value ? 'create' : 'save';
        showError(
          `Could not ${action}`,
          response.error?.message || `An error occurred while ${action}ing`
        );
      }
    })
    .catch(error => {
      // Handle exceptions
      console.error('EntityDetail: Save operation threw exception:', {
        error,
        errorMessage: error?.message,
        errorStack: error?.stack,
        isCreating: isCreating.value,
        entityId: entityId.value,
        formData: editForm.value,
        timestamp: new Date().toISOString(),
      });
    })
    .finally(() => {
      isSaving.value = false;
    });
};
```

#### 3.8 Cancel Operation

- [ ] Update cancel function to handle creation mode
- [ ] Navigate back to list when canceling creation
- [ ] Reset form when canceling edit

```javascript
// Cancel editing
const cancelEdit = () => {
  if (isCreating.value) {
    // If creating, go back to entity list
    router.push('/entities/list');
  } else {
    isEditing.value = false;
    initEditForm(); // Reset form to original values
  }
};
```

### 4. UI/Template Updates

#### 4.1 Page Title and Breadcrumbs

- [ ] Update page title to reflect creation mode
- [ ] Update breadcrumbs for creation context

```javascript
// Breadcrumbs
const breadcrumbs = computed(() => {
  if (isCreating.value) return 'Entities / Entity List / New Entity';
  if (!entity.value) return 'Entities / Entity List / Entity';
  return `Entities / Entity List / ${entity.value.name}`;
});

// Page title
const pageTitle = computed(() => {
  if (isCreating.value) return 'New Entity';
  return entity.value?.name || 'Entity';
});
```

#### 4.2 Conditional UI Elements

- [ ] Hide delete button when creating
- [ ] Update save button text for creation
- [ ] Hide tabs/sections that don't apply to new entities

```vue
<!-- Delete button - only show for existing entities -->
<Dialog v-if="!isCreating" v-model:open="showDeleteDialog">
  <!-- Delete dialog content -->
</Dialog>

<!-- Save button with dynamic text -->
<Button variant="default" :disabled="isSaving" @click="saveChanges">
  <Save class="mr-2 h-4 w-4" />
  {{ isSaving ? (isCreating ? 'Creating...' : 'Saving...') : (isCreating ? 'Create' : 'Save') }}
</Button>

<!-- Tabs - only show for existing entities -->
<Tabs v-if="!isCreating" default-value="details" class="w-full">
  <!-- Tab content -->
</Tabs>
```

#### 4.3 Data Display

- [ ] Handle undefined/null entity data in templates
- [ ] Use optional chaining for entity properties
- [ ] Provide fallback values where appropriate

```vue
<!-- Use optional chaining for entity properties -->
<p>{{ entity?.name }}</p>
<Badge :variant="getStatusVariant(entity?.status || 'active')">
  {{ getStatusText(entity?.status || 'active') }}
</Badge>
```

### 5. API Integration

#### 5.1 Create Endpoint

- [ ] Ensure API has a create endpoint
- [ ] Verify create endpoint returns the created entity with ID
- [ ] Test create endpoint with mock data

```javascript
// In api/index.ts
entities: {
  create: (data: Partial<Entity>) =>
    USE_MOCK_API
      ? (apiService as MockDataService).createEntity(data)
      : (apiService as ApiConfiguration).entities.create(data),
}
```

#### 5.2 Mock Service Implementation

- [ ] Implement create method in mock service
- [ ] Generate appropriate ID for new entities
- [ ] Return proper API response format

```javascript
// In mock-data.service.ts
async createEntity(data: Partial<Entity>): Promise<ApiResponse<Entity>> {
  const newEntity = {
    ...data,
    id: Math.max(...entitiesData.map(e => e.id)) + 1,
    createdDate: new Date().toISOString(),
  } as Entity;

  return this.mockRequest(newEntity);
}
```

### 6. Testing Checklist

#### 6.1 Navigation Testing

- [ ] "New" button navigates to correct URL
- [ ] URL shows `/entities/list/new`
- [ ] Route name is `entity-new`
- [ ] No API calls made on creation route

#### 6.2 Form Testing

- [ ] Form appears in edit mode when creating
- [ ] All fields are empty/have default values
- [ ] Form validation works for creation
- [ ] Save button shows "Create" text

#### 6.3 Save Testing

- [ ] Create operation calls correct API endpoint
- [ ] Success redirects to new entity detail page
- [ ] Error handling works for creation failures
- [ ] Loading states work correctly

#### 6.4 Cancel Testing

- [ ] Cancel button navigates back to list
- [ ] No data is saved when canceling
- [ ] Form resets properly

#### 6.5 Console Logging

- [ ] Creation mode detection logs correctly
- [ ] Route parameter logs show expected values
- [ ] API operation logs include creation context
- [ ] Error logs provide sufficient debugging info

### 7. Common Pitfalls to Avoid

- [ ] **Route Order**: Ensure `/new` route comes before `/:id` route
- [ ] **API Calls**: Don't make API calls when in creation mode
- [ ] **Form Initialization**: Handle both creation and edit scenarios
- [ ] **Navigation**: Use correct route names and paths
- [ ] **Error Handling**: Include creation context in error messages
- [ ] **UI State**: Properly manage edit mode for creation
- [ ] **Data Validation**: Ensure form validation works for new entities

### 8. Debugging Tips

#### 8.1 Console Logging

Add comprehensive logging to track:

- Route parameters and navigation
- Creation mode detection
- API call execution
- Form initialization
- Save operations

#### 8.2 Common Issues

- **Route not matching**: Check route order and path syntax
- **API errors**: Verify creation mode detection prevents unnecessary calls
- **Form not in edit mode**: Ensure edit mode is set in onMounted for creation
- **Save not working**: Check API endpoint and request format

## Example Implementation Files

### Router Configuration

```javascript
// router/router.ts
{
  path: '/boats/list/new',
  name: 'boat-new',
  component: BoatDetail,
},
{
  path: '/boats/list/:id',
  name: 'boat-detail',
  component: BoatDetail,
},
```

### List Component

```javascript
// BoatList.vue
const handleNewBoat = () => {
  router.push('/boats/list/new');
};
```

### Detail Component Key Sections

```javascript
// BoatDetail.vue
const isCreating = computed(() => route.name === 'boat-new');
const boatId = computed(() => route.params['id'] as string);

const { data: boat, loading, error } = useApiItem(
  () => api.boats.getById(boatId.value),
  { immediate: !isCreating.value }
);
```

This pattern provides a clean, maintainable way to handle entity creation while
reusing existing detail page components.
