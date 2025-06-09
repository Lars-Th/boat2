import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { 
  TestTube, 
  LayoutDashboard, 
  Users, 
  Settings as SettingsIcon,
  UserCheck,
  Search,
  Palette,
  Wrench,
  Hammer,
  FileText,
  User,
  Shield,
  UserCog,
  LogIn
} from 'lucide-vue-next'
import Dashboard from '@/views/Dashboard.vue'
import Settings from '@/views/Settings.vue'
import Test from '@/views/Test.vue'
import Customers from '@/views/Customers.vue'
import CustomerDetails from '@/views/CustomerDetails.vue'
import Contacts from '@/views/Contacts.vue'
import ContactDetails from '@/views/ContactDetails.vue'
import Prospector from '@/views/Prospector.vue'
import CustomComponents from '@/views/CustomComponents.vue'
import Machines from '@/views/Machines.vue'
import Tools from '@/views/Tools.vue'
import WorkOrders from '@/views/WorkOrders.vue'
import MyAccount from '@/views/MyAccount.vue'
import LoginAccounts from '@/views/LoginAccounts.vue'
import PermissionGroups from '@/views/PermissionGroups.vue'
import Login from '@/views/Login.vue'

// Single source of truth for routes and navigation
const routeDefinitions = [
  // Hidden/utility routes (no navigation)
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    redirect: '/dashboard'
  },
  {
    path: '/customers/:id',
    name: 'customer-details',
    component: CustomerDetails
  },
  {
    path: '/contacts/:id',
    name: 'contact-details',
    component: ContactDetails
  },
  // Main navigation section
  {
    path: '/dashboard',
    name: 'dashboard-main',
    component: Dashboard,
    navigation: { name: 'Dashboard', icon: LayoutDashboard, section: 'main' }
  },
  {
    path: '/customers',
    name: 'customers',
    component: Customers,
    navigation: { name: 'Kunder', icon: Users, section: 'main' }
  },
  {
    path: '/contacts',
    name: 'contacts',
    component: Contacts,
    navigation: { name: 'Kontaktpersoner', icon: UserCheck, section: 'main' }
  },
  {
    path: '/machines',
    name: 'machines',
    component: Machines,
    navigation: { name: 'Maskiner', icon: Wrench, section: 'main' }
  },
  {
    path: '/tools',
    name: 'tools',
    component: Tools,
    navigation: { name: 'Verktyg', icon: Hammer, section: 'main' }
  },
  {
    path: '/work-orders',
    name: 'work-orders',
    component: WorkOrders,
    navigation: { name: 'Arbetsorder', icon: FileText, section: 'main' }
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    navigation: { name: 'Logga in', icon: LogIn, section: 'main' }
  },
  // Bottom navigation section
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    navigation: { 
      name: 'Inställningar', 
      icon: SettingsIcon, 
      section: 'bottom',
      dropdown: [
        {
          name: 'Användare',
          icon: Users,
          children: [
            { name: 'Mitt Konto', path: '/settings/my-account', icon: User },
            { name: 'Inloggningskonton', path: '/settings/login-accounts', icon: UserCog },
            { name: 'Behörighetsgrupper', path: '/settings/permission-groups', icon: Shield }
          ]
        }
      ]
    }
  },
  {
    path: '/test',
    name: 'test',
    component: Test,
    navigation: { name: 'Test', icon: TestTube, section: 'bottom' }
  },
  {
    path: '/custom-components',
    name: 'custom-components',
    component: CustomComponents,
    navigation: { name: 'Custom Components', icon: Palette, section: 'bottom' }
  },
  {
    path: '/prospector',
    name: 'prospector',
    component: Prospector,
    navigation: { name: 'Prospector', icon: Search, section: 'bottom' }
  },
  // Settings sub-routes
  {
    path: '/settings/my-account',
    name: 'my-account',
    component: MyAccount
  },
  {
    path: '/settings/login-accounts',
    name: 'login-accounts',
    component: LoginAccounts
  },
  {
    path: '/settings/permission-groups',
    name: 'permission-groups',
    component: PermissionGroups
  }
]
// Derive routes from routeDefinitions (remove navigation property for router)
const routes = routeDefinitions.map((routeDef) => {
  // Create a copy without the navigation property
  const routeCopy = { ...routeDef }
  if ('navigation' in routeCopy) {
    delete routeCopy.navigation
  }
  return routeCopy
}) as unknown as RouteRecordRaw[]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guards
router.beforeEach((to, _from, next) => {
  // Log navigation
  console.log(`[Router] Navigating to: ${to.fullPath}`)
  next()
})

router.afterEach((to) => {
  console.log(`[Router] Finished navigating to: ${to.fullPath}`)
})


// Derive navigation items by section
const mainNavigationItems = routeDefinitions
  .filter(route => route.navigation?.section === 'main')
  .map(route => ({
    name: route.navigation!.name,
    path: route.path,
    icon: route.navigation!.icon
  }))

const bottomNavigationItems = routeDefinitions
  .filter(route => route.navigation?.section === 'bottom')
  .map(route => ({
    name: route.navigation!.name,
    path: route.path,
    icon: route.navigation!.icon,
    dropdown: route.navigation!.dropdown
  }))

// Keep legacy export for compatibility
const navigationItems = [...mainNavigationItems, ...bottomNavigationItems]


export default router
 export { mainNavigationItems, bottomNavigationItems, navigationItems }