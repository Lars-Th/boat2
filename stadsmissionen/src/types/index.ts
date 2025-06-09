// Vue-specific imports for types
import type { Component, VNode, Ref } from 'vue'

// Core entity types
export interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  createdAt: string
  updatedAt: string
}

export interface Contact {
  id: number
  customerId: number
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position?: string
  department?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkOrder {
  id: number
  customerId: number
  contactId?: number
  title: string
  description?: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  assignedTo?: number
  estimatedHours?: number
  actualHours?: number
  startDate?: string
  dueDate?: string
  completedDate?: string
  createdAt: string
  updatedAt: string
}

// Enums
export enum WorkOrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum WorkOrderPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// User and Authentication types
export interface User {
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
  VIEWER = 'viewer'
}

// API Response types
export interface ApiResponse<T = unknown> {
  data: T
  message?: string
  success: boolean
  errors?: string[]
}

export interface ApiError {
  message: string
  code?: string | number
  details?: Record<string, unknown>
}

// UI Component types
export interface BreadcrumbItem {
  label: string
  href?: string
  to?: string | { name: string; params?: Record<string, unknown> }
  icon?: string | Component
  isCurrentPage?: boolean
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  type?: 'text' | 'badge' | 'actions' | 'custom'
  render?: (value: unknown, row: T) => string | VNode
  badgeVariant?: (value: unknown) => string
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

// Form types
export interface FormField<T = unknown> {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio'
  value: T
  placeholder?: string
  required?: boolean
  disabled?: boolean
  options?: Array<{ label: string; value: unknown }>
  validation?: ValidationRule
}

// Navigation types
export interface NavigationItem {
  label: string
  path?: string
  icon?: string | Component
  children?: NavigationItem[]
  badge?: string | number
  external?: boolean
}

// Filter and Search types
export interface FilterOption {
  key?: string
  label: string
  type?: 'text' | 'select' | 'date' | 'number' | 'boolean'
  value?: string | number | boolean | Date // For backward compatibility
  options?: Array<{ value: string | number | boolean; label: string }>
}

// Simple filter option for basic dropdowns
export interface SimpleFilterOption {
  value: string | number
  label: string
}

export interface SearchFilters {
  [key: string]: string | number | boolean | Date | null | undefined
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

// Toast/Notification types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  message?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  timestamp: number;
  read: boolean;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
}

export interface ToastOptions {
  title: string;
  message?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
}

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
}

export interface Notification extends Toast {
  confirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
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

export interface UseToastReturn {
  toasts: Ref<Toast[]>;
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
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
  "E-post": string;
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
  types: ActivityType[];
}

export interface ParticipantGroup {
  id: string;
  namn: string;
  beskrivning: string;
  enheter: string[];
  deltagare: string[];
  isAutomatic: boolean;
  automatiskregel?: string;
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

// Route params interface
export interface RouteParams {
  id?: string;
  [key: string]: string | undefined;
}

// Validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  email?: boolean
  numeric?: boolean
  custom?: (value: unknown) => boolean | string
}

export interface ValidationResult {
  isValid: boolean
  message?: string
  errors?: string[]
}

export interface ValidationSchema {
  [fieldName: string]: {
    rules: string[]
    displayName: string
  }
}

export interface UseValidationReturn {
  validate: (value: unknown, rules: ValidationRule) => ValidationResult
  validateForm: (data: Record<string, unknown>, schema: Record<string, ValidationRule>) => Record<string, ValidationResult>
  isFormValid: (results: Record<string, ValidationResult>) => boolean
  validateField: (fieldName: string, value: unknown, rules: string[], displayName?: string) => boolean
  validateAll: (data: Record<string, unknown>, schema: Record<string, { rules: string[]; displayName?: string }>) => boolean
  validateWithSchema: (data: Record<string, unknown>, schema: ValidationSchema) => boolean
  validateNestedField: (data: Record<string, unknown>, fieldPath: string, rules: string[], displayName?: string) => boolean
  touchField: (fieldName: string) => void
  hasError: (fieldName: string) => boolean
  getError: (fieldName: string) => string | null
  isRequired: (fieldName: string, schema: Record<string, { rules?: string[] }>) => boolean
  clearErrors: () => void
  clearFieldError: (fieldName: string) => void
  errors: Ref<Record<string, string | null>>
  touchedFields: Ref<Record<string, boolean>>
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Generic data item for cards and tables
export interface DataItem {
  id: string | number
  [key: string]: unknown
}

// Component prop types
export interface BaseComponentProps {
  class?: string
  id?: string
}

export interface LoadingState {
  isLoading: boolean
  error?: string | null
  data?: unknown
} 