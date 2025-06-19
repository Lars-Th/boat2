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
export interface RelationshipConfig<T, R> {
  relationships: {
    [K in keyof R]: {
      type: 'hasOne' | 'hasMany' | 'belongsTo' | 'manyToMany';
      foreignKey: keyof T | string;
      targetEntity: string;
      targetKey?: string;
      through?: string; // For many-to-many relationships
      cache?: boolean;
      eager?: boolean; // Load immediately vs lazy load
    };
  };
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CascadeDeleteResult {
  canDelete: boolean;
  dependentEntities: Array<{ entity: string; count: number }>;
  cascadeActions: Array<{ action: 'delete' | 'nullify'; entity: string; field: string }>;
}

// Enhanced entity types with relationships
export interface WorkOrderWithRelations {
  WorkOrderID: number;
  WorkOrderNumber: string;
  CustomerID: number;
  ContactPersonID?: number;
  Title: string;
  Description?: string;
  Type: string;
  Status: string;
  Priority: string;
  AssignedTo: string;
  AssignedUserIDs: number[];
  EstimatedHours?: number;
  ActualHours?: number;
  HourlyRate: number;
  CreatedDate: string;
  StartDate?: string;
  DueDate?: string;
  CompletedDate?: string;
  Location: {
    Address: string;
    PostalCode: string;
    City: string;
    Country: string;
    Coordinates: { lat: number; lng: number };
  };
  AttestationStatus: string;
  InvoiceStatus: string;
  IsBillable: boolean;
  Tasks: any[];

  // Resolved relationships
  customer?: CustomerWithRelations;
  contact?: ContactWithRelations;
  assignedUsers?: EmployeeWithRelations[];
  timeEntries?: TimeEntryWithRelations[];
}

export interface CustomerWithRelations extends Customer {
  // Resolved relationships - always optional since they're loaded conditionally
  contacts?: ContactWithRelations[];
  workOrders?: WorkOrderWithRelations[];

  // Computed fields from relationships
  primaryContact?: ContactWithRelations; // Contact where IsPrimary = true
  totalWorkOrders?: number; // Count of all work orders
  activeWorkOrders?: number; // Count of active work orders
}

export interface ContactWithRelations extends Contact {
  // Resolved relationships - always optional since they're loaded conditionally
  customer?: CustomerWithRelations;
  workOrders?: WorkOrderWithRelations[];

  // Computed fields from relationships
  fullName?: string; // Computed from FirstName + LastName
  totalWorkOrders?: number; // Count of associated work orders
  activeWorkOrders?: number; // Count of active work orders
}

export interface EmployeeWithRelations {
  id: number;
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  weeklyCapacity: number;
  skills: string[];
  active: boolean;

  // Resolved relationships
  workOrders?: WorkOrderWithRelations[];
  timeEntries?: TimeEntryWithRelations[];
}

export interface TimeEntryWithRelations {
  TimeEntryID: number;
  WorkOrderID: number;
  UserID: number;
  UserName: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  Hours: number;
  Description: string;
  ActivityType: string;
  Status: string;
  CreatedDate: string;

  // Resolved relationships
  workOrder?: WorkOrderWithRelations;
  user?: EmployeeWithRelations;
}

export interface ParticipantWithRelations {
  ParticipantID: number;
  Fornamn: string;
  Efternamn: string;
  Personnummer: string;
  Kon: string;
  Telefon: string;
  'E-post': string;
  Adress: string;
  Postnummer: string;
  Ort: string;
  Kartkoordinater: {
    lat: number;
    lng: number;
  };
  Enheter: string[];
  Kommentar1: string;
  Kommentar2: string;
  Kommentar3: string;

  // Resolved relationships
  familyRelations?: FamilyRelationWithRelations[];
  guardians?: ParticipantWithRelations[];
  children?: ParticipantWithRelations[];
  siblings?: ParticipantWithRelations[];
  activities?: any[];
}

export interface FamilyRelationWithRelations {
  RelationID: number;
  ParticipantID: number;
  RelatedParticipantID: number;
  RelationType: string;

  // Resolved relationships
  participant?: ParticipantWithRelations;
  relatedParticipant?: ParticipantWithRelations;
}
