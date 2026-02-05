/**
 * User Model
 * Defines the structure for user authentication and permissions
 */

// Individual permission flags
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

// Default permissions for new users
export const createDefaultPermissions = (): UserPermissions => ({
  can_view_employees: true,
  can_add_employees: false,
  can_edit_employees: false,
  can_delete_employees: false,
  can_manage_users: false,
  can_view_all_departments: false,
  can_export_data: false,
  can_view_reports: false,
  can_manage_settings: false,
});

// Get permissions by role (preset configurations)
export const getPermissionsByRole = (role: string): UserPermissions => {
  switch (role) {
    case "admin":
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
    case "hr_manager":
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
    case "hr_staff":
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
    case "viewer":
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
    default:
      return createDefaultPermissions();
  }
};

// User session (logged in user)
export interface UserSession {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  department_access: string | null;
  permissions: UserPermissions;
}

// User info (for user management list)
export interface UserInfo {
  id: number;
  username: string;
  full_name: string;
  role: string;
  department_access: string | null;
  is_active: boolean;
  permissions: UserPermissions;
  created_at: string | null;
  last_login: string | null;
}

// Request to create a new user
export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  role: string;
  department_access: string | null;
  permissions: UserPermissions;
}

// Request to update a user
export interface UpdateUserRequest {
  id: number;
  username: string;
  full_name: string;
  role: string;
  department_access: string | null;
  is_active: boolean;
  permissions: UserPermissions;
}

// Login credentials
export interface LoginRequest {
  username: string;
  password: string;
}

// Available roles with descriptions
export const ROLES = [
  { value: "admin", label: "Administrator", description: "Full system access - all permissions enabled" },
  { value: "hr_manager", label: "HR Manager", description: "Can manage employees and view reports" },
  { value: "hr_staff", label: "HR Staff", description: "Can view and add employees only" },
  { value: "viewer", label: "Viewer", description: "Read-only access to employee data" },
  { value: "custom", label: "Custom", description: "Custom permissions configured manually" },
] as const;

export type RoleKey = typeof ROLES[number]["value"];

// Permission definitions for UI display
export const PERMISSION_DEFINITIONS = [
  {
    key: "can_view_employees" as keyof UserPermissions,
    label: "View Employees",
    description: "Can view employee list and profiles",
    category: "Employees",
  },
  {
    key: "can_add_employees" as keyof UserPermissions,
    label: "Add Employees",
    description: "Can add new employees to the system",
    category: "Employees",
  },
  {
    key: "can_edit_employees" as keyof UserPermissions,
    label: "Edit Employees",
    description: "Can modify existing employee information",
    category: "Employees",
  },
  {
    key: "can_delete_employees" as keyof UserPermissions,
    label: "Delete Employees",
    description: "Can remove employees from the system",
    category: "Employees",
  },
  {
    key: "can_view_all_departments" as keyof UserPermissions,
    label: "View All Departments",
    description: "Can view employees from all departments",
    category: "Employees",
  },
  {
    key: "can_export_data" as keyof UserPermissions,
    label: "Export Data",
    description: "Can export employee data to Excel/PDF",
    category: "Data",
  },
  {
    key: "can_view_reports" as keyof UserPermissions,
    label: "View Reports",
    description: "Can access analytics and reports",
    category: "Data",
  },
  {
    key: "can_manage_users" as keyof UserPermissions,
    label: "Manage Users",
    description: "Can create, edit, and delete user accounts",
    category: "Administration",
  },
  {
    key: "can_manage_settings" as keyof UserPermissions,
    label: "Manage Settings",
    description: "Can modify application settings",
    category: "Administration",
  },
] as const;

// Group permissions by category
export const getPermissionsByCategory = () => {
  const categories: Record<string, typeof PERMISSION_DEFINITIONS[number][]> = {};
  PERMISSION_DEFINITIONS.forEach((perm) => {
    if (!categories[perm.category]) {
      categories[perm.category] = [];
    }
    categories[perm.category].push(perm);
  });
  return categories;
};
