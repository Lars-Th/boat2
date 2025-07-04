// Core business entity interfaces

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

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  permissionID: number;
}

export interface PermissionGroup {
  PermissionGroupID: number;
  GroupName: string;
  Description: string;
  Permissions: string[];
  CreatedDate: string;
  UpdatedDate: string;
}

export interface Customer {
  id: number;
  customer_no: string;
  name: string;
  first_name: string;
  external_id: string;
  display_name: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  customer_type?: 'individual' | 'company';
  customer_type_text?: string;
  company_name?: string;
  company_org_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  title: string;
  email: string;
  phone: string;
  mobile: string;
  is_primary: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Boat {
  id: number;
  customer_id: number;
  name: string;
  registreringsnummer: string;
  length: number;
  width: number;
  safety_margin: number;
  weight: number;
  current_status: 'i_lager' | 'vid_brygga' | 'oplacerad';
  location_status: 'brygga' | 'lager' | 'lager_brygga';
  current_placement_id?: number;
  move_to_storage_date?: string;
  move_from_storage_date?: string;
  move_to_brygga_date?: string;
  move_from_brygga_date?: string;
  service_date?: string;
  konva_shape_json: string;
  notes: string;
  created_at: string;
  updated_at: string;
  sms_notifications: boolean;
  email_notifications: boolean;
}
