// Import enums
import type { WorkOrderPriority, WorkOrderStatus } from './enums';

// Core business entity interfaces

export interface Customer {
  CustomerID: number; // Matches JSON: "CustomerID"
  CustomerNumber: string; // Matches JSON: "CustomerNumber"
  CompanyName: string; // Matches JSON: "CompanyName"
  OrganizationNumber: string; // Matches JSON: "OrganizationNumber"
  Phone: string; // Matches JSON: "Phone"
  Email: string; // Matches JSON: "Email"
  Address: string; // Matches JSON: "Address"
  PostalCode: string; // Matches JSON: "PostalCode"
  City: string; // Matches JSON: "City"
  Country: string; // Matches JSON: "Country"
  InvoiceAddress: {
    // Matches JSON nested structure
    Address: string;
    PostalCode: string;
    City: string;
  };
  PaymentTerms: number; // Matches JSON: "PaymentTerms"
  VATNumber: string; // Matches JSON: "VATNumber"
  Status: 'active' | 'inactive'; // Matches JSON: "Status" with enum validation
  CreatedDate: string; // Matches JSON: "CreatedDate"
  Notes: string; // Matches JSON: "Notes"
}

export interface Contact {
  ContactID: number; // Matches JSON: "ContactID"
  CustomerID: number; // Matches JSON: "CustomerID"
  FirstName: string; // Matches JSON: "FirstName"
  LastName: string; // Matches JSON: "LastName"
  Title: string; // Matches JSON: "Title"
  Phone: string; // Matches JSON: "Phone"
  Mobile: string; // Matches JSON: "Mobile"
  Email: string; // Matches JSON: "Email"
  Department: string; // Matches JSON: "Department"
  IsPrimary: boolean; // Matches JSON: "IsPrimary"
  Notes: string; // Matches JSON: "Notes"
}

export interface WorkOrder {
  id: number;
  customerId: number;
  contactId?: number;
  title: string;
  description?: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedTo?: number;
  estimatedHours?: number;
  actualHours?: number;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  namn: string;
  logotyp?: string;
  enheter: string[];
  userCount?: number;
  kommentarLabels: {
    kommentar1: string;
    kommentar2: string;
    kommentar3: string;
  };
  kontaktuppgifter: {
    adress: string;
    postnummer: string;
    ort: string;
    telefon: string;
    epost: string;
    webbplats: string;
  };
  skapadDatum: string;
  uppdateradDatum: string;
}

export interface LoginAccount {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'Aktiv' | 'Inaktiv' | 'Låst';
  lastLogin: string;
  createdAt: string;
  department: string;
  permissionGroup?: {
    name: string;
  };
}

// New entities based on mock data analysis

export interface Task {
  TaskID: number;
  TaskNumber: string;
  CarID: number;
  Status: 'active' | 'completed' | 'pending' | 'cancelled';
  Priority: 'low' | 'medium' | 'high' | 'urgent';
  Type: 'police_tow' | 'accident_tow' | 'private_tow' | 'abandoned_tow';
  TowingReason: string;
  TowingDate: string;
  TowingLocation: string;
  TowingOfficerName: string;
  TowingOfficerBadge: string | null;
  CompletedDate: string | null;
  ReleasedDate: string | null;
  TowDurationHours: number | null;
  TotalCost: number;
  PaidAmount: number;
  PaymentStatus: 'pending' | 'paid' | 'overdue' | 'hold';
  PaymentDate: string | null;
  PaymentMethod: 'cash' | 'card' | 'invoice' | 'transfer' | null;
  ReleaseAuthorizedBy: string | null;
  CreatedDate: string;
  UpdatedDate: string;
  Notes: string;
}

export interface Car {
  CarID: number;
  LicensePlate: string;
  Brand: string;
  Model: string;
  Year: number;
  Color: string;
  VIN: string;
  OwnerName: string;
  OwnerPhone: string;
  OwnerEmail: string;
  OwnerAddress: string;
  InsuranceCompany: string;
  InsurancePolicyNumber: string;
  Status: 'active' | 'inactive' | 'sold' | 'scrapped';
  Notes: string;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface TowingStation {
  TowingStationID: number;
  Name: string;
  StationNumber: string;
  Address: string;
  PostalCode: string;
  City: string;
  Country: string;
  Phone: string;
  Email: string;
  ContactPersonName: string;
  ContactPersonPhone: string;
  ContactPersonEmail: string;
  WorkingHours: {
    Monday: string;
    Tuesday: string;
    Wednesday: string;
    Thursday: string;
    Friday: string;
    Saturday: string;
    Sunday: string;
  };
  EmergencyAvailable: boolean;
  Capacity: number;
  CurrentOccupancy: number;
  PricePerHour: number;
  PricePerDay: number;
  StorageTypes: Array<'indoor' | 'outdoor' | 'covered' | 'secure'>;
  Services: Array<'towing' | 'storage' | 'inspection' | 'release'>;
  Status: 'active' | 'inactive' | 'maintenance';
  LicenseNumber: string;
  InsurancePolicyNumber: string;
  Notes: string;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface Participant {
  ParticipantID: number;
  Fornamn: string;
  Efternamn: string;
  Personnummer: string;
  Kon: 'Man' | 'Kvinna' | 'Annan' | 'Vill inte ange';
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
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  permissionID: number;
  stadsmission: number;
}

export interface ActivityType {
  ActivityTypeID: number;
  Typnamn: string;
  Syfte: string;
  Beskrivning: string;
}

export interface Office {
  OfficeID: number;
  OfficeName: string;
  Address: string;
  PostalCode: string;
  City: string;
  Country: string;
  Phone: string;
  Email: string;
  ContactPerson: string;
  Status: 'active' | 'inactive';
  Notes: string;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface PermissionGroup {
  PermissionGroupID: number;
  GroupName: string;
  Description: string;
  Permissions: string[];
  CreatedDate: string;
  UpdatedDate: string;
}

export interface ParticipantGroup {
  ParticipantGroupID: number;
  GroupName: string;
  Description: string;
  GroupType: string;
  MaxParticipants: number;
  CurrentParticipants: number;
  StartDate: string;
  EndDate: string | null;
  Status: 'active' | 'inactive' | 'completed';
  ResponsibleUser: string;
  Notes: string;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface Activity {
  ActivityID: number;
  ActivityName: string;
  ActivityTypeID: number;
  Description: string;
  StartTime: string;
  EndTime: string;
  Location: string;
  MaxParticipants: number;
  CurrentParticipants: number;
  Status: 'planned' | 'active' | 'completed' | 'cancelled';
  ResponsibleUserID: number;
  Notes: string;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface ActivityTemplate {
  ActivityTemplateID: number;
  TemplateName: string;
  ActivityTypeID: number;
  Description: string;
  DefaultDuration: number;
  DefaultLocation: string;
  DefaultMaxParticipants: number;
  Instructions: string;
  RequiredMaterials: string[];
  Tags: string[];
  IsActive: boolean;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface Attendance {
  AttendanceID: number;
  ActivityID: number;
  ParticipantID: number;
  AttendanceDate: string;
  Status: 'present' | 'absent' | 'late' | 'excused';
  CheckInTime: string | null;
  CheckOutTime: string | null;
  Notes: string;
  RecordedByUserID: number;
  CreatedDate: string;
  UpdatedDate: string;
}

export interface ActivityCompletion {
  ActivityCompletionID: number;
  ActivityID: number;
  ParticipantID: number;
  CompletionDate: string;
  CompletionStatus: 'completed' | 'partially_completed' | 'not_completed';
  Score: number | null;
  Feedback: string;
  NextSteps: string;
  CompletedByUserID: number;
  CreatedDate: string;
  UpdatedDate: string;
}

// Junction table interfaces for many-to-many relationships

export interface ActivityOfficeJunction {
  ActivityID: number;
  OfficeID: number;
  CreatedDate: string;
}

export interface OfficeUserJunction {
  OfficeID: number;
  UserID: number;
  Role: string;
  StartDate: string;
  EndDate: string | null;
  Status: 'active' | 'inactive';
  CreatedDate: string;
}

export interface ParticipantGroupJunction {
  ParticipantID: number;
  ParticipantGroupID: number;
  JoinDate: string;
  LeaveDate: string | null;
  Status: 'active' | 'inactive' | 'completed';
  Role: 'participant' | 'leader' | 'assistant';
  CreatedDate: string;
}

export interface TaskTowingStationJunction {
  JunctionID: number;
  TaskID: number;
  TowingStationID: number;
  StorageStartDate: string;
  StorageEndDate: string | null;
  StorageType: 'outdoor' | 'covered' | 'secure';
  StorageLocation: string;
  PricePerHour: number;
  TotalStorageCost: number;
  Status: 'active' | 'completed' | 'transferred';
  Notes: string;
}
