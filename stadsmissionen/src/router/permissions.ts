export interface PermissionConfig {
  [routeName: string]: string[];
}

// Map permission codes to role names
export const permissionToRole: { [key: string]: string[] } = {
  H: ['Handläggare'],
  A: ['Administratör', 'Enhetsansvarig'],
  SA: ['Systemadministratör'],
};

// Route permissions configuration
export const routePermissions: PermissionConfig = {
  // Dashboard
  dashboard: ['H', 'A', 'SA'],

  // Activities
  activities: ['H', 'A', 'SA'],
  'activity-detail': ['H', 'A', 'SA'],
  'new-activity': ['A', 'SA'],
  attendance: ['H', 'A', 'SA'],
  'activity-types': ['A', 'SA'],
  'activity-templates': ['A', 'SA'],
  'new-activity-template': ['A', 'SA'],
  'activity-template-detail': ['A', 'SA'],
  'edit-activity-template': ['A', 'SA'],

  // Participants
  participants: ['H', 'A', 'SA'],
  'participant-detail': ['H', 'A', 'SA'],
  'new-participant': ['H', 'A', 'SA'],
  'edit-participant': ['H', 'A', 'SA'],
  'participant-groups': ['H', 'A', 'SA'],

  // Reports
  reports: ['A', 'SA'],
  export: ['A', 'SA'],

  // Customers
  customers: ['H', 'A', 'SA'],
  'customer-detail': ['H', 'A', 'SA'],
  contacts: ['H', 'A', 'SA'],
  'contact-detail': ['H', 'A', 'SA'],

  // Settings
  settings: ['H', 'A', 'SA'],
  'settings-my-account': ['H', 'A', 'SA'],
  'settings-login-accounts': ['A', 'SA'],
  'user-detail': ['A', 'SA'],
  'settings-permission-groups': ['A', 'SA'],

  // Development
  'custom-components': ['H', 'A', 'SA'],
};

/**
 * Check if a user has permission to access a route
 */
export function hasPermission(userRole: string, routeName: string): boolean {
  const requiredPermissions = routePermissions[routeName];

  if (!requiredPermissions) {
    // If no permissions are specified, allow access
    return true;
  }

  const allowedRoles = requiredPermissions.flatMap(perm => permissionToRole[perm] ?? []);
  return allowedRoles.includes(userRole);
}

/**
 * Get allowed roles for a given set of permissions
 */
export function getAllowedRoles(permissions: string[]): string[] {
  return permissions.flatMap(perm => permissionToRole[perm] ?? []);
}
