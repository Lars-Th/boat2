// Authentication and user-related interfaces

export interface User {
  id: string | number;
  name: string;
  email: string;
  password: string;
  permissionID: number;
  aktiv: boolean;
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
