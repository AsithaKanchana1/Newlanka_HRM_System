export interface UserPermissions {
  can_view_employees: boolean;
  can_add_employees: boolean;
  can_edit_employees: boolean;
  can_delete_employees: boolean;
  can_manage_users: boolean;
  can_view_all_departments: boolean;
  can_export_data: boolean;
  can_view_reports: boolean;
  can_manage_settings: boolean;
}

export interface UserSession {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  department_access: string | null;
  permissions: UserPermissions;
}

export interface UserInfo {
  id: number;
  username: string;
  full_name: string;
  role: string;
  department_access: string | null;
  is_active: boolean;
  created_at: string | null;
  last_login: string | null;
  permissions?: UserPermissions;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  role: string;
  department_access: string | null;
  permissions?: UserPermissions;
}

export interface UpdateUserRequest {
  user_id: number;
  full_name: string;
  role: string;
  department_access: string | null;
  is_active: boolean;
  permissions?: UserPermissions;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export const ROLES = [
  { value: "admin", label: "Administrator", description: "Full system access" },
  { value: "hr_manager", label: "HR Manager", description: "Can manage employees and export data" },
  { value: "hr_staff", label: "HR Staff", description: "Can view and add employees only" },
  { value: "viewer", label: "Viewer", description: "Read-only access" },
  { value: "custom", label: "Custom", description: "Custom permissions" },
] as const;

export type RoleKey = typeof ROLES[number]["value"];

// Permission definitions for UI display
export interface PermissionDefinition {
  key: keyof UserPermissions;
  label: string;
  description: string;
  category: 'Employees' | 'Data' | 'Administration';
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Employees category
  { key: 'can_view_employees', label: 'View Employees', description: 'Can view employee records', category: 'Employees' },
  { key: 'can_add_employees', label: 'Add Employees', description: 'Can add new employees', category: 'Employees' },
  { key: 'can_edit_employees', label: 'Edit Employees', description: 'Can modify employee data', category: 'Employees' },
  { key: 'can_delete_employees', label: 'Delete Employees', description: 'Can remove employees', category: 'Employees' },
  { key: 'can_view_all_departments', label: 'View All Departments', description: 'Access to all departments', category: 'Employees' },
  
  // Data category
  { key: 'can_export_data', label: 'Export Data', description: 'Can export to Excel/CSV/PDF', category: 'Data' },
  { key: 'can_view_reports', label: 'View Reports', description: 'Can access analytics and reports', category: 'Data' },
  
  // Administration category
  { key: 'can_manage_users', label: 'Manage Users', description: 'Can create and manage user accounts', category: 'Administration' },
  { key: 'can_manage_settings', label: 'Manage Settings', description: 'Can modify system settings', category: 'Administration' },
];

// Get permissions for a given role
export function getPermissionsByRole(role: string): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        can_view_employees: true,
        can_add_employees: true,
        can_edit_employees: true,
        can_delete_employees: true,
        can_manage_users: true,
        can_view_all_departments: true,
        can_export_data: true,
        can_view_reports: true,
        can_manage_settings: true,
      };
    case 'hr_manager':
      return {
        can_view_employees: true,
        can_add_employees: true,
        can_edit_employees: true,
        can_delete_employees: true,
        can_manage_users: false,
        can_view_all_departments: true,
        can_export_data: true,
        can_view_reports: true,
        can_manage_settings: false,
      };
    case 'hr_staff':
      return {
        can_view_employees: true,
        can_add_employees: true,
        can_edit_employees: false,
        can_delete_employees: false,
        can_manage_users: false,
        can_view_all_departments: false,
        can_export_data: false,
        can_view_reports: false,
        can_manage_settings: false,
      };
    case 'viewer':
    default:
      return {
        can_view_employees: true,
        can_add_employees: false,
        can_edit_employees: false,
        can_delete_employees: false,
        can_manage_users: false,
        can_view_all_departments: false,
        can_export_data: false,
        can_view_reports: false,
        can_manage_settings: false,
      };
  }
}

// Get permission definitions by category
export function getPermissionsByCategory(category: string): PermissionDefinition[] {
  return PERMISSION_DEFINITIONS.filter(p => p.category === category);
}
