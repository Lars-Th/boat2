// Activity, participant, and attendance-related interfaces

export interface Participant {
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
  fullName?: string;
  hasGuardian?: boolean;
  hasSiblings?: boolean;
  guardianNames?: string[];
  siblingNames?: string[];
  totalRelations?: number;
}

export interface Activity {
  ActivityID: number;
  Namn: string;
  Beskrivning?: string;
  DatumTid: string;
  Plats?: string;
  ActivityTypeID: number;
  typeName?: string;
  typeDescription?: string;
  [key: string]: unknown;
}

export interface Attendance {
  AttendanceID: number;
  ActivityID: number;
  ParticipantID: number;
  DatumTid: string;
  Närvaro: boolean;
  Anteckningar?: string;
}

export interface ActivityType {
  ActivityTypeID: number;
  Typnamn: string;
  Beskrivning: string;
  Syfte: string;
  isActive?: boolean;
  usageCount?: number;
}

export interface ActivityTemplate {
  id: string;
  namn: string;
  beskrivning: string;
  malltyp: string;
  aktivitetstyper: string[];
  standardVaraktighet: number;
  standardPlats: string;
  resultatformular: Array<{
    id: string;
    fraga: string;
    typ: string;
    obligatorisk: boolean;
    skalaMin?: number;
    skalaMax?: number;
    skalaKommentar?: boolean;
    harKommentar?: boolean;
  }>;
  skapadDatum: string;
  skapadAv: string;
}

export interface ParticipantGroup {
  id: string;
  namn: string;
  beskrivning: string;
  enheter: string[];
  deltagare: string[];
  isAutomatic: boolean;
  automatiskregel?: string | null;
}

// Legacy activity permission group interface (to be migrated)
export interface ActivityPermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystemGroup?: boolean;
  isSystem?: boolean;
  color?: string;
}

// Helper types for activity management
export interface ActivityStatus {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
}

export interface ParticipantStatus {
  total: number;
  active: number;
  inactive: number;
  completed: number;
}

export interface AttendanceStatistics {
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  avgAttendancePerActivity: number;
}

export interface ActivityMetrics {
  totalActivities: number;
  totalParticipants: number;
  totalAttendances: number;
  averageAttendanceRate: number;
  topActivityTypes: Array<{
    activityTypeId: number;
    name: string;
    count: number;
  }>;
  monthlyStats: Array<{
    month: string;
    activities: number;
    participants: number;
    attendances: number;
  }>;
}

// Activity result form fields
export interface ActivityResultField {
  id: string;
  fraga: string;
  typ: 'text' | 'number' | 'boolean' | 'scale' | 'select' | 'multiselect';
  obligatorisk: boolean;
  skalaMin?: number;
  skalaMax?: number;
  skalaKommentar?: boolean;
  harKommentar?: boolean;
  options?: string[];
}

// Activity completion result
export interface ActivityResult {
  fieldId: string;
  value: any;
  comment?: string;
}

// Enhanced activity completion with results
export interface ActivityCompletionWithResults {
  ActivityCompletionID: number;
  ActivityID: number;
  ParticipantID: number;
  CompletionDate: string;
  CompletionStatus: 'completed' | 'partially_completed' | 'not_completed';
  Score: number | null;
  Feedback: string;
  NextSteps: string;
  Results: ActivityResult[];
  CompletedByUserID: number;
  CreatedDate: string;
  UpdatedDate: string;
}
