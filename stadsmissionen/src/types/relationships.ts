// Import base types
import type { Contact, Customer } from './index';

// Import base API types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: any;
}

// Relationship Management Types
// Removed unused RelationshipConfig interface

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Enhanced entity types with relationships
// Removed unused WorkOrderWithRelations interface

export interface CustomerWithRelations extends Customer {
  // Resolved relationships - always optional since they're loaded conditionally
  contacts?: ContactWithRelations[];
  // workOrders?: WorkOrderWithRelations[]; // Removed reference to unused interface

  // Computed fields from relationships
  primaryContact?: ContactWithRelations; // Contact where IsPrimary = true
  totalWorkOrders?: number; // Count of all work orders
  activeWorkOrders?: number; // Count of active work orders
}

export interface ContactWithRelations extends Contact {
  // Resolved relationships - always optional since they're loaded conditionally
  customer?: CustomerWithRelations;
  // workOrders?: WorkOrderWithRelations[]; // Removed reference to unused interface

  // Computed fields from relationships
  fullName?: string; // Computed from FirstName + LastName
  totalWorkOrders?: number; // Count of associated work orders
  activeWorkOrders?: number; // Count of active work orders
}

// Removed unused EmployeeWithRelations and TimeEntryWithRelations interfaces

// Removed duplicate ParticipantWithRelations and FamilyRelationWithRelations interfaces
// (These are already defined in enhanced.ts and are being used there)
