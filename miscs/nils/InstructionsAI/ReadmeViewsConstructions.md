# Views Documentation

This directory contains all the application's view components that serve as the main pages in our Vue.js application. Views are the top-level components that represent distinct routes and are composed using reusable UI components and custom components.

## Architecture Overview

Views in this application follow a modular architecture pattern:

```
src/
├── views/                    # Main view components (this directory)
│   ├── Dashboard.vue
│   ├── Customers.vue
│   ├── CustomerDetails.vue
│   ├── Settings.vue
│   ├── Test.vue
│   └── Contacts.vue
├── components/
│   ├── ui/                   # Base UI components (shadcn/ui style)
│   └── custom/               # Custom business logic components
└── router/
    └── router.ts            # Route definitions and navigation config
```

## Component Architecture

### 1. UI Components (`components/ui/`)

Base UI components provide foundational building blocks:
- **Form elements**: `input/`, `button/`, `select/`, `checkbox/`, etc.
- **Layout components**: `card/`, `dialog/`, `sheet/`, `table/`, etc.
- **Feedback components**: `alert/`, `toast/`, `badge/`, etc.
- **Navigation**: `navigation-menu/`, `breadcrumb/`, `pagination/`

These components are typically unstyled or minimally styled and focus on functionality.

### 2. Custom Components (`components/custom/`)

Custom components encapsulate business logic and provide reusable patterns:
- **PageLayout.vue**: Standard page wrapper with breadcrumbs, stats, and title
- **DataTable.vue**: Feature-rich table with sorting, filtering, and actions
- **ViewControls.vue**: Search and filter bar with action buttons
- **DashboardCard.vue**: Card component for dashboard metrics
- **ProspectorChat.vue**: Chat interface component
- **StatusNotification.vue**: Application-wide notifications

### 3. View Construction Pattern

Views should follow this structure:

```vue
<script setup lang="ts">
// 1. Imports
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { someStore } from '@/stores/someStore'

// UI components (as needed)
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Custom components (primary building blocks)
import PageLayout from '@/components/custom/PageLayout.vue'
import DataTable from '@/components/custom/DataTable.vue'

// 2. Composables and stores
const router = useRouter()
const store = someStore()

// 3. Component logic
const someComputedValue = computed(() => store.someValue)

// 4. Methods
function handleAction() {
  // Handle user interactions
}
</script>

<template>
  <!-- Always wrap in PageLayout for consistency -->
  <PageLayout
    title="Page Title"
    breadcrumbs="Home / Section / Page"
    :show-stats="true"
    :stats="stats"
  >
    <!-- Page content using custom and UI components -->
    <DataTable
      :data="data"
      :columns="columns"
      @row-click="handleRowClick"
    />
  </PageLayout>
</template>
```

## Router Integration

Views are connected to the application through the router system defined in `src/router/router.ts`.

### Route Definition Structure

Each route is defined in the `routeDefinitions` array:

```typescript
{
  path: '/route-path',
  name: 'route-name',
  component: ViewComponent,
  navigation: {
    name: 'Display Name',
    icon: IconComponent
  } // Optional: include for nav menu
}
```

### Navigation Configuration

- **Visible in Navigation**: Routes with a `navigation` property appear in the main navigation menu
- **Hidden Routes**: Routes without `navigation` (like detail pages) don't appear in nav
- **Navigation Items**: Auto-generated from `routeDefinitions` with navigation properties

Example from router:
```typescript
{
  path: '/customers',
  name: 'customers',
  component: Customers,
  navigation: { name: 'Kunder', icon: Users }
}, // ✅ Appears in navigation

{
  path: '/customers/:id',
  name: 'customer-details',
  component: CustomerDetails
  // ❌ No navigation property = hidden from nav
}
```

## Creating New Views

### 1. Create the View Component

```bash
# Create new view file
touch src/views/NewView.vue
```

### 2. Basic View Template

```vue
<script setup lang="ts">
import PageLayout from '@/components/custom/PageLayout.vue'
// Import other components as needed

// Component logic here
</script>

<template>
  <PageLayout
    title="New View"
    breadcrumbs="Home / New View"
  >
    <!-- Your view content -->
  </PageLayout>
</template>
```

### 3. Add Route Definition

In `src/router/router.ts`, add to `routeDefinitions`:

```typescript
{
  path: '/new-view',
  name: 'new-view',
  component: () => import('@/views/NewView.vue'), // Lazy loading
  navigation: { name: 'New View', icon: SomeIcon } // Optional
}
```

### 4. Import Dependencies

Add necessary imports at the top of `router.ts`:

```typescript
import NewView from '@/views/NewView.vue'
import { SomeIcon } from 'lucide-vue-next' // If adding to navigation
```

## Modifying Existing Views

### Changing View Content
1. Edit the view file directly in `src/views/`
2. Follow the established patterns using `PageLayout` and custom components
3. Update any necessary stores or composables

### Changing Navigation
1. Modify the `navigation` property in `routeDefinitions`
2. Update icon imports if changing icons
3. Navigation updates automatically from route definitions

### Changing Routes
1. Update the `path` in the route definition
2. Update any `router.push()` calls that reference the old path
3. Update any `router-link` `to` attributes

## Deleting Views

### 1. Remove Route Definition
Remove the route object from `routeDefinitions` in `router.ts`

### 2. Remove Component Import
Remove the import statement for the view component

### 3. Delete View File
```bash
rm src/views/ViewToDelete.vue
```

### 4. Update References
- Remove any `router.push()` calls to the deleted route
- Remove any `router-link` references
- Update any parent components that may reference the view

## Best Practices

### 1. Consistent Layout
- Always use `PageLayout` as the root component
- Provide meaningful titles and breadcrumbs
- Include stats when relevant

### 2. Component Composition
- Prefer custom components over multiple UI components
- Keep views focused on orchestration, not implementation details
- Use stores for data management

### 3. Routing
- Use descriptive route names and paths
- Group related routes (e.g., `/customers` and `/customers/:id`)
- Only include `navigation` for top-level routes

### 4. Performance
- Use lazy loading for routes: `component: () => import('@/views/SomeView.vue')`
- Keep views lightweight by delegating complex logic to stores and composables

### 5. Naming Conventions
- View files: PascalCase (e.g., `CustomerDetails.vue`)
- Route names: kebab-case (e.g., `customer-details`)
- Route paths: kebab-case (e.g., `/customer-details`)

## Dependencies

Views depend on:

1. **Vue Router**: For routing and navigation
2. **Pinia Stores**: For state management
3. **UI Components**: From `@/components/ui/`
4. **Custom Components**: From `@/components/custom/`
5. **Lucide Icons**: For navigation icons
6. **Composables**: For reusable logic

## Examples

See existing views for implementation patterns:
- **Dashboard.vue**: Simple layout with cards and stats
- **Customers.vue**: Data table with filtering and actions
- **CustomerDetails.vue**: Detail view with tabs and forms
- **Settings.vue**: Form-heavy view with sections

## Troubleshooting

### Navigation Not Updating
- Check that the route has a `navigation` property
- Verify the component is imported in router.ts
- Ensure the icon is imported from lucide-vue-next

### Route Not Found
- Verify the route is in `routeDefinitions`
- Check for typos in route name/path
- Ensure component import path is correct

### Component Not Rendering
- Check that the view file exists and exports default
- Verify all imported components exist
- Check browser console for errors
