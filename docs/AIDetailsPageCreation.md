# AI Details Page Creation Guide

This guide provides a comprehensive checklist for creating detail pages for
objects from list pages, following the established patterns in the codebase.
This guide is based on the `ActivityDetail.vue` implementation and can be
adapted for any entity type.

## 📋 Prerequisites Checklist

- [ ] Entity type is defined in `src/types/index.ts`
- [ ] API endpoints exist for the entity (CRUD operations)
- [ ] List page exists and is functional
- [ ] Router configuration includes detail route pattern

## 🏗️ Architecture Overview

Detail pages follow this structure:

1. **Data Layer**: API calls via composables
2. **State Management**: Reactive data with loading/error states
3. **UI Components**: Reusable components from `components/shared/`,
   `components/common/`, and `components/ui/`
4. **Actions**: Edit, delete, and navigation functionality

## 📁 File Structure

```
src/
├── views/
│   └── [Entity]Detail.vue          # Main detail page
├── components/
│   ├── shared/                     # Reusable business components
│   │   ├── DataTable.vue          # For related data tables
│   │   ├── ViewControls.vue       # Search/filter controls
│   │   └── ViewControls.vue    # Advanced filtering
│   ├── common/                     # Generic UI components
│   │   ├── LoadingSpinner.vue     # Loading states
│   │   └── ErrorBoundary.vue      # Error handling
│   ├── layout/
│   │   └── PageLayout.vue         # Page wrapper with stats
│   └── ui/                        # Base UI components
├── composables/
│   ├── useApi.ts                  # API data management
│   ├── useToast.ts               # Toast notifications
│   └── useValidation.ts          # Form validation
└── api/
    └── index.ts                   # API service definitions
```

## 🚀 Implementation Checklist

### 1. Setup and Imports

- [ ] **Import Vue Composition API**

  ```typescript
  import { computed, onMounted, ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  ```

- [ ] **Import Layout Components**

  ```typescript
  import PageLayout from '@/components/layout/PageLayout.vue';
  ```

- [ ] **Import Shared Components**

  ```typescript
  import DataTable from '@/components/shared/DataTable.vue';
  // Optional: ViewControls for complex data
  ```

- [ ] **Import UI Components**

  ```typescript
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from '@/components/ui/card';
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from '@/components/ui/tabs';
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '@/components/ui/dialog';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Textarea } from '@/components/ui/textarea';
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
  ```

- [ ] **Import Icons**

  ```typescript
  import {
    ArrowLeft,
    BarChart3,
    Calendar,
    Clock,
    Edit,
    MapPin,
    Save,
    Trash2,
    UserCheck,
    UserX,
    Users,
    X,
  } from 'lucide-vue-next';
  ```

- [ ] **Import Composables and API**
  ```typescript
  import { useApiItem, useApiList } from '@/composables/useApi';
  import { useToast } from '@/composables/useToast';
  import api from '@/api';
  import type { YourEntity, RelatedEntity } from '@/types';
  ```

### 2. Data Management Setup

- [ ] **Define Local Interfaces** (if needed for complex related data)

  ```typescript
  interface RelatedData {
    id: number;
    name: string;
    // ... other properties
  }
  ```

- [ ] **Setup Route and Router**

  ```typescript
  const route = useRoute();
  const router = useRouter();
  const { success, error: showError } = useToast();
  ```

- [ ] **Get Entity ID from Route**

  ```typescript
  const entityId = computed(() => route.params['id'] as string);
  ```

- [ ] **Fetch Main Entity with Relations**

  ```typescript
  const {
    data: entityWithRelations,
    loading: isLoading,
    error: entityError,
    refresh: refreshEntity,
  } = useApiItem(
    () =>
      api.yourEntities.getById(entityId.value, {
        include: ['relatedData1', 'relatedData2'],
      }),
    {
      cacheKey: `entity-with-relations-${entityId.value}`,
    }
  );
  ```

- [ ] **Extract Related Data**

  ```typescript
  const entity = computed(() => entityWithRelations.value);
  const relatedData1 = computed(
    () => entityWithRelations.value?.relatedData1 || []
  );
  const relatedData2 = computed(
    () => entityWithRelations.value?.relatedData2 || []
  );
  ```

- [ ] **Fetch Additional Reference Data** (if needed)

  ```typescript
  const {
    data: referenceData,
    loading: referenceLoading,
    error: referenceError,
  } = useApiList<ReferenceType>(() => api.referenceTypes.getAll(), {
    cacheKey: 'referenceTypes',
  });
  ```

- [ ] **Setup Error Handling**
  ```typescript
  const hasError = computed(
    () => entityError.value !== null || referenceError.value !== null
  );
  ```

### 3. Statistics and Computed Data

- [ ] **Calculate Statistics**

  ```typescript
  const stats = computed(() => {
    if (!entity.value || !relatedData1.value) {
      return [
        { title: 'Total Items', value: 0, color: 'blue' },
        { title: 'Active Items', value: 0, color: 'green' },
        { title: 'Inactive Items', value: 0, color: 'red' },
        { title: 'Success Rate', value: '0%', color: 'purple' },
      ];
    }

    const total = relatedData1.value.length;
    const active = relatedData1.value.filter(item => item.isActive).length;
    const inactive = total - active;
    const successRate = total > 0 ? Math.round((active / total) * 100) : 0;

    return [
      { title: 'Total Items', value: total, color: 'blue' },
      { title: 'Active Items', value: active, color: 'green' },
      { title: 'Inactive Items', value: inactive, color: 'red' },
      { title: 'Success Rate', value: `${successRate}%`, color: 'purple' },
    ];
  });
  ```

### 4. Edit Functionality

- [ ] **Setup Edit State**

  ```typescript
  const isEditing = ref(false);
  const isSaving = ref(false);
  const editForm = ref({
    name: '',
    description: '',
    // ... other editable fields
  });
  ```

- [ ] **Date Formatting Helper** (if needed)

  ```typescript
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  ```

- [ ] **Initialize Edit Form**

  ```typescript
  const initEditForm = () => {
    if (entity.value) {
      editForm.value = {
        name: entity.value.name,
        description: entity.value.description ?? '',
        // ... other fields
      };
    }
  };
  ```

- [ ] **Save Changes Function**

  ```typescript
  const saveChanges = () => {
    if (!entity.value) return;

    isSaving.value = true;

    api.yourEntities
      .update(entityId.value, editForm.value)
      .then(response => {
        if (response.success && response.data) {
          // Update local data immediately
          if (entityWithRelations.value) {
            Object.assign(entityWithRelations.value, response.data);
          }

          // Refresh cache
          refreshEntity();
          isEditing.value = false;
          success('Entity Updated', 'Changes saved successfully');
        } else {
          showError(
            'Save Failed',
            response.error?.message || 'An error occurred'
          );
        }
      })
      .catch(error => {
        console.error('Error saving changes:', error);
        showError('Save Failed', 'An unexpected error occurred');
      })
      .finally(() => {
        isSaving.value = false;
      });
  };
  ```

- [ ] **Edit Mode Controls**

  ```typescript
  const startEdit = () => {
    initEditForm();
    isEditing.value = true;
  };

  const cancelEdit = () => {
    isEditing.value = false;
    initEditForm();
  };
  ```

### 5. Delete Functionality

- [ ] **Setup Delete State**

  ```typescript
  const isDeleting = ref(false);
  const showDeleteDialog = ref(false);
  ```

- [ ] **Delete Function**

  ```typescript
  const deleteEntity = () => {
    if (!entity.value) return;

    isDeleting.value = true;

    api.yourEntities
      .delete(entityId.value)
      .then(response => {
        if (response.success) {
          success('Entity Deleted', 'Entity has been deleted successfully');
          router.push('/your-entities'); // Navigate back to list
        } else {
          showError(
            'Delete Failed',
            response.error?.message || 'An error occurred'
          );
        }
      })
      .catch(error => {
        console.error('Error deleting entity:', error);
        showError('Delete Failed', 'An unexpected error occurred');
      })
      .finally(() => {
        isDeleting.value = false;
        showDeleteDialog.value = false;
      });
  };
  ```

### 6. Navigation and Utility Functions

- [ ] **Navigation Functions**

  ```typescript
  const goBack = () => {
    router.push('/your-entities');
  };
  ```

- [ ] **Date Formatting**

  ```typescript
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  ```

### 7. Data Table Configuration (for related data)

- [ ] **Define Table Columns**

  ```typescript
  const relatedDataColumns = [
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: 'Actions' },
  ];
  ```

- [ ] **Prepare Table Data**

  ```typescript
  const relatedTableData = computed(() => {
    if (!relatedData1.value) return [];

    return relatedData1.value.map(item => ({
      id: item.id,
      name: item.name,
      status: item.isActive,
      createdAt: item.createdAt,
      // ... other fields
    }));
  });
  ```

### 8. Component Lifecycle

- [ ] **Initialize on Mount**

  ```typescript
  onMounted(() => {
    initEditForm();
  });
  ```

- [ ] **Setup Breadcrumbs**
  ```typescript
  const breadcrumbs = computed(() => {
    if (!entity.value) return 'Entities / Entity';
    return `Entities / ${entity.value.name}`;
  });
  ```

## 🎨 Template Structure Checklist

### 1. Page Layout Wrapper

- [ ] **Use PageLayout Component**
  ```vue
  <PageLayout
    :title="entity?.name || 'Entity'"
    :breadcrumbs="breadcrumbs"
    show-stats
    :stats="stats"
  ></PageLayout>
  ```

### 2. Loading and Error States

- [ ] **Loading State**

  ```vue
  <div v-if="isLoading" class="flex items-center justify-center py-12">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
      <p class="text-muted-foreground">Loading entity...</p>
    </div>
  </div>
  ```

- [ ] **Error State**

  ```vue
  <div v-else-if="hasError" class="flex items-center justify-center py-12">
    <div class="text-center">
      <p class="text-destructive mb-2">An error occurred while loading entity</p>
      <Button variant="outline" @click="refreshEntity">
        Try Again
      </Button>
    </div>
  </div>
  ```

- [ ] **Not Found State**
  ```vue
  <div v-else-if="!entity" class="flex items-center justify-center h-64">
    <div class="text-center">
      <h3 class="text-lg font-semibold text-muted-foreground">Entity not found</h3>
      <p class="text-sm text-muted-foreground mt-2">The requested entity could not be found.</p>
      <Button class="mt-4" @click="goBack">
        <ArrowLeft class="mr-2 h-4 w-4" />
        Back to Entities
      </Button>
    </div>
  </div>
  ```

### 3. Header Actions

- [ ] **Action Buttons**

  ```vue
  <div class="flex items-center justify-between">
    <Button variant="outline" @click="goBack">
      <ArrowLeft class="mr-2 h-4 w-4" />
      Back
    </Button>

    <div class="flex gap-2">
      <template v-if="!isEditing">
        <Button variant="outline" @click="startEdit">
          <Edit class="mr-2 h-4 w-4" />
          Edit
        </Button>
        <Dialog v-model:open="showDeleteDialog">
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 class="mr-2 h-4 w-4" />
              Delete
            </Button>
          </DialogTrigger>
          <!-- Delete dialog content -->
        </Dialog>
      </template>
      <template v-else>
        <Button variant="default" @click="saveChanges" :disabled="isSaving">
          <Save class="mr-2 h-4 w-4" />
          {{ isSaving ? 'Saving...' : 'Save' }}
        </Button>
        <Button variant="outline" @click="cancelEdit" :disabled="isSaving">
          <X class="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </template>
    </div>
  </div>
  ```

### 4. Main Information Card

- [ ] **Entity Information Display**
  ```vue
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Calendar class="h-5 w-5" />
        Entity Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="!isEditing" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Display mode fields -->
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Edit mode fields -->
      </div>
    </CardContent>
  </Card>
  ```

### 5. Tabbed Content (if applicable)

- [ ] **Tabs Component**

  ```vue
  <Tabs default-value="related-data" class="w-full">
    <TabsList class="grid w-full grid-cols-3">
      <TabsTrigger value="related-data" class="flex items-center gap-2">
        <Users class="h-4 w-4" />
        Related Data
      </TabsTrigger>
      <TabsTrigger value="details" class="flex items-center gap-2">
        <Calendar class="h-4 w-4" />
        Details
      </TabsTrigger>
      <TabsTrigger value="statistics" class="flex items-center gap-2">
        <BarChart3 class="h-4 w-4" />
        Statistics
      </TabsTrigger>
    </TabsList>
  
    <TabsContent value="related-data">
      <!-- DataTable or related content -->
    </TabsContent>
    <!-- Other tabs -->
  </Tabs>
  ```

### 6. Data Tables for Related Data

- [ ] **DataTable Implementation**
  ```vue
  <Card>
    <CardHeader>
      <CardTitle>Related Data</CardTitle>
    </CardHeader>
    <CardContent>
      <DataTable
        :data="relatedTableData"
        :columns="relatedDataColumns"
      >
        <template #status="{ item }">
          <Badge :variant="item.status ? 'default' : 'destructive'">
            {{ item.status ? 'Active' : 'Inactive' }}
          </Badge>
        </template>
        <template #createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
      </DataTable>
    </CardContent>
  </Card>
  ```

### 7. Delete Confirmation Dialog

- [ ] **Delete Dialog**
  ```vue
  <Dialog v-model:open="showDeleteDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Entity</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{{ entity.name }}"?
          This action cannot be undone and will remove all related data.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="showDeleteDialog = false" :disabled="isDeleting">
          Cancel
        </Button>
        <Button variant="destructive" @click="deleteEntity" :disabled="isDeleting">
          <Trash2 class="mr-2 h-4 w-4" />
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  ```

## 🔧 Component Usage Guidelines

### Shared Components Priority

1. **`DataTable`** - For any tabular data display

   - Supports sorting, filtering, pagination
   - Custom cell templates via slots
   - Row click handling

2. **`ViewControls`** - For search and filter controls

   - Search input with debouncing
   - Filter dropdowns
   - Action buttons

3. **`ViewControls`** - Advanced filtering
   - Multiple filter types
   - Searchbar functionality
   - Diverse action buttons

### Common Components

1. **`LoadingSpinner`** - For loading states

   - Different sizes and variants
   - Optional text display
   - Full-screen option

2. **`ErrorBoundary`** - For error handling
   - Graceful error display
   - Retry functionality

### UI Components

Use components from `@/components/ui/` for all basic UI elements:

- Forms: `Input`, `Textarea`, `Select`, `Label`
- Layout: `Card`, `Tabs`, `Dialog`
- Actions: `Button`, `Badge`
- Icons: Import from `lucide-vue-next`

## 🚨 Common Pitfalls to Avoid

- [ ] **Don't forget error handling** - Always handle API errors gracefully
- [ ] **Don't skip loading states** - Users need feedback during data fetching
- [ ] **Don't hardcode entity names** - Make the component reusable
- [ ] **Don't forget to refresh cache** - Update cache after mutations
- [ ] **Don't skip form validation** - Validate data before saving
- [ ] **Don't forget responsive design** - Use grid layouts that work on mobile
- [ ] **Don't skip accessibility** - Use proper ARIA labels and semantic HTML

## 🎯 Final Checklist

- [ ] All imports are correctly configured
- [ ] Data fetching with error handling is implemented
- [ ] Edit functionality works correctly
- [ ] Delete functionality with confirmation is implemented
- [ ] Navigation functions work properly
- [ ] Loading and error states are handled
- [ ] Statistics are calculated and displayed
- [ ] Related data is properly displayed
- [ ] Form validation is implemented (if applicable)
- [ ] Responsive design is tested
- [ ] Component follows established patterns
- [ ] Code is properly typed with TypeScript
- [ ] Toast notifications work for user feedback

## 📚 Additional Resources

- Review `ActivityDetail.vue` for a complete implementation example
- Check `ActivityList.vue` for list page integration patterns
- Refer to `ARCHITECTURE.md` for overall project structure
- See `src/api/README.md` for API usage patterns
- Check component documentation in respective files

This guide ensures consistency across all detail pages while maintaining
flexibility for entity-specific requirements.
