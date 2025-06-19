# AI View Creation Checklist

This document outlines the complete process for creating new views and integrating them into the sidebar navigation system.

## 📋 **Complete Checklist**

### **Phase 1: Planning & Design**

- [ ] **Define View Purpose**
  - [ ] Determine the main functionality of the view
  - [ ] Decide if it needs subitems/dropdown structure
  - [ ] Define user permissions (H, A, SA)

- [ ] **Choose Icons**
  - [ ] Select main icon from `lucide-vue-next`
  - [ ] Select subitem icons if using dropdown
  - [ ] Verify icons are available in the library

- [ ] **Plan Route Structure**
  - [ ] Define main route path (e.g., `/my-feature`)
  - [ ] Define subitem paths if needed (e.g., `/my-feature/sub1`)
  - [ ] Ensure paths don't conflict with existing routes

### **Phase 2: Create View Files**

- [ ] **Create Main View File**
  - [ ] Create `src/views/YourViewName.vue`
  - [ ] Add basic Vue template structure
  - [ ] Include proper styling with Tailwind CSS
  - [ ] Add navigation elements if needed

- [ ] **Create Subview Files (if applicable)**
  - [ ] Create additional `.vue` files for each subitem
  - [ ] Include back navigation to main view
  - [ ] Maintain consistent styling and layout

- [ ] **View File Template Structure**
  ```vue
  <template>
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Back navigation (for subviews) -->
        <div class="flex items-center gap-4 mb-6">
          <router-link to="/parent-path" class="text-primary hover:text-primary/80 transition-colors">
            ← Back to Parent
          </router-link>
        </div>
        
        <!-- Main content -->
        <h1 class="text-3xl font-bold text-gray-900 mb-6">View Title</h1>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <!-- Your content here -->
        </div>
      </div>
    </div>
  </template>

  <script setup lang="ts">
  // Your script logic here
  </script>
  ```

### **Phase 3: Update Router Configuration**

- [ ] **Add Icon Imports**
  - [ ] Open `src/router/router.ts`
  - [ ] Add required icons to the import statement from `lucide-vue-next`
  ```typescript
  import {
    // ... existing icons,
    YourIcon,
    SubIcon,
  } from 'lucide-vue-next';
  ```

- [ ] **Add View Imports**
  - [ ] Add dynamic imports for all view components
  ```typescript
  // Your views
  const YourViewName = () => import('@/views/YourViewName.vue');
  const YourSubView1 = () => import('@/views/YourSubView1.vue');
  const YourSubView2 = () => import('@/views/YourSubView2.vue');
  ```

- [ ] **Add Route Definitions**
  - [ ] Add route objects to `routeDefinitions` array
  - [ ] Include navigation configuration for sidebar integration

### **Phase 4: Route Definition Structure**

- [ ] **Simple View (No Dropdown)**
  ```typescript
  {
    path: '/your-route',
    name: 'your-route',
    component: YourViewName,
    navigation: {
      name: 'Display Name',
      icon: YourIcon,
      section: 'main', // or 'bottom'
      permissions: ['H', 'A', 'SA'], // Adjust as needed
    },
  },
  ```

- [ ] **View with Dropdown Subitems**
  ```typescript
  {
    path: '/your-route',
    name: 'your-route',
    component: YourViewName,
    navigation: {
      name: 'Display Name',
      icon: YourIcon,
      section: 'main', // or 'bottom'
      permissions: ['H', 'A', 'SA'],
      dropdown: [
        {
          name: 'Section Name',
          icon: YourIcon,
          children: [
            {
              name: 'Subitem 1',
              path: '/your-route/sub1',
              icon: SubIcon,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Subitem 2',
              path: '/your-route/sub2',
              icon: SubIcon,
              permissions: ['H', 'A', 'SA'],
            },
          ],
        },
      ],
    },
  },
  ```

- [ ] **Add Subitem Routes**
  ```typescript
  {
    path: '/your-route/sub1',
    name: 'your-route-sub1',
    component: YourSubView1,
  },
  {
    path: '/your-route/sub2',
    name: 'your-route-sub2',
    component: YourSubView2,
  },
  ```

### **Phase 5: Configuration Options**

- [ ] **Navigation Section**
  - [ ] `'main'` - Places item in main navigation area
  - [ ] `'bottom'` - Places item in bottom navigation area

- [ ] **Permission Levels**
  - [ ] `'H'` - Handläggare (Handler)
  - [ ] `'A'` - Administratör (Administrator)
  - [ ] `'SA'` - Systemadministratör (System Administrator)
  - [ ] Use array like `['H', 'A', 'SA']` for multiple permissions

### **Phase 6: Testing & Validation**

- [ ] **Test Navigation**
  - [ ] Verify menu item appears in sidebar
  - [ ] Test dropdown expansion (if applicable)
  - [ ] Test navigation to all routes

- [ ] **Test Responsive Design**
  - [ ] Check mobile responsiveness
  - [ ] Verify styling consistency
  - [ ] Test on different screen sizes

- [ ] **Test Permissions**
  - [ ] Verify correct users can access the view
  - [ ] Test permission restrictions work correctly

- [ ] **Test Routing**
  - [ ] Test direct URL access
  - [ ] Test navigation between subviews
  - [ ] Test back button functionality

### **Phase 7: Code Review & Cleanup**

- [ ] **Review Code Quality**
  - [ ] Check for TypeScript errors
  - [ ] Verify proper component structure
  - [ ] Ensure consistent naming conventions

- [ ] **Clean Up**
  - [ ] Remove any debug code
  - [ ] Add proper comments where needed
  - [ ] Verify all imports are used

## 🎯 **Quick Reference**

### **Common Icons Used in Project**
- `LayoutDashboard` - Dashboard views
- `Calendar` - Activity/event related
- `Users` - User/participant management
- `ClipboardList` - Lists, orders, tasks
- `BarChart3` - Reports, statistics
- `Settings` - Configuration views
- `Package` - General content/features
- `Tag` - Categories, labels
- `FileText` - Documents, reports

### **File Locations**
- **Views**: `src/views/YourViewName.vue`
- **Router**: `src/router/router.ts`
- **Navigation**: Automatically generated from router configuration

### **Naming Conventions**
- **Files**: PascalCase (e.g., `MyNewView.vue`)
- **Routes**: kebab-case (e.g., `/my-new-view`)
- **Components**: PascalCase in imports

## ⚠️ **Common Issues & Solutions**

### **Icon Not Showing**
- Verify icon is imported from `lucide-vue-next`
- Check spelling of icon name
- Ensure icon exists in the library

### **Route Not Working**
- Check path spelling in route definition
- Verify component import path is correct
- Ensure route name is unique

### **Menu Item Not Appearing**
- Verify `navigation` object is properly configured
- Check `section` value is 'main' or 'bottom'
- Ensure user has required permissions

### **Dropdown Not Expanding**
- Verify `dropdown` array structure is correct
- Check `children` array exists and has proper format
- Ensure NavigationSidebar component is handling dropdown correctly

## 🚀 **Example Implementation**

See the `Placeholder` implementation in this project as a complete example that follows all these steps:
- `src/views/Placeholder.vue`
- `src/views/Placeholder1.vue`
- `src/views/Placeholder2.vue`
- Router configuration in `src/router/router.ts`

---

**💡 Pro Tip**: Always test your implementation thoroughly before considering it complete. The navigation system is critical for user experience! 