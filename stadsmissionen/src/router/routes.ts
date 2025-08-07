import type { RouteRecordRaw } from 'vue-router';

// Lazy load all views
const LoginForm = () => import('@/views/LoginForm.vue');

// User management
const UserList = () => import('@/views/UserList.vue');
const UserDetail = () => import('@/views/UserDetail.vue');
const PermissionGroups = () => import('@/views/PermissionGroups.vue');

// Boat storage system
const CustomerList = () => import('@/views/CustomerList.vue');
const CustomerDetail = () => import('@/views/CustomerDetail.vue');
const ContactList = () => import('@/views/ContactList.vue');
const ContactDetail = () => import('@/views/ContactDetail.vue');
const BoatList = () => import('@/views/BoatList.vue');
const BoatDetail = () => import('@/views/BoatDetail.vue');
const BoatPlacement = () => import('@/views/BoatPlacement.vue');
const BoatLager2 = () => import('@/views/BoatLager2.vue');

// Storage management
const StorageLocationList = () => import('@/views/StorageLocationList.vue');
const StorageLocationDetail = () => import('@/views/StorageLocationDetail.vue');

// Development
const CustomComponents = () => import('@/views/CustomComponents.vue');
const TooltipDemo = () => import('@/views/TooltipDemo.vue');
const Placeholder = () => import('@/views/Placeholder.vue');
const Dashboard = () => import('@/views/Dashboard.vue');

// Konva Canvas Testing
const KonvaCanvas = () => import('@/components/konva/KonvaCanvas.vue');
const KonvaAdvanced = () => import('@/views/KonvaAdvanced.vue');
const BoatCanvasTest = () => import('@/views/BoatCanvasTest.vue');

// Company Settings
const CompanySettings = () => import('@/views/CompanySettings.vue');

// Auth routes
export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginForm,
    meta: { requiresAuth: false },
  },
];

// Boat storage routes
export const boatStorageRoutes: RouteRecordRaw[] = [
  {
    path: '/customers',
    name: 'customers',
    component: CustomerList,
  },
  {
    path: '/customers/:id',
    name: 'customer-detail',
    component: CustomerDetail,
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: ContactList,
  },
  {
    path: '/contacts/:id',
    name: 'contact-detail',
    component: ContactDetail,
  },
  {
    path: '/boats',
    name: 'boats',
    component: BoatList,
  },
  {
    path: '/boats/:id',
    name: 'boat-detail',
    component: BoatDetail,
  },
  {
    path: '/boat-placement',
    name: 'boat-placement',
    component: BoatPlacement,
  },
  {
    path: '/boat-lager2',
    name: 'boat-lager2',
    component: BoatLager2,
  },
];

// Storage routes
export const storageRoutes: RouteRecordRaw[] = [
  {
    path: '/storage/locations',
    name: 'storage-locations',
    component: StorageLocationList,
  },
  {
    path: '/storage/locations/:id',
    name: 'storage-location-detail',
    component: StorageLocationDetail,
  },
];

// Settings routes
export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: '/settings',
    name: 'settings',
    component: UserDetail,
  },
  {
    path: '/settings/company',
    name: 'settings-company',
    component: CompanySettings,
  },
  {
    path: '/settings/my-account',
    name: 'settings-my-account',
    component: UserDetail,
  },
  {
    path: '/settings/login-accounts',
    name: 'settings-login-accounts',
    component: UserList,
  },
  {
    path: '/settings/login-accounts/:id',
    name: 'user-detail',
    component: UserDetail,
  },
  {
    path: '/settings/permission-groups',
    name: 'settings-permission-groups',
    component: PermissionGroups,
  },
];

// Home/Dashboard routes
export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
  },
  {
    path: '/home',
    name: 'home',
    component: Placeholder,
  },
];

// Development routes
export const developmentRoutes: RouteRecordRaw[] = [
  {
    path: '/custom-components',
    name: 'custom-components',
    component: CustomComponents,
  },
  {
    path: '/tooltip-demo',
    name: 'tooltip-demo',
    component: TooltipDemo,
  },
  {
    path: '/placeholder',
    name: 'placeholder',
    component: Placeholder,
  },
  {
    path: '/konva-test',
    name: 'konva-test',
    component: KonvaCanvas,
  },
  {
    path: '/konva-advanced',
    name: 'konva-advanced',
    component: KonvaAdvanced,
  },
  {
    path: '/boat-canvas-test',
    name: 'boat-canvas-test',
    component: BoatCanvasTest,
  },
];

// Utility routes
export const utilityRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: '/dashboard',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/dashboard',
  },
];

// Combine all routes
export const allRoutes: RouteRecordRaw[] = [
  ...utilityRoutes,
  ...authRoutes,
  ...homeRoutes,
  ...settingsRoutes,
  ...developmentRoutes,
  ...boatStorageRoutes,
  ...storageRoutes,
];
