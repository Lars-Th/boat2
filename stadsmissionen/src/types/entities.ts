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
