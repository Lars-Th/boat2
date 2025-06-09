import { createRouter, createWebHistory } from "vue-router";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserPlus,
  UserCheck,
  ClipboardList,
  BarChart3,
  Download,
  Settings,
  UserCog,
  Cog,
  Tag,
  Plus,
  List,
  FileText,
  Users2,
  User,
  Palette,
} from "lucide-vue-next";

// Import views - all as dynamic imports for consistency
const Dashboard = () => import("@/views/Dashboard.vue");

// Placeholder components for new views (will be created)
const ActivityList = () => import("@/views/ActivityList.vue");
const ActivityDetail = () => import("@/views/ActivityDetail.vue");
const NewActivity = () => import("@/views/NewActivity.vue");
const AttendanceRegistration = () =>
  import("@/views/AttendanceRegistration.vue");
const ParticipantList = () => import("@/views/ParticipantList.vue");
const ParticipantDetail = () => import("@/views/ParticipantDetail.vue");
const NewParticipant = () => import("@/views/NewParticipant.vue");
const FamilyConnections = () => import("@/views/FamilyConnections.vue");
const Statistics = () => import("@/views/Statistics.vue");
const Export = () => import("@/views/Export.vue");
const UserManagement = () => import("@/views/UserManagement.vue");
const SystemSettings = () => import("@/views/SystemSettings.vue");
const ActivityTypes = () => import("@/views/ActivityTypes.vue");
const ActivityTemplates = () => import("@/views/ActivityTemplates.vue");
const NewActivityTemplate = () => import("@/views/NewActivityTemplate.vue");
const ActivityTemplateDetail = () =>
  import("@/views/ActivityTemplateDetail.vue");
const ParticipantGroups = () => import("@/views/ParticipantGroups.vue");
const MyProfile = () => import("@/views/MyProfile.vue");
const UserDetail = () => import("@/views/UserDetail.vue");
const ThemeSettings = () => import("@/views/ThemeSettings.vue");

// Single source of truth for routes and navigation
const routeDefinitions = [
  // Root redirect
  {
    path: "/",
    name: "root",
    redirect: "/dashboard",
  },

  // Dashboard (Översikt)
  {
    path: "/dashboard",
    name: "dashboard",
    component: Dashboard,
    navigation: {
      name: "Dashboard",
      icon: LayoutDashboard,
      section: "main",
      permissions: ["H", "A", "SA"],
    },
  },

  // Aktiviteter section
  {
    path: "/activities",
    name: "activities",
    component: ActivityList,
    navigation: {
      name: "Aktiviteter",
      icon: Calendar,
      section: "main",
      permissions: ["H", "A", "SA"],
      dropdown: [
        {
          name: "Aktiviteter",
          icon: Calendar,
          children: [
            {
              name: "Lista aktiviteter",
              path: "/activities",
              icon: List,
              permissions: ["H", "A", "SA"],
            },
            {
              name: "Ny aktivitet",
              path: "/activities/new",
              icon: Plus,
              permissions: ["A", "SA"],
            },
            {
              name: "Närvaroregistrering",
              path: "/attendance",
              icon: ClipboardList,
              permissions: ["H", "A", "SA"],
            },
          ],
        },
      ],
    },
  },
  {
    path: "/activities/:id",
    name: "activity-detail",
    component: ActivityDetail,
  },
  {
    path: "/activities/new",
    name: "new-activity",
    component: NewActivity,
  },
  {
    path: "/attendance",
    name: "attendance",
    component: AttendanceRegistration,
  },

  // Deltagare section
  {
    path: "/participants",
    name: "participants",
    component: ParticipantList,
    navigation: {
      name: "Deltagare",
      icon: Users,
      section: "main",
      permissions: ["H", "A", "SA"],
      dropdown: [
        {
          name: "Deltagare",
          icon: Users,
          children: [
            {
              name: "Lista deltagare",
              path: "/participants",
              icon: List,
              permissions: ["H", "A", "SA"],
            },
            {
              name: "Ny deltagare",
              path: "/participants/new",
              icon: UserPlus,
              permissions: ["H", "A", "SA"],
            },
            {
              name: "Familjekopplingar",
              path: "/family-connections",
              icon: UserCheck,
              permissions: ["H", "A", "SA"],
            },
            {
              name: "Deltagargrupper",
              path: "/participant-groups",
              icon: Users2,
              permissions: ["H", "A", "SA"],
            },
          ],
        },
      ],
    },
  },
  {
    path: "/participants/new",
    name: "new-participant",
    component: NewParticipant,
  },
  {
    path: "/participants/:id",
    name: "participant-detail",
    component: ParticipantDetail,
  },
  {
    path: "/participants/:id/edit",
    name: "edit-participant",
    component: NewParticipant,
  },
  {
    path: "/family-connections",
    name: "family-connections",
    component: FamilyConnections,
  },
  {
    path: "/participant-groups",
    name: "participant-groups",
    component: ParticipantGroups,
  },

  // Rapporter section
  {
    path: "/reports",
    name: "reports",
    component: Statistics,
    navigation: {
      name: "Rapporter",
      icon: BarChart3,
      section: "main",
      permissions: ["A", "SA"],
      dropdown: [
        {
          name: "Rapporter",
          icon: BarChart3,
          children: [
            {
              name: "Statistik",
              path: "/reports",
              icon: BarChart3,
              permissions: ["A", "SA"],
            },
            {
              name: "Export",
              path: "/export",
              icon: Download,
              permissions: ["A", "SA"],
            },
          ],
        },
      ],
    },
  },
  {
    path: "/export",
    name: "export",
    component: Export,
  },

  // Administration section (bottom navigation)
  {
    path: "/admin",
    name: "admin",
    component: UserManagement,
    navigation: {
      name: "Administration",
      icon: Settings,
      section: "bottom",
      permissions: ["H", "A", "SA"],
      dropdown: [
        {
          name: "Administration",
          icon: Settings,
          children: [
            {
              name: "Mina sidor",
              path: "/my-profile",
              icon: User,
              permissions: ["H", "A", "SA"],
            },
            {
              name: "Användarhantering",
              path: "/admin/users",
              icon: UserCog,
              permissions: ["A", "SA"],
            },
            {
              name: "Inställningar",
              path: "/settings",
              icon: Cog,
              permissions: ["SA"],
            },
            {
              name: "Teman",
              path: "/themes",
              icon: Palette,
              permissions: ["SA"],
            },
            {
              name: "Aktivitetstyper",
              path: "/activity-types",
              icon: Tag,
              permissions: ["A", "SA"],
            },
            {
              name: "Aktivitetsmallar",
              path: "/activity-templates",
              icon: FileText,
              permissions: ["A", "SA"],
            },
          ],
        },
      ],
    },
  },
  {
    path: "/my-profile",
    name: "my-profile",
    component: MyProfile,
  },
  {
    path: "/admin/users",
    name: "admin-users",
    component: UserManagement,
  },
  {
    path: "/admin/users/:id",
    name: "user-detail",
    component: UserDetail,
  },
  {
    path: "/settings",
    name: "settings",
    component: SystemSettings,
  },
  {
    path: "/themes",
    name: "themes",
    component: ThemeSettings,
  },
  {
    path: "/activity-types",
    name: "activity-types",
    component: ActivityTypes,
  },
  {
    path: "/activity-templates",
    name: "activity-templates",
    component: ActivityTemplates,
  },
  {
    path: "/activity-templates/new",
    name: "new-activity-template",
    component: NewActivityTemplate,
  },
  {
    path: "/activity-templates/:id",
    name: "activity-template-detail",
    component: ActivityTemplateDetail,
  },
  {
    path: "/activity-templates/:id/edit",
    name: "edit-activity-template",
    component: NewActivityTemplate,
  },

  // Catch-all route - redirect any unknown paths to dashboard
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    redirect: "/dashboard",
  },
];

// Helper function to check permissions
const hasPermission = (userRole: string, requiredPermissions: string[]) => {
  const roleMap: { [key: string]: string } = {
    Handläggare: "H",
    Administratör: "A",
    Systemadministratör: "SA",
  };

  const userPermission = roleMap[userRole] ?? "H";
  return requiredPermissions.includes(userPermission);
};

// Derive navigation items by section with permission filtering
export const mainNavigationItems = routeDefinitions
  .filter((route) => route.navigation?.section === "main")
  .map((route) => ({
    name: route.navigation!.name,
    path: route.path,
    icon: route.navigation!.icon,
    dropdown: route.navigation!.dropdown,
    permissions: route.navigation!.permissions,
  }));

export const bottomNavigationItems = routeDefinitions
  .filter((route) => route.navigation?.section === "bottom")
  .map((route) => ({
    name: route.navigation!.name,
    path: route.path,
    icon: route.navigation!.icon,
    dropdown: route.navigation!.dropdown,
    permissions: route.navigation!.permissions,
  }));

// Keep legacy export for compatibility
export const navigationItems = [
  ...mainNavigationItems,
  ...bottomNavigationItems,
];

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
router.beforeEach((to, _from, next) => {
  console.log(`[Router] Navigating to: ${to.fullPath}`);

  // Always redirect root to dashboard
  if (to.path === "/") {
    next("/dashboard");
    return;
  }

  // Permission checking implementation
  try {
    // Import auth composable dynamically to avoid circular dependencies
    import('@/composables/useAuth').then(({ useAuth }) => {
      const { currentUser } = useAuth()
      const user = currentUser.value
      
      if (!user) {
        console.warn('[Router] No authenticated user found')
        next('/login') // Redirect to login if no user
        return
      }

      const route = routeDefinitions.find(r => r.name === to.name)
      if (route?.navigation?.permissions) {
        const userRoles = user.roller
        const requiredPermissions = route.navigation.permissions
        
        // Map permission codes to role names (matching the actual role names in useAuth)
        const permissionToRole: { [key: string]: string[] } = {
          'H': ['handlaggare'],
          'A': ['administrator', 'enhetsansvarig'],
          'SA': ['systemadministrator']
        }
        
        const allowedRoles = requiredPermissions.flatMap(perm => permissionToRole[perm] ?? [])
        const hasAccess = allowedRoles.some(role => userRoles.includes(role))
        
        if (!hasAccess) {
          console.warn(`[Router] Access denied to ${to.path}`)
          console.warn(`[Router] User roles:`, userRoles)
          console.warn(`[Router] Required permissions:`, requiredPermissions)
          console.warn(`[Router] Allowed roles:`, allowedRoles)
          next('/dashboard') // Redirect to dashboard if no permission
          return
        }
      }

      next()
    }).catch(error => {
      console.error('[Router] Error checking permissions:', error)
      next() // Continue navigation on error
    })
  } catch (error) {
    console.error('[Router] Permission check failed:', error)
    next() // Continue navigation on error
  }
});

router.afterEach((to) => {
  console.log(`[Router] Finished navigating to: ${to.fullPath}`);
});

export { hasPermission };
export default router;
