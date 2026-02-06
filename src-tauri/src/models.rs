use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub epf_number: String,
    pub name_with_initials: String,
    pub full_name: String,
    pub dob: Option<String>,
    pub police_area: Option<String>,
    pub transport_route: Option<String>,
    pub mobile_1: Option<String>,
    pub mobile_2: Option<String>,
    pub address: Option<String>,
    pub date_of_join: Option<String>,
    pub date_of_resign: Option<String>,
    pub working_status: String,
    pub marital_status: Option<String>,
    pub cader: Option<String>,
    pub designation: Option<String>,
    pub allocation: Option<String>,
    pub department: Option<String>,
    pub image_path: Option<String>,
    #[serde(skip_deserializing)]
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmployeeFilters {
    pub epf_number: String,
    pub department: String,
    pub transport_route: String,
    pub working_status: String,
}

#[derive(Debug, Serialize)]
pub struct DashboardStats {
    pub total_employees: i32,
    pub active_employees: i32,
    pub resigned_employees: i32,
    pub departments: Vec<DepartmentCount>,
    pub caders: Vec<DepartmentCount>,
    pub allocations: Vec<DepartmentCount>,
    pub recent_joinings: i32,
    pub recent_resignations: i32,
}

#[derive(Debug, Serialize)]
pub struct DepartmentCount {
    pub name: String,
    pub count: i32,
}

// User and Authentication Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i32,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub full_name: String,
    pub role: String,  // "admin", "hr_manager", "hr_staff", "viewer", "custom"
    pub department_access: Option<String>,  // null means all departments, or comma-separated list
    pub is_active: bool,
    pub permissions: UserPermissions,  // Custom permissions stored per user
    pub created_at: Option<String>,
    pub last_login: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserSession {
    pub user_id: i32,
    pub username: String,
    pub full_name: String,
    pub role: String,
    pub department_access: Option<String>,
    pub permissions: UserPermissions,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserPermissions {
    pub can_view_employees: bool,
    pub can_add_employees: bool,
    pub can_edit_employees: bool,
    pub can_delete_employees: bool,
    pub can_manage_users: bool,
    pub can_view_all_departments: bool,
    pub can_export_data: bool,
    pub can_view_reports: bool,
    pub can_manage_settings: bool,
    pub can_backup_database: bool,
    pub can_view_audit_logs: bool,
}

impl Default for UserPermissions {
    fn default() -> Self {
        UserPermissions {
            can_view_employees: true,
            can_add_employees: false,
            can_edit_employees: false,
            can_delete_employees: false,
            can_manage_users: false,
            can_view_all_departments: false,
            can_export_data: false,
            can_view_reports: false,
            can_manage_settings: false,
            can_backup_database: false,
            can_view_audit_logs: false,
        }
    }
}

impl UserPermissions {
    pub fn admin() -> Self {
        UserPermissions {
            can_view_employees: true,
            can_add_employees: true,
            can_edit_employees: true,
            can_delete_employees: true,
            can_manage_users: true,
            can_view_all_departments: true,
            can_export_data: true,
            can_view_reports: true,
            can_manage_settings: true,
            can_backup_database: true,
            can_view_audit_logs: true,
        }
    }

    pub fn hr_manager() -> Self {
        UserPermissions {
            can_view_employees: true,
            can_add_employees: true,
            can_edit_employees: true,
            can_delete_employees: true,
            can_manage_users: false,
            can_view_all_departments: true,
            can_export_data: true,
            can_view_reports: true,
            can_manage_settings: false,
            can_backup_database: false,
            can_view_audit_logs: false,
        }
    }

    pub fn hr_staff() -> Self {
        UserPermissions {
            can_view_employees: true,
            can_add_employees: true,
            can_edit_employees: false,
            can_delete_employees: false,
            can_manage_users: false,
            can_view_all_departments: false,
            can_export_data: false,
            can_view_reports: false,
            can_manage_settings: false,
            can_backup_database: false,
            can_view_audit_logs: false,
        }
    }

    pub fn viewer() -> Self {
        UserPermissions {
            can_view_employees: true,
            can_add_employees: false,
            can_edit_employees: false,
            can_delete_employees: false,
            can_manage_users: false,
            can_view_all_departments: false,
            can_export_data: false,
            can_view_reports: false,
            can_manage_settings: false,
            can_backup_database: false,
            can_view_audit_logs: false,
        }
    }

    pub fn from_role(role: &str) -> Self {
        match role {
            "admin" => Self::admin(),
            "hr_manager" => Self::hr_manager(),
            "hr_staff" => Self::hr_staff(),
            "viewer" => Self::viewer(),
            _ => Self::default(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    pub full_name: String,
    pub role: String,
    pub department_access: Option<String>,
    pub permissions: Option<UserPermissions>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub user_id: i32,
    pub full_name: String,
    pub role: String,
    pub department_access: Option<String>,
    pub is_active: bool,
    pub permissions: Option<UserPermissions>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct UserInfo {
    pub id: i32,
    pub username: String,
    pub full_name: String,
    pub role: String,
    pub department_access: Option<String>,
    pub is_active: bool,
    pub permissions: Option<UserPermissions>,
    pub created_at: Option<String>,
    pub last_login: Option<String>,
}

// Audit Log Models
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditLog {
    pub id: i32,
    pub user_id: Option<i32>,
    pub username: String,
    pub action: String,           // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, IMPORT, VIEW
    pub entity_type: String,      // EMPLOYEE, USER, DATABASE, SYSTEM
    pub entity_id: Option<String>,// e.g., EPF number or user ID
    pub old_value: Option<String>,// JSON of old values for UPDATE/DELETE
    pub new_value: Option<String>,// JSON of new values for CREATE/UPDATE
    pub details: Option<String>,  // Additional context
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AuditLogFilters {
    pub username: String,
    pub action: String,
    pub entity_type: String,
    pub start_date: String,
    pub end_date: String,
    pub limit: i32,
    pub offset: i32,
}

#[derive(Debug, Serialize)]
pub struct AuditLogResult {
    pub logs: Vec<AuditLog>,
    pub total_count: i32,
}
