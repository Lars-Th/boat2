export interface ParticipantData {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  emergencyContact?: string;
  medicalInfo?: string;
  notes?: string;
}

export interface EnhancedActivityType {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  activityCount: number;
  participantCount: number;
  averageParticipants: number;
}
