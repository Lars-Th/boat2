import type { RouteRecordRaw } from 'vue-router';

// Lazy load all views
const Dashboard = () => import('@/views/Dashboard.vue');
const LoginForm = () => import('@/views/LoginForm.vue');

// User management
const UserList = () => import('@/views/UserList.vue');
const UserDetail = () => import('@/views/UserDetail.vue');
const PermissionGroups = () => import('@/views/PermissionGroups.vue');

// Customer management
const CustomerList = () => import('@/views/CustomerList.vue');
const CustomerDetail = () => import('@/views/CustomerDetail.vue');
const ContactPersonList = () => import('@/views/ContactPersonList.vue');
const ContactPersonDetail = () => import('@/views/ContactPersonDetail.vue');

// Activity management
const ActivityList = () => import('@/views/ActivityList.vue');
const ActivityDetail = () => import('@/views/ActivityDetail.vue');
const NewActivity = () => import('@/views/NewActivity.vue');
const AttendanceRegistration = () => import('@/views/AttendanceRegistration.vue');
const ActivityTypes = () => import('@/views/ActivityTypes.vue');
const ActivityTemplateList = () => import('@/views/ActivityTemplateList.vue');
const ActivityTemplateDetail = () => import('@/views/ActivityTemplateDetail.vue');
const NewActivityTemplate = () => import('@/views/NewActivityTemplate.vue');
const ActivityCompletion = () => import('@/views/ActivityCompletion.vue');

// Participant management
const ParticipantList = () => import('@/views/ParticipantList.vue');
const ParticipantDetail = () => import('@/views/ParticipantDetail.vue');
const NewParticipant = () => import('@/views/NewParticipant.vue');
const ParticipantGroups = () => import('@/views/ParticipantGroups.vue');

// Reports & Export
const Statistics = () => import('@/views/Statistics.vue');
const Export = () => import('@/views/Export.vue');

// Development
const CustomComponents = () => import('@/views/CustomComponents.vue');
const Placeholder = () => import('@/views/Placeholder.vue');

// System Settings
const SystemSettings = () => import('@/views/SystemSettings.vue');

// Auth routes
export const authRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginForm,
    meta: { requiresAuth: false },
  },
];

// Main application routes
export const dashboardRoutes: RouteRecordRaw[] = [
  {
    path: '/home',
    name: 'dashboard',
    component: Dashboard,
  },
];

// Customer management routes
export const customerRoutes: RouteRecordRaw[] = [
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
    component: ContactPersonList,
  },
  {
    path: '/contacts/:id',
    name: 'contact-detail',
    component: ContactPersonDetail,
  },
];

// Activity management routes
export const activityRoutes: RouteRecordRaw[] = [
  {
    path: '/activities',
    name: 'activities',
    component: ActivityList,
  },
  {
    path: '/activities/:id',
    name: 'activity-detail',
    component: ActivityDetail,
  },
  {
    path: '/activities/new',
    name: 'new-activity',
    component: NewActivity,
  },
  {
    path: '/attendance',
    name: 'attendance',
    component: AttendanceRegistration,
  },
  {
    path: '/activity-types',
    name: 'activity-types',
    component: ActivityTypes,
  },
  {
    path: '/activity-templates',
    name: 'activity-templates',
    component: ActivityTemplateList,
  },
  {
    path: '/activity-templates/new',
    name: 'new-activity-template',
    component: NewActivityTemplate,
  },
  {
    path: '/activity-templates/:id',
    name: 'activity-template-detail',
    component: ActivityTemplateDetail,
  },
  {
    path: '/activity-templates/:id/edit',
    name: 'edit-activity-template',
    component: NewActivityTemplate,
  },
  {
    path: '/activities/:id/complete',
    name: 'activity-completion',
    component: ActivityCompletion,
  },
];

// Participant management routes
export const participantRoutes: RouteRecordRaw[] = [
  {
    path: '/participants',
    name: 'participants',
    component: ParticipantList,
  },
  {
    path: '/participants/new',
    name: 'new-participant',
    component: NewParticipant,
  },
  {
    path: '/participants/:id',
    name: 'participant-detail',
    component: ParticipantDetail,
  },
  {
    path: '/participants/:id/edit',
    name: 'edit-participant',
    component: NewParticipant,
  },
  {
    path: '/participant-groups',
    name: 'participant-groups',
    component: ParticipantGroups,
  },
];

// Reports routes
export const reportRoutes: RouteRecordRaw[] = [
  {
    path: '/reports',
    name: 'reports',
    component: Statistics,
  },
  {
    path: '/export',
    name: 'export',
    component: Export,
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
  {
    path: '/settings/stadsmissioner',
    name: 'settings-stadsmissioner',
    component: SystemSettings,
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
    path: '/placeholder',
    name: 'placeholder',
    component: Placeholder,
  },
];

// Utility routes
export const utilityRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    redirect: '/home',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/home',
  },
];

// Combine all routes
export const allRoutes: RouteRecordRaw[] = [
  ...utilityRoutes,
  ...authRoutes,
  ...dashboardRoutes,
  ...customerRoutes,
  ...activityRoutes,
  ...participantRoutes,
  ...reportRoutes,
  ...settingsRoutes,
  ...developmentRoutes,
];
