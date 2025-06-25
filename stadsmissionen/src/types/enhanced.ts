import type { Activity, ActivityType, Attendance, Participant, User } from './index';

// Enhanced activity types with relational data
export interface ActivityWithTypes extends Activity {
  activityType?: ActivityType;
}

export interface ActivityWithParticipants extends Activity {
  participants?: Participant[];
}

// Removed unused ActivityWithRelations interface

// Enhanced participant types with relational data
export interface ParticipantWithActivities extends Participant {
  activities?: Activity[];
}

export interface ParticipantWithFamily extends Participant {
  familyMembers?: Participant[];
}

export interface ParticipantWithRelations extends Participant {
  activities?: Activity[];
  familyMembers?: Participant[];
  attendances?: Attendance[];
}

// Enhanced user types with relational data
export interface PermissionGroup {
  id: number;
  name: string;
  administreraInloggningskonton: boolean;
  hanteraAnvandare: boolean;
  laddaUppOchRedigera: boolean;
  visaOchLaddaNer: boolean;
  lasaPubliceradeNyheter: boolean;
  publiceranyheter: boolean;
  administreraKategorier: boolean;
  redigeraVerksamheter: boolean;
  skapaVerksamheter: boolean;
}

export interface UserWithPermissionGroup extends User {
  permissionGroup?: PermissionGroup;
}

// API parameter types for include options
export interface RelationalParams {
  include?: string[];
}

export interface ActivityRelationalParams extends RelationalParams {
  include?: ('types' | 'participants' | 'attendances')[];
}

export interface ParticipantRelationalParams extends RelationalParams {
  include?: ('activities' | 'family' | 'attendances')[];
}

export interface UserRelationalParams extends RelationalParams {
  include?: 'permissionGroup'[];
}

// Union types for different API responses based on include parameters
// Removed unused complex conditional types: ActivityResponse, ParticipantResponse, UserResponse

// Enhanced auth user type for authentication
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  permissionGroup?: PermissionGroup;
}
