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
  aktiv: boolean;
  enheter: string[];
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
