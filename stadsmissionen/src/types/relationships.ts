// Import base types
import type {
  Activity,
  ActivityCompletion,
  ActivityTemplate,
  ActivityType,
  Attendance,
  Car,
  Contact,
  Customer,
  LoginAccount,
  Office,
  Organization,
  Participant,
  ParticipantGroup,
  PermissionGroup,
  Task,
  TowingStation,
  User,
  WorkOrder,
} from './index';
import type { ApiResponse } from './api';

// Customer relationships
export interface CustomerWithRelations extends Customer {
  // Resolved relationships - always optional since they're loaded conditionally
  contacts?: ContactWithRelations[];
  workOrders?: WorkOrderWithRelations[];

  // Computed fields from relationships
  primaryContact?: ContactWithRelations; // Contact where IsPrimary = true
  totalWorkOrders?: number; // Count of all work orders
  activeWorkOrders?: number; // Count of active work orders
  totalContacts?: number; // Count of all contacts
}

// Contact relationships
export interface ContactWithRelations extends Contact {
  // Resolved relationships - always optional since they're loaded conditionally
  customer?: CustomerWithRelations;
  workOrders?: WorkOrderWithRelations[];

  // Computed fields from relationships
  fullName?: string; // Computed from FirstName + LastName
  totalWorkOrders?: number; // Count of associated work orders
  activeWorkOrders?: number; // Count of active work orders
}

// Task relationships
export interface TaskWithRelations extends Task {
  // Resolved relationships
  car?: CarWithRelations;
  towingStations?: TowingStationWithRelations[];

  // Computed fields
  carDetails?: string; // Car brand, model, license plate
  totalStorageCost?: number; // Sum of all storage costs
  storageStatus?: 'stored' | 'released' | 'transferred';
}

// Car relationships
export interface CarWithRelations extends Car {
  // Resolved relationships
  tasks?: TaskWithRelations[];

  // Computed fields
  totalTasks?: number; // Count of all tasks for this car
  activeTasks?: number; // Count of active tasks
  totalCost?: number; // Sum of all task costs
  lastTaskDate?: string; // Date of most recent task
}

// TowingStation relationships
export interface TowingStationWithRelations extends TowingStation {
  // Resolved relationships
  tasks?: TaskWithRelations[];

  // Computed fields
  totalTasks?: number; // Count of all tasks handled
  activeTasks?: number; // Count of currently active tasks
  occupancyRate?: number; // CurrentOccupancy / Capacity * 100
  totalRevenue?: number; // Sum of all storage costs
}

// Participant relationships
export interface ParticipantWithRelations extends Participant {
  // Resolved relationships
  activities?: ActivityWithRelations[];
  attendances?: AttendanceWithRelations[];
  activityCompletions?: ActivityCompletionWithRelations[];
  participantGroups?: ParticipantGroupWithRelations[];

  // Computed fields
  fullName?: string; // Computed from Fornamn + Efternamn
  totalActivities?: number; // Count of all activities participated in
  activeActivities?: number; // Count of current activities
  attendanceRate?: number; // Percentage of attended activities
  completionRate?: number; // Percentage of completed activities
}

// User relationships
export interface UserWithRelations extends User {
  // Resolved relationships
  permissionGroup?: PermissionGroup;
  organization?: Organization;
  offices?: OfficeWithRelations[];
  activitiesResponsible?: ActivityWithRelations[];
  attendancesRecorded?: AttendanceWithRelations[];
  activityCompletionsRecorded?: ActivityCompletionWithRelations[];

  // Computed fields
  totalActivitiesResponsible?: number;
  totalAttendancesRecorded?: number;
  permissions?: string[]; // From permission group
}

// Activity relationships
export interface ActivityWithRelations extends Activity {
  // Resolved relationships
  activityType?: ActivityType;
  responsibleUser?: UserWithRelations;
  participants?: ParticipantWithRelations[];
  attendances?: AttendanceWithRelations[];
  activityCompletions?: ActivityCompletionWithRelations[];
  offices?: OfficeWithRelations[];

  // Computed fields
  participantCount?: number; // Count of participants
  attendanceRate?: number; // Average attendance rate
  completionRate?: number; // Average completion rate
  averageScore?: number; // Average completion score
}

// ActivityType relationships
export interface ActivityTypeWithRelations extends ActivityType {
  // Resolved relationships
  activities?: ActivityWithRelations[];
  activityTemplates?: ActivityTemplateWithRelations[];

  // Computed fields
  totalActivities?: number; // Count of activities using this type
  activeActivities?: number; // Count of current activities
  totalTemplates?: number; // Count of templates using this type
}

// ActivityTemplate relationships
export interface ActivityTemplateWithRelations extends ActivityTemplate {
  // Resolved relationships
  activityType?: ActivityTypeWithRelations;

  // Computed fields
  usageCount?: number; // How many times this template has been used
  averageRating?: number; // Average rating from activities using this template
}

// ActivityCompletion relationships
export interface ActivityCompletionWithRelations extends ActivityCompletion {
  // Resolved relationships
  activity?: ActivityWithRelations;
  participant?: ParticipantWithRelations;
  completedByUser?: UserWithRelations;

  // Computed fields
  activityName?: string; // From activity
  participantName?: string; // From participant
  completedByName?: string; // From user
}

// Attendance relationships
export interface AttendanceWithRelations extends Attendance {
  // Resolved relationships
  activity?: ActivityWithRelations;
  participant?: ParticipantWithRelations;
  recordedByUser?: UserWithRelations;

  // Computed fields
  activityName?: string; // From activity
  participantName?: string; // From participant
  recordedByName?: string; // From user
  durationMinutes?: number; // CheckOutTime - CheckInTime in minutes
}

// Office relationships
export interface OfficeWithRelations extends Office {
  // Resolved relationships
  users?: UserWithRelations[];
  activities?: ActivityWithRelations[];

  // Computed fields
  totalUsers?: number; // Count of users in this office
  activeUsers?: number; // Count of active users
  totalActivities?: number; // Count of activities in this office
  activeActivities?: number; // Count of current activities
}

// PermissionGroup relationships
export interface PermissionGroupWithRelations extends PermissionGroup {
  // Resolved relationships
  users?: UserWithRelations[];

  // Computed fields
  totalUsers?: number; // Count of users with this permission group
  activeUsers?: number; // Count of active users with this permission group
}

// ParticipantGroup relationships
export interface ParticipantGroupWithRelations extends ParticipantGroup {
  // Resolved relationships
  participants?: ParticipantWithRelations[];

  // Computed fields
  participantCount?: number; // Count of participants in this group
  activeParticipants?: number; // Count of active participants
  completionRate?: number; // Percentage of completed participants
}

// WorkOrder relationships
export interface WorkOrderWithRelations extends WorkOrder {
  // Resolved relationships
  customer?: CustomerWithRelations;
  contact?: ContactWithRelations;
  assignedToUser?: UserWithRelations;

  // Computed fields
  customerName?: string; // From customer
  contactName?: string; // From contact
  assignedToName?: string; // From user
  isOverdue?: boolean; // If dueDate is past and not completed
  progressPercentage?: number; // actualHours / estimatedHours * 100
}

// Organization relationships
export interface OrganizationWithRelations extends Organization {
  // Resolved relationships
  users?: UserWithRelations[];

  // Computed fields
  totalUsers?: number; // Count of users in this organization
  activeUsers?: number; // Count of active users
}

// LoginAccount relationships
export interface LoginAccountWithRelations extends LoginAccount {
  // Resolved relationships
  permissionGroup?: PermissionGroupWithRelations;

  // Computed fields
  isActive?: boolean; // status === 'Aktiv'
  daysSinceLastLogin?: number; // Days since lastLogin
}

// Utility types for relationship loading
export type WithRelations<T> = T extends Customer
  ? CustomerWithRelations
  : T extends Contact
    ? ContactWithRelations
    : T extends Task
      ? TaskWithRelations
      : T extends Car
        ? CarWithRelations
        : T extends TowingStation
          ? TowingStationWithRelations
          : T extends Participant
            ? ParticipantWithRelations
            : T extends User
              ? UserWithRelations
              : T extends Activity
                ? ActivityWithRelations
                : T extends ActivityType
                  ? ActivityTypeWithRelations
                  : T extends ActivityTemplate
                    ? ActivityTemplateWithRelations
                    : T extends ActivityCompletion
                      ? ActivityCompletionWithRelations
                      : T extends Attendance
                        ? AttendanceWithRelations
                        : T extends Office
                          ? OfficeWithRelations
                          : T extends PermissionGroup
                            ? PermissionGroupWithRelations
                            : T extends ParticipantGroup
                              ? ParticipantGroupWithRelations
                              : T extends WorkOrder
                                ? WorkOrderWithRelations
                                : T extends Organization
                                  ? OrganizationWithRelations
                                  : T extends LoginAccount
                                    ? LoginAccountWithRelations
                                    : T;

// Relationship loading options
export interface RelationshipLoadOptions {
  // Customer relationships
  contacts?: boolean;
  workOrders?: boolean;

  // Task relationships
  car?: boolean;
  towingStations?: boolean;

  // Participant relationships
  activities?: boolean;
  attendances?: boolean;
  activityCompletions?: boolean;
  participantGroups?: boolean;

  // User relationships
  permissionGroup?: boolean;
  organization?: boolean;
  offices?: boolean;
  activitiesResponsible?: boolean;

  // Activity relationships
  activityType?: boolean;
  responsibleUser?: boolean;
  participants?: boolean;

  // Generic relationships
  all?: boolean; // Load all available relationships
}
