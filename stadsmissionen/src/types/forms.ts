export interface ActivityFormData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  maxParticipants?: number;
  activityTypeId: number;
  isRecurring: boolean;
  recurringPattern?: string;
}

export interface OrganizationFormData {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface OrganizationForm {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface SerieSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  maxOccurrences?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}
