import { createRouter, createWebHistory } from 'vue-router';
import {
  Anchor,
  BarChart3,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Code,
  Download,
  FileText,
  FolderOpen,
  LayoutDashboard,
  List,
  Package,
  Palette,
  PieChart,
  Plus,
  Settings,
  Shield,
  User,
  UserCheck,
  UserPlus,
  Users,
  Users2,
  Wrench,
} from 'lucide-vue-next';

// Import existing views - all as dynamic imports for consistency
const Dashboard = () => import('@/views/Dashboard.vue');

// User management views
// MyAccount removed - using UserDetail instead
const UserList = () => import('@/views/UserList.vue');
const PermissionGroups = () => import('@/views/PermissionGroups.vue');

// Existing views (activity management system)
const ActivityList = () => import('@/views/ActivityList.vue');
const ActivityDetail = () => import('@/views/ActivityDetail.vue');
const NewActivity = () => import('@/views/NewActivity.vue');
const AttendanceRegistration = () => import('@/views/AttendanceRegistration.vue');
const ParticipantList = () => import('@/views/ParticipantList.vue');
const ParticipantDetail = () => import('@/views/ParticipantDetail.vue');
const NewParticipant = () => import('@/views/NewParticipant.vue');
const FamilyConnections = () => import('@/views/FamilyConnections.vue');
const Statistics = () => import('@/views/Statistics.vue');
const Export = () => import('@/views/Export.vue');
const ActivityTypes = () => import('@/views/ActivityTypes.vue');
const ActivityTemplates = () => import('@/views/ActivityTemplates.vue');
const NewActivityTemplate = () => import('@/views/NewActivityTemplate.vue');
const ActivityTemplateDetail = () => import('@/views/ActivityTemplateDetail.vue');
const ParticipantGroups = () => import('@/views/ParticipantGroups.vue');

// New views from migrated project (work order management system)
const CustomerList = () => import('@/views/CustomerList.vue');
const CustomerDetail = () => import('@/views/CustomerDetail.vue');
const ContactPersonList = () => import('@/views/ContactPersonList.vue');
const ContactPersonDetail = () => import('@/views/ContactPersonDetail.vue');
const WorkOrderList = () => import('@/views/WorkOrderList.vue');
const WorkOrderDetail = () => import('@/views/WorkOrderDetail.vue');
const ReadyForAttestation = () => import('@/views/ReadyForAttestation.vue');
const ReadyForInvoicing = () => import('@/views/ReadyForInvoicing.vue');
const WorkOrderReport = () => import('@/views/WorkOrderReport.vue');
const MachineList = () => import('@/views/MachineList.vue');
const MachineDetail = () => import('@/views/MachineDetail.vue');
const ToolList = () => import('@/views/ToolList.vue');
const ToolDetail = () => import('@/views/ToolDetail.vue');
const MachineSummary = () => import('@/views/MachineSummary.vue');
const PlanningCalendar = () => import('@/views/PlanningCalendar.vue');
const TimeReporting = () => import('@/views/TimeReporting.vue');
const TimeSummary = () => import('@/views/TimeSummary.vue');
const UserDetail = () => import('@/views/UserDetail.vue');

// Boat views
const BoatCustomers = () => import('@/views/BoatCustomers.vue');
const BoatList = () => import('@/views/BoatList.vue');
const BoatDetail = () => import('@/views/BoatDetail.vue');

// Development/Demo views
const CustomComponents = () => import('@/views/CustomComponents.vue');

// Authentication views
const LoginForm = () => import('@/views/LoginForm.vue');

// Single source of truth for routes and navigation
const routeDefinitions = [
  // Root redirect
  {
    path: '/',
    name: 'root',
    redirect: '/home',
  },

  // Authentication routes
  {
    path: '/login',
    name: 'login',
    component: LoginForm,
    meta: { requiresAuth: false },
  },

  // Dashboard (Översikt)
  {
    path: '/home',
    name: 'dashboard',
    component: Dashboard,
    navigation: {
      name: 'Dashboard',
      icon: LayoutDashboard,
      section: 'main',
      permissions: ['H', 'A', 'SA'],
    },
  },

  // Aktiviteter section (existing system)
  {
    path: '/activities',
    name: 'activities',
    component: ActivityList,
    navigation: {
      name: 'Aktiviteter',
      icon: Calendar,
      section: 'main',
      permissions: ['H', 'A', 'SA'],
      dropdown: [
        {
          children: [
            {
              name: 'Lista aktiviteter',
              path: '/activities',
              icon: List,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Ny aktivitet',
              path: '/activities/new',
              icon: Plus,
              permissions: ['A', 'SA'],
            },
            {
              name: 'Närvaroregistrering',
              path: '/attendance',
              icon: ClipboardList,
              permissions: ['H', 'A', 'SA'],
            },
          ],
        },
      ],
    },
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

  // Deltagare section (existing system)
  {
    path: '/participants',
    name: 'participants',
    component: ParticipantList,
    navigation: {
      name: 'Deltagare',
      icon: Users,
      section: 'main',
      permissions: ['H', 'A', 'SA'],
      dropdown: [
        {
          children: [
            {
              name: 'Lista deltagare',
              path: '/participants',
              icon: List,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Ny deltagare',
              path: '/participants/new',
              icon: UserPlus,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Familjekopplingar',
              path: '/family-connections',
              icon: UserCheck,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Deltagargrupper',
              path: '/participant-groups',
              icon: Users2,
              permissions: ['H', 'A', 'SA'],
            },
          ],
        },
      ],
    },
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
    path: '/family-connections',
    name: 'family-connections',
    component: FamilyConnections,
  },
  {
    path: '/participant-groups',
    name: 'participant-groups',
    component: ParticipantGroups,
  },

  // Rapporter section (existing system)
  {
    path: '/reports',
    name: 'reports',
    component: Statistics,
    navigation: {
      name: 'Rapporter',
      icon: BarChart3,
      section: 'main',
      permissions: ['A', 'SA'],
      dropdown: [
        {
          children: [
            {
              name: 'Statistik',
              path: '/reports',
              icon: BarChart3,
              permissions: ['A', 'SA'],
            },
            {
              name: 'Export',
              path: '/export',
              icon: Download,
              permissions: ['A', 'SA'],
            },
          ],
        },
      ],
    },
  },
  {
    path: '/export',
    name: 'export',
    component: Export,
  },
  // Båtar section (moved to Development folder)
  {
    path: '/boats',
    name: 'boats',
    component: BoatList,
  },
  {
    path: '/boats/customers',
    name: 'boat-customers',
    component: BoatCustomers,
  },
  {
    path: '/boats/list',
    name: 'boat-list',
    component: BoatList,
  },
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

  // NEW SECTIONS FROM MIGRATED PROJECT

  // Kund section with dropdown
  {
    path: '/customers',
    name: 'customers',
    component: CustomerList,
    navigation: {
      name: 'Kund',
      icon: Users,
      section: 'main',
      permissions: ['H', 'A', 'SA'],
      dropdown: [
        {
          children: [
            { name: 'Kunder', path: '/customers', icon: Users, permissions: ['H', 'A', 'SA'] },
            {
              name: 'Kontaktpersoner',
              path: '/contacts',
              icon: UserCheck,
              permissions: ['H', 'A', 'SA'],
            },
          ],
        },
      ],
    },
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

  // Temporis section with all work management tools
  {
    path: '/work-orders',
    name: 'work-orders',
    component: WorkOrderList,
    navigation: {
      name: 'Temporis',
      icon: FolderOpen,
      section: 'main',
      permissions: ['H', 'A', 'SA'],
      dropdown: [
        {
          name: 'Arbetsordrar',
          icon: ClipboardList,
          children: [
            {
              name: 'Arbetsordrar',
              path: '/work-orders',
              icon: ClipboardList,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Klara för attestering',
              path: '/ready-attestation',
              icon: CheckCircle,
              permissions: ['A', 'SA'],
            },
            {
              name: 'Klara för Fakturering',
              path: '/ready-invoicing',
              icon: FileText,
              permissions: ['A', 'SA'],
            },
            {
              name: 'Rapport',
              path: '/work-order-report',
              icon: BarChart3,
              permissions: ['A', 'SA'],
            },
          ],
        },
        {
          name: 'Maskiner',
          icon: Wrench,
          children: [
            { name: 'Maskiner', path: '/machines', icon: Wrench, permissions: ['H', 'A', 'SA'] },
            { name: 'Redskap', path: '/tools', icon: Settings, permissions: ['H', 'A', 'SA'] },
            {
              name: 'Sammanställning',
              path: '/machine-summary',
              icon: PieChart,
              permissions: ['A', 'SA'],
            },
          ],
        },
        {
          name: 'Tid',
          icon: Clock,
          children: [
            {
              name: 'Tidredovisning',
              path: '/time-reporting',
              icon: Clock,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Sammanställning',
              path: '/time-summary',
              icon: PieChart,
              permissions: ['A', 'SA'],
            },
          ],
        },
        {
          name: 'Planering',
          icon: Calendar,
          children: [
            {
              name: 'Planeringskalender',
              path: '/planning-calendar',
              icon: Calendar,
              permissions: ['H', 'A', 'SA'],
            },
          ],
        },
      ],
    },
  },
  {
    path: '/work-orders/:id',
    name: 'work-order-detail',
    component: WorkOrderDetail,
  },
  {
    path: '/ready-attestation',
    name: 'ready-attestation',
    component: ReadyForAttestation,
  },
  {
    path: '/ready-invoicing',
    name: 'ready-invoicing',
    component: ReadyForInvoicing,
  },
  {
    path: '/work-order-report',
    name: 'work-order-report',
    component: WorkOrderReport,
  },

  // Machine routes (now part of Temporis)
  {
    path: '/machines',
    name: 'machines',
    component: MachineList,
  },
  {
    path: '/machines/:id',
    name: 'machine-detail',
    component: MachineDetail,
  },
  {
    path: '/tools',
    name: 'tools',
    component: ToolList,
  },
  {
    path: '/tools/:id',
    name: 'tool-detail',
    component: ToolDetail,
  },
  {
    path: '/machine-summary',
    name: 'machine-summary',
    component: MachineSummary,
  },

  // Planning Calendar route (now part of Temporis)
  {
    path: '/planning-calendar',
    name: 'planning-calendar',
    component: PlanningCalendar,
  },

  // Time reporting routes (now part of Temporis)
  {
    path: '/time-reporting',
    name: 'time-reporting',
    component: TimeReporting,
  },

  {
    path: '/time-summary',
    name: 'time-summary',
    component: TimeSummary,
  },

  // BOTTOM NAVIGATION - Updated structure from migrated project

  // Development folder (bottom navigation)
  {
    path: '/custom-components',
    name: 'custom-components',
    component: CustomComponents,
    navigation: {
      name: 'Development',
      icon: Code,
      section: 'bottom',
      permissions: ['H', 'A', 'SA'],
      dropdown: [
        {
          name: 'Komponenter',
          icon: Package,
          children: [
            {
              name: 'Komponenter',
              path: '/custom-components',
              icon: Package,
              permissions: ['H', 'A', 'SA'],
            },
          ],
        },
        {
          name: 'Båtar',
          icon: Anchor,
          children: [
            {
              name: 'Kunder',
              path: '/boats/customers',
              icon: Users,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Båtar',
              path: '/boats/list',
              icon: Anchor,
              permissions: ['H', 'A', 'SA'],
            },
          ],
        },
      ],
    },
  },
  // Inställningar section with dropdown (bottom navigation)
  {
    path: '/settings',
    name: 'settings',
    component: UserDetail,
    navigation: {
      name: 'Inställningar',
      icon: Settings,
      section: 'bottom',
      permissions: ['H', 'A', 'SA'],
      dropdown: [
        {
          name: 'Användare',
          icon: Users,
          children: [
            {
              name: 'Mitt konto',
              path: '/settings/my-account',
              icon: User,
              permissions: ['H', 'A', 'SA'],
            },
            {
              name: 'Inloggningskonton',
              path: '/settings/login-accounts',
              icon: UserCheck,
              permissions: ['A', 'SA'],
            },
            {
              name: 'Behörighetsgrupper',
              path: '/settings/permission-groups',
              icon: Shield,
              permissions: ['A', 'SA'],
            },
          ],
        },
      ],
    },
  },
  // User management routes
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

  // Legacy routes for existing activity management system
  {
    path: '/activity-types',
    name: 'activity-types',
    component: ActivityTypes,
  },
  {
    path: '/activity-templates',
    name: 'activity-templates',
    component: ActivityTemplates,
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

  // Catch-all route - redirect any unknown paths to dashboard
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/home',
  },
];

// Derive navigation items by section with permission filtering
export const mainNavigationItems = routeDefinitions
  .filter(route => route.navigation?.section === 'main')
  .map(route => ({
    name: route.navigation!.name,
    path: route.path,
    icon: route.navigation!.icon,
    dropdown: route.navigation!.dropdown,
    permissions: route.navigation!.permissions,
  }));

export const bottomNavigationItems = routeDefinitions
  .filter(route => route.navigation?.section === 'bottom')
  .map(route => ({
    name: route.navigation!.name,
    path: route.path,
    icon: route.navigation!.icon,
    dropdown: route.navigation!.dropdown,
    permissions: route.navigation!.permissions,
  }));

// Keep legacy export for compatibility
export const navigationItems = [...mainNavigationItems, ...bottomNavigationItems];

// Derive routes from routeDefinitions (remove navigation property for router)
const routes = routeDefinitions.map(({ navigation, ...route }) => {
  // navigation property is intentionally destructured and ignored
  void navigation;
  return route;
});

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Navigation guards with permission checking
router.beforeEach(async (to, _from, next) => {
  console.log(`[Router] Navigating to: ${to.fullPath}`);

  // Always redirect root to dashboard
  if (to.path === '/') {
    next('/home');
    return;
  }

  // Allow access to login page without authentication
  if (to.name === 'login') {
    next();
    return;
  }

  // Check for stored user data directly to avoid circular dependency issues
  try {
    let currentUser = null;

    // Try to get user from localStorage first
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (error) {
        console.error('[Router] Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
      }
    }

    // If no stored user and we're in development mode, set default user
    if (!currentUser && (import.meta.env.DEV || import.meta.env['VITE_USE_MOCK_API'] === 'true')) {
      try {
        // Import API dynamically to avoid circular dependencies
        const { default: api } = await import('@/api');
        const response = await api.auth.getDefaultUser();
        if (response.success && response.data) {
          currentUser = response.data;
          const mockToken = `mock-token-${response.data.id}-${Date.now()}`;
          localStorage.setItem('currentUser', JSON.stringify(response.data));
          localStorage.setItem('authToken', mockToken);
          console.log('🔧 Development mode: Auto-logged in as default user (Lars Thomas)');
        }
      } catch (error) {
        console.error('[Router] Error setting default user:', error);
      }
    }

    if (!currentUser) {
      console.warn('[Router] No authenticated user found');
      next('/login');
      return;
    }

    // Check permissions for the route
    const route = routeDefinitions.find(r => r.name === to.name);
    if (route?.navigation?.permissions) {
      const requiredPermissions = route.navigation.permissions;

      // Map permission codes to role names (matching the actual role names in useAuth)
      const permissionToRole: { [key: string]: string[] } = {
        H: ['Handläggare'],
        A: ['Administratör', 'Enhetsansvarig'],
        SA: ['Systemadministratör'],
      };

      const allowedRoles = requiredPermissions.flatMap(perm => permissionToRole[perm] ?? []);
      const hasAccess = allowedRoles.includes(currentUser.role);

      if (!hasAccess) {
        console.warn(`[Router] Access denied to ${to.path}`);
        console.warn(`[Router] User role:`, currentUser.role);
        console.warn(`[Router] Required permissions:`, requiredPermissions);
        console.warn(`[Router] Allowed roles:`, allowedRoles);
        next('/home'); // Redirect to dashboard if no permission
        return;
      }
    }

    next();
  } catch (error) {
    console.error('[Router] Navigation error:', error);
    next('/login');
  }
});

export default router;
