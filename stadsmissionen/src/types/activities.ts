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

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystemGroup?: boolean;
  isSystem?: boolean;
  color?: string;
}
