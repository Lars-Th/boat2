// Import base types
import type { Contact, Customer } from './index';
import type { ApiResponse } from './api';

export interface CustomerWithRelations extends Customer {
  // Resolved relationships - always optional since they're loaded conditionally
  contacts?: ContactWithRelations[];

  // Computed fields from relationships
  primaryContact?: ContactWithRelations; // Contact where IsPrimary = true
  totalWorkOrders?: number; // Count of all work orders
  activeWorkOrders?: number; // Count of active work orders
}

export interface ContactWithRelations extends Contact {
  // Resolved relationships - always optional since they're loaded conditionally
  customer?: CustomerWithRelations;

  // Computed fields from relationships
  fullName?: string; // Computed from FirstName + LastName
  totalWorkOrders?: number; // Count of associated work orders
  activeWorkOrders?: number; // Count of active work orders
}
