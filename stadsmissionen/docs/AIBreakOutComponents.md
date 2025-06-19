# Component Extraction Guide: Breaking Out Large Views into Reusable Components

## Overview

This guide explains how to identify, extract, and organize components from large monolithic view files (like `ActivityDetail.vue`) into smaller, maintainable, and reusable components following the established patterns seen in `BoatDetail.vue`.

## Folder Structure Convention

```
src/components/
├── features/           # Domain-specific components
│   ├── activities/     # Activity-related components
│   ├── boats/         # Boat-related components
│   ├── users/         # User-related components
│   └── organization/  # Organization-related components
├── layout/            # Page layout components
├── shared/           # Cross-domain reusable components
├── common/           # Legacy/general components
└── ui/              # Base UI library components
```

## Component Identification Checklist

### ✅ **Identify Components to Extract**

**Large Card Sections:**
- [ ] Information cards with multiple fields (e.g., main entity information)
- [ ] Cards with both view and edit modes
- [ ] Cards with complex validation or formatting logic

**Tab Content:**
- [ ] Each tab content area should become its own component
- [ ] Tabs with forms or complex data display
- [ ] Tabs with specific business logic

**Repeated Patterns:**
- [ ] Similar data display patterns used elsewhere
- [ ] Form sections that could be reused
- [ ] Data tables with custom formatting

**Complex Template Logic:**
- [ ] Template sections with multiple v-if/v-else conditions
- [ ] Areas with complex computed properties
- [ ] Sections with local state management

### ✅ **Component Naming Convention**

**Format:** `{Domain}{Purpose}{Type}.vue`

**Examples:**
- `ActivityInformationCard.vue` - Main information display
- `ActivityAttendanceTab.vue` - Tab content for attendance
- `ActivityParticipantsTab.vue` - Tab content for participants
- `ActivityStatisticsTab.vue` - Tab content for statistics

### ✅ **Data Structure Analysis**

**Before Extraction:**
- [ ] List all data used in the section
- [ ] Identify computed properties specific to the section
- [ ] Note any local reactive state
- [ ] Document any watchers or lifecycle hooks used
- [ ] Identify any methods/functions used only in that section

**API Data Requirements:**
- [ ] Determine if API data structure needs changes
- [ ] Check if relational data loading is needed
- [ ] Verify if additional endpoints are required
- [ ] Ensure proper data caching strategies

## Step-by-Step Extraction Process

### 1. **Create Component Structure**

```bash
# Create feature-specific directory if it doesn't exist
mkdir -p src/components/features/activities

# Create index.ts for clean imports
touch src/components/features/activities/index.ts
```

### 2. **Extract Component Template**

**From:** Large view file
```vue
<!-- Extract this section -->
<Card>
  <CardHeader>
    <CardTitle>Activity Information</CardTitle>
  </CardHeader>
  <CardContent>
    <!-- Complex form/display logic -->
  </CardContent>
</Card>
```

**To:** New component file
```vue
<script setup lang="ts">
// Component-specific logic here
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Calendar class="h-5 w-5" />
        Activity Information
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Extracted content -->
    </CardContent>
  </Card>
</template>
```

### 3. **Define Props Interface**

**Template for component props:**
```typescript
interface Props {
  // Main entity data (optional for creation mode)
  activity?: Activity;

  // Edit state control
  isEditing: boolean;

  // Form data for editing (specific fields only)
  editForm: {
    Namn: string;
    Beskrivning: string;
    Plats: string;
    DatumTid: string;
    ActivityTypeID: number;
  };

  // Additional data if needed
  activityTypes?: ActivityType[];
}

interface Emits {
  // Form data updates
  (e: 'update:editForm', value: Props['editForm']): void;

  // Custom actions if needed
  (e: 'save'): void;
  (e: 'cancel'): void;
}
```

### 4. **Handle Data Binding**

**Two-way binding pattern:**
```typescript
const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Helper function for updating individual fields
const updateField = <K extends keyof Props['editForm']>(
  field: K,
  value: Props['editForm'][K]
) => {
  emit('update:editForm', {
    ...props.editForm,
    [field]: value,
  });
};
```

### 5. **Update Parent Component**

**Import the new components:**
```typescript
// Feature Components
import {
  ActivityInformationCard,
  ActivityAttendanceTab,
  ActivityParticipantsTab,
  ActivityStatisticsTab,
} from '@/components/features/activities';
```

**Replace template sections:**
```vue
<!-- Replace large inline section with component -->
<ActivityInformationCard
  :activity="activity"
  :is-editing="isEditing"
  :edit-form="{
    Namn: editForm.Namn,
    Beskrivning: editForm.Beskrivning,
    Plats: editForm.Plats,
    DatumTid: editForm.DatumTid,
    ActivityTypeID: editForm.ActivityTypeID,
  }"
  :activity-types="activityTypes"
  @update:edit-form="newForm => {
    editForm.Namn = newForm.Namn;
    editForm.Beskrivning = newForm.Beskrivning;
    editForm.Plats = newForm.Plats;
    editForm.DatumTid = newForm.DatumTid;
    editForm.ActivityTypeID = newForm.ActivityTypeID;
  }"
/>
```

### 6. **Create Index File**

**In `src/components/features/activities/index.ts`:**
```typescript
export { default as ActivityInformationCard } from './ActivityInformationCard.vue';
export { default as ActivityAttendanceTab } from './ActivityAttendanceTab.vue';
export { default as ActivityParticipantsTab } from './ActivityParticipantsTab.vue';
export { default as ActivityStatisticsTab } from './ActivityStatisticsTab.vue';
```

## API Data Considerations

### ✅ **Before Component Extraction**

**Current API Pattern (ActivityDetail.vue):**
- [ ] Single API call with include relations: `{ include: ['types', 'participants', 'attendances'] }`
- [ ] All data loaded at parent level
- [ ] Complex computed properties for data transformation
- [ ] Direct data mutation in parent

### ✅ **After Component Extraction**

**Optimized API Pattern:**
- [ ] Keep relational data loading at parent level
- [ ] Pass specific data subsets to child components
- [ ] Move data transformations to appropriate child components
- [ ] Use proper prop drilling for deep data access

**Data Flow Pattern:**
```typescript
// Parent component (ActivityDetail.vue)
const {
  data: activityWithRelations,
  loading: isLoading,
  error: activityError,
  refresh: refreshActivity,
} = useApiItem(
  () => api.activities.getById(activityId.value, {
    include: ['types', 'participants', 'attendances']
  }),
  { cacheKey: `activity-with-relations-${activityId.value}` }
);

// Extract specific data for child components
const activity = computed(() => activityWithRelations.value);
const attendances = computed(() => activityWithRelations.value?.attendances || []);
const participants = computed(() => activityWithRelations.value?.participants || []);
```

## Common Pitfalls and Solutions

### ❌ **Avoid These Mistakes**

1. **Over-extraction:** Don't create components for every small section
2. **Under-extraction:** Don't leave complex logic in large components
3. **Wrong props:** Don't pass entire parent state as props
4. **API changes:** Don't modify API structure without checking all consumers
5. **Missing types:** Don't forget to define proper TypeScript interfaces

### ✅ **Best Practices**

1. **Single Responsibility:** Each component should have one clear purpose
2. **Minimal Props:** Only pass data that the component actually needs
3. **Clear Naming:** Component names should clearly indicate their purpose
4. **Consistent Patterns:** Follow established patterns in the codebase
5. **Proper Testing:** Ensure extracted components work in isolation

## Testing Checklist

### ✅ **After Component Extraction**

**Functionality Testing:**
- [ ] All features work the same as before extraction
- [ ] Edit mode works correctly
- [ ] Form validation still functions
- [ ] API calls and data updates work properly
- [ ] Navigation and routing remain intact

**Component Testing:**
- [ ] Component renders correctly with minimum required props
- [ ] Component handles missing/undefined data gracefully
- [ ] Component emits events correctly
- [ ] Component updates parent state properly

**Integration Testing:**
- [ ] Parent component imports work correctly
- [ ] Props are passed correctly
- [ ] Event handling works as expected
- [ ] No TypeScript errors
- [ ] No console errors or warnings

## Example: ActivityDetail.vue Extraction Plan

### Components to Extract:

1. **ActivityInformationCard.vue**
   - Main activity information display/edit
   - Props: `activity`, `isEditing`, `editForm`, `activityTypes`

2. **ActivityAttendanceTab.vue**
   - Attendance table and statistics
   - Props: `attendances`, `participants`

3. **ActivityParticipantsTab.vue**
   - Participants list with attendance status
   - Props: `participants`, `attendances`

4. **ActivityStatisticsTab.vue**
   - Statistics cards and detailed analytics
   - Props: `stats`, `activity`, `attendances`, `participants`

### Data Requirements:
- No API changes needed (current relational loading is sufficient)
- Move computed properties to appropriate child components
- Keep form state management at parent level

## Completion Checklist

### ✅ **Component Creation**
- [ ] Created feature directory: `src/components/features/{domain}/`
- [ ] Created individual component files with proper naming
- [ ] Created index.ts export file
- [ ] Added proper TypeScript interfaces for props and emits

### ✅ **Component Implementation**
- [ ] Extracted template sections correctly
- [ ] Implemented proper prop handling
- [ ] Added event emission for data updates
- [ ] Moved relevant computed properties and methods
- [ ] Added proper imports and dependencies

### ✅ **Parent Component Updates**
- [ ] Added component imports
- [ ] Replaced template sections with new components
- [ ] Updated prop binding
- [ ] Added event handlers for component emissions
- [ ] Removed unused code and imports

### ✅ **Quality Assurance**
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All functionality works as before
- [ ] Components render correctly in both view and edit modes
- [ ] Data updates and API calls work properly
- [ ] Clean, readable code with proper organization

---

**Remember:** The goal is to make code more maintainable and reusable while preserving all existing functionality. Take it step by step and test thoroughly after each extraction.
