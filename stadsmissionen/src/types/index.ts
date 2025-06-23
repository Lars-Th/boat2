// Vue-specific imports for types
import type { Component, Ref, VNode } from 'vue';

// Import API types from the API client
import type { ApiError, ApiResponse } from '../api/client/types';

// Core entity types
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

// Enums
export enum WorkOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// User and Authentication types
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  permissionID: number;
}

export interface UserExtended {
  id: string;
  namn: string;
  epost: string;
  losenord: string;
  roller: string[];
  enheter: string[];
  organisationId: string;
  aktiv: boolean;
  skapadDatum: string;
  uppdateradDatum?: string;
  senastInloggad?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  VIEWER = 'viewer',
}

// UI Component types
export interface BreadcrumbItem {
  label: string;
  href?: string;
  to?: string | { name: string; params?: Record<string, unknown> };
  icon?: string | Component;
  isCurrentPage?: boolean;
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'badge' | 'actions' | 'custom';
  render?: (value: unknown, row: T) => string | VNode;
  format?: (value: unknown) => string;
  badgeVariant?: (value: unknown) => string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Form types
export interface FormField<T = unknown> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  value: T;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ label: string; value: unknown }>;
  validation?: ValidationRule;
}

// Navigation types
export interface NavigationItem {
  label: string;
  path?: string;
  icon?: string | Component;
  children?: NavigationItem[];
  badge?: string | number;
  external?: boolean;
}

// Filter and Search types
export interface SearchFilters {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

// Enhanced Toast types from advanced toast library
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirm';
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
  variant?: 'default' | 'outline' | 'ghost';
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  message?: string;
  variant?: ToastVariant;
  type?: ToastType;
  timestamp: number;
  read: boolean;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  position?: ToastPosition;
  icon?: string;
  closable?: boolean;
}

export interface ToastOptions {
  title: string;
  message?: string;
  description?: string;
  type?: ToastType;
  variant?: ToastVariant;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  position?: ToastPosition;
  icon?: string;
  closable?: boolean;
}

export interface ToastConfig {
  position?: ToastPosition;
  duration?: number;
  maxToasts?: number;
  pauseOnHover?: boolean;
  closeOnClick?: boolean;
  showProgressBar?: boolean;
  newestOnTop?: boolean;
  preventDuplicates?: boolean;
  icons?: {
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
    confirm?: string;
  };
}

export interface UseToastReturn {
  toasts: Ref<Toast[]>;
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, options: Partial<ToastOptions>) => void;
  success: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  error: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  warning: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  info: (
    title: string,
    description?: string,
    options?: Omit<ToastOptions, 'type' | 'title' | 'description'>
  ) => string;
  confirm: (
    title: string,
    description?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => string;
  promise: <T>(
    promise: Promise<T>,
    options: { loading: string; success: string; error: string }
  ) => Promise<T>;
  unsavedChanges: (onSave: () => void, onDiscard: () => void) => string;
  config: ToastConfig;
  setConfig: (newConfig: Partial<ToastConfig>) => void;
}

// Legacy notification types for backward compatibility
export interface Notification extends Toast {
  confirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface NotificationOptions {
  title: string;
  message?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
}

export interface UseNotificationsReturn {
  notifications: Ref<Notification[]>;
  unreadCount: Ref<number>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

// Statistics interface
export interface Statistic {
  title: string;
  value: string | number;
  icon: Component;
  color: string;
}

// Theme interfaces
export interface ColorDefinition {
  key: string;
  label: string;
  description: string;
  category: 'brand' | 'layout' | 'content' | 'status';
}

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  preview: string;
}

// Participant types
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

export interface FamilyRelation {
  RelationID: number;
  ParticipantID: number;
  RelatedParticipantID: number;
  RelationType: string;
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
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string;
  fullName?: string;
}

export interface Boat {
  BoatID: number;
  BoatNumber: string;
  BoatName: string;
  RegistrationNumber: string;
  BoatType: string;
  BoatModel: string;
  YearBuilt: number;
  Length: number;
  Width: number;
  Owner: string;
  OwnerPhone: string;
  OwnerEmail: string;
  HarbourLocation: string;
  Status: 'active' | 'maintenance' | 'inactive';
  CreatedDate: string;
  LastModified: string;
  LastService: string;
  NextService: string;
  TechnicalDetails: {
    Engine: string;
    FuelType: string;
    HullMaterial: string;
    SailArea?: number;
    Draft?: number;
    MaxSpeed?: number;
    FuelCapacity?: number;
  };
  Notes: string;
}

// Route params interface
export interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

// Validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  numeric?: boolean;
  custom?: (value: unknown) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  errors?: string[];
}

export interface ValidationSchema {
  [fieldName: string]: {
    rules: string[];
    displayName: string;
  };
}

export interface UseValidationReturn {
  validate: (value: unknown, rules: ValidationRule) => ValidationResult;
  validateForm: (
    data: Record<string, unknown>,
    schema: Record<string, ValidationRule>
  ) => Record<string, ValidationResult>;
  isFormValid: (results: Record<string, ValidationResult>) => boolean;
  validateField: (
    fieldName: string,
    value: unknown,
    rules: string[],
    displayName?: string
  ) => boolean;
  validateAll: (
    data: Record<string, unknown>,
    schema: Record<string, { rules: string[]; displayName?: string }>
  ) => boolean;
  validateWithSchema: (data: Record<string, unknown>, schema: ValidationSchema) => boolean;
  validateNestedField: (
    data: Record<string, unknown>,
    fieldPath: string,
    rules: string[],
    displayName?: string
  ) => boolean;
  touchField: (fieldName: string) => void;
  hasError: (fieldName: string) => boolean;
  getError: (fieldName: string) => string | null;
  isRequired: (fieldName: string, schema: Record<string, { rules?: string[] }>) => boolean;
  clearErrors: () => void;
  clearFieldError: (fieldName: string) => void;
  errors: Ref<Record<string, string | null>>;
  touchedFields: Ref<Record<string, boolean>>;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Generic data item for cards and tables
export interface DataItem {
  id: string | number;
  [key: string]: unknown;
}

// Component prop types
export interface BaseComponentProps {
  class?: string;
  id?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: unknown;
}

// New filter type hierarchy
export interface FilterOption {
  key?: string;
  label: string;
  value?: string | number | boolean | Date;
  options?: Array<{ value: string | number | boolean; label: string }>;
  isSimple?: boolean;
}

// Re-export types from api client
export type { ApiError, ApiResponse };

// Remove NotificationOptions and Notification interfaces as they're now consolidated with Toast
