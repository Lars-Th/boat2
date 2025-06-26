import {
  BarChart3,
  Building,
  Calendar,
  ClipboardList,
  Code,
  Download,
  FileText,
  LayoutDashboard,
  List,
  Package,
  Plus,
  Settings,
  Shield,
  Tag,
  User,
  UserCheck,
  UserPlus,
  Users,
  Users2,
} from 'lucide-vue-next';
import type { NavigationItem } from '@/types/navigation';

// Main navigation items
export const mainNavigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    path: '/home',
    icon: LayoutDashboard,
    permissions: ['H', 'A', 'SA'],
  },
  {
    name: 'Aktiviteter',
    path: '/activities',
    icon: Calendar,
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
  {
    name: 'Deltagare',
    path: '/participants',
    icon: Users,
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
            name: 'Deltagargrupper',
            path: '/participant-groups',
            icon: Users2,
            permissions: ['H', 'A', 'SA'],
          },
        ],
      },
    ],
  },
  {
    name: 'Rapporter',
    path: '/reports',
    icon: BarChart3,
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
  {
    name: 'Kund',
    path: '/customers',
    icon: Users,
    permissions: ['H', 'A', 'SA'],
    dropdown: [
      {
        children: [
          {
            name: 'Kunder',
            path: '/customers',
            icon: Users,
            permissions: ['H', 'A', 'SA'],
          },
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
];

// Bottom navigation items
export const bottomNavigationItems: NavigationItem[] = [
  {
    name: 'Development',
    path: '/custom-components',
    icon: Code,
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
    ],
  },
  {
    name: 'Inställningar',
    path: '/settings',
    icon: Settings,
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
      {
        name: 'System',
        icon: Settings,
        children: [
          {
            name: 'Aktivitetstyper',
            path: '/activity-types',
            icon: Tag,
            permissions: ['A', 'SA'],
          },
          {
            name: 'Aktivitetsmallar',
            path: '/activity-templates',
            icon: FileText,
            permissions: ['A', 'SA'],
          },
          {
            name: 'Stadsmissioner',
            path: '/settings/stadsmissioner',
            icon: Building,
            permissions: ['A', 'SA'],
          },
        ],
      },
    ],
  },
];

// Legacy export for compatibility
export const navigationItems = [...mainNavigationItems, ...bottomNavigationItems];
