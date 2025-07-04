import {
  Anchor,
  Building2,
  Code,
  LayoutDashboard,
  MessageCircle,
  Package,
  Phone,
  Settings,
  Shield,
  User,
  UserCheck,
  Users,
  Warehouse,
  Shapes,
} from 'lucide-vue-next';
import type { MainNavigationItem } from '@/types/navigation';

// Main navigation items
export const mainNavigationItems: MainNavigationItem[] = [
  {
    name: 'Översikt',
    path: '/dashboard',
    icon: LayoutDashboard,
    permissions: ['H', 'A', 'SA'],
  },
  {
    name: 'Kundinformation',
    path: '/boats',
    icon: Anchor,
    permissions: ['H', 'A', 'SA'],
    dropdown: [
      {
        name: 'Hantering',
        icon: Building2,
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
            icon: Phone,
            permissions: ['H', 'A', 'SA'],
          },
          {
            name: 'Båtar',
            path: '/boats',
            icon: Anchor,
            permissions: ['H', 'A', 'SA'],
          },
        ],
      },
    ],
  },
  {
    name: 'Båtlagring',
    path: '/storage',
    icon: Warehouse,
    permissions: ['H', 'A', 'SA'],
    dropdown: [
      {
        name: 'Lagring',
        icon: Warehouse,
        children: [
          {
            name: 'Skapa lager',
            path: '/storage/locations',
            icon: Warehouse,
            permissions: ['H', 'A', 'SA'],
          },
        ],
      },
    ],
  },
];

// Bottom navigation items
export const bottomNavigationItems: MainNavigationItem[] = [
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
          {
            name: 'Tooltip System',
            path: '/tooltip-demo',
            icon: MessageCircle,
            permissions: ['H', 'A', 'SA'],
          },
          {
            name: 'Konva Test',
            path: '/konva-test',
            icon: Shapes,
            permissions: ['H', 'A', 'SA'],
          },
          {
            name: 'Konva Advanced',
            path: '/konva-advanced',
            icon: Shapes,
            permissions: ['H', 'A', 'SA'],
          },
          {
            name: 'Båt Canvas Test',
            path: '/boat-canvas-test',
            icon: Shapes,
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
            name: 'Företagsinställningar',
            path: '/settings/company',
            icon: Building2,
            permissions: ['A', 'SA'],
          },
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
];

// Legacy export for compatibility
export const navigationItems = [...mainNavigationItems, ...bottomNavigationItems];
