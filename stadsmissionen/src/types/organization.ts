export interface JunctionData {
  id: number;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface OfficeData {
  id: number;
  name: string;
  address?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
}
