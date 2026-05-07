import { api } from './client';
import { Permission } from '../lib/modulePermissions';

export interface AppModule {
  key: string;
  name: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AppRole {
  key: string;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  userCount: number;
  permissions: Permission[];
}

export interface EmployeeOption {
  id: string;
  employee_code: string;
  first_name: string;
  surname: string;
  email?: string | null;
  is_active: number | boolean;
  has_system_access: number | boolean;
}

export interface RolePayload {
  key?: string;
  name: string;
  description?: string;
  isActive?: boolean;
  permissions: Permission[];
}

export const authAdminApi = {
  getModules: () => api.get<AppModule[]>('/auth/modules'),
  getRoles: () => api.get<AppRole[]>('/auth/roles'),
  getEmployeeOptions: () => api.get<EmployeeOption[]>('/auth/employee-options'),
  createRole: (payload: RolePayload) => api.post<{ key: string; message: string }>('/auth/roles', payload),
  updateRole: (key: string, payload: RolePayload) => api.put<{ message: string }>(`/auth/roles/${key}`, payload),
  deleteRole: (key: string) => api.delete<{ message: string }>(`/auth/roles/${key}`),
};
